"""
ATITHI Hotel MCP (Model Context Protocol) Server
Robust SSE + HTTP Bridge for Agora Conversational AI Agent & Supabase
Folder: /Users/dev/Desktop/Final-ATITHI/backend/mcp_server.py
"""

import os
import json
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx
from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from sse_starlette.sse import EventSourceResponse

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AtithiMCPServer")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://heqxbglfenwlsbjrtkki.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Active SSE Sessions: session_id -> asyncio.Queue
active_sessions: Dict[str, asyncio.Queue] = {}

def get_supabase_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# ============================================================================
# TOOL 1: LOOKUP GUEST BY ROOM
# ============================================================================
async def lookup_guest_by_room(room_number: str) -> Dict[str, Any]:
    clean_room = str(room_number).strip().replace("Room", "").replace("room", "").strip()
    url = f"{SUPABASE_URL}/rest/v1/rooms?room_number=eq.{clean_room}&select=id,hotel_id,room_number,room_type,status,current_guest_name,current_guest_phone,floor,view_type"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200 and resp.json():
                room = resp.json()[0]
                guest_name = room.get("current_guest_name") or "Valued Guest"
                return {
                    "found": True,
                    "room_number": room["room_number"],
                    "guest_name": guest_name,
                    "room_type": room.get("room_type"),
                    "status": room.get("status"),
                    "floor": room.get("floor"),
                    "view_type": room.get("view_type"),
                    "greeting_suggestion": f"नमस्ते {guest_name} जी, बताइए आपकी क्या सेवा कर सकते हैं?"
                }
            return {
                "found": False,
                "room_number": clean_room,
                "message": f"Room {clean_room} is currently vacant or not found in registry."
            }
        except Exception as e:
            logger.error(f"Error querying room {clean_room}: {e}")
            return {"found": False, "error": str(e)}

# ============================================================================
# TOOL 2: CREATE SERVICE TICKET
# ============================================================================
async def create_service_ticket(
    room_number: str,
    title: str,
    description: str,
    department: str = "Housekeeping",
    priority: str = "normal"
) -> Dict[str, Any]:
    clean_room = str(room_number).strip().replace("Room", "").replace("room", "").strip()
    room_info = await lookup_guest_by_room(clean_room)
    guest_name = room_info.get("guest_name", "Guest") if room_info.get("found") else "Guest"
    
    dept_url = f"{SUPABASE_URL}/rest/v1/departments?name=ilike.%25{department.strip()}%25&select=id,name"
    department_id = None
    hotel_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            d_resp = await client.get(dept_url, headers=get_supabase_headers())
            if d_resp.status_code == 200 and d_resp.json():
                department_id = d_resp.json()[0]["id"]
        except Exception as e:
            logger.warning(f"Dept query error: {e}")

        ticket_number = f"AT-{clean_room}-{int(datetime.now().timestamp()) % 10000:04d}"
        now_iso = datetime.now(timezone.utc).isoformat()
        sla_iso = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

        ticket_payload = {
            "hotel_id": hotel_id,
            "ticket_number": ticket_number,
            "room_number": clean_room,
            "guest_name": guest_name,
            "department_id": department_id,
            "category": "complaint" if priority in ("high", "urgent") else "service_request",
            "title": title,
            "description": description,
            "priority": priority,
            "status": "open",
            "source_channel": "agora_voice",
            "sla_due_at": sla_iso,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        try:
            ins_resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/tickets",
                headers=get_supabase_headers(),
                json=ticket_payload
            )
            if ins_resp.status_code in (200, 201):
                return {
                    "success": True,
                    "ticket_number": ticket_number,
                    "room_number": clean_room,
                    "guest_name": guest_name,
                    "department": department,
                    "eta_minutes": 10 if priority == "urgent" else 15,
                    "spoken_confirmation": f"मैंने आपकी {title} की रिक्वेस्ट दर्ज कर ली है। हमारी टीम 10-15 मिनट में आपके कमरे पर पहुंच जाएगी।"
                }
            return {"success": False, "error": ins_resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

# ============================================================================
# TOOL 3: GET OPEN TICKETS
# ============================================================================
async def get_open_tickets(room_number: str) -> Dict[str, Any]:
    clean_room = str(room_number).strip().replace("Room", "").replace("room", "").strip()
    url = f"{SUPABASE_URL}/rest/v1/tickets?room_number=eq.{clean_room}&status=neq.resolved&select=ticket_number,title,status,priority,created_at&order=created_at.desc"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200:
                tickets = resp.json()
                return {"room_number": clean_room, "open_count": len(tickets), "tickets": tickets}
            return {"room_number": clean_room, "open_count": 0, "tickets": []}
        except Exception as e:
            return {"error": str(e)}

# ============================================================================
# TOOL 4: SEARCH KNOWLEDGE BASE
# ============================================================================
async def search_hotel_knowledge(query: str) -> Dict[str, Any]:
    url = f"{SUPABASE_URL}/rest/v1/hotel_knowledge?or=(category.ilike.%25{query}%25,title.ilike.%25{query}%25,content.ilike.%25{query}%25)&select=category,title,content&limit=3"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200 and resp.json():
                return {"found": True, "results": resp.json()}
            return {"found": False, "message": "No matching knowledge base entry found."}
        except Exception as e:
            return {"found": False, "error": str(e)}

# ============================================================================
# TOOL 5: GET AVAILABLE ROOMS
# ============================================================================
async def get_available_rooms(
    room_type: Optional[str] = None,
    floor: Optional[int] = None
) -> Dict[str, Any]:
    url = f"{SUPABASE_URL}/rest/v1/rooms?status=eq.available&select=room_number,room_type,floor,bed_type,view_type,base_price_inr,has_balcony,has_ac&order=room_number.asc"
    if floor:
        url += f"&floor=eq.{floor}"
    if room_type:
        url += f"&room_type=ilike.%25{room_type.strip()}%25"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200:
                rooms = resp.json()
                room_summaries = []
                for r in rooms[:5]:
                    price_val = int(float(r.get("base_price_inr", 4800)))
                    room_summaries.append(f"Room {r['room_number']} ({r['room_type']} - ₹{price_val}/night, {r['view_type']})")
                
                spoken_text = (
                    f"हमारे पास अभी {len(rooms)} कमरे उपलब्ध हैं। उदाहरण के लिए: " + 
                    ", ".join(room_summaries[:3]) + 
                    "। क्या आप इनमें से कोई कमरा बुक करना चाहेंगे?"
                ) if rooms else "क्षमा करें, अभी कोई कमरा उपलब्ध नहीं है।"

                return {
                    "total_available": len(rooms),
                    "rooms": rooms,
                    "spoken_summary": spoken_text
                }
            return {"total_available": 0, "rooms": [], "error": resp.text}
        except Exception as e:
            logger.error(f"Error querying available rooms: {e}")
            return {"total_available": 0, "rooms": [], "error": str(e)}

# ============================================================================
# TOOL 6: BOOK ROOM (DIRECT BOOKING WITH PAY ON PROPERTY TAG)
# ============================================================================
async def book_room(
    room_number: str,
    guest_name: str,
    guest_phone: Optional[str] = None,
    nights: int = 1,
    special_requests: Optional[str] = None
) -> Dict[str, Any]:
    clean_room = str(room_number).strip().replace("Room", "").replace("room", "").strip()
    hotel_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    
    url = f"{SUPABASE_URL}/rest/v1/rooms?room_number=eq.{clean_room}&select=id,room_number,room_type,status,base_price_inr,floor,view_type"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r_resp = await client.get(url, headers=get_supabase_headers())
            if r_resp.status_code != 200 or not r_resp.json():
                return {
                    "success": False,
                    "message": f"Room {clean_room} not found in hotel inventory."
                }
            
            room = r_resp.json()[0]
            if room.get("status") != "available":
                return {
                    "success": False,
                    "message": f"Room {clean_room} is currently {room.get('status')} and not available. Please ask guest to select another available room."
                }
            
            base_price = float(room.get("base_price_inr", 4800))
            total_price = int(base_price * max(1, nights))
            now_ts = int(datetime.now().timestamp())
            booking_id = f"BK-{clean_room}-{now_ts % 10000:04d}"
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # 1. Update room status to occupied in Supabase
            update_room_url = f"{SUPABASE_URL}/rest/v1/rooms?room_number=eq.{clean_room}"
            room_patch_payload = {
                "status": "occupied",
                "current_guest_name": guest_name,
                "current_guest_phone": guest_phone or "",
                "updated_at": now_iso
            }
            await client.patch(
                update_room_url,
                headers=get_supabase_headers(),
                json=room_patch_payload
            )

            # 2. Resolve Front Desk department ID
            dept_id = None
            dept_url = f"{SUPABASE_URL}/rest/v1/departments?code=eq.FRONT_DESK&select=id"
            d_resp = await client.get(dept_url, headers=get_supabase_headers())
            if d_resp.status_code == 200 and d_resp.json():
                dept_id = d_resp.json()[0]["id"]

            # 3. Create Front Desk Reservation / Check-in Ticket
            ticket_payload = {
                "hotel_id": hotel_id,
                "ticket_number": booking_id,
                "room_number": clean_room,
                "guest_name": guest_name,
                "department_id": dept_id,
                "category": "service_request",
                "title": f"New Room Booking • Room {clean_room} (Pay on Property)",
                "description": (
                    f"Direct booking for {guest_name}. "
                    f"Room: {clean_room} ({room.get('room_type')}). "
                    f"Duration: {nights} night(s). "
                    f"Total Tariff: ₹{total_price}. "
                    f"TAG: PAY_ON_PROPERTY (To be paid at check-in reception). "
                    f"Special requests: {special_requests or 'None'}."
                ),
                "priority": "medium",
                "status": "open",
                "source_channel": "mcp_voice_agent",
                "notes": f"Tag: PAY_ON_PROPERTY | Amount Due: ₹{total_price} | Phone: {guest_phone or 'N/A'}",
                "sla_due_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
                "created_at": now_iso,
                "updated_at": now_iso
            }
            await client.post(
                f"{SUPABASE_URL}/rest/v1/tickets",
                headers=get_supabase_headers(),
                json=ticket_payload
            )

            spoken_confirmation = (
                f"बधाई हो {guest_name} जी! आपका Room {clean_room} ({room.get('room_type')}) सफलतापूर्वक बुक हो गया है। "
                f"आपकी बुकिंग आईडी {booking_id} है। इसका कुल किराया ₹{total_price} रहेगा, "
                f"और आपको अभी कुछ भी पे नहीं करना है—यह 'Pay on Property' है, यानी आप होटल पहुंचकर चेक-इन के समय पे कर सकते हैं।"
            )

            return {
                "success": True,
                "booking_id": booking_id,
                "room_number": clean_room,
                "room_type": room.get("room_type"),
                "guest_name": guest_name,
                "nights": nights,
                "total_price_inr": total_price,
                "payment_tag": "PAY_ON_PROPERTY",
                "payment_status": "To be collected at hotel check-in desk",
                "check_in_time": "2:00 PM (14:00)",
                "spoken_confirmation": spoken_confirmation
            }
        except Exception as e:
            logger.error(f"Error booking room: {e}")
            return {"success": False, "error": str(e)}

# ============================================================================
# TOOLS SCHEMA
# ============================================================================
TOOLS_SPEC = [
    {
        "name": "lookup_guest_by_room",
        "description": "Look up guest details and room specifications from Supabase. Call this when guest states room number.",
        "inputSchema": {
            "type": "object",
            "properties": {"room_number": {"type": "string", "description": "e.g. 104, 108"}},
            "required": ["room_number"]
        }
    },
    {
        "name": "create_service_ticket",
        "description": "Create an automated service or complaint ticket in the hotel database for guest requests.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "room_number": {"type": "string", "description": "Guest room number"},
                "title": {"type": "string", "description": "Short summary (e.g. 'Extra Blankets Requested')"},
                "description": {"type": "string", "description": "Detailed explanation of guest request"},
                "department": {"type": "string", "enum": ["Housekeeping", "Engineering", "Front Desk", "In-Room Dining"]},
                "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"]}
            },
            "required": ["room_number", "title", "description"]
        }
    },
    {
        "name": "get_open_tickets",
        "description": "Check active requests or tickets for a specific room to update the guest on progress.",
        "inputSchema": {
            "type": "object",
            "properties": {"room_number": {"type": "string"}},
            "required": ["room_number"]
        }
    },
    {
        "name": "search_hotel_knowledge",
        "description": "Search hotel policies, timings, amenities, restaurant hours in Supabase.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"]
        }
    },
    {
        "name": "get_available_rooms",
        "description": "Check available hotel rooms and current rates for booking. Can filter by room_type or floor.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "room_type": {"type": "string", "description": "Optional filter: e.g. 'Deluxe', 'Suite', 'King'"},
                "floor": {"type": "integer", "description": "Optional floor number (1, 2, 3, 4)"}
            }
        }
    },
    {
        "name": "book_room",
        "description": "Directly book an available room for a guest with 'Pay on Property' payment tag (no advance required, payment collected at check-in). Updates inventory and alerts Front Desk.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "room_number": {"type": "string", "description": "Room number to book, e.g. '102', '106', '202'"},
                "guest_name": {"type": "string", "description": "Full name of the guest"},
                "guest_phone": {"type": "string", "description": "Guest contact number"},
                "nights": {"type": "integer", "description": "Number of nights (default 1)"},
                "special_requests": {"type": "string", "description": "Optional requests like 'quiet room', 'extra pillow'"}
            },
            "required": ["room_number", "guest_name"]
        }
    }
]

# ============================================================================
# JSON-RPC DISPATCHER
# ============================================================================
async def process_json_rpc(data: dict) -> dict:
    method = data.get("method")
    req_id = data.get("id")
    logger.info(f"Processing JSON-RPC method: {method} (id={req_id})")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": True}
                },
                "serverInfo": {
                    "name": "atithi-hotel-ops",
                    "version": "1.0.0"
                }
            }
        }
    elif method in ("tools/list", "tools/listTools"):
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS_SPEC}
        }
    elif method == "tools/call":
        params = data.get("params", {})
        tool_name = params.get("name")
        args = params.get("arguments", {})
        res = None
        if tool_name == "lookup_guest_by_room":
            res = await lookup_guest_by_room(**args)
        elif tool_name == "create_service_ticket":
            res = await create_service_ticket(**args)
        elif tool_name == "get_open_tickets":
            res = await get_open_tickets(**args)
        elif tool_name == "search_hotel_knowledge":
            res = await search_hotel_knowledge(**args)
        elif tool_name == "get_available_rooms":
            res = await get_available_rooms(**args)
        elif tool_name == "book_room":
            res = await book_room(**args)
        elif tool_name == "search_hotel_knowledge":
            res = await search_hotel_knowledge(**args)
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"content": [{"type": "text", "text": json.dumps(res, ensure_ascii=False)}]}
        }
    elif method == "notifications/initialized":
        return None
    elif method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    return {"jsonrpc": "2.0", "id": req_id, "result": {}}

# ============================================================================
# SSE & HTTP HANDLERS
# ============================================================================
def get_base_url(request: Request) -> str:
    # Build public URL from headers
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host}"

async def sse_handler(request: Request):
    """Handles GET /sse - Sends absolute endpoint URL and listens for messages"""
    session_id = uuid.uuid4().hex
    queue = asyncio.Queue()
    active_sessions[session_id] = queue

    base_url = get_base_url(request)
    post_endpoint_url = f"{base_url}/messages/?session_id={session_id}"
    logger.info(f"New SSE connection. Session: {session_id}. Endpoint announced: {post_endpoint_url}")

    async def event_generator():
        # Step 1: Send endpoint event with absolute URL
        yield {
            "event": "endpoint",
            "data": post_endpoint_url
        }

        # Step 2: Keep stream open and dispatch messages
        try:
            while True:
                msg = await queue.get()
                if msg is None:
                    break
                yield {
                    "event": "message",
                    "data": json.dumps(msg)
                }
        finally:
            active_sessions.pop(session_id, None)
            logger.info(f"SSE Session closed: {session_id}")

    return EventSourceResponse(event_generator())

async def messages_handler(request: Request):
    """Handles POST /messages/ and POST /sse"""
    session_id = request.query_params.get("session_id")
    try:
        body = await request.json()
    except Exception:
        body = {}

    logger.info(f"Received POST request (session_id={session_id}): {body}")
    result = await process_json_rpc(body)

    if result:
        # If session_id is active in SSE, push to the stream
        if session_id and session_id in active_sessions:
            await active_sessions[session_id].put(result)
            return JSONResponse({"status": "accepted"}, status_code=202)
        # Otherwise return directly in HTTP response
        return JSONResponse(result)

    return Response(status_code=202)

async def root_handler(request: Request):
    """Handles GET/POST /"""
    if request.method == "POST":
        return await messages_handler(request)
    return JSONResponse({
        "status": "online",
        "service": "ATITHI Hotel MCP Server",
        "tools_count": len(TOOLS_SPEC),
        "sse_endpoint": "/sse",
        "messages_endpoint": "/messages/"
    })

# Mount application routes
routes = [
    Route("/mcp", endpoint=messages_handler, methods=["GET", "POST"]),
    Route("/sse", endpoint=sse_handler, methods=["GET"]),
    Route("/sse", endpoint=messages_handler, methods=["POST"]),
    Route("/messages/", endpoint=messages_handler, methods=["POST"]),
    Route("/messages", endpoint=messages_handler, methods=["POST"]),
    Route("/", endpoint=root_handler, methods=["GET", "POST"]),
]

app = Starlette(routes=routes)

if __name__ == "__main__":
    import uvicorn
    print("Starting ATITHI MCP Server on port 8002...")
    uvicorn.run("backend.mcp_server:app", host="0.0.0.0", port=8002, reload=True)
