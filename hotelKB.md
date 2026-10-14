Exactly. **The hotel Knowledge Base should be one of the first things we build.**

But I would make one important distinction:

> **The Knowledge Base is not just a collection of FAQs. It is ATITHI's source of truth about the hotel.**

Your architecture already separates **hotel knowledge** from **property/operational data**: hotel FAQs, services and policies belong in the knowledge layer, while rooms, guests and live operational state belong in property data. ATITHI_OS_Pitch_Mentor_Review_R…

# 1. What should be inside the ATITHI Knowledge Base?

For our MVP, I'd structure it into **8 categories**.

### 1. Hotel Information

```text
Hotel name
Address
Phone
Email
Check-in time
Check-out time
Early check-in policy
Late checkout policy
Reception hours
Parking
Pet policy
Accessibility
```

### 2. Rooms & Facilities

```text
Room types
Room descriptions
Bed types
Occupancy
AC / heating
TV
Wi-Fi
Balcony
Pool
Gym
Restaurant
Conference room
Parking
```

### 3. Food & Dining

```text
Breakfast timing
Breakfast location
Breakfast price
Room service
Restaurant timings
Menu
Vegetarian options
Jain options
Special dietary options
```

### 4. Hotel Services

```text
Housekeeping
Laundry
Extra towels
Extra bed
Room service
Wake-up call
Taxi assistance
Luggage storage
Iron
Maintenance requests
```

### 5. Policies

```text
Cancellation
Refund
Check-in
Check-out
ID requirements
Children
Pets
Smoking
Visitors
Payment
Damage policy
```

### 6. Guest FAQs

For example:

```text
Q: What time is breakfast?

A: Breakfast is served from 7:30 AM
to 10:30 AM at the ground-floor restaurant.
```

```text
Q: What is the Wi-Fi password?

A: The guest Wi-Fi network is
"Hotel_Guest". The password is provided
through the hotel's approved guest access flow.
```

### 7. Local Information

Later we can add:

```text
Mussoorie Mall Road
Kempty Falls
Lal Tibba
Taxi services
Restaurants
Activities
Emergency contacts
Nearby hospitals
Pharmacies
ATMs
```

But **local recommendations should be a separate/controlled knowledge category**, because we don't want the model inventing opening hours, prices, availability, etc.

### 8. Operational Rules

This is particularly important for an **agentic** system.

For example:

```text
If guest asks for extra towel
→ Housekeeping

If guest reports AC problem
→ Maintenance

If guest asks for checkout extension
→ Front Desk

If guest reports payment problem
→ Front Desk / Manager

If guest reports emergency
→ Immediate human escalation
```

This is where the Knowledge Base starts becoming an **operational brain**, rather than just an FAQ database.

---

# 2. But don't put EVERYTHING in the Knowledge Base

This distinction will save us a lot of problems later.

## Knowledge Base

Things that are relatively stable:

```text
"What time is breakfast?"
"Do you have parking?"
"What's your cancellation policy?"
"Where is the restaurant?"
"Do rooms have balconies?"
```

## Operational Database

Things that change:

```text
Is Room 204 occupied?
Who is staying in Room 204?
Is Room 204 clean?
Is Room 305 available?
Is ticket AT-024 resolved?
Which staff member is handling it?
```

## Live Booking System

Eventually:

```text
Current room availability
Current rates
Reservation status
Booking creation
Cancellation
Modification
```

That's why we **must not use the Knowledge Base as a fake PMS**.

Your architecture explicitly says Excel/CSV can bootstrap property data in the MVP, while live room/rate information should eventually come from the PMS/booking system. ATITHI_OS_Pitch_Mentor_Review_R…

---

# 3. How ATITHI should answer a guest

The architecture should look like this:

```text
                    GUEST
                      │
                      ↓
              "Breakfast kab hai?"
                      │
                      ↓
                ATITHI AI
                      │
                      ↓
                 INTENT
                breakfast
                      │
                      ↓
              KNOWLEDGE BASE
                      │
              ┌───────┴───────┐
              ↓               ↓
          FOUND            NOT FOUND
              │               │
              ↓               ↓
          Answer       Human handoff
```

For example:

**Guest:**

> “Breakfast kitne baje hai?”

ATITHI retrieves:

```json
{
  "category": "dining",
  "key": "breakfast_hours",
  "value": "7:30 AM - 10:30 AM",
  "source": "hotel_admin",
  "last_updated": "2026-10-13"
}
```

Then responds:

> “Breakfast is served from 7:30 AM to 10:30 AM at our restaurant.”

The LLM **generates the wording**.

It does **not invent the fact**.

---

# 4. The Knowledge Base should be editable by the hotel

This is important commercially.

Don't hard-code:

```text
breakfast = 7:30 AM
```

Instead:

```text
HOTEL ADMIN
     ↓
Knowledge Base
     ↓
ATITHI
```

Owner changes:

> Breakfast: 7:30 AM–10:30 AM

to:

> Breakfast: 8:00 AM–11:00 AM

ATITHI automatically uses the new information.

This also addresses the **stale information** risk identified in your architecture. The system should use approved hotel facts and refuse/handoff when information is missing or outdated. ATITHI_OS_Pitch_Mentor_Review_R…

---

# 5. For our hackathon, don't over-engineer it

I recommend starting with a **structured PostgreSQL knowledge base**, not immediately building a complicated vector database/RAG pipeline.

Something like:

```text
hotel_knowledge

id
hotel_id
category
title
content
language
source
active
updated_at
```

Example:

| Category | Title | Content |
|---|---|---|
| Dining | Breakfast Hours | 7:30 AM – 10:30 AM |
| Hotel | Check-in | Check-in begins at 2 PM |
| Hotel | Check-out | Check-out is until 11 AM |
| Facility | Swimming Pool | Open 7 AM – 8 PM |
| Service | Laundry | Available 8 AM – 8 PM |
| Policy | Pets | Pets are not permitted |
| Wi-Fi | Guest Network | Hotel_Guest |
| Local | Mall Road | 2.5 km from hotel |

Then later, when the knowledge base becomes large:

```text
PostgreSQL
     +
pgvector
     ↓
semantic retrieval
     ↓
RAG
```

We don't need to introduce vector search just because we're calling it an AI product.

---

# 6. And we should create a "Demo Hotel"

Before building the AI, let's create **one complete fictional hotel**.

For example:

### ATITHI Demo Property

**Hotel:** The Himalayan Vista  
**Location:** Mussoorie, Uttarakhand  
**Rooms:** 40

Then populate:

```text
Hotel Information
        ↓
Rooms
        ↓
Facilities
        ↓
Dining
        ↓
Policies
        ↓
FAQs
        ↓
Services
        ↓
Departments
        ↓
Escalation rules
        ↓
Local information
```

Now we have a controlled environment where we can test:

> “What time is breakfast?”

> “Can I get an extra towel?”

> “Is there parking?”

> “Mera checkout kal hai, ek din extend kar sakte hain?”

> “Room 204 mein AC nahi chal raha.”

> “Do you have a room for tonight?”

And **each one should route differently**.

---

## So yes — our first actual build step should be:

### **PHASE 1: HOTEL KNOWLEDGE + PROPERTY DATA**

We create:

```text
Supabase
│
├── hotels
├── rooms
├── departments
├── hotel_knowledge
├── services
├── policies
└── escalation_rules
```

Then:

### **PHASE 2: ATITHI READS THE KNOWLEDGE**

```text
Guest question
      ↓
Intent
      ↓
Knowledge retrieval
      ↓
Grounded response
```

### **PHASE 3: ATITHI TAKES ACTION**

```text
Complaint
      ↓
Tool call
      ↓
Create ticket
      ↓
Notify staff
```

### **PHASE 4: VOICE**

```text
Phone
 ↓
Voice AI
 ↓
Same ATITHI brain
```

This is the architecture I would lock in **before we write the voice agent**. It also means that later, **QR, voice, WhatsApp and any other channel all use the same hotel brain and action engine**, instead of each becoming a separate bot. ATITHI_OS_Pitch_Mentor_Review_R…

**Next, we should build the actual Knowledge Base schema + seed the complete demo hotel's data.** That gives us the foundation for everything else.