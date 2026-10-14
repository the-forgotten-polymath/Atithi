"""
ATITHI Intent Classifier & Entity Extractor
Understands guest inquiries in English, Hindi, and Hinglish.
Maps guest intent to appropriate hotel operational categories.
"""

import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class IntentResult(BaseModel):
    intent: str
    confidence: float
    category: str
    department: str
    entities: Dict[str, Any]
    is_actionable: bool
    urgency: str
    language: str

# Intent Definitions & Priority Rules
INTENT_RULES = [
    {
        "intent": "EMERGENCY_ESCALATION",
        "category": "local_info",
        "department": "Security & Management",
        "urgency": "critical",
        "is_actionable": True,
        "keywords": [
            "emergency", "doctor", "hospital", "ambulance", "police", "fire",
            "heart", "chest pain", "bleed", "accident", "bimar", "chot", "dawa"
        ]
    },
    {
        "intent": "MAINTENANCE_ISSUE",
        "category": "operational_rules",
        "department": "Engineering & Maintenance",
        "urgency": "high",
        "is_actionable": True,
        "keywords": [
            "ac", "air condition", "aircon", "heating", "heater", "thand", "garam",
            "not working", "nahi chal raha", "kharab", "leaking", "paani", "geyser",
            "hot water", "tv", "remote", "light", "bulb", "power", "socket", "flush"
        ]
    },
    {
        "intent": "HOUSEKEEPING_REQUEST",
        "category": "services",
        "department": "Housekeeping",
        "urgency": "medium",
        "is_actionable": True,
        "keywords": [
            "towel", "extra towel", "towels", "tauliya", "bedsheet", "chaddar",
            "pillow", "takia", "blanket", "kambal", "clean room", "cleaning",
            "safai", "soap", "shampoo", "dental kit", "water bottle", "paani ki bottle",
            "dustbin", "laundry", "iron", "press"
        ]
    },
    {
        "intent": "DINING_INQUIRY",
        "category": "dining",
        "department": "Food & Beverage",
        "urgency": "low",
        "is_actionable": False,
        "keywords": [
            "breakfast", "nashta", "lunch", "dinner", "khana", "restaurant", "menu",
            "food", "room service", "buffet", "timing", "kab hai", "jain", "veg",
            "vegetarian", "snack", "coffee", "tea", "chai"
        ]
    },
    {
        "intent": "POLICY_INQUIRY",
        "category": "policies",
        "department": "Front Desk",
        "urgency": "medium",
        "is_actionable": False,
        "keywords": [
            "checkout", "check out", "check-out", "checkin", "check in", "check-in",
            "extend", "extension", "stay badhana", "ek din extend", "late checkout",
            "cancellation", "cancel", "refund", "pet", "dog", "smoking", "smoke", "visitor"
        ]
    },
    {
        "intent": "FACILITY_INQUIRY",
        "category": "facilities",
        "department": "Front Desk",
        "urgency": "low",
        "is_actionable": False,
        "keywords": [
            "wifi", "wi-fi", "internet", "password", "network", "parking", "car", "gaadi",
            "valet", "gym", "fitness", "pool", "swimming", "swimming pool", "ev charger"
        ]
    },
    {
        "intent": "LOCAL_RECOMMENDATION",
        "category": "local_info",
        "department": "Concierge & Travel Desk",
        "urgency": "low",
        "is_actionable": False,
        "keywords": [
            "mall road", "kempty", "kempty falls", "lal tibba", "sightseeing", "visit",
            "taxi", "cab", "shopping", "places to see", "distance", "ghoomne"
        ]
    },
    {
        "intent": "RESERVATION_INQUIRY",
        "category": "operational_rules",
        "department": "Front Desk Reservations",
        "urgency": "medium",
        "is_actionable": False,
        "keywords": [
            "room for tonight", "available room", "book a room", "rates", "tariff",
            "price per night", "room khali hai", "vacancy", "suite price"
        ]
    }
]

def extract_entities(query: str) -> Dict[str, Any]:
    """Extracts room numbers, guest names, items, and quantities from text."""
    entities: Dict[str, Any] = {}
    
    # 1. Room Number extraction (e.g. "Room 204", "room 103", "kamre 305", "in 204")
    room_patterns = [
        r'\b(?:room|suite|kamra|rm|room\s*no\.?)\s*([0-9]{3,4})\b',
        r'\b([1-4][0-1][0-9])\b' # 3-digit hotel room numbers like 101-410
    ]
    for pattern in room_patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            entities["room_number"] = match.group(1)
            break
            
    # 2. Item extraction
    item_keywords = {
        "extra_towel": ["extra towel", "towel", "tauliya", "towels"],
        "extra_blanket": ["blanket", "kambal"],
        "extra_pillow": ["pillow", "takia"],
        "water_bottles": ["water bottle", "paani ki bottle", "drinking water"],
        "ac_repair": ["ac", "air condition", "heater", "heating"],
        "iron": ["iron", "ironing board", "press"]
    }
    for item_key, synonyms in item_keywords.items():
        if any(syn in query.lower() for syn in synonyms):
            entities["requested_item"] = item_key
            break
            
    # 3. Detect stay extension details
    if any(k in query.lower() for k in ["extend", "extension", "ek din", "one more night", "another night"]):
        entities["extension_requested"] = True

    return entities

def detect_language(query: str) -> str:
    """Heuristic language detection for English, Hindi, and Hinglish."""
    hinglish_markers = [
        "hai", "kab", "kitne", "kahan", "baje", "karo", "karen", "chahiye", "mera", "meri",
        "nahi", "chal", "raha", "rahi", "ek", "din", "bhai", "kripya", "dhanyawad", "saaf"
    ]
    words = query.lower().split()
    if any(w in words for w in hinglish_markers):
        return "hinglish"
    return "en"

def classify_intent(query: str) -> IntentResult:
    """Classifies the user's intent with confidence scoring and entity extraction."""
    clean_query = query.lower().strip()
    entities = extract_entities(query)
    lang = detect_language(query)
    
    best_intent = None
    max_score = 0

    for rule in INTENT_RULES:
        score = 0
        for kw in rule["keywords"]:
            if kw in clean_query:
                # Longer matches (e.g. "not working", "extra towel") get higher weight
                score += len(kw.split()) * 2

        if score > max_score:
            max_score = score
            best_intent = rule

    if not best_intent or max_score == 0:
        return IntentResult(
            intent="GENERAL_FAQ",
            confidence=0.40,
            category="hotel_info",
            department="Front Desk",
            entities=entities,
            is_actionable=False,
            urgency="low",
            language=lang
        )

    # Normalize confidence between 0.70 and 0.98 based on match strength
    confidence = min(0.98, 0.65 + (max_score * 0.08))

    return IntentResult(
        intent=best_intent["intent"],
        confidence=round(confidence, 2),
        category=best_intent["category"],
        department=best_intent["department"],
        entities=entities,
        is_actionable=best_intent["is_actionable"],
        urgency=best_intent["urgency"],
        language=lang
    )
