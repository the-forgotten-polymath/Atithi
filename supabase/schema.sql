-- ============================================================================
-- ATITHI HOTEL OS - SUPABASE DATABASE SCHEMA (PHASE 1)
-- Architecture: Supabase PostgreSQL for Hotel Knowledge & Operational Data
-- ============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: hotels
-- Central property record (Hotel profile, contact, core timings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tagline TEXT,
    slug TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    pincode TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    check_in_time TIME NOT NULL DEFAULT '14:00',
    check_out_time TIME NOT NULL DEFAULT '11:00',
    early_check_in_policy TEXT,
    late_check_out_policy TEXT,
    reception_hours TEXT NOT NULL DEFAULT '24x7',
    star_rating NUMERIC(2, 1) DEFAULT 4.5,
    total_rooms INT NOT NULL DEFAULT 40,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- TABLE: departments
-- Operational hotel departments for ticket routing and escalation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. FRONT_DESK, HOUSEKEEPING, MAINTENANCE, FNB, CONCIERGE, MANAGEMENT
    name TEXT NOT NULL,
    description TEXT,
    lead_name TEXT,
    contact_extension TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_departments_hotel_code UNIQUE (hotel_id, code)
);

-- ============================================================================
-- TABLE: rooms
-- Physical inventory and live status (Operational Property Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    floor INT NOT NULL,
    room_type TEXT NOT NULL, -- e.g. Deluxe Room, Executive Valley Suite, Royal Heritage Penthouse
    bed_type TEXT NOT NULL DEFAULT 'King Bed',
    max_occupancy INT NOT NULL DEFAULT 2,
    base_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 4500.00,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'occupied', 'cleaning', 'maintenance'
    has_balcony BOOLEAN NOT NULL DEFAULT TRUE,
    has_ac BOOLEAN NOT NULL DEFAULT TRUE,
    view_type TEXT DEFAULT 'Valley View',
    dnd_active BOOLEAN NOT NULL DEFAULT FALSE,
    current_guest_name TEXT,
    current_guest_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_rooms_hotel_number UNIQUE (hotel_id, room_number)
);

-- ============================================================================
-- TABLE: hotel_knowledge
-- Structured Ground Truth Knowledge Base (The 8 ATITHI Categories)
-- Categories:
--   1. hotel_info
--   2. rooms_facilities
--   3. food_dining
--   4. hotel_services
--   5. policies
--   6. guest_faqs
--   7. local_info
--   8. operational_rules
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hotel_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subcategory TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    language TEXT NOT NULL DEFAULT 'en',
    priority INT NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'hotel_admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- TABLE: services
-- Catalog of requestable amenities and operational guest services
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    code TEXT NOT NULL, -- e.g. EXTRA_TOWEL, EXTRA_BED, LAUNDRY, WAKEUP_CALL, TAXI_BOOKING, ROOM_CLEANING
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- housekeeping, front_desk, concierge, dining, maintenance
    description TEXT,
    is_complimentary BOOLEAN NOT NULL DEFAULT TRUE,
    price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_delivery_mins INT NOT NULL DEFAULT 15,
    available_from TIME DEFAULT '00:00',
    available_to TIME DEFAULT '23:59',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_services_hotel_code UNIQUE (hotel_id, code)
);

-- ============================================================================
-- TABLE: policies
-- Official binding hotel terms & regulations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. CANCELLATION, CHECK_IN_ID, VISITORS, PETS, SMOKING, LATE_CHECKOUT, DAMAGE
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_text TEXT NOT NULL,
    strictness_level TEXT NOT NULL DEFAULT 'strict', -- info, flexible, moderate, strict
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_policies_hotel_code UNIQUE (hotel_id, code)
);

-- ============================================================================
-- TABLE: escalation_rules
-- Agentic Dispatch & Escalation Brain for ATITHI Tools
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    trigger_intent TEXT NOT NULL, -- e.g. extra_towel, ac_breakdown, plumbing_leak, checkout_extension, medical_emergency
    target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    sla_minutes INT NOT NULL DEFAULT 30,
    auto_notify_lead BOOLEAN NOT NULL DEFAULT TRUE,
    action_type TEXT NOT NULL DEFAULT 'create_ticket', -- create_ticket, notify_manager, immediate_human_handoff
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_escalation_hotel_intent UNIQUE (hotel_id, trigger_intent)
);

-- ============================================================================
-- TABLE: tickets
-- Operational ticket tracking (Complaints & Requests generated by ATITHI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL, -- e.g. AT-101, AT-102
    room_number TEXT NOT NULL,
    guest_name TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- complaint, service_request, maintenance, escalation, general
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, escalated, cancelled
    source_channel TEXT NOT NULL DEFAULT 'ai_chat', -- ai_chat, voice, qr, front_desk
    sla_due_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & RETRIEVAL
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_floor ON public.rooms(hotel_id, floor);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_status ON public.rooms(hotel_id, status);

CREATE INDEX IF NOT EXISTS idx_hotel_knowledge_category ON public.hotel_knowledge(hotel_id, category);
CREATE INDEX IF NOT EXISTS idx_hotel_knowledge_active ON public.hotel_knowledge(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_hotel_knowledge_tags ON public.hotel_knowledge USING GIN(tags);

-- Full-Text Search index on Knowledge Base (Title & Content) for instant keyword matching
CREATE INDEX IF NOT EXISTS idx_hotel_knowledge_fts ON public.hotel_knowledge 
USING GIN (to_tsvector('english', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_tickets_hotel_status ON public.tickets(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_room ON public.tickets(hotel_id, room_number);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON public.tickets(department_id);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(hotel_id, category);
CREATE INDEX IF NOT EXISTS idx_escalation_intent ON public.escalation_rules(hotel_id, trigger_intent);

-- ============================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hotels_updated_at ON public.hotels;
CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_hotel_knowledge_updated_at ON public.hotel_knowledge;
CREATE TRIGGER trg_hotel_knowledge_updated_at BEFORE UPDATE ON public.hotel_knowledge FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_policies_updated_at ON public.policies;
CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Read access enabled for guest & public queries; Writes protected
-- ============================================================================
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/public read access to hotel knowledge, services, and policies
CREATE POLICY "Public Read Access for Hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Knowledge" ON public.hotel_knowledge FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Access for Services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Access for Policies" ON public.policies FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Escalation Rules" ON public.escalation_rules FOR SELECT USING (true);

-- Allow public creation of tickets (e.g. from guest AI chat / QR code), full control for service_role
CREATE POLICY "Public Insert Access for Tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access for Tickets" ON public.tickets FOR SELECT USING (true);
