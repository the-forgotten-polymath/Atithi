"""
ATITHI Knowledge, Intent Brain & Closed-Loop Operations Hub (Phase 2 & Phase 5)
FastAPI service providing:
1. 4-step Cognitive Pipeline: Guest Query -> Intent -> KB Retrieval -> Grounded Response
2. Closed-Loop Execution: Understand -> Decide -> Act (Ticket) -> Track -> Confirm (Close)
"""

import os
import json
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.knowledge_base import HOTEL_META, KNOWLEDGE_ITEMS
from backend.llm_agent import process_guest_query
from backend.ticket_service import (
    create_ticket,
    list_tickets,
    update_ticket_status,
    confirm_and_close_ticket,
    lookup_guest_and_room,
    get_owner_analytics
)
from backend.notifications import subscribe_events, unsubscribe_events
from backend.intelligence import (
    scan_for_incidents,
    simulate_ppt_hot_water_incident,
    update_incident_action,
    ACTIVE_INCIDENTS
)

load_dotenv()

app = FastAPI(
    title="ATITHI Hotel AI Brain & Operational Loop Hub",
    description="Grounded AI concierge and closed-loop ticket execution for The Himalayan Vista",
    version="2.5.0"
)

# Enable CORS for web frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    room_number: Optional[str] = None
    guest_name: Optional[str] = None
    api_key: Optional[str] = None
    source_channel: Optional[str] = "ai_chat"

class ChatResponse(BaseModel):
    reply: str
    intent: str
    confidence: float
    is_grounded: bool
    primary_source: Optional[str] = None
    department: str
    human_handoff: bool
    action_ticket: Optional[Dict[str, Any]] = None
    entities: Dict[str, Any]
    provider: str

class UpdateTicketRequest(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class ConfirmTicketRequest(BaseModel):
    guest_feedback: Optional[str] = "Issue fully resolved. Thank you!"
    guest_satisfied: bool = True

class CreateTicketManualRequest(BaseModel):
    room_number: str
    title: str
    description: str
    department: str = "Housekeeping"
    priority: str = "normal"
    guest_name: Optional[str] = None
    source_channel: str = "ai_chat"

@app.get("/api/health")
def health_check():
    has_groq = bool(os.environ.get("GROQ_API_KEY"))
    return {
        "status": "healthy",
        "phase": "PHASE_5_CLOSE_THE_LOOP",
        "hotel": HOTEL_META["name"],
        "knowledge_items_loaded": len(KNOWLEDGE_ITEMS),
        "llm_engine": "Groq Llama-3.3-70B Active" if has_groq else "Hybrid Engine",
        "groq_configured": has_groq
    }

@app.get("/api/knowledge")
def list_knowledge(category: Optional[str] = None):
    if category:
        items = [k for k in KNOWLEDGE_ITEMS if k["category"] == category]
    else:
        items = KNOWLEDGE_ITEMS
    return {
        "hotel": HOTEL_META["name"],
        "total": len(items),
        "items": items
    }

@app.post("/api/chat", response_model=ChatResponse)
async def handle_guest_chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    query = request.message.strip()

    # Process through Hybrid Cognitive Engine (Groq Llama-3.3-70B with Grounded Fallback)
    result = process_guest_query(
        query=query,
        api_key=request.api_key,
        room_number=request.room_number,
        guest_name=request.guest_name
    )

    action_ticket = result.get("action_ticket")
    
    # ACT STEP: If the brain decides an action ticket is needed, create it in Supabase!
    if action_ticket:
        extracted_room = action_ticket.get("room_number") or request.room_number or "104"
        clean_room = str(extracted_room).replace("Room", "").replace("room", "").strip()
        issue_title = action_ticket.get("issue") or query[:50]
        department = action_ticket.get("department") or result.get("department", "Housekeeping")
        priority = action_ticket.get("priority", "medium").lower()

        if action_ticket.get("type") == "ROOM_BOOKING":
            from backend.mcp_server import book_room
            booking_res = await book_room(
                room_number=clean_room,
                guest_name=request.guest_name or "Guest",
                nights=1
            )
            action_ticket["ticket_number"] = booking_res.get("booking_id")
            action_ticket["status"] = "open"
            action_ticket["payment_tag"] = "PAY_ON_PROPERTY"
            action_ticket["total_price_inr"] = booking_res.get("total_price_inr")
        else:
            created_tkt = await create_ticket(
                room_number=clean_room,
                title=issue_title,
                description=f"Guest request: {query}",
                department=department,
                priority=priority,
                guest_name=request.guest_name,
                source_channel=request.source_channel or "ai_chat"
            )
            action_ticket["ticket_number"] = created_tkt.get("ticket_number")
            action_ticket["status"] = created_tkt.get("status")
            action_ticket["sla_due_at"] = created_tkt.get("sla_due_at")
            action_ticket["created_at"] = created_tkt.get("created_at")
            action_ticket["guest_name"] = created_tkt.get("guest_name")

    return ChatResponse(
        reply=result["reply"],
        intent=result["intent"],
        confidence=result["confidence"],
        is_grounded=result["is_grounded"],
        primary_source=result["primary_source"],
        department=result["department"],
        human_handoff=result["human_handoff"],
        action_ticket=action_ticket,
        entities=result["entities"],
        provider=result["provider"]
    )

# ---------------------------------------------------------------------------
# OPERATIONAL TICKETS API (PHASE 5: TRACK & RESOLVE)
# ---------------------------------------------------------------------------

@app.get("/api/tickets")
async def get_tickets_endpoint(room_number: Optional[str] = None, status: Optional[str] = None):
    """Retrieve operational tickets from Supabase."""
    tickets = await list_tickets(room_number=room_number, status=status)
    return {"total": len(tickets), "tickets": tickets}

@app.post("/api/tickets")
async def create_ticket_endpoint(req: CreateTicketManualRequest):
    """Manual or Voice ticket creation."""
    tkt = await create_ticket(
        room_number=req.room_number,
        title=req.title,
        description=req.description,
        department=req.department,
        priority=req.priority,
        guest_name=req.guest_name,
        source_channel=req.source_channel
    )
    return {"success": True, "ticket": tkt}

@app.patch("/api/tickets/{ticket_number}")
async def update_ticket_endpoint(ticket_number: str, req: UpdateTicketRequest):
    """
    Staff update:
    - acknowledge & assign: status='in_progress', assigned_to='Ramesh Chandra'
    - resolve: status='resolved', resolution_notes='...'
    """
    updated = await update_ticket_status(
        ticket_number=ticket_number,
        new_status=req.status,
        assigned_to=req.assigned_to,
        resolution_notes=req.resolution_notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found or update failed")
    return {"success": True, "ticket": updated}

@app.post("/api/tickets/{ticket_number}/confirm")
async def confirm_ticket_endpoint(ticket_number: str, req: ConfirmTicketRequest):
    """
    Guest follow-up confirmation:
    - Closes the loop when guest verifies issue is fixed!
    """
    closed = await confirm_and_close_ticket(
        ticket_number=ticket_number,
        guest_feedback=req.guest_feedback or "Issue fully resolved.",
        guest_satisfied=req.guest_satisfied
    )
    if not closed:
        raise HTTPException(status_code=404, detail="Ticket not found or closing failed")
    return {
        "success": True,
        "message": "Closed-loop verified and completed! Ticket marked CLOSED.",
        "ticket": closed
    }

# ---------------------------------------------------------------------------
# PHASE 7: OWNER DASHBOARD & EXECUTIVE INTELLIGENCE API
# ---------------------------------------------------------------------------

@app.get("/api/owner/analytics")
async def owner_analytics_endpoint():
    """
    Returns high-level hotel owner & GM analytics:
    - TODAY: Calls Answered, Enquiries, Complaints, Resolved, Open
    - RESPONSE: Median Ack Time, Resolved Before Checkout
    - TOP ISSUES: Hot Water, AC, Wi-Fi, Housekeeping
    - OPPORTUNITIES & REVENUE FUNNEL: Enquiries -> Qualified -> Bookings -> Potential Revenue
    """
    return await get_owner_analytics()

@app.get("/api/tickets/events")
async def ticket_events_stream(request: Request):
    """
    Server-Sent Events (SSE) stream for real-time ticket updates across
    the Operations Dashboard and In-Room Guest Portal.
    """
    q = subscribe_events()

    async def event_generator():
        try:
            # Send initial keepalive
            yield f": keepalive\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"event: {payload['event']}\ndata: {json.dumps(payload['data'])}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        finally:
            unsubscribe_events(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ---------------------------------------------------------------------------
# PHASE 9: OPERATIONAL INTELLIGENCE & INCIDENT PATTERN DETECTION API
# ---------------------------------------------------------------------------

class IncidentActionRequest(BaseModel):
    action: str  # "dispatch", "resolve", "dismiss"
    engineer_name: Optional[str] = "Chief Engineer Rajesh Negi"

@app.get("/api/intelligence/incidents")
async def get_incidents_endpoint():
    """
    Retrieve all detected spatial/temporal system incident alerts.
    Detects cross-room subsystem clusters (e.g. 3 hot-water complaints in 17 minutes).
    Enforces AI Safety: 'Potential shared-system issue — human verification required'.
    """
    incidents = await scan_for_incidents()
    return {"total": len(incidents), "incidents": incidents}

@app.post("/api/intelligence/scan")
async def scan_incidents_endpoint():
    """Trigger real-time pattern detection scan over Supabase tickets."""
    incidents = await scan_for_incidents()
    return {"scanned": True, "total": len(incidents), "incidents": incidents}

@app.post("/api/intelligence/simulate-ppt")
async def simulate_ppt_endpoint():
    """
    Simulates the exact PPT presentation scenario:
    Room 204 -> Hot Water
    Room 307 -> Hot Water
    Room 412 -> Hot Water within 17 minutes
    -> PATTERN DETECTED: Potential shared-system incident
    """
    incident = await simulate_ppt_hot_water_incident()
    return {"success": True, "incident": incident}

@app.post("/api/intelligence/incidents/{incident_id}/action")
async def incident_action_endpoint(incident_id: str, req: IncidentActionRequest):
    """
    Human-in-the-loop action:
    - dispatch: Assigns Chief Engineer to inspect the physical subsystem
    - resolve: Marks the shared system verified & cleared
    - dismiss: Dismisses false positive
    """
    updated = update_incident_action(incident_id, req.action, req.engineer_name or "Chief Engineer Rajesh Negi")
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"success": True, "incident": updated}

# ============================================================================
# UNIFIED MCP (Model Context Protocol) BRIDGE (Mounted directly on Port 8001)
# Agora Realtime Voice Agent connects directly to this server for MCP tools!
# ============================================================================
from backend.mcp_server import messages_handler, sse_handler, root_handler

app.add_api_route("/mcp", messages_handler, methods=["GET", "POST"])
app.add_api_route("/sse", sse_handler, methods=["GET"])
app.add_api_route("/sse", messages_handler, methods=["POST"])
app.add_api_route("/messages/", messages_handler, methods=["POST"])
app.add_api_route("/messages", messages_handler, methods=["POST"])
app.add_api_route("/mcp/health", root_handler, methods=["GET"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
