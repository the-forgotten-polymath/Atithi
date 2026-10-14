"""
Automated Test Suite for ATITHI Phase 2
Tests the 7 mandatory benchmark questions from hotelKB.md:
1. "What time is breakfast?"
2. "Can I get an extra towel?"
3. "Is there parking?"
4. "Mera checkout kal hai, ek din extend kar sakte hain?"
5. "Room 204 mein AC nahi chal raha."
6. "Do you have a room for tonight?"
7. "What is the Wi-Fi password?"
Plus edge cases and zero-hallucination guardrail validation.
"""

import sys
from backend.intent import classify_intent
from backend.retriever import retrieve_knowledge
from backend.generator import generate_grounded_response

BENCHMARK_TESTS = [
    {
        "id": 1,
        "query": "What time is breakfast?",
        "expected_intent": "DINING_INQUIRY",
        "expected_dept": "Food & Beverage",
        "must_contain": ["7:30 AM", "10:30 AM", "Glasshouse Bistro"]
    },
    {
        "id": 2,
        "query": "Can I get an extra towel?",
        "expected_intent": "HOUSEKEEPING_REQUEST",
        "expected_dept": "Housekeeping",
        "must_contain": ["Housekeeping", "10–15 minutes"]
    },
    {
        "id": 3,
        "query": "Is there parking?",
        "expected_intent": "FACILITY_INQUIRY",
        "expected_dept": "Front Desk",
        "must_contain": ["valet", "parking", "EV"]
    },
    {
        "id": 4,
        "query": "Mera checkout kal hai, ek din extend kar sakte hain?",
        "expected_intent": "POLICY_INQUIRY",
        "expected_dept": "Front Desk",
        "must_contain": ["Front Desk", "availability", "late checkout"]
    },
    {
        "id": 5,
        "query": "Room 204 mein AC nahi chal raha.",
        "expected_intent": "MAINTENANCE_ISSUE",
        "expected_dept": "Engineering & Maintenance",
        "must_contain": ["Engineering", "10 minute", "Room 204"]
    },
    {
        "id": 6,
        "query": "Do you have a room for tonight?",
        "expected_intent": "RESERVATION_INQUIRY",
        "expected_dept": "Front Desk Reservations",
        "must_contain": ["Front Desk", "suites", "availability"]
    },
    {
        "id": 7,
        "query": "What is the Wi-Fi password?",
        "expected_intent": "FACILITY_INQUIRY",
        "expected_dept": "Front Desk",
        "must_contain": ["HimalayanVista_Guest", "portal"]
    },
    {
        "id": 8,
        "query": "Can you book me a private submarine for tomorrow morning?",
        "expected_intent": "GENERAL_FAQ",
        "expected_dept": "Front Desk",
        "should_handoff": True,
        "must_contain": ["connecting you directly with our Front Desk"]
    }
]

def run_tests():
    print("\n" + "=" * 75)
    print("🚀 RUNNING ATITHI PHASE 2 KNOWLEDGE & INTENT BENCHMARK SUITE")
    print("=" * 75 + "\n")

    passed_count = 0
    total_count = len(BENCHMARK_TESTS)

    for test in BENCHMARK_TESTS:
        query = test["query"]
        print(f"👉 Test #{test['id']}: '{query}'")

        # Step 1: Intent & Entity
        intent_res = classify_intent(query)
        print(f"   [1. Intent]     -> {intent_res.intent} (Conf: {intent_res.confidence}, Lang: {intent_res.language})")

        # Step 2: Knowledge Retrieval
        retrieval_res = retrieve_knowledge(query, intent_res)
        primary_title = retrieval_res.primary_item["title"] if retrieval_res.primary_item else "None (Not Found)"
        print(f"   [2. Retrieval]  -> Grounded: {retrieval_res.is_grounded} | Fact: '{primary_title}'")

        # Step 3: Grounded Response
        response = generate_grounded_response(
            query=query,
            intent_res=intent_res,
            retrieval_res=retrieval_res,
            guest_name="Guest"
        )
        print(f"   [3. Response]   -> \"{response.reply[:95]}...\"")
        if response.action_ticket:
            print(f"   [4. Action Tkt] -> {response.action_ticket['type']} -> Dept: {response.action_ticket['department']}")
        if response.human_handoff:
            print(f"   [4. Guardrail]  -> 🛡️ Triggered Human Handoff (Zero Hallucination)")

        # Validations
        errors = []
        if test.get("expected_intent") and intent_res.intent != test["expected_intent"]:
            errors.append(f"Intent mismatch: got {intent_res.intent}, expected {test['expected_intent']}")

        if test.get("should_handoff") and not response.human_handoff:
            errors.append("Expected human handoff for unknown fact, but got none")

        for phrase in test.get("must_contain", []):
            if phrase.lower() not in response.reply.lower():
                errors.append(f"Response missing expected fact: '{phrase}'")

        if errors:
            print(f"   ❌ FAILED: {', '.join(errors)}\n")
        else:
            print(f"   ✅ PASSED\n")
            passed_count += 1

    print("=" * 75)
    print(f"📊 TEST SUMMARY: {passed_count}/{total_count} PASSED ({int(passed_count/total_count*100)}% SUCCESS)")
    print("=" * 75 + "\n")

    if passed_count != total_count:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
