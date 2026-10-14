-- ============================================================================
-- ATITHI HOTEL OS - SEED DATA SCRIPT (PHASE 1)
-- Complete Demo Hotel: "The Himalayan Vista, Mussoorie" (40 Rooms)
-- Covers all 8 Knowledge Categories + Property Data + Escalation Rules
-- ============================================================================

-- Clean existing demo data safely if re-running
DO $$
DECLARE
    demo_hotel_id UUID;
BEGIN
    SELECT id INTO demo_hotel_id FROM public.hotels WHERE slug = 'the-himalayan-vista' LIMIT 1;
    IF demo_hotel_id IS NOT NULL THEN
        DELETE FROM public.hotels WHERE id = demo_hotel_id;
    END IF;
END $$;

-- 1. INSERT HOTEL PROFILE
INSERT INTO public.hotels (
    id,
    name,
    tagline,
    slug,
    address,
    city,
    state,
    country,
    pincode,
    phone,
    email,
    website,
    check_in_time,
    check_out_time,
    early_check_in_policy,
    late_check_out_policy,
    reception_hours,
    star_rating,
    total_rooms,
    currency
) VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'The Himalayan Vista',
    'Luxury Heritage & Valley Retreat • Est. 1912',
    'the-himalayan-vista',
    'Library End, Camel''s Back Road',
    'Mussoorie',
    'Uttarakhand',
    'India',
    '248179',
    '+91 135 263 5890',
    'concierge@himalayanvistahotel.com',
    'https://www.himalayanvistahotel.com',
    '14:00',
    '11:00',
    'Early check-in from 10:00 AM is complimentary subject to room availability. Before 10:00 AM incurs a 50% half-day tariff.',
    'Late checkout until 1:00 PM is complimentary upon prior request. Checkouts until 6:00 PM incur 50% room tariff.',
    '24 Hours Front Desk & Concierge',
    4.8,
    40,
    'INR'
);

-- 2. INSERT DEPARTMENTS
INSERT INTO public.departments (id, hotel_id, code, name, description, lead_name, contact_extension) VALUES
('d1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'FRONT_DESK', 'Front Desk & Reception', 'Check-in, billing, room keys, and guest registrations', 'Vikram Negi (Duty Manager)', '100'),
('d1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'HOUSEKEEPING', 'Housekeeping & Laundry', 'Room cleaning, linens, towels, toiletries, and laundry', 'Sunita Rawat (Executive Housekeeper)', '102'),
('d1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'MAINTENANCE', 'Engineering & Maintenance', 'HVAC, heating, electrical, plumbing, Wi-Fi, and electronic locks', 'Ramesh Chandra (Chief Engineer)', '104'),
('d1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'FNB', 'Food & Beverage / In-Room Dining', 'Pine & Mist Restaurant, room service, buffet breakfast, and bar', 'Chef Anupam Joshi (F&B Director)', '105'),
('d1000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'CONCIERGE', 'Concierge & Travel Desk', 'Local sightseeing, taxi bookings, luggage transfer, and porterage', 'Deepak Thapa (Head Concierge)', '106'),
('d1000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'MANAGEMENT', 'General Management & Security', 'VIP relations, critical escalations, payment disputes, and medical emergencies', 'Col. Rajeshwar Singh (General Manager)', '109');

-- 3. INSERT 40 ROOMS ACROSS 4 FLOORS (PROPERTY OPERATIONAL DATA)
INSERT INTO public.rooms (hotel_id, room_number, floor, room_type, bed_type, max_occupancy, base_price_inr, status, has_balcony, has_ac, view_type, current_guest_name, dnd_active) VALUES
-- Floor 1: Ground / Garden Wing (Rooms 101 to 110)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '101', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'occupied', true, true, 'Pine Garden View', 'Rajesh Sharma', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '102', 1, 'Heritage Deluxe Twin', '2 Queen Beds', 3, 5200, 'available', true, true, 'Pine Garden View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '103', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'occupied', true, true, 'Courtyard Fountain', 'Priya Patel', true),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '104', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'cleaning', true, true, 'Courtyard Fountain', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '105', 1, 'Heritage Deluxe Twin', '2 Queen Beds', 3, 5200, 'occupied', true, true, 'Pine Garden View', 'Vikramaditya Singhania', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '106', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'available', true, true, 'Pine Garden View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '107', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'available', true, true, 'Rose Garden Walkway', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '108', 1, 'Heritage Deluxe Twin', '2 Queen Beds', 3, 5200, 'occupied', true, true, 'Rose Garden Walkway', 'Ananya Iyer', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '109', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'available', true, true, 'Pine Garden View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '110', 1, 'Heritage Deluxe King', '1 California King', 2, 4800, 'maintenance', true, true, 'Pine Garden View', null, false),

-- Floor 2: Valley View Floor (Rooms 201 to 210)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '201', 2, 'Executive Valley King', '1 California King', 2, 6200, 'occupied', true, true, 'Doon Valley Panorama', 'Rohan Malhotra', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '202', 2, 'Executive Valley Twin', '2 Queen Beds', 3, 6600, 'available', true, true, 'Doon Valley Panorama', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '203', 2, 'Executive Valley King', '1 California King', 2, 6200, 'occupied', true, true, 'Doon Valley Panorama', 'Neha Kapoor', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '204', 2, 'Executive Valley King', '1 California King', 2, 6200, 'occupied', true, true, 'Himalayan Ridge View', 'Siddharth Verma', true),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '205', 2, 'Executive Valley Twin', '2 Queen Beds', 3, 6600, 'available', true, true, 'Himalayan Ridge View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '206', 2, 'Executive Valley King', '1 California King', 2, 6200, 'cleaning', true, true, 'Doon Valley Panorama', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '207', 2, 'Executive Valley King', '1 California King', 2, 6200, 'available', true, true, 'Doon Valley Panorama', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '208', 2, 'Executive Valley Twin', '2 Queen Beds', 3, 6600, 'occupied', true, true, 'Doon Valley Panorama', 'Aarav Deshmukh', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '209', 2, 'Executive Valley King', '1 California King', 2, 6200, 'available', true, true, 'Himalayan Ridge View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '210', 2, 'Executive Valley King', '1 California King', 2, 6200, 'occupied', true, true, 'Himalayan Ridge View', 'Meera Nambiar', false),

-- Floor 3: Imperial Suite Wing (Rooms 301 to 310)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '301', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'occupied', true, true, 'Panoramic Snow Peaks', 'Devendra Joshi', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '302', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'available', true, true, 'Panoramic Snow Peaks', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '303', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'occupied', true, true, 'Camel''s Back Sunset View', 'Kavita Sundaram', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '304', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'cleaning', true, true, 'Camel''s Back Sunset View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '305', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'available', true, true, 'Panoramic Snow Peaks', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '306', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'occupied', true, true, 'Panoramic Snow Peaks', 'Aditya Roy Chowdhury', true),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '307', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'available', true, true, 'Camel''s Back Sunset View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '308', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'available', true, true, 'Camel''s Back Sunset View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '309', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'occupied', true, true, 'Panoramic Snow Peaks', 'Sunil Narang', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '310', 3, 'Imperial Royal Suite', '1 Grand Four-Poster King', 3, 9500, 'available', true, true, 'Panoramic Snow Peaks', null, false),

-- Floor 4: Presidential & Penthouse Tier (Rooms 401 to 410)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '401', 4, 'Maharaja Penthouse Suite', '1 Emperor King + Jacuzzi', 4, 16000, 'occupied', true, true, '360° Himalayan Vista', 'Justice K. S. Mukherjee', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '402', 4, 'Maharaja Penthouse Suite', '1 Emperor King + Jacuzzi', 4, 16000, 'available', true, true, '360° Himalayan Vista', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '403', 4, 'Governor''s Heritage Suite', '1 Four-Poster King', 3, 13500, 'available', true, true, 'Doon Valley Lights at Night', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '404', 4, 'Governor''s Heritage Suite', '1 Four-Poster King', 3, 13500, 'occupied', true, true, 'Doon Valley Lights at Night', 'Dr. Alok Bansal', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '405', 4, 'Presidential Sky Villa', '2 King Bedrooms + Fireplace', 5, 24000, 'available', true, true, 'Trisul & Nanda Devi Peaks', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '406', 4, 'Presidential Sky Villa', '2 King Bedrooms + Fireplace', 5, 24000, 'occupied', true, true, 'Trisul & Nanda Devi Peaks', 'Mr. Amitav Goenka', true),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '407', 4, 'Governor''s Heritage Suite', '1 Four-Poster King', 3, 13500, 'available', true, true, 'Camel''s Back Sunset View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '408', 4, 'Governor''s Heritage Suite', '1 Four-Poster King', 3, 13500, 'available', true, true, 'Camel''s Back Sunset View', null, false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '409', 4, 'Maharaja Penthouse Suite', '1 Emperor King + Jacuzzi', 4, 16000, 'occupied', true, true, '360° Himalayan Vista', 'Smt. Radhika Agarwal', false),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '410', 4, 'Maharaja Penthouse Suite', '1 Emperor King + Jacuzzi', 4, 16000, 'available', true, true, '360° Himalayan Vista', null, false);

-- 4. INSERT REQUESTABLE SERVICES CATALOG
INSERT INTO public.services (hotel_id, department_id, code, name, category, description, is_complimentary, price_inr, estimated_delivery_mins, available_from, available_to) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000002', 'EXTRA_TOWEL', 'Extra Bath Towels & Mats', 'housekeeping', 'Fresh plush Turkish cotton bath towels and foot mats delivered to room', true, 0, 15, '00:00', '23:59'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000002', 'EXTRA_BED', 'Rollaway Extra Bed & Quilt', 'housekeeping', 'Comfortable rollaway bed with clean linens and warm down duvet', false, 1500, 30, '08:00', '22:00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000002', 'IRON_BOARD', 'Iron & Ironing Board', 'housekeeping', 'Steam iron and full-size ironing board delivered to room', true, 0, 15, '06:00', '23:00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000002', 'LAUNDRY_EXPRESS', 'Express Laundry & Pressing', 'housekeeping', 'Same-day laundry and steam press service (returned within 4 hours)', false, 450, 240, '08:00', '18:00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000002', 'ROOM_CLEANING', 'Housekeeping Refresh', 'housekeeping', 'Complete room turn-down, trash clearance, and linen change', true, 0, 30, '08:00', '20:00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000001', 'WAKEUP_CALL', 'Automated / Steward Wake-Up Call', 'front_desk', 'Personalized morning wake-up call at requested time with weather update', true, 0, 5, '00:00', '23:59'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000005', 'LUGGAGE_STORAGE', 'Luggage Storage & Assistance', 'concierge', 'Luggage collection from room or safe custody at Bell Desk post-checkout', true, 0, 15, '00:00', '23:59'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000005', 'TAXI_BOOKING', 'Chauffeured Cab & Sightseeing', 'concierge', 'Airport transfer to Dehradun Jolly Grant (DED) or local sightseeing vehicle', false, 2800, 45, '06:00', '22:00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000004', 'ROOM_SERVICE', 'In-Room Dining Order', 'dining', 'Hot meals, beverages, snacks, and desserts from Pine & Mist kitchen', false, 0, 35, '00:00', '23:59'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000003', 'HEATING_CHECK', 'Room Climate / Radiator Check', 'maintenance', 'Inspection and adjustment of room oil heaters / central heating thermostats', true, 0, 15, '00:00', '23:59'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd1000000-0000-0000-0000-000000000001', 'LATE_CHECKOUT_REQ', 'Late Checkout Extension', 'front_desk', 'Request to extend checkout time past standard 11:00 AM', false, 0, 15, '07:00', '12:00');

-- 5. INSERT BINDING HOTEL POLICIES
INSERT INTO public.policies (hotel_id, code, title, summary, full_text, strictness_level) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'CANCELLATION', 'Reservation Cancellation & Refund Policy', 'Free cancellation up to 48 hours prior to check-in. Non-refundable within 48 hours.', 'Cancellations made 48 hours or more prior to the 2:00 PM check-in date receive a 100% refund processed within 5-7 banking days. Cancellations made within 48 hours of check-in, or no-shows, forfeit the full first-night tariff. Peak holiday dates (Dec 23 - Jan 2) are non-refundable 14 days prior.', 'moderate'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'CHECK_IN_OUT', 'Standard Check-In and Check-Out Times', 'Check-in: 2:00 PM. Check-out: 11:00 AM. Extensions subject to availability.', 'Standard check-in begins at 2:00 PM IST. Early check-in from 10:00 AM onwards is accommodated compliments of the hotel if rooms are vacant. Standard check-out is 11:00 AM. Late check-out until 1:00 PM is offered complimentary on request if occupancy allows; check-out between 1:00 PM and 6:00 PM incurs 50% tariff, and past 6:00 PM incurs full day tariff.', 'flexible'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ID_REQUIREMENTS', 'Mandatory Photo Identity Verification', 'All adult guests must present original government photo ID (Aadhaar, Passport, DL, Voter ID). PAN cards not accepted.', 'Per Government of Uttarakhand hospitality regulations, every adult guest staying in the room must submit a valid government-issued photo ID at check-in (Aadhaar Card, Passport, Driving License, or Voter ID). PAN cards are strictly not accepted as proof of residence. Foreign nationals must produce a valid passport and valid Indian visa or OCI card.', 'strict'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'SMOKING', 'Strict Non-Smoking Property Policy', 'Rooms are 100% non-smoking. Designated outdoor smoking terrace available. ₹5,000 penalty.', 'All indoor guest rooms, corridors, suites, balconies, and public indoor areas are strictly non-smoking (including e-cigarettes and vapes). A specialized cleaning and ionization fee of ₹5,000 will be debited to the guest folio if smoke traces or burns are detected. Guests may smoke only in the designated open-air gazebo on the Pine Lawn.', 'strict'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'PETS', 'Pet Policy', 'Pets are strictly not permitted on hotel premises due to high-altitude wildlife corridors.', 'To preserve hygiene standards and due to local wildlife conservation safety regulations along Camel''s Back ridge, pets and animals of any species are not permitted on hotel property. Certified service animals require 72 hours prior authorization from management.', 'strict'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'VISITORS', 'Guest Visitors & Non-Residents', 'Visitors allowed in lobby & restaurant until 8:00 PM. Overnight guests must register at front desk.', 'Non-resident visitors are warmly welcomed in the lobby lounge, garden cafe, and restaurant between 8:00 AM and 8:00 PM. For security reasons, non-registered visitors are not permitted into guest room corridors after 8:00 PM. Any visitor staying overnight must present government ID at the Front Desk and pay prevailing extra-occupant rates.', 'moderate'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'CHILDREN', 'Child Occupancy & Crib Policy', 'Up to 2 children below 6 years stay complimentary using existing bedding.', 'Children aged 5 and under stay free of charge when sharing existing bedding with parents. Baby cribs/cots are provided complimentary upon request (subject to inventory). Extra rollaway beds for children aged 6 to 12 are available at ₹1,000 per night, and ₹1,500 for guests 12 and above.', 'flexible'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DAMAGE', 'Property Damage & Breakage', 'Guests are liable for intentional or accidental breakage of fixtures, electronics, or antique furniture.', 'Guests will be held accountable for any physical damage caused to hotel property, antique woodwork, smart televisions, or jacuzzi fixtures during their tenure. An itemized invoice reflecting repair or replacement costs will be settled at check-out.', 'strict');

-- 6. INSERT THE 8 KNOWLEDGE BASE CATEGORIES (ATITHI'S GROUND TRUTH BRAIN)
INSERT INTO public.hotel_knowledge (hotel_id, category, subcategory, title, content, tags, priority) VALUES

-- CATEGORY 1: HOTEL INFORMATION
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_info', 'overview', 'Hotel Overview & Heritage',
 'The Himalayan Vista is a heritage boutique luxury property established in 1912 along Camel''s Back Road, Mussoorie, Uttarakhand. It features 40 valley-facing luxury rooms, suites, and penthouses at an elevation of 6,580 feet overlooking the Doon Valley and snow-capped peaks.',
 ARRAY['hotel_name', 'overview', 'location', 'heritage', 'address', 'mussoorie'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_info', 'timings', 'Check-In and Check-Out Timings',
 'Standard check-in begins at 2:00 PM. Standard check-out is at 11:00 AM. Early check-in from 10:00 AM onwards and late checkout until 1:00 PM can be requested through Front Desk and are offered complimentary subject to room availability.',
 ARRAY['checkin', 'checkout', 'timings', 'time', 'early_checkin', 'late_checkout'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_info', 'parking', 'Parking & Valet Services',
 'The hotel provides private, secure, on-site multi-level parking for up to 45 vehicles with 24x7 complimentary valet parking service. We also feature two Type-2 22kW EV charging stations available for guest vehicles.',
 ARRAY['parking', 'car_parking', 'valet', 'ev_charger', 'vehicle'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_info', 'wifi', 'Guest Wi-Fi Network & Access',
 'Complimentary high-speed Wi-Fi (up to 200 Mbps) is provided across all rooms and public lawns. Connect to the SSID "HimalayanVista_Guest". On connecting, enter your Room Number and Guest Last Name to authenticate.',
 ARRAY['wifi', 'internet', 'password', 'network', 'speed'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_info', 'reception', 'Front Desk & Contact Information',
 'The Front Desk and Concierge operate 24 hours a day, 7 days a week. You can reach the Front Desk by dialing 100 from your room intercom or by calling +91 135 263 5890.',
 ARRAY['reception', 'phone', 'contact', 'hours', 'front_desk', 'extension'], 1),

-- CATEGORY 2: ROOMS & FACILITIES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'rooms_facilities', 'pool', 'Heated Indoor Swimming Pool',
 'Our temperature-controlled glasshouse pool is located on the Lower Ground Level (-1) with stunning valley views. Operating hours are 7:00 AM to 8:00 PM daily. Complimentary towels and bathrobes are available poolside. Appropriate swimwear is mandatory.',
 ARRAY['pool', 'swimming', 'swimming_pool', 'heated_pool', 'timings'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'rooms_facilities', 'gym', 'Fitness Studio & Yoga Deck',
 'The 24-hour Fitness Center is located on Level 1, equipped with LifeFitness treadmills, ellipticals, free weights, and an open-air morning Yoga Deck. Morning guided yoga sessions take place daily at 7:00 AM.',
 ARRAY['gym', 'fitness', 'workout', 'yoga', 'exercise'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'rooms_facilities', 'heating', 'Room Climate Control & Heating',
 'All guest rooms are equipped with centralized dual-cycle inverter climate control and supplementary radiant oil heaters during winter months. Radiator thermostat controls are on the bedside console, or you can request housekeeping to adjust temperature.',
 ARRAY['heating', 'heater', 'ac', 'climate_control', 'cold', 'temperature'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'rooms_facilities', 'conference', 'Pine View Banquet & Boardroom',
 'The Pine View Banquet Hall seats up to 100 guests for private events, corporate offsites, and intimate weddings. It is equipped with 4K laser projection, high-fidelity sound, and valley-facing breakaway lawns.',
 ARRAY['conference', 'meeting', 'banquet', 'hall', 'event', 'wedding'], 3),

-- CATEGORY 3: FOOD & DINING
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food_dining', 'breakfast', 'Breakfast Timings & Location',
 'Complimentary buffet breakfast is served every morning from 7:30 AM to 10:30 AM at our ground-floor restaurant "Pine & Mist". It includes North Indian, South Indian live counters, Continental spreads, fresh mountain bakery breads, fresh juices, and organic Himalayan honey.',
 ARRAY['breakfast', 'breakfast_time', 'nashta', 'buffet', 'food', 'morning'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food_dining', 'restaurant', 'Pine & Mist Restaurant Hours',
 'Pine & Mist is our fine-dining restaurant open daily from 7:30 AM to 11:00 PM. Lunch is served from 12:30 PM to 3:30 PM, and Dinner from 7:30 PM to 10:45 PM. Features Garhwali regional delicacies, Awadhi grills, and Continental fare.',
 ARRAY['restaurant', 'lunch', 'dinner', 'timings', 'pine_and_mist', 'food'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food_dining', 'dietary', 'Vegetarian, Jain, and Dietary Options',
 'We maintain dedicated separate cookware for Pure Vegetarian and Jain meal preparations. Jain breakfast items (poha, parathas without onion/garlic, fruit platters) and gluten-free breads are available daily on request.',
 ARRAY['jain', 'pure_veg', 'vegetarian', 'dietary', 'halal', 'gluten_free', 'vegan'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food_dining', 'room_service', '24x7 In-Room Dining Service',
 'In-Room Dining is available 24 hours a day. Dial 105 to place your order. A late-night snack menu (sandwiches, hot parathas, biryani, soups, desserts, and hot tea/coffee) operates from 11:00 PM to 6:00 AM.',
 ARRAY['room_service', 'in_room_dining', 'midnight_food', 'food_order', 'order'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food_dining', 'high_tea', 'Sunset High Tea Experience',
 'Complimentary traditional Sunset High Tea with masala chai, Darjeeling green tea, pakoras, and English scones is served every evening between 4:30 PM and 6:00 PM on the Sunset Cedar Lawn for all resident guests.',
 ARRAY['tea', 'high_tea', 'snacks', 'chai', 'sunset'], 2),

-- CATEGORY 4: HOTEL SERVICES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_services', 'linens', 'Towels, Toiletries & Linens Request',
 'Extra bath towels, bathrobes, dental kits, shaving kits, or fresh cotton bedsheets can be provided to your room within 15 minutes by calling Housekeeping at extension 102 or asking ATITHI.',
 ARRAY['towel', 'extra_towel', 'toiletry', 'soap', 'shampoo', 'bedsheet', 'pillow'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_services', 'laundry', 'Laundry & Ironing Facilities',
 'Standard laundry collected before 10:00 AM is returned by 7:00 PM. Express 4-hour pressing is also available. Steam irons and ironing boards are delivered to your room complimentary upon request.',
 ARRAY['laundry', 'iron', 'ironing_board', 'dry_cleaning', 'press'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_services', 'luggage', 'Luggage Porterage & Storage',
 'Complimentary secure luggage storage is available at the Bell Desk both before check-in and after check-out. Dial extension 106 for porter assistance with your bags.',
 ARRAY['luggage', 'bags', 'porter', 'storage', 'cloakroom'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hotel_services', 'doctor', 'Doctor on Call & Medical Assistance',
 'First aid kits are available 24x7 at the Front Desk. A registered medical practitioner is on call 24 hours a day for emergency room visits within 20 minutes.',
 ARRAY['doctor', 'medical', 'medicine', 'first_aid', 'sick', 'emergency'], 1),

-- CATEGORY 5: POLICIES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'policies', 'cancellation', 'Cancellation Policy Summary',
 'Full 100% refund for cancellations submitted at least 48 hours prior to the 2:00 PM check-in date. Cancellations within 48 hours incur a 1-night room charge.',
 ARRAY['cancellation', 'refund', 'cancel', 'policy'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'policies', 'smoking', 'Non-Smoking Fine & Rules',
 'All guest rooms, bathrooms, and corridors are strictly non-smoking. A cleaning penalty of ₹5,000 applies if smoking occurs in the room. Designated smoking gazebo is available on the Pine Lawn.',
 ARRAY['smoking', 'cigarette', 'vape', 'fine', 'policy'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'policies', 'visitors', 'Visitor Policy Summary',
 'Non-resident guests are permitted in lobby and dining areas between 8:00 AM and 8:00 PM. For safety, visitors are not allowed in residential corridors after 8:00 PM without front desk check-in.',
 ARRAY['visitor', 'friends', 'guests', 'visiting_hours'], 2),

-- CATEGORY 6: GUEST FAQS
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'guest_faqs', 'drinking_water', 'Is the Tap Water Drinkable? Water Bottles',
 'We provide unlimited complimentary glass-bottled purified RO drinking water in all rooms. We do not recommend drinking straight from bathroom taps. Additional water bottles are delivered free upon request.',
 ARRAY['water', 'drinking_water', 'bottle', 'ro_water', 'mineral_water'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'guest_faqs', 'hair_dryer', 'Hair Dryers and Bathroom Amenities',
 'Every room is equipped with a high-power 2000W hair dryer mounted inside the vanity cabinet, along with luxury Ayurvedic Forest Essentials toiletries, bathrobes, and plush slippers.',
 ARRAY['hair_dryer', 'dryer', 'toiletries', 'slippers', 'shampoo'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'guest_faqs', 'room_keys', 'Lost Keycard or Smart Lock Issue',
 'If you lose your RFID room keycard or the door lock blinks red, visit the Front Desk with your ID to get a fresh duplicate issued immediately at no charge.',
 ARRAY['key', 'keycard', 'lost_key', 'lock', 'door'], 2),

-- CATEGORY 7: LOCAL INFORMATION (MUSSOORIE & SURROUNDINGS)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'local_info', 'sightseeing', 'Mall Road & Library Chowk',
 'Mussoorie Mall Road and Library Chowk are located just 2.2 km from the hotel (a scenic 25-minute walk along Camel''s Back Road or a 7-minute taxi ride). Famous for shopping, wooden crafts, and cafes.',
 ARRAY['mall_road', 'shopping', 'distance', 'library_chowk', 'walk'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'local_info', 'sightseeing', 'Kempty Falls Excursion',
 'Kempty Falls is situated 14 km from the hotel (approx. 40 minutes by cab). Best visited between 9:00 AM and 1:00 PM to avoid heavy crowds. Our Travel Desk can arrange a private round-trip cab for ₹1,800.',
 ARRAY['kempty_falls', 'waterfall', 'sightseeing', 'taxi', 'timing'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'local_info', 'sightseeing', 'Lal Tibba & Landour Bakehouse',
 'Lal Tibba, the highest vantage point in Mussoorie (7,160 ft), and the historic Char Dukan / Landour Bakehouse are 4.8 km away. Ideal for panoramic snow peak views, ginger lemon tea, and freshly baked lemon tarts.',
 ARRAY['lal_tibba', 'landour', 'bakehouse', 'char_dukan', 'viewpoint'], 2),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'local_info', 'emergency', 'Nearest Hospitals, Pharmacies & ATMs',
 'Civil Hospital Mussoorie is 2.8 km away (Phone: +91 135 263 2841, open 24x7). The nearest 24-hour pharmacy is Apollo Pharmacy at Kulri (2.4 km). State Bank of India & HDFC Bank ATMs are located at Library Chowk (2.1 km).',
 ARRAY['hospital', 'pharmacy', 'atm', 'emergency', 'cash', 'medicine'], 1),

-- CATEGORY 8: OPERATIONAL RULES (DISPATCH GUIDELINES)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'operational_rules', 'dispatch', 'Housekeeping Routing Guideline',
 'Requests for extra towels, pillows, room cleaning, toiletries, or iron boxes must be dispatched to Housekeeping with a 15-minute SLA.',
 ARRAY['rules', 'housekeeping', 'dispatch', 'sla'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'operational_rules', 'dispatch', 'Maintenance & HVAC Breakdown Guideline',
 'Complaints regarding AC not cooling, heating malfunction, geyser water temperature, plumbing leaks, or TV problems must be routed to Maintenance with High priority and a 20-minute SLA.',
 ARRAY['rules', 'maintenance', 'ac_breakdown', 'plumbing', 'high_priority'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'operational_rules', 'dispatch', 'Checkout Extensions & Billing Guideline',
 'Requests to extend checkout or inquiries regarding disputed invoices must be routed to the Front Desk / Duty Manager. Checkout extension up to 1:00 PM can be auto-approved if occupancy is below 85%.',
 ARRAY['rules', 'front_desk', 'checkout_extension', 'billing'], 1),

('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'operational_rules', 'dispatch', 'Emergency Escalation Protocol',
 'Medical emergencies, physical safety threats, fire alarms, or severe guest distress must bypass automated queues and trigger immediate human escalation to the General Manager and Security Lead within 5 minutes.',
 ARRAY['rules', 'emergency', 'critical', 'safety', 'manager_escalation'], 1);

-- 7. INSERT ESCALATION RULES (AGENTIC DISPATCH LOGIC)
INSERT INTO public.escalation_rules (hotel_id, trigger_intent, target_department_id, priority, sla_minutes, auto_notify_lead, action_type, notes) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'extra_towel', 'd1000000-0000-0000-0000-000000000002', 'low', 15, true, 'create_ticket', 'Dispatch extra bath towels/mats to guest room'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'room_cleaning', 'd1000000-0000-0000-0000-000000000002', 'medium', 30, true, 'create_ticket', 'Assign available floor steward for full room cleaning'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'iron_request', 'd1000000-0000-0000-0000-000000000002', 'low', 15, false, 'create_ticket', 'Deliver steam iron & ironing board'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ac_breakdown', 'd1000000-0000-0000-0000-000000000003', 'high', 20, true, 'create_ticket', 'Urgent HVAC technician inspection required'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'plumbing_leak', 'd1000000-0000-0000-0000-000000000003', 'high', 15, true, 'create_ticket', 'Water leakage or geyser malfunction in bathroom'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'wifi_issue', 'd1000000-0000-0000-0000-000000000003', 'medium', 25, false, 'create_ticket', 'Reset room access point or assist with portal login'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'checkout_extension', 'd1000000-0000-0000-0000-000000000001', 'medium', 20, true, 'create_ticket', 'Guest requesting late checkout; verify occupancy & grant or invoice'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'taxi_booking', 'd1000000-0000-0000-0000-000000000005', 'medium', 20, false, 'create_ticket', 'Arrange airport cab or local driver via concierge desk'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'payment_dispute', 'd1000000-0000-0000-0000-000000000006', 'high', 20, true, 'notify_manager', 'Manager intervention required for bill discrepancy or refund request'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'medical_emergency', 'd1000000-0000-0000-0000-000000000006', 'critical', 5, true, 'immediate_human_handoff', 'CRITICAL: Doctor on call summoned and manager alerted immediately');

-- 8. INSERT INITIAL DEMO TICKETS TO SHOW OPERATIONAL STATE
INSERT INTO public.tickets (hotel_id, ticket_number, room_number, guest_name, department_id, category, title, description, priority, status, source_channel, sla_due_at) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'AT-001', '204', 'Siddharth Verma', 'd1000000-0000-0000-0000-000000000003', 'complaint', 'AC Not Cooling in Room 204', 'Guest reported that the room temperature is stuck at 26C and the inverter blower is making humming noise.', 'high', 'in_progress', 'ai_chat', now() + interval '15 minutes'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'AT-002', '101', 'Rajesh Sharma', 'd1000000-0000-0000-0000-000000000002', 'service_request', '2 Extra Bath Towels Requested', 'Guest asked for two additional bath towels and dental kit delivered to room.', 'low', 'open', 'ai_chat', now() + interval '10 minutes'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'AT-003', '306', 'Aditya Roy Chowdhury', 'd1000000-0000-0000-0000-000000000001', 'service_request', 'Late Checkout Request until 1:00 PM', 'Guest has an afternoon flight from Dehradun and requested a complimentary 2-hour checkout extension.', 'medium', 'open', 'ai_chat', now() + interval '20 minutes');
