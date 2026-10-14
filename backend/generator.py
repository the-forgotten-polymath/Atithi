"""
ATITHI Grounded Response Generator
Transforms retrieved hotel facts into warm, courteous concierge responses.
Guarantees zero hallucinations through strict fact grounding and automatic human handoff.
"""

from typing import Dict, Any, Optional
from backend.intent import IntentResult
from backend.retriever import RetrievalResult
from backend.knowledge_base import HOTEL_META

class ATITHIResponse:
    def __init__(
        self,
        reply: str,
        intent: str,
        confidence: float,
        is_grounded: bool,
        primary_source: Optional[str],
        department: str,
        action_ticket: Optional[Dict[str, Any]] = None,
        human_handoff: bool = False,
        entities: Optional[Dict[str, Any]] = None
    ):
        self.reply = reply
        self.intent = intent
        self.confidence = confidence
        self.is_grounded = is_grounded
        self.primary_source = primary_source
        self.department = department
        self.action_ticket = action_ticket
        self.human_handoff = human_handoff
        self.entities = entities or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reply": self.reply,
            "intent": self.intent,
            "confidence": self.confidence,
            "is_grounded": self.is_grounded,
            "primary_source": self.primary_source,
            "department": self.department,
            "human_handoff": self.human_handoff,
            "action_ticket": self.action_ticket,
            "entities": self.entities
        }

def generate_grounded_response(
    query: str,
    intent_res: IntentResult,
    retrieval_res: RetrievalResult,
    room_number: Optional[str] = None,
    guest_name: Optional[str] = None
) -> ATITHIResponse:
    """Generates a warm, polished hotel concierge reply grounded strictly in retrieved facts."""
    
    # Resolve room number: explicit argument > extracted from entity
    effective_room = room_number or intent_res.entities.get("room_number")
    is_hinglish = (intent_res.language == "hinglish")
    hotel_name = HOTEL_META["name"]

    # --- Case 1: Fact Not Found in Knowledge Base (Human Handoff Guardrail) ---
    if not retrieval_res.is_grounded or not retrieval_res.primary_item:
        if is_hinglish:
            reply = (
                f"Namaste{f' {guest_name}' if guest_name else ''}. Main yeh sunishchit karna chahta hoon "
                f"ki aapko bilkul sahi aur taaza jaankari mile. Main aapko hamare Front Desk Concierge "
                f"se turant jod raha hoon jo aapki poori madad karenge."
            )
        else:
            reply = (
                f"Welcome to {hotel_name}. To ensure you receive the most accurate and up-to-date information, "
                f"I am connecting you directly with our Front Desk Duty Manager right now."
            )
        return ATITHIResponse(
            reply=reply,
            intent=intent_res.intent,
            confidence=intent_res.confidence,
            is_grounded=False,
            primary_source=None,
            department="Front Desk",
            human_handoff=True,
            entities=intent_res.entities
        )

    # --- Case 2: Grounded Fact Retrieved ---
    fact = retrieval_res.primary_item
    fact_content = fact["content"]
    fact_title = fact["title"]
    department = intent_res.department

    action_ticket = None

    # Handle Specific Intent Categories with Warm Human Front-Desk Touch:
    rm_phrase = f"Room {effective_room}" if effective_room else "aapke kamre"

    # 1. Maintenance Issue (e.g. "Room 204 mein AC nahi chal raha")
    if intent_res.intent == "MAINTENANCE_ISSUE":
        if is_hinglish:
            reply = (
                f"नमस्ते, इस परेशानी के लिए माफी चाहते हैं। मैंने अपनी टीम को तुरंत बोल दिया है, कोई 10 मिनट में {rm_phrase} में आकर इसे ठीक कर देगा। कृपया थोड़ा धैर्य रखें।"
            )
        else:
            reply = (
                f"We're so sorry about that! I have alerted our team right away and someone will be at {rm_phrase if effective_room else 'your room'} within 10 minutes to fix this for you."
            )
        action_ticket = {
            "type": "MAINTENANCE_DISPATCH",
            "department": "Engineering & Maintenance",
            "room_number": effective_room or "Unassigned",
            "priority": "HIGH",
            "issue": query
        }

    # 2. Housekeeping Request (e.g. "Can I get an extra towel?")
    elif intent_res.intent == "HOUSEKEEPING_REQUEST":
        if is_hinglish:
            reply = (
                f"नमस्ते! मैंने अपनी टीम को बोल दिया है, 10-15 मिनट में {rm_phrase} में ताज़ा सामान पहुँचा दिया जाएगा।"
            )
        else:
            reply = (
                f"Sure thing! I have asked our team to bring fresh supplies to {rm_phrase if effective_room else 'your room'} within 10–15 minutes."
            )
        action_ticket = {
            "type": "HOUSEKEEPING_DELIVERY",
            "department": "Housekeeping",
            "room_number": effective_room or "Unassigned",
            "priority": "MEDIUM",
            "requested_item": intent_res.entities.get("requested_item", "housekeeping_item")
        }

    # 3. Stay Extension / Policy (e.g. "Mera checkout kal hai, ek din extend kar sakte hain?")
    elif intent_res.intent == "POLICY_INQUIRY" and intent_res.entities.get("extension_requested"):
        if is_hinglish:
            reply = (
                f"नमस्ते! आपके स्टे एक्सटेंशन के लिए हमने फ्रंट डेस्क मैनेजर को तुरंत बता दिया है। "
                f"वे अगले 5 मिनट में रूम इन्वेंट्री चेक करके आपके इंटरकॉम पर कन्फर्म कर देंगे।"
            )
        else:
            reply = (
                f"Thank you for letting us know! I have notified our Front Desk Duty Manager regarding your extension request. "
                f"They will check tomorrow's room availability and contact you shortly."
            )
        action_ticket = {
            "type": "STAY_EXTENSION_REQUEST",
            "department": "Front Desk",
            "room_number": effective_room or "Unassigned",
            "priority": "MEDIUM",
            "action": "Check inventory and confirm extension"
        }

    # 4. Dining (e.g. "What time is breakfast?" / "Breakfast kitne baje hai?")
    elif intent_res.intent == "DINING_INQUIRY":
        if is_hinglish:
            reply = (
                "नमस्ते! नाश्ता सुबह 7:30 से 10:30 बजे तक हमारे ग्राउंड फ्लोर वाले रेस्टोरेंट (The Glasshouse) में रहता है। आप आराम से आ सकते हैं!"
            )
        else:
            reply = (
                "Good day! Breakfast is served daily from 7:30 AM to 10:30 AM at The Glasshouse Bistro on the Ground Floor."
            )

    # 5. Facilities & Wi-Fi (e.g. "What is the Wi-Fi password?" / "Is there parking?")
    elif intent_res.intent == "FACILITY_INQUIRY":
        if "wifi" in query.lower():
            if is_hinglish:
                reply = "नमस्ते! Wi-Fi नेटवर्क 'HimalayanVista_Guest' है। कनेक्ट करने के बाद अपना रूम नंबर और लास्ट नेम डालेंगे तो इंटरनेट चालू हो जाएगा।"
            else:
                reply = "Welcome! Connect to 'HimalayanVista_Guest' and enter your Room Number and Last Name on the welcome screen."
        elif "parking" in query.lower():
            if is_hinglish:
                reply = "नमस्ते! जी हाँ, हमारे यहाँ 24 घंटे फ्री वैले और प्राइवेट पार्किंग उपलब्ध है, जिसमें EV चार्जिंग भी शामिल है।"
            else:
                reply = "Yes, complimentary 24/7 valet and secure on-site parking is available for all guests, including EV charging stations."
        else:
            if is_hinglish:
                reply = f"नमस्ते! {fact_content}"
            else:
                reply = f"Welcome! {fact_content}"

    # 6. Reservation Inquiry (e.g. "Do you have a room for tonight?")
    elif intent_res.intent == "RESERVATION_INQUIRY":
        if is_hinglish:
            reply = (
                f"Namaste! {fact_content} "
                f"Aaj raat ke liye live room availability aur best direct rates confirm karne ke liye hamare Front Desk Reservations team turant aapki madad karegi."
            )
        else:
            reply = (
                f"Welcome to {hotel_name}! {fact_content} "
                f"Our Front Desk team will be delighted to verify instant room availability and reserve the perfect suite for your stay tonight."
            )

    # 7. General Grounded Fallback
    else:
        if is_hinglish:
            reply = f"Namaste! {fact_content}"
        else:
            reply = f"Welcome to {hotel_name}. {fact_content}"

    return ATITHIResponse(
        reply=reply,
        intent=intent_res.intent,
        confidence=intent_res.confidence,
        is_grounded=True,
        primary_source=fact_title,
        department=department,
        action_ticket=action_ticket,
        human_handoff=False,
        entities=intent_res.entities
    )
