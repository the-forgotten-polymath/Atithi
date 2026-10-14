"""
ATITHI Grounded Knowledge Base
Source of truth for "The Himalayan Vista, Mussoorie"
Contains verified facts categorized per hotelKB.md.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

HOTEL_META = {
    "id": "himalayan-vista-mussoorie",
    "name": "The Himalayan Vista",
    "tagline": "Luxury Mountain Sanctuary & Heritage Retreat",
    "location": "Library End, Mall Road, Mussoorie, Uttarakhand 248179, India",
    "phone": "+91 135 263 9000 / +91 98765 43210",
    "email": "concierge@himalayanvistahotel.com",
    "reception_hours": "24 Hours / 7 Days",
    "total_rooms": 40,
    "floors": 4,
    "currency": "₹"
}

# 8 Core Knowledge Base Categories
KNOWLEDGE_ITEMS = [
    # Category 1: Hotel Information & Policies
    {
        "id": "kb-checkin-time",
        "category": "hotel_info",
        "sub_category": "timings",
        "title": "Check-in Time",
        "keywords": ["checkin", "check in", "check-in", "arrival", "kitne baje", "aana"],
        "content": "Standard check-in time begins at 2:00 PM. Early check-in is subject to room availability upon arrival.",
        "language": "en"
    },
    {
        "id": "kb-checkout-time",
        "category": "hotel_info",
        "sub_category": "timings",
        "title": "Check-out Time",
        "keywords": ["checkout", "check out", "check-out", "departure", "nikalna", "chodna"],
        "content": "Standard check-out time is until 11:00 AM.",
        "language": "en"
    },
    {
        "id": "kb-late-checkout-policy",
        "category": "policies",
        "sub_category": "checkout_extension",
        "title": "Late Checkout & Stay Extension Policy",
        "keywords": ["extend", "extension", "late checkout", "late check-out", "der se checkout", "stay badhana", "ek din extend"],
        "content": "Late check-out is subject to next-day room availability and front desk approval. Complimentary late checkout until 1:00 PM is extended to VIP and Platinum guests. To extend your stay for another night, our Front Desk team can confirm room availability immediately.",
        "requires_front_desk": True,
        "language": "en"
    },
    {
        "id": "kb-parking",
        "category": "hotel_info",
        "sub_category": "amenities",
        "title": "Parking Facility",
        "keywords": ["parking", "car", "gaadi", "valet", "park", "vehicle"],
        "content": "Complimentary valet parking and secure on-site private parking are available 24/7 for all resident guests, including 4 dedicated EV charging stations.",
        "language": "en"
    },
    {
        "id": "kb-wifi-credentials",
        "category": "facilities",
        "sub_category": "connectivity",
        "title": "Guest Wi-Fi Details",
        "keywords": ["wifi", "wi-fi", "internet", "password", "network", "connect"],
        "content": "High-speed complimentary Wi-Fi is accessible throughout the hotel and in all suites. Network name: 'HimalayanVista_Guest'. Connect to open the welcome portal and authenticate using your Room Number and Guest Last Name.",
        "language": "en"
    },

    # Category 2: Food & Dining
    {
        "id": "kb-breakfast-timing",
        "category": "dining",
        "sub_category": "breakfast",
        "title": "Breakfast Timings & Venue",
        "keywords": ["breakfast", "nashta", "morning food", "buffet", "breakfast timing", "breakfast kab hai", "breakfast time"],
        "content": "Breakfast is served daily from 7:30 AM to 10:30 AM at 'The Glasshouse Bistro' on the Ground Floor overlooking the Doon Valley. A lavish buffet featuring live Indian (Dosa, Parathas) and Continental counters is complimentary for all resident guests.",
        "language": "en"
    },
    {
        "id": "kb-room-service",
        "category": "dining",
        "sub_category": "in_room_dining",
        "title": "24x7 In-Room Dining",
        "keywords": ["room service", "in-room dining", "khana", "order food", "dinner", "lunch", "midnight snack"],
        "content": "In-room dining operates 24 hours daily. You can place your order directly by pressing '9' on your in-room intercom or by requesting assistance right here through ATITHI.",
        "language": "en"
    },
    {
        "id": "kb-dietary-jain",
        "category": "dining",
        "sub_category": "dietary",
        "title": "Vegetarian, Jain & Special Dietary Options",
        "keywords": ["vegetarian", "veg", "jain", "halal", "vegan", "gluten-free", "sattvic"],
        "content": "Our culinary team caters fully to dietary requirements. We offer 100% pure vegetarian menus and authentic Jain delicacies prepared in dedicated sattvic cookware upon request.",
        "language": "en"
    },

    # Category 3: Hotel Services & Housekeeping
    {
        "id": "kb-extra-towels",
        "category": "services",
        "sub_category": "housekeeping",
        "title": "Extra Towels & Linens",
        "keywords": ["towel", "extra towel", "towels", "tauliya", "linen", "blanket", "pillow", "takia", "chaddar"],
        "content": "Housekeeping delivers fresh bath towels, hand towels, plush bathrobes, or additional pillows directly to your room within 10–15 minutes at no extra charge.",
        "department": "Housekeeping",
        "language": "en"
    },
    {
        "id": "kb-laundry-service",
        "category": "services",
        "sub_category": "laundry",
        "title": "Laundry & Dry Cleaning",
        "keywords": ["laundry", "iron", "dry cleaning", "press", "dhobi", "clothes"],
        "content": "Same-day laundry and dry-cleaning services are available. Articles handed over to housekeeping before 10:00 AM are returned freshly pressed by 6:00 PM. Complimentary steam irons and ironing boards are delivered to your room upon request.",
        "department": "Housekeeping",
        "language": "en"
    },
    {
        "id": "kb-luggage-storage",
        "category": "services",
        "sub_category": "concierge",
        "title": "Luggage Storage & Bell Desk",
        "keywords": ["luggage", "baggage", "store luggage", "cloak room", "saamaan"],
        "content": "Complimentary secure luggage storage is available at the Concierge Bell Desk 24/7 if you arrive early or want to explore Mussoorie after check-out.",
        "language": "en"
    },

    # Category 4: Facilities & Wellness
    {
        "id": "kb-swimming-pool",
        "category": "facilities",
        "sub_category": "recreation",
        "title": "Temperature-Controlled Mountain Pool",
        "keywords": ["pool", "swimming", "swimming pool", "swim", "heated pool"],
        "content": "Our heated infinity mountain pool is located on the 1st Floor Terrace and is open daily from 7:00 AM to 8:00 PM. Fresh towels and poolside refreshments are provided.",
        "language": "en"
    },
    {
        "id": "kb-fitness-center",
        "category": "facilities",
        "sub_category": "recreation",
        "title": "Fitness Center & Gym",
        "keywords": ["gym", "fitness", "workout", "exercise", "treadmill"],
        "content": "The Fitness Center is open daily from 6:00 AM to 10:00 PM, equipped with state-of-the-art cardio machines, free weights, and a panoramic yoga deck.",
        "language": "en"
    },

    # Category 5: Policies
    {
        "id": "kb-cancellation-policy",
        "category": "policies",
        "sub_category": "booking",
        "title": "Cancellation & Refund Policy",
        "keywords": ["cancellation", "cancel", "refund", "modify", "charges"],
        "content": "Free cancellation or booking modifications are permitted up to 48 hours prior to the scheduled check-in date (2:00 PM). Cancellations made within 48 hours are subject to a one-night tariff charge.",
        "language": "en"
    },
    {
        "id": "kb-smoking-policy",
        "category": "policies",
        "sub_category": "house_rules",
        "title": "Non-Smoking Policy",
        "keywords": ["smoking", "smoke", "cigarette", "cigar", "vape"],
        "content": "The Himalayan Vista is a 100% smoke-free property in all guest rooms, corridors, and indoor areas. A designated smoking area is provided on the open-air Garden Terrace. A deep-cleaning fee of ₹5,000 applies to smoking in guest suites.",
        "language": "en"
    },
    {
        "id": "kb-pet-policy",
        "category": "policies",
        "sub_category": "pets",
        "title": "Pet Policy",
        "keywords": ["pet", "pets", "dog", "cat", "kutta", "animals"],
        "content": "Pets are welcomed exclusively in our designated Ground Floor Garden Chalet rooms upon advance reservation. Pets are not permitted in upper floor suites or dining venues.",
        "language": "en"
    },

    # Category 6: Maintenance & In-Room Issues
    {
        "id": "kb-ac-heating-maintenance",
        "category": "operational_rules",
        "sub_category": "maintenance",
        "title": "Air Conditioning & Climate Control Assistance",
        "keywords": ["ac", "air conditioning", "heating", "heater", "cold", "garam", "nahi chal raha", "not working", "climate control", "blower"],
        "content": "All rooms feature 4-pipe central heating and cooling with individual digital thermostats. If your climate control is not cooling or heating properly, our on-duty Engineering & Maintenance team responds immediately to inspect and calibrate it.",
        "department": "Engineering & Maintenance",
        "is_maintenance": True,
        "language": "en"
    },
    {
        "id": "kb-geyser-hot-water",
        "category": "operational_rules",
        "sub_category": "maintenance",
        "title": "24/7 Hot Water & Plumbing",
        "keywords": ["hot water", "geyser", "shower", "water pressure", "paani", "garam paani", "leak"],
        "content": "Centralized solar & electric pressurized hot water is guaranteed 24 hours. For any temperature or plumbing issue, Engineering is dispatched within 10 minutes.",
        "department": "Engineering & Maintenance",
        "is_maintenance": True,
        "language": "en"
    },

    # Category 7: Local Attractions & Sightseeing
    {
        "id": "kb-mall-road",
        "category": "local_info",
        "sub_category": "attractions",
        "title": "Mall Road, Mussoorie",
        "keywords": ["mall road", "shopping", "bazaar", "market", "walking", "stroll"],
        "content": "Mall Road is located just 2.5 km (a picturesque 10-minute drive or scenic 25-minute hill walk) from the hotel. Our travel desk provides complimentary hourly shuttle drops between 4:00 PM and 9:00 PM.",
        "language": "en"
    },
    {
        "id": "kb-kempty-falls",
        "category": "local_info",
        "sub_category": "attractions",
        "title": "Kempty Falls",
        "keywords": ["kempty", "kempty falls", "waterfall", "sightseeing", "excursion"],
        "content": "Kempty Falls is approximately 14 km (40 minutes drive) from the property. Our Concierge Desk arranges private chauffeured cars and curated sightseeing day trips.",
        "language": "en"
    },
    {
        "id": "kb-emergency-hospital",
        "category": "local_info",
        "sub_category": "emergency",
        "title": "Medical Assistance & Nearby Hospital",
        "keywords": ["hospital", "doctor", "medical", "emergency", "sick", "bimar", "dawa", "pharmacy", "ambulance"],
        "content": "A doctor is on call 24 hours for resident guests. The nearest comprehensive medical facility is Landour Community Hospital (4.5 km away). In any health emergency, dial '0' from your in-room intercom for immediate management and first-aid response.",
        "is_emergency": True,
        "department": "Security & Emergency",
        "language": "en"
    },

    # Category 8: Reservation & Availability
    {
        "id": "kb-room-availability",
        "category": "operational_rules",
        "sub_category": "reservations",
        "title": "Live Room Availability & Booking Inquiries",
        "keywords": ["available room", "room for tonight", "book a room", "booking", "vacancy", "khali room"],
        "content": "Our property features 40 bespoke luxury suites across 4 floors (Maharaja Penthouse, Imperial Deluxe, and Royal Suites). For immediate check-in tonight or reservations, our Front Desk Reservation Manager provides real-time room options and best direct rates.",
        "requires_front_desk": True,
        "language": "en"
    }
]
