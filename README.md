<div align="center">

# 🏨 ATITHI (अतिथि)
### Autonomous AI Operations & In-Room Voice Concierge for Luxury Hospitality
**One Unified Brain • Three Interaction Channels • Closed-Loop Operations**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70B-f55036.svg)](https://groq.com)
[![Agora](https://img.shields.io/badge/Agora-Realtime_Voice_RTC-099dfd.svg?logo=agora&logoColor=white)](https://www.agora.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standardized_Tools-6366f1.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

> *"Voice isn't the product. QR isn't the product. The chatbot isn't the product.*  
> **ATITHI's product is the operational brain that turns natural guest conversations into hotel actions and measurable owner outcomes."**

</div>

---

## 📖 Executive Summary

Independent and heritage luxury hotels lose millions annually to **unanswered booking calls, fragmented department communication, delayed complaint resolution, and 18–25% OTA commissions**.

**ATITHI** is an autonomous operational operating system that unifies **Inbound Voice Calls**, **In-Room QR Concierge**, and **Hotel Staff Workflows** through a single cognitive intelligence engine.

Instead of generic chatbot responses, ATITHI:
1. **Understands** natural spoken multilingual dialects (English, Hindi, Hinglish).
2. **Retrieves** verified, property-specific policies and live inventory.
3. **Takes Action** via standardized Model Context Protocol (MCP) tools: creating tickets, dispatching staff, and booking rooms with `Pay on Property`.
4. **Closes the Loop** with proactive post-service guest confirmation before checkout.
5. **Translates Operations into Revenue** on the real-time Owner Executive Intelligence Dashboard.

---

## 🏛️ System Architecture

```
                       VOICE INTERCOM
                       (Agora RTC Web)
                              │
                              ▼
                       ┌──────────────┐
 IN-ROOM QR ──────────►│ ATITHI BRAIN │◄──────── STAFF DISPATCH
 (Table Tent Cards)    │(Groq 70B/API)│          (Operations Console)
                       └──────┬───────┘
                              ▼
                       Intent & Policy
                              ▼
                       Action Execution
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
        Hotel Knowledge     Ticket        Enquiry
        Retrieval (RAG)    Lifecycle     & Booking
               │              │              │
               └──────────────┼──────────────┘
                              ▼
                   OWNER EXECUTIVE DASHBOARD
```

### Core Architecture Highlights
- **Single Unified Brain**: Eliminates fragmented logic forks. Every interaction channel routes through the exact same cognitive pipeline (`/api/chat` + MCP Server).
- **Sub-Second Voice Inference**: Powered by Groq Llama-3.3-70B for zero latency, natural, jargon-free conversational speech.
- **Closed-Loop Accountability**: Tickets only reach `CLOSED` status when the guest verifies that the service was successfully delivered.
- **Model Context Protocol (MCP)**: Exposes 6 standardized tools directly to the Agora Realtime Voice Agent and external LLMs.

---

## 🎬 The 3 Real-World Demonstration Scenarios

### Scenario 1 — Inbound Direct Booking Call
```
Guest calls: "Do you have a room for 2 people this weekend?"
     ↓
ATITHI qualifies inquiry & checks live room inventory across 40 rooms
     ↓
Directly books room with "PAY_ON_PROPERTY" tag (collected at check-in)
     ↓
Reservation ticket dispatched to Front Desk & +₹9,600 attributed to Owner Funnel
```

### Scenario 2 — Closed-Loop Operational Complaint
```
Guest: "Room 204 mein garam paani nahi aa raha."
     ↓
ATITHI understands dialect (Intent = Complaint • Subsystem = Hot Water • Priority = HIGH)
     ↓
Creates ticket #TKT-204-XXXX & notifies Maintenance Department
     ↓
Staff acknowledges ("in_progress") & marks serviced ("resolved")
     ↓
ATITHI follows up with guest: "Is the hot water working now?"
     ↓
Guest taps "Yes, It's Fixed!" → Ticket permanently CLOSED
```

### Scenario 3 — Multilingual In-Room QR Concierge
```
Guest scans Table Tent QR in Room 204: "Checkout kitne baje hai?"
     ↓
ATITHI retrieves verified hotel knowledge: "Your standard checkout time is 11:00 AM."
     ↓
Guest asks: "Mujhe taxi chahiye."
     ↓
ATITHI classifies TAXI_REQUEST → Dispatches Concierge Desk ticket
     ↓
Guest tracks live status on their mobile screen in real time
```

---

## 👑 Owner Executive Intelligence: The Golden Metric

The Owner Dashboard (`/owner.html`) connects real-time hotel operational data directly to profitability, guest satisfaction, and root-cause prevention:

```
─────────────────────────────────────────────────────────────────
                      ATITHI OPERATIONS TODAY
─────────────────────────────────────────────────────────────────
Calls Answered       37        Median Ack Time        2m 14s
Enquiries Captured   14        Resolved Before CO     6/7 (85.7%)
Complaints            8        Open Complaints        1
Resolved              7        Avg Resolution Time    11m 45s
─────────────────────────────────────────────────────────────────
                 OPPORTUNITIES & REVENUE FUNNEL
─────────────────────────────────────────────────────────────────
14 Enquiries  ──►  4 Qualified  ──►  2 Direct Bookings Attributed
                        Potential Revenue: ₹18,000
             OTA Commission Saved (18%): ₹3,240
─────────────────────────────────────────────────────────────────
```

---

## 🛠️ Tech Stack & Technologies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Cognitive AI Brain** | Groq Cloud (Llama-3.3-70B) | Grounded natural speech inference in English, Hindi, Hinglish |
| **Realtime Voice RTC** | Agora RTC Web SDK v4 + Voice AI Agent | Bidirectional ultra-low latency voice calling & audio streaming |
| **Tool Protocol** | Model Context Protocol (MCP) | JSON-RPC standard for voice agent tool execution & inventory lookup |
| **Database & Auth** | Supabase (PostgreSQL) | Relational schema with RLS, full-text search, and real-time events |
| **Backend API** | FastAPI + Starlette + Uvicorn (Python 3.12) | Asynchronous REST endpoints, ticket state machine, analytics |
| **Operations Console** | Vanilla HTML5, CSS3, JavaScript (ES6+) | Luxury dark-mode corridor view, interactive doors, live filters |
| **Guest In-Room QR** | Mobile-First Responsive Web Application | In-Room chat, Voice Intercom calling stage, ticket status tracker |

---

## 📁 Repository Structure

```
Final-ATITHI/
├── backend/
│   ├── main.py                  # Unified FastAPI Hub & MCP Server (Port 8001)
│   ├── llm_agent.py             # Groq Llama-3.3 cognitive reasoning & intent router
│   ├── mcp_server.py            # Model Context Protocol tools (6 standardized tools)
│   ├── ticket_service.py        # Supabase ticket lifecycle & owner analytics engine
│   ├── knowledge_base.py        # 8 categories of grounded hotel knowledge facts
│   ├── intelligence.py          # Spatial-temporal multi-room pattern detection
│   └── notifications.py         # Real-time Server-Sent Events (SSE) notification hub
├── Hotels/
│   ├── index.html               # Hotel Operations Console & Live Demo Guide
│   ├── style.css                # Luxury glassmorphism operations styling
│   ├── app.js                   # Interactive doors, filter states, and live API sync
│   └── owner.html               # Owner Executive Intelligence Dashboard & ROI Funnel
├── cutomer/
│   ├── index.html               # Customer Voice Intercom (Agora RTC Visualizer Orb)
│   ├── qr.html                  # In-Room Multilingual QR Concierge (Voice + Chat)
│   ├── server.py                # Intercom server & dynamic Agora RTC token signer
│   └── app.js                   # Agora Web RTC client, volume meter, and call state
├── supabase/
│   ├── schema.sql               # 8 relational tables (hotels, rooms, tickets, policies, KB)
│   └── seed.sql                 # Complete 40-room realistic dataset for The Himalayan Vista
├── .env.example                 # Environment configuration template
├── requirements.txt             # Python backend dependencies
└── README.md                    # System documentation
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js (optional, for syntax validation)
- Groq Cloud API Key ([groq.com](https://groq.com))
- Supabase Account ([supabase.com](https://supabase.com))
- Agora Developer Account ([agora.io](https://agora.io))

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/the-forgotten-polymath/Atithi.git
cd Atithi

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy the template and fill in your keys:
```bash
cp .env.example .env
```
Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=gsk_your_groq_api_key_here
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

### 4. Seed the Database
In your Supabase SQL Editor:
1. Run `supabase/schema.sql` to create tables and foreign keys.
2. Run `supabase/seed.sql` to populate the 40-room property dataset for *The Himalayan Vista, Mussoorie*.

---

## 🚀 Running the Services

### Terminal 1: Unified Backend Brain & MCP Server (Port 8001)
```bash
source .venv/bin/activate
uvicorn backend.main:app --port 8001 --reload
```
*Health Check*: [http://127.0.0.1:8001/mcp/health](http://127.0.0.1:8001/mcp/health)

### Terminal 2: Customer Voice Intercom & QR Portal (Port 8085)
```bash
source .venv/bin/activate
uvicorn cutomer.server:app --port 8085 --reload
```
*QR Portal*: [http://localhost:8085/qr.html?room=204](http://localhost:8085/qr.html?room=204)

### Terminal 3: Hotel Operations Console & Owner Dashboard (Port 8080)
```bash
python3 -m http.server 8080 --directory Hotels
```
*Operations Console*: [http://localhost:8080/index.html](http://localhost:8080/index.html)  
*Owner Dashboard*: [http://localhost:8080/owner.html](http://localhost:8080/owner.html)

---

## 🌐 Public Demo Tunneling (Path A)

To test on your smartphone or connect Agora's Cloud Voice Agent to your local machine:
```bash
# Expose Port 8001 via Cloudflare Tunnel
cloudflared tunnel --url http://localhost:8001
```
Use the resulting `https://*.trycloudflare.com` URL:
- **In Agora Console**: Set MCP URL to `https://*.trycloudflare.com/mcp`
- **On Mobile Phone**: Scan in-room QR code and talk hands-free via Voice Intercom!

---

## 🔒 Security & AI Safety Guarantees

1. **Zero Hallucination Grounding**: ATITHI answers hotel questions exclusively using verified entries from `hotel_knowledge`. If an inquiry falls outside property facts, the AI politely offers to connect the guest with reception.
2. **AI Safety in Physical Subsystems**: When multi-room anomaly detection detects clustered complaints (e.g., 3 hot-water complaints in 17 minutes), ATITHI **never** assumes hardware failure (e.g. "the boiler is broken"). It alerts management: *"Potential shared-system issue — human engineering verification required."*
3. **No Financial Exposure**: Direct room bookings through voice or QR are explicitly tagged `PAY_ON_PROPERTY`—zero credit card numbers are stored or transmitted. Payment is collected at the front desk upon check-in.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<strong>Built with ❤️ for Indian Luxury Hospitality</strong><br>
<em>Turning guest conversations into hotel actions and measurable owner outcomes.</em>
</div>
