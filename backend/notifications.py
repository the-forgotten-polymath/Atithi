"""
ATITHI Staff & Owner Notification Service
Dispatches alerts to Telegram Bot/Channel (if configured)
and maintains an in-memory event bus for real-time SSE broadcasts.
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("atithi_notifications")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# In-memory subscriber queues for Server-Sent Events (SSE)
_SUBSCRIBERS: List[asyncio.Queue] = []

def subscribe_events() -> asyncio.Queue:
    """Subscribe a client to live ticket events."""
    q = asyncio.Queue()
    _SUBSCRIBERS.append(q)
    return q

def unsubscribe_events(q: asyncio.Queue):
    """Unsubscribe a client from live ticket events."""
    if q in _SUBSCRIBERS:
        _SUBSCRIBERS.remove(q)

async def broadcast_event(event_type: str, data: Dict[str, Any]):
    """Broadcast an event to all connected web clients via SSE."""
    payload = {
        "event": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    dead = []
    for q in _SUBSCRIBERS:
        try:
            q.put_nowait(payload)
        except Exception:
            dead.append(q)
    for q in dead:
        unsubscribe_events(q)

async def send_telegram_alert(message: str) -> bool:
    """Send alert to Hotel Staff / Owner Telegram group."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.info(f"[SIMULATED TELEGRAM ALERT] (Configure TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID for live push):\n{message}")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info("Telegram alert sent successfully.")
                return True
            else:
                logger.warning(f"Telegram API returned {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Error sending Telegram alert: {e}")
        return False

async def notify_new_ticket(ticket: Dict[str, Any]):
    """Notify staff and owner when a new ticket is opened."""
    priority_emoji = {
        "critical": "🚨🔴",
        "high": "⚠️🟠",
        "medium": "🟡",
        "low": "🔵"
    }.get(str(ticket.get("priority", "low")).lower(), "📋")

    msg = (
        f"{priority_emoji} <b>NEW ATITHI GUEST TICKET #{ticket.get('ticket_number')}</b>\n"
        f"🏨 <b>The Himalayan Vista</b>\n"
        f"🛏️ <b>Room:</b> {ticket.get('room_number')} ({ticket.get('guest_name', 'Guest')})\n"
        f"🏷️ <b>Issue:</b> {ticket.get('title')}\n"
        f"🏢 <b>Department:</b> {ticket.get('department_name', 'General')}\n"
        f"⚡ <b>Priority:</b> {str(ticket.get('priority')).upper()} | <b>SLA:</b> 15 Mins\n"
        f"📡 <b>Channel:</b> {ticket.get('source_channel', 'ai_chat')}\n"
        f"💬 <b>Details:</b> {ticket.get('description', '')}\n"
        f"🕒 <i>Status: OPEN — Pending Staff Acknowledgment</i>"
    )

    # 1. Send Telegram Alert (or log simulation)
    await send_telegram_alert(msg)

    # 2. Broadcast via SSE to Dashboard and Guest Room
    await broadcast_event("ticket_created", ticket)

async def notify_ticket_status_change(ticket: Dict[str, Any], old_status: str, new_status: str):
    """Notify when a ticket changes state (in_progress, resolved, closed)."""
    status_emoji = {
        "in_progress": "⚙️ Assigned & In Progress",
        "resolved": "✅ Resolved by Staff — Follow-up sent to Guest",
        "closed": "🔒 Closed & Confirmed by Guest"
    }.get(new_status, new_status.upper())

    msg = (
        f"🔔 <b>TICKET UPDATE #{ticket.get('ticket_number')}</b>\n"
        f"🛏️ <b>Room:</b> {ticket.get('room_number')} | {ticket.get('guest_name', 'Guest')}\n"
        f"🏷️ <b>Title:</b> {ticket.get('title')}\n"
        f"📊 <b>Status:</b> {status_emoji}\n"
        f"👤 <b>Staff:</b> {ticket.get('assigned_to', 'On-duty Team')}\n"
        f"📝 <b>Notes:</b> {ticket.get('resolution_notes', 'N/A')}"
    )

    await send_telegram_alert(msg)
    await broadcast_event("ticket_updated", {
        "ticket": ticket,
        "old_status": old_status,
        "new_status": new_status
    })
