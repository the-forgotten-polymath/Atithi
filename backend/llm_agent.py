"""
ATITHI LLM Cognitive Agent (Groq / Llama-3.3)
Transforms natural, unstructured, dialectal, and Hinglish queries into
grounded 5-star responses with structured intent, entity extraction, and action tickets.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

from backend.knowledge_base import HOTEL_META, KNOWLEDGE_ITEMS
from backend.intent import classify_intent, IntentResult
from backend.retriever import retrieve_knowledge
from backend.generator import generate_grounded_response, ATITHIResponse

load_dotenv()

logger = logging.getLogger("atithi_llm")

# Format Knowledge Base as a condensed grounded context block
def build_grounded_context() -> str:
    lines = [
        f"PROPERTY: {HOTEL_META['name']} ({HOTEL_META['tagline']})",
        f"LOCATION: {HOTEL_META['location']}",
        f"RECEPTION: {HOTEL_META['reception_hours']} | PHONE: {HOTEL_META['phone']}",
        f"TOTAL ROOMS: {HOTEL_META['total_rooms']} across {HOTEL_META['floors']} floors (Tariff currency: {HOTEL_META['currency']})",
        "\nVERIFIED HOTEL POLICIES & FACTS (GROUND TRUTH):"
    ]
    for item in KNOWLEDGE_ITEMS:
        lines.append(f"- [{item['category'].upper()}] {item['title']}: {item['content']}")
    return "\n".join(lines)

GROUNDED_SYSTEM_PROMPT = f"""You are ATITHI, a real, caring, and attentive front-desk team member at 'The Himalayan Vista' luxury mountain hotel in Mussoorie.

CRITICAL TONE & ANTI-AI-SLOP GUIDELINES:
1. TALK LIKE A REAL CARING HUMAN (NO JARGON):
   - Speak naturally like a warm, helpful human on the phone or intercom.
   - NEVER use internal corporate/department jargon with guests: DO NOT say "engineering team", "maintenance team", "housekeeping division", or "technician".
   - Simply say "our team" or "someone will be right up" ("हमारी टीम" / "कोई अभी आकर देख लेगा").
   - NEVER quote brochure text or technical specs.
   - KEEP IT SIMPLE & BRIEF: 1 to 2 short, natural, comforting sentences that anyone can easily understand.
2. EXACT LANGUAGE MATCHING:
   - MATCH THE GUEST'S LANGUAGE: If the guest writes in English, reply in natural English. If the guest writes in Hindi or Hinglish, reply in natural Hindi.
   - For Hindi or Hinglish queries:
     * Example for complaint: "नमस्ते, इस परेशानी के लिए माफी चाहते हैं। मैंने अपनी टीम को बोल दिया है, कोई 5-10 मिनट में आपके कमरे में आकर इसे ठीक कर देगा और एक्स्ट्रा कंबल भी दे देगा।"
     * Example for timing: "नमस्ते! नाश्ता सुबह 7:30 से 10:30 बजे तक ग्राउंड फ्लोर वाले रेस्टोरेंट (The Glasshouse) में रहता है। आप आराम से आ सकते हैं!"
     * Example for Wi-Fi: "Wi-Fi नेटवर्क 'HimalayanVista_Guest' है। कनेक्ट करके अपना रूम नंबर और नाम दर्ज करेंगे तो इंटरनेट चालू हो जाएगा।"
   - For English queries:
     * Example for complaint: "We're so sorry about that! I've alerted our team right away and someone will be at your room within 10 minutes to fix the water temperature."
     * Example for towels: "Sure thing! I've asked our team to bring fresh towels to your room right away—they will be there in about 10 minutes."
     * Example for breakfast: "Good morning! Breakfast is served daily from 7:30 AM to 10:30 AM at The Glasshouse restaurant on the Ground Floor."
3. COMPLAINTS & DEFECTS:
   - Apologize simply and sincerely, say that you have alerted your team right now, and give a quick reassuring timeline. Keep it effortless to understand.
4. STRICT ZERO-HALLUCINATION:
   - Answer strictly from the verified facts below.
   - If the guest asks about something not in the hotel's knowledge, do not invent. Politely say you'll check with the Duty Manager and set "is_grounded": false, "human_handoff": true.
5. ACTION TICKETS & ROOM BOOKINGS:
   - For room bookings / new reservations: create a ROOM_BOOKING ticket routed to Front Desk with priority MEDIUM. Tag it as PAY_ON_PROPERTY (payment to be settled at check-in desk).
   - For defects (AC, heater, geyser, Wi-Fi down): create a MAINTENANCE_DISPATCH ticket with priority HIGH.
   - For amenities (towels, blankets, water, dental kit): create a HOUSEKEEPING_DELIVERY ticket with priority MEDIUM.
   - For taxi/cab assistance ("mujhe taxi chahiye", "need a cab", "airport drop"): create a TAXI_REQUEST ticket routed to Concierge & Travel Desk with priority MEDIUM.
   - For extensions/reservations: route to Front Desk.
   - Always extract room number if mentioned (e.g. 'room 302' -> '302').

VERIFIED HOTEL FACTS (INTERNAL REFERENCE ONLY — DO NOT COPY-PASTE TO GUEST):
{build_grounded_context()}

OUTPUT FORMAT:
Respond ONLY with a valid JSON object (no markdown code blocks, raw JSON):
{{
  "intent": "DINING_INQUIRY | HOUSEKEEPING_REQUEST | MAINTENANCE_ISSUE | POLICY_INQUIRY | FACILITY_INQUIRY | LOCAL_RECOMMENDATION | RESERVATION_INQUIRY | EMERGENCY_ESCALATION | TAXI_REQUEST | GENERAL_FAQ",
  "confidence": 0.95,
  "department": "Housekeeping | Engineering & Maintenance | Food & Beverage | Front Desk | Security & Management | Concierge & Travel Desk",
  "reply": "Natural, warm, human reply without brochure slop...",
  "is_grounded": true,
  "primary_source": "Title of verified fact",
  "human_handoff": false,
  "action_ticket": {{
    "type": "MAINTENANCE_DISPATCH | HOUSEKEEPING_DELIVERY | STAY_EXTENSION_REQUEST | ROOM_BOOKING | TAXI_REQUEST",
    "department": "...",
    "room_number": "302 or Unassigned",
    "priority": "HIGH | MEDIUM | LOW",
    "issue": "concise description of issue"
  }} or null,
  "entities": {{
    "room_number": "...",
    "requested_item": "..."
  }}
}}
"""

PREFERRED_GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]

_CACHED_GROQ_MODEL = None

def get_best_groq_model(client) -> str:
    global _CACHED_GROQ_MODEL
    if _CACHED_GROQ_MODEL:
        return _CACHED_GROQ_MODEL
    try:
        available = {m.id for m in client.models.list().data}
        for model in PREFERRED_GROQ_MODELS:
            if model in available:
                _CACHED_GROQ_MODEL = model
                return model
    except Exception:
        pass
    _CACHED_GROQ_MODEL = "openai/gpt-oss-120b"
    return _CACHED_GROQ_MODEL

def call_groq_llm(
    query: str,
    api_key: Optional[str] = None,
    room_number: Optional[str] = None,
    guest_name: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Invokes Groq LLM for real-time sub-second cognitive inference."""
    groq_key = api_key or os.environ.get("GROQ_API_KEY")
    if not groq_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        model = get_best_groq_model(client)

        user_content = f"Guest Message: {query}"
        if room_number:
            user_content += f"\nGuest's Room: {room_number}"
        if guest_name:
            user_content += f"\nGuest's Name: {guest_name}"

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": GROUNDED_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        content = completion.choices[0].message.content.strip()
        data = json.loads(content)
        data["provider"] = f"Groq {model} (High-Speed LLM)"
        return data
    except Exception as e:
        logger.warning(f"Groq LLM call failed: {e}. Falling back to grounded rule engine.")
        return None

def process_guest_query(
    query: str,
    api_key: Optional[str] = None,
    room_number: Optional[str] = None,
    guest_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Hybrid cognitive orchestrator:
    1. Tries Groq LLM (llama-3.3-70b-versatile) if GROQ_API_KEY is present.
    2. Seamlessly falls back to our deterministic Knowledge & Intent engine if key is absent or offline.
    """
    # 1. Attempt Groq LLM
    llm_result = call_groq_llm(
        query=query,
        api_key=api_key,
        room_number=room_number,
        guest_name=guest_name
    )

    if llm_result:
        # Normalize and return
        return {
            "reply": llm_result.get("reply", ""),
            "intent": llm_result.get("intent", "GENERAL_FAQ"),
            "confidence": float(llm_result.get("confidence", 0.95)),
            "is_grounded": bool(llm_result.get("is_grounded", True)),
            "primary_source": llm_result.get("primary_source"),
            "department": llm_result.get("department", "Front Desk"),
            "human_handoff": bool(llm_result.get("human_handoff", False)),
            "action_ticket": llm_result.get("action_ticket"),
            "entities": llm_result.get("entities", {}),
            "provider": "Groq Llama-3.3-70B (Ultra-fast LLM)"
        }

    # 2. Deterministic Grounded Engine Fallback
    intent_res = classify_intent(query)
    retrieval_res = retrieve_knowledge(query, intent_res)
    grounded_res = generate_grounded_response(
        query=query,
        intent_res=intent_res,
        retrieval_res=retrieval_res,
        room_number=room_number,
        guest_name=guest_name
    )

    return {
        "reply": grounded_res.reply,
        "intent": grounded_res.intent,
        "confidence": grounded_res.confidence,
        "is_grounded": grounded_res.is_grounded,
        "primary_source": grounded_res.primary_source,
        "department": grounded_res.department,
        "human_handoff": grounded_res.human_handoff,
        "action_ticket": grounded_res.action_ticket,
        "entities": grounded_res.entities,
        "provider": "Deterministic Grounded Engine (Local Mirror)"
    }
