"""
ATITHI Knowledge Retrieval Engine
Pulls verified hotel facts from the Knowledge Base based on intent and query.
Provides strict grounding to prevent LLM hallucinations.
"""

from typing import List, Dict, Any, Optional
from backend.knowledge_base import KNOWLEDGE_ITEMS, HOTEL_META
from backend.intent import IntentResult

class RetrievalResult:
    def __init__(self, items: List[Dict[str, Any]], primary_item: Optional[Dict[str, Any]], is_grounded: bool, search_score: float):
        self.items = items
        self.primary_item = primary_item
        self.is_grounded = is_grounded
        self.search_score = search_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_grounded": self.is_grounded,
            "search_score": round(self.search_score, 2),
            "primary_fact": self.primary_item["title"] if self.primary_item else None,
            "matched_count": len(self.items),
            "sources": [
                {
                    "id": item["id"],
                    "title": item["title"],
                    "category": item["category"],
                    "content": item["content"]
                }
                for item in self.items
            ]
        }

def retrieve_knowledge(query: str, intent_res: IntentResult) -> RetrievalResult:
    """Retrieves relevant facts from the knowledge base using intent and keyword matching."""
    clean_query = query.lower()
    query_tokens = set(clean_query.replace('?', '').replace('!', '').replace('.', '').split())
    
    scored_items: List[tuple[float, Dict[str, Any]]] = []

    for item in KNOWLEDGE_ITEMS:
        score = 0.0

        kw_matched = False
        # 1. Keyword Matches
        for kw in item.get("keywords", []):
            if kw in clean_query:
                score += 4.0 + (len(kw.split()) * 2)
                kw_matched = True

        # 2. Title / Token overlap
        title_tokens = set(item["title"].lower().split())
        token_overlap = len(query_tokens.intersection(title_tokens))
        score += token_overlap * 2.5

        # 3. Category Alignment (ONLY if there was at least a keyword or token match, or specific intent)
        if item["category"] == intent_res.category and (kw_matched or token_overlap > 0):
            score += 3.0

        # 4. Intent-specific routing boosts (only if query contains relevant keyword)
        if intent_res.intent == "DINING_INQUIRY" and "breakfast" in item["id"] and any(w in clean_query for w in ["breakfast", "nashta", "morning"]):
            score += 10.0
        elif intent_res.intent == "MAINTENANCE_ISSUE" and "ac" in clean_query and "ac" in item["id"]:
            score += 10.0
        elif intent_res.intent == "HOUSEKEEPING_REQUEST" and "towel" in clean_query and "towel" in item["id"]:
            score += 10.0
        elif intent_res.intent == "POLICY_INQUIRY" and any(k in clean_query for k in ["extend", "extension", "ek din"]) and "checkout" in item["id"]:
            score += 10.0
        elif intent_res.intent == "FACILITY_INQUIRY" and "wifi" in clean_query and "wifi" in item["id"]:
            score += 10.0
        elif intent_res.intent == "FACILITY_INQUIRY" and "parking" in clean_query and "parking" in item["id"]:
            score += 10.0
        elif intent_res.intent == "RESERVATION_INQUIRY" and "room" in clean_query and "room-availability" in item["id"]:
            score += 10.0

        if score > 0:
            scored_items.append((score, item))

    # Sort items by score descending
    scored_items.sort(key=lambda x: x[0], reverse=True)

    if not scored_items or scored_items[0][0] < 2.5:
        # Not found in knowledge base -> Flag as ungrounded for human handoff
        return RetrievalResult(
            items=[],
            primary_item=None,
            is_grounded=False,
            search_score=0.0
        )

    top_score = scored_items[0][0]
    matched = [item for s, item in scored_items if s >= (top_score * 0.45)][:3]

    return RetrievalResult(
        items=matched,
        primary_item=matched[0],
        is_grounded=True,
        search_score=top_score
    )
