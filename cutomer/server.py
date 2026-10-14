"""
ATITHI Guest Voice Intercom Server
Dedicated standalone backend for Agora Conversational AI Agent Testing
Folder: /Users/dev/Desktop/Final-ATITHI/cutomer
"""

import os
import time
import base64
import logging
from typing import Optional
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from agora_token_builder import RtcTokenBuilder
    HAS_TOKEN_BUILDER = True
except ImportError:
    HAS_TOKEN_BUILDER = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AtithiCustomerServer")

from dotenv import load_dotenv

# Load root .env
load_dotenv(Path(__file__).parent.parent / ".env")

# Agora Default Credentials provided by User
APP_ID = os.getenv("AGORA_APP_ID", "1932b7112f574a56a8cf07a4bae9d0f1")
DEFAULT_PIPELINE_ID = os.getenv("AGORA_PIPELINE_ID", "b8a99367a95c4cd2a8a4d5a9ebfbc849")
CUSTOMER_KEY = os.getenv("AGORA_CUSTOMER_KEY", "e4db3335b0ff424bb0f757993a2705c0")
CUSTOMER_SECRET = os.getenv("AGORA_CUSTOMER_SECRET", "ca868b5aee024fa9b474db73a3b5b1a8")
APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE", "61980c347f334a928f59add81059e533")

app = FastAPI(title="ATITHI Customer Voice Intercom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartCallRequest(BaseModel):
    room_number: str = "104"
    channel_name: Optional[str] = None
    pipeline_id: Optional[str] = None
    guest_uid: int = 1001
    app_certificate: Optional[str] = None

class StopCallRequest(BaseModel):
    agent_instance_id: str

def get_auth_header() -> str:
    auth_str = f"{CUSTOMER_KEY}:{CUSTOMER_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    return f"Basic {b64_auth}"

def generate_rtc_token(app_id: str, app_cert: str, channel: str, uid: int, role: int = 1) -> str:
    if not app_cert or not HAS_TOKEN_BUILDER:
        return ""
    # Expire in 1 hour (3600s)
    privilege_expired_ts = int(time.time()) + 3600
    try:
        return RtcTokenBuilder.buildTokenWithUid(
            app_id, app_cert, channel, uid, role, privilege_expired_ts
        )
    except Exception as e:
        logger.error(f"Failed to generate RTC token: {e}")
        return ""

@app.get("/api/config")
def get_config():
    return {
        "app_id": APP_ID,
        "default_pipeline_id": DEFAULT_PIPELINE_ID,
        "has_app_certificate": bool(APP_CERTIFICATE),
    }

@app.post("/api/call/start")
async def start_call(req: StartCallRequest):
    channel = req.channel_name or f"atithi_room_{req.room_number}_{int(time.time())}"
    pipeline = req.pipeline_id or DEFAULT_PIPELINE_ID
    app_cert = req.app_certificate or APP_CERTIFICATE
    guest_uid = req.guest_uid
    agent_uid = 999

    guest_token = ""
    agent_token = ""
    if app_cert:
        guest_token = generate_rtc_token(APP_ID, app_cert, channel, guest_uid, role=1)
        agent_token = generate_rtc_token(APP_ID, app_cert, channel, agent_uid, role=1)
        logger.info(f"Generated tokens for channel={channel}, guest_uid={guest_uid}, agent_uid={agent_uid}")

    # Build Agora Conversational AI Agent Join payload
    body = {
        "name": f"session_{channel}",
        "pipeline_id": pipeline,
        "properties": {
            "channel": channel,
            "token": agent_token,
            "agent_rtc_uid": str(agent_uid),
            "remote_rtc_uids": [str(guest_uid)]
        }
    }

    headers = {
        "Authorization": get_auth_header(),
        "Content-Type": "application/json"
    }
    join_url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{APP_ID}/join"

    logger.info(f"Dispatching Agora AI Agent to channel: {channel} with pipeline {pipeline}")
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(join_url, headers=headers, json=body)
        except Exception as e:
            logger.error(f"Agora API request error: {e}")
            raise HTTPException(status_code=502, detail=f"Failed to reach Agora API: {str(e)}")

    if resp.status_code not in (200, 201):
        logger.error(f"Agora API error {resp.status_code}: {resp.text}")
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Agora Error ({resp.status_code}): {resp.text}"
        )

    data = resp.json()
    agent_instance_id = data.get("agent_id")
    logger.info(f"Agora Agent spawned successfully. Instance ID: {agent_instance_id}")

    return {
        "success": True,
        "app_id": APP_ID,
        "channel": channel,
        "guest_uid": guest_uid,
        "guest_token": guest_token,
        "agent_uid": agent_uid,
        "agent_instance_id": agent_instance_id,
        "status": data.get("status", "RUNNING")
    }

@app.post("/api/call/stop")
async def stop_call(req: StopCallRequest):
    if not req.agent_instance_id:
        return {"success": True, "message": "No instance ID provided"}

    headers = {
        "Authorization": get_auth_header(),
        "Content-Type": "application/json"
    }
    leave_url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{APP_ID}/agents/{req.agent_instance_id}/leave"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(leave_url, headers=headers)
            logger.info(f"Agent leave status: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.warning(f"Error stopping agent {req.agent_instance_id}: {e}")

    return {"success": True, "agent_instance_id": req.agent_instance_id}

@app.get("/api/call/status/{agent_instance_id}")
async def get_agent_status(agent_instance_id: str):
    headers = {
        "Authorization": get_auth_header(),
        "Content-Type": "application/json"
    }
    url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{APP_ID}/agents/{agent_instance_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=headers)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Proxy Brain & Tickets endpoints to Backend Port 8001
BACKEND_BRAIN_URL = os.getenv("BACKEND_BRAIN_URL", "http://127.0.0.1:8001")

@app.post("/api/chat")
async def proxy_chat(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(f"{BACKEND_BRAIN_URL}/api/chat", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except Exception as e:
            logger.error(f"Error proxying /api/chat: {e}")
            raise HTTPException(status_code=502, detail=f"AI Brain service unavailable: {e}")

@app.get("/api/tickets")
async def proxy_get_tickets(request: Request):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{BACKEND_BRAIN_URL}/api/tickets?{request.query_params}")
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

@app.patch("/api/tickets/{ticket_number}")
async def proxy_patch_ticket(ticket_number: str, request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.patch(f"{BACKEND_BRAIN_URL}/api/tickets/{ticket_number}", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

@app.post("/api/tickets/{ticket_number}/confirm")
async def proxy_confirm_ticket(ticket_number: str, request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(f"{BACKEND_BRAIN_URL}/api/tickets/{ticket_number}/confirm", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

# Mount static files in cutomer directory
STATIC_DIR = Path(__file__).parent.resolve()
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8085, reload=True)
