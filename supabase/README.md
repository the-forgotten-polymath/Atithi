# 🏨 ATITHI Hotel OS — Supabase Setup Guide

This directory contains the complete database migration and seed data for **ATITHI OS (Phase 1: Hotel Knowledge Base & Operational Property Data)**.

---

## 📁 Files in this Directory

| File | Description |
|---|---|
| [`schema.sql`](file:///Users/dev/Desktop/Final-ATITHI/supabase/schema.sql) | DDL schema: creates 8 core tables (`hotels`, `departments`, `rooms`, `hotel_knowledge`, `services`, `policies`, `escalation_rules`, `tickets`), indexes, full-text search, auto-updating timestamps, and Row Level Security (RLS). |
| [`seed.sql`](file:///Users/dev/Desktop/Final-ATITHI/supabase/seed.sql) | Complete dataset for **The Himalayan Vista, Mussoorie** (40 rooms, 6 departments, all 8 knowledge categories, policies, services, escalation rules, and demo tickets). |

---

## 🚀 Quick Setup in Supabase (Takes ~60 seconds)

### Step 1: Open your Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in.
2. Select your project (or click **New Project**).

### Step 2: Run `schema.sql`
1. In the left navigation, click on **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///Users/dev/Desktop/Final-ATITHI/supabase/schema.sql) and paste it into the editor.
4. Click **Run** (or `Cmd + Enter`).
5. You should see `Success. No rows returned`.

### Step 3: Run `seed.sql`
1. Open another new query in the **SQL Editor**.
2. Copy the entire contents of [`supabase/seed.sql`](file:///Users/dev/Desktop/Final-ATITHI/supabase/seed.sql) and paste it into the editor.
3. Click **Run**.
4. You should see `Success`.

---

## 🔍 How to Verify in Supabase Table Editor

Navigate to **Table Editor** on your Supabase dashboard to verify:

1. **`hotels`**: 1 record (*The Himalayan Vista, Mussoorie*).
2. **`departments`**: 6 records (*FRONT_DESK*, *HOUSEKEEPING*, *MAINTENANCE*, *FNB*, *CONCIERGE*, *MANAGEMENT*).
3. **`rooms`**: 40 records across Floors 1 to 4 with room types, views, bed types, and live statuses (`occupied`, `available`, `cleaning`, `maintenance`).
4. **`hotel_knowledge`**: 22 curated factual knowledge cards spanning all 8 core categories:
   - `hotel_info` (Check-in/out, Wi-Fi network, Valet parking, Reception)
   - `rooms_facilities` (Heated pool, Gym/Yoga, Heating/Radiators, Banquet)
   - `food_dining` (Breakfast timing 7:30–10:30 AM, Jain/Veg options, 24x7 Room dining, High tea)
   - `hotel_services` (Linens & towels, Laundry, Porterage, Doctor on call)
   - `policies` (Cancellation 48h, Smoking ₹5,000 fine, Visitor hours)
   - `guest_faqs` (Purified RO water bottles, Hair dryers, Keycard reset)
   - `local_info` (Mall Road 2.2 km, Kempty Falls 14 km, Lal Tibba, Nearest Hospital/ATM)
   - `operational_rules` (Housekeeping 15m, Maintenance 20m, Emergency protocol)
5. **`services`**: 11 requestable guest services with price and turnaround SLAs.
6. **`policies`**: 8 binding policy definitions.
7. **`escalation_rules`**: 10 automated dispatch intents (`extra_towel`, `ac_breakdown`, `medical_emergency`, etc.).
8. **`tickets`**: 3 initial tickets (`AT-001`, `AT-002`, `AT-003`).

---

## 🔑 Environment Variables

To connect your backend or Next.js app, add these to your `.env` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
