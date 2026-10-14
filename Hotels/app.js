/**
 * The Grand Imperial Hotel - Comprehensive Hotel Operations & Directory
 * Interactive door simulation, live floor management, Indian guest tracking, and INR currency.
 * Fully editable hotel settings (identity, dining, policies, stewards) and editable room details.
 */

const DEFAULT_CONFIG = {
  hotel: {
    name: "The Himalayan Vista",
    tagline: "Luxury Heritage & Valley Retreat • Est. 1912",
    address: "Library End, Camel's Back Road, Mussoorie, Uttarakhand 248179",
    phone: "+91 135 263 5890",
    email: "concierge@himalayanvistahotel.com",
    checkInTime: "2:00 PM (14:00)",
    checkOutTime: "11:00 AM (11:00)",
    currency: "₹"
  },
  diningAndAmenities: {
    breakfastTimings: "7:30 AM – 10:30 AM",
    breakfastVenue: "The Glasshouse Bistro & Pine & Mist, Ground Floor",
    wifiSsid: "HimalayanVista_Guest",
    wifiPassword: "Room Number + Guest Last Name",
    poolTimings: "7:00 AM – 8:00 PM (Heated Indoor Glasshouse Pool)",
    gymTimings: "24 Hours (Guided Yoga at 7:00 AM)",
    roomServiceHours: "24x7 In-Room Dining (Dial 105)"
  },
  policies: {
    cancellation: "100% refund up to 48 hours prior to check-in",
    smokingPenalty: "₹5,000 deep-cleaning fine (Designated Gazebo on Pine Lawn)",
    extraBedFee: "₹1,500 / night (Complimentary baby cots)",
    visitorPolicy: "Permitted in lobby/restaurant until 8:00 PM",
    petPolicy: "Strictly not permitted in upper suites (Wildlife zone)"
  },
  stewards: [
    "Sunita Rawat (Floor 1)",
    "Vikram Negi (Floor 2)",
    "Deepak Thapa (Floor 3)",
    "Ramesh Chandra (Floor 4)"
  ],
  floorsCount: 4,
  roomsPerFloor: [10, 10, 10, 10], // 4 Floors = 40 Rooms
  roomStates: {}
};

// Curated Pool of Indian Guest Names
const GUEST_NAMES = [
  "Rajesh Sharma",
  "Priya Patel",
  "Vikramaditya Singhania",
  "Ananya Iyer",
  "Rohan Malhotra",
  "Neha Kapoor",
  "Siddharth Verma",
  "Aarav Deshmukh",
  "Meera Nambiar",
  "Devendra Joshi",
  "Kavita Sundaram",
  "Aditya Roy Chowdhury"
];

const ROOM_VIEWS = [
  "Grand Courtyard Garden",
  "Heritage Palace Vista",
  "Terrace & Classical Fountain",
  "City Panorama & Aravali View",
  "Private Mughal Rose Garden",
  "Lakeside Vista",
  "Pine Garden View",
  "Himalayan Ridge View"
];

const STANDARD_AMENITIES = [
  { name: "High-Speed Wi-Fi", icon: "📶" },
  { name: "Marble Jacuzzi", icon: "🛁" },
  { name: "Tea & Coffee Maker", icon: "☕" },
  { name: "Gourmet Minibar", icon: "🍸" },
  { name: "65\" 4K Smart TV", icon: "📺" },
  { name: "Private Balcony", icon: "🌿" },
  { name: "Electronic Safe", icon: "🔒" },
  { name: "24x7 Room Dining", icon: "🛎️" },
  { name: "Central Climate Control", icon: "❄️" },
  { name: "Forest Essentials Bath Kit", icon: "🧴" }
];

class HotelApp {
  constructor() {
    this.config = this.loadConfig();
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.audioEnabled = true;
    this.audioCtx = null;
    this.activeRoomData = null;

    this.cacheDom();
    this.bindEvents();
    this.applyHeaderBranding();
    this.render();
    this.startTicketPolling();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('himalayan_vista_hotel_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.floorsCount >= 4 && Array.isArray(parsed.roomsPerFloor)) {
          return {
            ...DEFAULT_CONFIG,
            ...parsed,
            hotel: { ...DEFAULT_CONFIG.hotel, ...(parsed.hotel || {}) },
            diningAndAmenities: { ...DEFAULT_CONFIG.diningAndAmenities, ...(parsed.diningAndAmenities || {}) },
            policies: { ...DEFAULT_CONFIG.policies, ...(parsed.policies || {}) },
            stewards: Array.isArray(parsed.stewards) && parsed.stewards.length ? parsed.stewards : DEFAULT_CONFIG.stewards,
            roomStates: parsed.roomStates || {}
          };
        }
      }
    } catch (e) {
      console.warn('Could not read saved config, using default', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  saveConfig() {
    try {
      localStorage.setItem('himalayan_vista_hotel_v5', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save config to localStorage', e);
    }
  }

  cacheDom() {
    // Header Branding & Stats
    this.hotelTitle = document.getElementById('hotel-title');
    this.hotelSubtitle = document.getElementById('hotel-subtitle');
    this.statFloors = document.getElementById('stat-floors-count');
    this.statRooms = document.getElementById('stat-rooms-count');
    this.statOccupancy = document.getElementById('stat-occupancy-rate');
    this.statRevenue = document.getElementById('stat-revenue');

    // Header Controls & Search
    this.inputSearch = document.getElementById('input-room-search');
    this.btnClearSearch = document.getElementById('btn-clear-search');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnOpenSettings = document.getElementById('btn-open-settings');

    // Filter Buttons
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.countAll = document.getElementById('count-all');
    this.countAvailable = document.getElementById('count-available');
    this.countOccupied = document.getElementById('count-occupied');
    this.countCleaning = document.getElementById('count-cleaning');
    this.countDnd = document.getElementById('count-dnd');

    // Floors Wrapper
    this.floorsWrapper = document.getElementById('floors-wrapper');
    this.audioToast = document.getElementById('audio-toast');

    // Settings Modal
    this.settingsModal = document.getElementById('settings-modal');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCancelSettings = document.getElementById('btn-cancel-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnResetDefault = document.getElementById('btn-reset-default');
    this.settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
    this.settingsTabPanes = document.querySelectorAll('.settings-tab-pane');

    // Settings - Floors Tab
    this.inputFloorsCount = document.getElementById('input-floors-count');
    this.btnDecreaseFloors = document.getElementById('btn-decrease-floors');
    this.btnIncreaseFloors = document.getElementById('btn-increase-floors');
    this.inputQuickRooms = document.getElementById('input-quick-rooms');
    this.btnDecreaseQuick = document.getElementById('btn-decrease-quick');
    this.btnIncreaseQuick = document.getElementById('btn-increase-quick');
    this.btnApplyUniform = document.getElementById('btn-apply-uniform');
    this.floorsConfigList = document.getElementById('floors-config-list');

    // Settings - Hotel Identity Tab
    this.inputHotelName = document.getElementById('input-hotel-name');
    this.inputHotelTagline = document.getElementById('input-hotel-tagline');
    this.inputHotelAddress = document.getElementById('input-hotel-address');
    this.inputHotelPhone = document.getElementById('input-hotel-phone');
    this.inputHotelEmail = document.getElementById('input-hotel-email');
    this.inputHotelCurrency = document.getElementById('input-hotel-currency');
    this.inputHotelCheckin = document.getElementById('input-hotel-checkin');
    this.inputHotelCheckout = document.getElementById('input-hotel-checkout');

    // Settings - Dining & Amenities Tab
    this.inputBreakfastTimings = document.getElementById('input-breakfast-timings');
    this.inputBreakfastVenue = document.getElementById('input-breakfast-venue');
    this.inputWifiSsid = document.getElementById('input-wifi-ssid');
    this.inputWifiPassword = document.getElementById('input-wifi-password');
    this.inputPoolTimings = document.getElementById('input-pool-timings');
    this.inputGymTimings = document.getElementById('input-gym-timings');
    this.inputRoomServiceHours = document.getElementById('input-room-service-hours');

    // Settings - Policies Tab
    this.inputCancellationPolicy = document.getElementById('input-cancellation-policy');
    this.inputSmokingPenalty = document.getElementById('input-smoking-penalty');
    this.inputExtraBedFee = document.getElementById('input-extra-bed-fee');
    this.inputVisitorPolicy = document.getElementById('input-visitor-policy');
    this.inputPetPolicy = document.getElementById('input-pet-policy');

    // Settings - Staff Tab
    this.inputHotelStewards = document.getElementById('input-hotel-stewards');

    // Room Details Modal Elements
    this.roomModal = document.getElementById('room-modal');
    this.btnCloseRoomModal = document.getElementById('btn-close-room-modal');
    this.roomModalTitle = document.getElementById('room-modal-title');
    this.roomModalBadge = document.getElementById('room-modal-level-badge');
    this.roomModalTierBadge = document.getElementById('room-modal-tier-badge');
    this.miniRoomNumber = document.getElementById('mini-room-number');
    this.miniDoorHanger = document.getElementById('mini-door-hanger');
    this.miniDoorLight = document.getElementById('mini-door-light');
    this.roomEditPrice = document.getElementById('room-edit-price');
    this.roomCurrencySymbol = document.getElementById('room-currency-symbol');

    // Room Details - Editable Inputs
    this.roomEditStatus = document.getElementById('room-edit-status');
    this.roomEditGuestName = document.getElementById('room-edit-guest-name');
    this.roomEditVip = document.getElementById('room-edit-vip');
    this.roomEditDates = document.getElementById('room-edit-dates');
    this.roomEditCapacity = document.getElementById('room-edit-capacity');

    this.roomEditType = document.getElementById('room-edit-type');
    this.roomEditView = document.getElementById('room-edit-view');
    this.roomEditBed = document.getElementById('room-edit-bed');
    this.roomEditArea = document.getElementById('room-edit-area');

    this.roomAmenitiesWrap = document.getElementById('room-amenities-wrap');
    this.roomEditSteward = document.getElementById('room-edit-steward');
    this.roomEditSanitized = document.getElementById('room-edit-sanitized');

    // Room Action Buttons
    this.btnKnockDoor = document.getElementById('btn-knock-door');
    this.btnToggleStatus = document.getElementById('btn-toggle-status');
    this.btnToggleStatusText = document.getElementById('btn-toggle-status-text');
    this.btnToggleDnd = document.getElementById('btn-toggle-dnd');
    this.btnToggleDndText = document.getElementById('btn-toggle-dnd-text');
    this.btnToggleCleaning = document.getElementById('btn-toggle-cleaning');
    this.btnSaveRoomDetails = document.getElementById('btn-save-room-details');

    // Export to Excel & Google Sheets Elements
    this.btnHeaderExportExcel = document.getElementById('btn-header-export-excel');
    this.btnExportAllExcel = document.getElementById('btn-export-all-excel');
    this.btnSettingsExportExcel = document.getElementById('btn-settings-export-excel');
    this.btnCopyGoogleSheets = document.getElementById('btn-copy-google-sheets');
    this.btnSyncGoogleSheets = document.getElementById('btn-sync-google-sheets');
    this.inputGoogleSheetsWebhook = document.getElementById('google-sheets-webhook');
    this.btnToggleSheetsGuide = document.getElementById('btn-toggle-sheets-guide');
    this.exportTotalRooms = document.getElementById('export-total-rooms');
    this.exportOccupancyRate = document.getElementById('export-occupancy-rate');
    this.exportFloorsCount = document.getElementById('export-floors-count');

    // Phase 2: AI Concierge Testing Console Elements
    this.btnOpenConcierge = document.getElementById('btn-open-concierge');
    this.btnCloseConcierge = document.getElementById('btn-close-concierge');
    this.conciergeModal = document.getElementById('concierge-modal');
    this.conciergeForm = document.getElementById('concierge-input-form');
    this.conciergeInput = document.getElementById('concierge-input-text');
    this.conciergeStream = document.getElementById('concierge-chat-stream');

    // Phase 5: Operational Tickets & Closed-Loop Elements
    this.btnOpenTickets = document.getElementById('btn-open-tickets');
    this.btnCloseTickets = document.getElementById('btn-close-tickets');
    this.ticketsModal = document.getElementById('tickets-modal');
    this.headerTicketCount = document.getElementById('header-ticket-count');
    this.headerTicketDot = document.getElementById('header-ticket-dot');
    this.ticketsListStream = document.getElementById('tickets-list-stream');
    this.tktTabs = document.querySelectorAll('.tkt-tab');
    this.activeTktFilter = 'all';
    this.ticketsData = [];
    this.lastOpenCount = 0;

    // Phase 8: In-Room QR Stand Elements
    this.btnOpenQrStand = document.getElementById('btn-open-qr-stand');
    this.btnCloseQrModal = document.getElementById('btn-close-qr-modal');
    this.qrModal = document.getElementById('qr-modal');
    this.selectQrRoom = document.getElementById('select-qr-room');
    this.qrStandImg = document.getElementById('qr-stand-img');
    this.standRoomPill = document.getElementById('stand-room-pill');
    this.btnOpenLiveQr = document.getElementById('btn-open-live-qr');

    // Phase 9: Operational Intelligence & Incident Detection Elements
    this.btnOpenIncidents = document.getElementById('btn-open-incidents');
    this.headerIncidentDot = document.getElementById('header-incident-dot');
    this.headerIncidentCount = document.getElementById('header-incident-count');
    this.incidentAlertBanner = document.getElementById('incident-alert-banner');
    this.bannerSubsystemTag = document.getElementById('banner-subsystem-tag');
    this.bannerIncidentTitle = document.getElementById('banner-incident-title');
    this.bannerIncidentMsg = document.getElementById('banner-incident-msg');
    this.bannerRoomsAffected = document.getElementById('banner-rooms-affected');
    this.bannerClusterTime = document.getElementById('banner-cluster-time');
    this.bannerStatusBadge = document.getElementById('banner-status-badge');
    this.btnBannerDispatch = document.getElementById('btn-banner-dispatch');
    this.btnBannerView = document.getElementById('btn-banner-view');
    this.btnBannerSimulate = document.getElementById('btn-banner-simulate');
    this.bannerTktCount = document.getElementById('banner-tkt-count');

    this.incidentModal = document.getElementById('incident-modal');
    this.btnCloseIncidentModal = document.getElementById('btn-close-incident-modal');
    this.btnModalDispatchEng = document.getElementById('btn-modal-dispatch-eng');
    this.btnModalResolveEng = document.getElementById('btn-modal-resolve-eng');
    this.btnModalCloseView = document.getElementById('btn-modal-close-view');

    this.modalIncSubsystem = document.getElementById('modal-inc-subsystem');
    this.modalIncStatus = document.getElementById('modal-inc-status');
    this.modalIncRooms = document.getElementById('modal-inc-rooms');
    this.modalIncWindow = document.getElementById('modal-inc-window');
    this.modalIncDept = document.getElementById('modal-inc-dept');
    this.modalIncEngineer = document.getElementById('modal-inc-engineer');
    this.modalIncAlertText = document.getElementById('modal-inc-alert-text');

    this.currentIncident = null;

    // Phase 12: End-to-End Demo Guide Elements
    this.btnOpenDemoGuide = document.getElementById('btn-open-demo-guide');
    this.demoGuideModal = document.getElementById('demo-guide-modal');
    this.btnCloseDemoModal = document.getElementById('btn-close-demo-modal');
    this.btnRunSc1 = document.getElementById('btn-run-sc1');
    this.btnRunSc2 = document.getElementById('btn-run-sc2');
    this.btnRunSc3 = document.getElementById('btn-run-sc3');
    this.demoTerminal = document.getElementById('demo-terminal');
    this.demoTermBody = document.getElementById('demo-term-body');
    this.demoTermStatus = document.getElementById('demo-term-status');
  }

  bindEvents() {
    // Phase 12: Demo Guide Modal Listeners
    if (this.btnOpenDemoGuide) {
      this.btnOpenDemoGuide.addEventListener('click', () => this.openDemoGuideModal());
    }
    if (this.btnCloseDemoModal) {
      this.btnCloseDemoModal.addEventListener('click', () => this.closeDemoGuideModal());
    }
    if (this.demoGuideModal) {
      this.demoGuideModal.addEventListener('click', (e) => {
        if (e.target === this.demoGuideModal) this.closeDemoGuideModal();
      });
    }
    if (this.btnRunSc1) {
      this.btnRunSc1.addEventListener('click', () => this.executeScenario1());
    }
    if (this.btnRunSc2) {
      this.btnRunSc2.addEventListener('click', () => this.executeScenario2());
    }
    if (this.btnRunSc3) {
      this.btnRunSc3.addEventListener('click', () => this.executeScenario3());
    }
    // Settings modal triggers
    this.btnOpenSettings.addEventListener('click', () => this.openSettingsModal());
    this.btnCloseSettings.addEventListener('click', () => this.closeSettingsModal());
    this.btnCancelSettings.addEventListener('click', () => this.closeSettingsModal());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettingsModal();
    });

    // Concierge modal triggers
    if (this.btnOpenConcierge) {
      this.btnOpenConcierge.addEventListener('click', () => this.openConciergeModal());
    }
    if (this.btnCloseConcierge) {
      this.btnCloseConcierge.addEventListener('click', () => this.closeConciergeModal());
    }
    if (this.conciergeModal) {
      this.conciergeModal.addEventListener('click', (e) => {
        if (e.target === this.conciergeModal) this.closeConciergeModal();
      });
    }

    // Phase 5: Tickets modal triggers
    if (this.btnOpenTickets) {
      this.btnOpenTickets.addEventListener('click', () => this.openTicketsModal());
    }
    if (this.btnCloseTickets) {
      this.btnCloseTickets.addEventListener('click', () => this.closeTicketsModal());
    }
    if (this.ticketsModal) {
      this.ticketsModal.addEventListener('click', (e) => {
        if (e.target === this.ticketsModal) this.closeTicketsModal();
      });
    }

    // Phase 8: QR Modal Triggers
    if (this.btnOpenQrStand) {
      this.btnOpenQrStand.addEventListener('click', () => this.openQrModal());
    }
    if (this.btnCloseQrModal) {
      this.btnCloseQrModal.addEventListener('click', () => this.closeQrModal());
    }
    if (this.qrModal) {
      this.qrModal.addEventListener('click', (e) => {
        if (e.target === this.qrModal) this.closeQrModal();
      });
    }
    if (this.selectQrRoom) {
      this.selectQrRoom.addEventListener('change', () => this.updateQrStandPreview());
    }

    // Phase 9: Incident Event Listeners
    if (this.btnOpenIncidents) {
      this.btnOpenIncidents.addEventListener('click', () => this.openIncidentModal());
    }
    if (this.btnCloseIncidentModal) {
      this.btnCloseIncidentModal.addEventListener('click', () => this.closeIncidentModal());
    }
    if (this.btnModalCloseView) {
      this.btnModalCloseView.addEventListener('click', () => this.closeIncidentModal());
    }
    if (this.btnBannerView) {
      this.btnBannerView.addEventListener('click', () => this.openIncidentModal());
    }
    if (this.btnBannerDispatch) {
      this.btnBannerDispatch.addEventListener('click', () => this.dispatchEngineer());
    }
    if (this.btnModalDispatchEng) {
      this.btnModalDispatchEng.addEventListener('click', () => this.dispatchEngineer());
    }
    if (this.btnModalResolveEng) {
      this.btnModalResolveEng.addEventListener('click', () => this.resolveIncident());
    }
    if (this.btnBannerSimulate) {
      this.btnBannerSimulate.addEventListener('click', () => this.simulatePptIncident());
    }
    if (this.incidentModal) {
      this.incidentModal.addEventListener('click', (e) => {
        if (e.target === this.incidentModal) this.closeIncidentModal();
      });
    }

    // Ticket Filter Tabs
    this.tktTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tktTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTktFilter = tab.getAttribute('data-tkt-filter') || 'all';
        this.renderTicketsList();
      });
    });
    if (this.conciergeForm) {
      this.conciergeForm.addEventListener('submit', (e) => this.handleConciergeSubmit(e));
    }
    document.querySelectorAll('.chip-prompt').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query');
        if (q) {
          if (this.conciergeInput) this.conciergeInput.value = q;
          this.sendConciergeMessage(q);
        }
      });
    });

    // Excel & Google Sheets Export Triggers
    if (this.btnHeaderExportExcel) {
      this.btnHeaderExportExcel.addEventListener('click', () => this.exportToExcel());
    }
    if (this.btnExportAllExcel) {
      this.btnExportAllExcel.addEventListener('click', () => this.exportToExcel());
    }
    if (this.btnSettingsExportExcel) {
      this.btnSettingsExportExcel.addEventListener('click', () => this.exportToExcel());
    }
    if (this.btnCopyGoogleSheets) {
      this.btnCopyGoogleSheets.addEventListener('click', () => this.copyForGoogleSheets());
    }
    if (this.btnSyncGoogleSheets) {
      this.btnSyncGoogleSheets.addEventListener('click', () => this.syncToGoogleSheets());
    }
    if (this.btnToggleSheetsGuide) {
      this.btnToggleSheetsGuide.addEventListener('click', () => this.toggleSheetsGuide());
    }

    // Settings Tabs Switching
    this.settingsTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.settingsTabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        this.settingsTabPanes.forEach(pane => {
          if (pane.id === targetTab) {
            pane.removeAttribute('hidden');
            pane.classList.add('active');
          } else {
            pane.setAttribute('hidden', '');
            pane.classList.remove('active');
          }
        });
        this.playChime();
      });
    });

    // Floor counter stepper
    this.btnDecreaseFloors.addEventListener('click', () => {
      let val = parseInt(this.inputFloorsCount.value, 10) || 1;
      if (val > 1) {
        this.inputFloorsCount.value = val - 1;
        this.syncModalFloorInputs();
      }
    });

    this.btnIncreaseFloors.addEventListener('click', () => {
      let val = parseInt(this.inputFloorsCount.value, 10) || 1;
      if (val < 15) {
        this.inputFloorsCount.value = val + 1;
        this.syncModalFloorInputs();
      }
    });

    this.inputFloorsCount.addEventListener('change', () => {
      let val = parseInt(this.inputFloorsCount.value, 10) || 1;
      val = Math.max(1, Math.min(15, val));
      this.inputFloorsCount.value = val;
      this.syncModalFloorInputs();
    });

    // Quick uniform rooms stepper
    this.btnDecreaseQuick.addEventListener('click', () => {
      let val = parseInt(this.inputQuickRooms.value, 10) || 1;
      if (val > 1) this.inputQuickRooms.value = val - 1;
    });

    this.btnIncreaseQuick.addEventListener('click', () => {
      let val = parseInt(this.inputQuickRooms.value, 10) || 1;
      if (val < 15) this.inputQuickRooms.value = val + 1;
    });

    this.btnApplyUniform.addEventListener('click', () => {
      const uniformRooms = parseInt(this.inputQuickRooms.value, 10) || 4;
      const inputs = this.floorsConfigList.querySelectorAll('.floor-rooms-input');
      inputs.forEach(inp => inp.value = uniformRooms);
      this.showToast(`Applied ${uniformRooms} rooms to all floors`);
    });

    // Preset buttons
    document.querySelectorAll('.btn-chip[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        this.applyPreset(preset);
      });
    });

    // Reset & Save Settings
    this.btnResetDefault.addEventListener('click', () => {
      this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      this.saveConfig();
      this.openSettingsModal();
      this.applyHeaderBranding();
      this.render();
      this.showToast('Reset to default hotel configuration');
    });

    this.btnSaveSettings.addEventListener('click', () => this.saveSettingsFromModal());

    // Search input
    this.inputSearch.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.btnClearSearch.hidden = !this.searchQuery;
      this.applyFilterAndSearch();
    });

    this.btnClearSearch.addEventListener('click', () => {
      this.inputSearch.value = '';
      this.searchQuery = '';
      this.btnClearSearch.hidden = true;
      this.applyFilterAndSearch();
    });

    // Filter tabs
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.applyFilterAndSearch();
        this.playChime();
      });
    });

    // Sound toggle
    this.btnSoundToggle.addEventListener('click', () => {
      this.audioEnabled = !this.audioEnabled;
      this.soundIcon.innerHTML = this.audioEnabled ? '&#128266;' : '&#128263;';
      this.showToast(this.audioEnabled ? 'Sound enabled' : 'Sound muted');
      if (this.audioEnabled) this.playChime();
    });

    // Room modal close
    this.btnCloseRoomModal.addEventListener('click', () => this.closeRoomModal());
    this.roomModal.addEventListener('click', (e) => {
      if (e.target === this.roomModal) this.closeRoomModal();
    });

    // Room Actions inside modal
    this.btnKnockDoor.addEventListener('click', () => {
      this.playKnock();
      if (this.activeRoomData) {
        this.showToast(`Knocked on Room ${this.activeRoomData.roomNumber}! ✊`);
      }
    });

    this.btnToggleStatus.addEventListener('click', () => {
      if (!this.activeRoomData) return;
      const state = this.getRoomState(this.activeRoomData.roomNumber, this.activeRoomData.floorNumber);
      if (state.status === 'occupied') {
        state.status = 'available';
        state.guestName = 'Vacant (Ready for Check-In)';
        state.vip = 'Standard Guest';
        state.dnd = false;
        state.lights = false;
        this.showToast(`Room ${this.activeRoomData.roomNumber} Checked Out (Now Available)`);
      } else {
        state.status = 'occupied';
        state.guestName = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
        state.vip = Math.random() > 0.5 ? 'Taj Club VIP' : 'Gold Member';
        state.lights = true;
        this.showToast(`Room ${this.activeRoomData.roomNumber} Checked In to ${state.guestName}!`);
      }
      this.setRoomState(this.activeRoomData.roomNumber, state);
      this.updateRoomModalView(this.activeRoomData);
      this.render();
      this.playChime();
    });

    this.btnToggleDnd.addEventListener('click', () => {
      if (!this.activeRoomData) return;
      const state = this.getRoomState(this.activeRoomData.roomNumber, this.activeRoomData.floorNumber);
      state.dnd = !state.dnd;
      this.setRoomState(this.activeRoomData.roomNumber, state);
      this.updateRoomModalView(this.activeRoomData);
      this.render();
      this.playChime();
      this.showToast(`Room ${this.activeRoomData.roomNumber} Do Not Disturb: ${state.dnd ? 'ACTIVATED' : 'OFF'}`);
    });

    this.btnToggleCleaning.addEventListener('click', () => {
      if (!this.activeRoomData) return;
      const state = this.getRoomState(this.activeRoomData.roomNumber, this.activeRoomData.floorNumber);
      state.status = state.status === 'cleaning' ? 'available' : 'cleaning';
      this.setRoomState(this.activeRoomData.roomNumber, state);
      this.updateRoomModalView(this.activeRoomData);
      this.render();
      this.playChime();
      this.showToast(`Room ${this.activeRoomData.roomNumber} Housekeeping Status: ${state.status.toUpperCase()}`);
    });

    // Save individual room changes button
    this.btnSaveRoomDetails.addEventListener('click', () => this.saveRoomDetailsFromModal());

    // Live update door status and preview when dropdown changes
    this.roomEditStatus.addEventListener('change', () => {
      const newStatus = this.roomEditStatus.value;
      if (newStatus === 'occupied') {
        this.miniDoorLight.classList.add('active');
      } else {
        this.miniDoorLight.classList.remove('active');
      }
      if (newStatus === 'cleaning') {
        this.miniDoorHanger.removeAttribute('hidden');
        this.miniDoorHanger.textContent = 'CLEAN';
        this.miniDoorHanger.style.background = 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)';
      } else {
        const state = this.activeRoomData ? this.getRoomState(this.activeRoomData.roomNumber, this.activeRoomData.floorNumber) : {};
        if (state.dnd) {
          this.miniDoorHanger.removeAttribute('hidden');
          this.miniDoorHanger.textContent = 'DND';
          this.miniDoorHanger.style.background = 'linear-gradient(180deg, #b71c1c 0%, #8e1515 100%)';
        } else {
          this.miniDoorHanger.setAttribute('hidden', '');
        }
      }
    });

    // Escape closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSettingsModal();
        this.closeRoomModal();
      }
    });
  }

  applyHeaderBranding() {
    if (this.hotelTitle && this.config.hotel.name) {
      this.hotelTitle.textContent = this.config.hotel.name;
    }
    if (this.hotelSubtitle && this.config.hotel.tagline) {
      this.hotelSubtitle.textContent = this.config.hotel.tagline;
    }
  }

  // --- Presets Handler ---
  applyPreset(presetKey) {
    if (presetKey === '2-4') {
      this.inputFloorsCount.value = 2;
      this.syncModalFloorInputs([4, 4]);
    } else if (presetKey === '3-5') {
      this.inputFloorsCount.value = 3;
      this.syncModalFloorInputs([5, 5, 5]);
    } else if (presetKey === '4-3') {
      this.inputFloorsCount.value = 4;
      this.syncModalFloorInputs([3, 3, 3, 3]);
    } else if (presetKey === '4-10') {
      this.inputFloorsCount.value = 4;
      this.syncModalFloorInputs([10, 10, 10, 10]);
    } else if (presetKey === 'custom-grand') {
      this.inputFloorsCount.value = 4;
      this.syncModalFloorInputs([8, 6, 4, 2]);
    }
    this.playChime();
    this.showToast(`Loaded preset layout`);
  }

  // --- Settings Modal ---
  openSettingsModal() {
    // Tab 1: Floors
    this.inputFloorsCount.value = this.config.floorsCount;
    this.syncModalFloorInputs(this.config.roomsPerFloor);

    // Tab 2: Hotel Identity
    this.inputHotelName.value = this.config.hotel.name || '';
    this.inputHotelTagline.value = this.config.hotel.tagline || '';
    this.inputHotelAddress.value = this.config.hotel.address || '';
    this.inputHotelPhone.value = this.config.hotel.phone || '';
    this.inputHotelEmail.value = this.config.hotel.email || '';
    this.inputHotelCurrency.value = this.config.hotel.currency || '₹';
    this.inputHotelCheckin.value = this.config.hotel.checkInTime || '';
    this.inputHotelCheckout.value = this.config.hotel.checkOutTime || '';

    // Tab 3: Dining & Amenities
    this.inputBreakfastTimings.value = this.config.diningAndAmenities.breakfastTimings || '';
    this.inputBreakfastVenue.value = this.config.diningAndAmenities.breakfastVenue || '';
    this.inputWifiSsid.value = this.config.diningAndAmenities.wifiSsid || '';
    this.inputWifiPassword.value = this.config.diningAndAmenities.wifiPassword || '';
    this.inputPoolTimings.value = this.config.diningAndAmenities.poolTimings || '';
    this.inputGymTimings.value = this.config.diningAndAmenities.gymTimings || '';
    this.inputRoomServiceHours.value = this.config.diningAndAmenities.roomServiceHours || '';

    // Tab 4: Policies
    this.inputCancellationPolicy.value = this.config.policies.cancellation || '';
    this.inputSmokingPenalty.value = this.config.policies.smokingPenalty || '';
    this.inputExtraBedFee.value = this.config.policies.extraBedFee || '';
    this.inputVisitorPolicy.value = this.config.policies.visitorPolicy || '';
    this.inputPetPolicy.value = this.config.policies.petPolicy || '';

    // Tab 5: Stewards
    this.inputHotelStewards.value = (this.config.stewards || []).join('\n');

    // Tab 6: Excel Preview Stats
    const totalRooms = (this.config.roomsPerFloor || []).reduce((a, b) => a + b, 0);
    const floorsCount = this.config.floorsCount || (this.config.roomsPerFloor || []).length;
    let occCount = 0;
    for (let f = 1; f <= floorsCount; f++) {
      const numRooms = (this.config.roomsPerFloor || [])[f - 1] || 4;
      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r < 10 ? '0' + r : r}`;
        const st = this.getRoomState(roomNumber, f);
        if (st.status === 'occupied') occCount++;
      }
    }
    const occPct = totalRooms > 0 ? Math.round((occCount / totalRooms) * 100) : 0;
    if (this.exportTotalRooms) this.exportTotalRooms.textContent = `${totalRooms} Rooms`;
    if (this.exportOccupancyRate) this.exportOccupancyRate.textContent = `${occPct}% (${occCount}/${totalRooms})`;
    if (this.exportFloorsCount) this.exportFloorsCount.textContent = `${floorsCount} Floors`;
    if (this.inputGoogleSheetsWebhook) {
      this.inputGoogleSheetsWebhook.value = this.config.googleSheetsWebhook || '';
    }

    this.settingsModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeSettingsModal() {
    this.settingsModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  syncModalFloorInputs(customValues = null) {
    const count = parseInt(this.inputFloorsCount.value, 10) || 1;
    this.floorsConfigList.innerHTML = '';

    for (let f = count; f >= 1; f--) {
      const floorIdx = f - 1;
      let roomsVal = 4;
      if (customValues && customValues[floorIdx] !== undefined) {
        roomsVal = customValues[floorIdx];
      } else if (this.config.roomsPerFloor[floorIdx] !== undefined) {
        roomsVal = this.config.roomsPerFloor[floorIdx];
      }

      const item = document.createElement('div');
      item.className = 'floor-config-item';
      item.innerHTML = `
        <span class="floor-config-name">Floor ${f}</span>
        <div class="stepper-input compact">
          <button type="button" class="stepper-btn btn-dec-item" data-idx="${floorIdx}">&minus;</button>
          <input type="number" class="num-input floor-rooms-input" data-idx="${floorIdx}" min="1" max="15" value="${roomsVal}">
          <button type="button" class="stepper-btn btn-inc-item" data-idx="${floorIdx}">&plus;</button>
        </div>
      `;
      this.floorsConfigList.appendChild(item);
    }

    this.floorsConfigList.querySelectorAll('.btn-dec-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-idx');
        const inp = this.floorsConfigList.querySelector(`.floor-rooms-input[data-idx="${idx}"]`);
        let v = parseInt(inp.value, 10) || 1;
        if (v > 1) inp.value = v - 1;
      });
    });

    this.floorsConfigList.querySelectorAll('.btn-inc-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-idx');
        const inp = this.floorsConfigList.querySelector(`.floor-rooms-input[data-idx="${idx}"]`);
        let v = parseInt(inp.value, 10) || 1;
        if (v < 15) inp.value = v + 1;
      });
    });
  }

  saveSettingsFromModal() {
    const floorsCount = parseInt(this.inputFloorsCount.value, 10) || 1;
    const newRooms = [];

    for (let f = 0; f < floorsCount; f++) {
      const inp = this.floorsConfigList.querySelector(`.floor-rooms-input[data-idx="${f}"]`);
      const val = inp ? (parseInt(inp.value, 10) || 4) : 4;
      newRooms[f] = Math.max(1, Math.min(15, val));
    }

    // Save Floors
    this.config.floorsCount = floorsCount;
    this.config.roomsPerFloor = newRooms;

    // Save Hotel Identity
    this.config.hotel = {
      name: this.inputHotelName.value.trim() || DEFAULT_CONFIG.hotel.name,
      tagline: this.inputHotelTagline.value.trim() || DEFAULT_CONFIG.hotel.tagline,
      address: this.inputHotelAddress.value.trim() || DEFAULT_CONFIG.hotel.address,
      phone: this.inputHotelPhone.value.trim() || DEFAULT_CONFIG.hotel.phone,
      email: this.inputHotelEmail.value.trim() || DEFAULT_CONFIG.hotel.email,
      currency: this.inputHotelCurrency.value.trim() || '₹',
      checkInTime: this.inputHotelCheckin.value.trim() || DEFAULT_CONFIG.hotel.checkInTime,
      checkOutTime: this.inputHotelCheckout.value.trim() || DEFAULT_CONFIG.hotel.checkOutTime
    };

    // Save Dining & Amenities
    this.config.diningAndAmenities = {
      breakfastTimings: this.inputBreakfastTimings.value.trim() || DEFAULT_CONFIG.diningAndAmenities.breakfastTimings,
      breakfastVenue: this.inputBreakfastVenue.value.trim() || DEFAULT_CONFIG.diningAndAmenities.breakfastVenue,
      wifiSsid: this.inputWifiSsid.value.trim() || DEFAULT_CONFIG.diningAndAmenities.wifiSsid,
      wifiPassword: this.inputWifiPassword.value.trim() || DEFAULT_CONFIG.diningAndAmenities.wifiPassword,
      poolTimings: this.inputPoolTimings.value.trim() || DEFAULT_CONFIG.diningAndAmenities.poolTimings,
      gymTimings: this.inputGymTimings.value.trim() || DEFAULT_CONFIG.diningAndAmenities.gymTimings,
      roomServiceHours: this.inputRoomServiceHours.value.trim() || DEFAULT_CONFIG.diningAndAmenities.roomServiceHours
    };

    // Save Policies
    this.config.policies = {
      cancellation: this.inputCancellationPolicy.value.trim() || DEFAULT_CONFIG.policies.cancellation,
      smokingPenalty: this.inputSmokingPenalty.value.trim() || DEFAULT_CONFIG.policies.smokingPenalty,
      extraBedFee: this.inputExtraBedFee.value.trim() || DEFAULT_CONFIG.policies.extraBedFee,
      visitorPolicy: this.inputVisitorPolicy.value.trim() || DEFAULT_CONFIG.policies.visitorPolicy,
      petPolicy: this.inputPetPolicy.value.trim() || DEFAULT_CONFIG.policies.petPolicy
    };

    // Save Stewards
    const stewardsList = this.inputHotelStewards.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    if (stewardsList.length > 0) {
      this.config.stewards = stewardsList;
    }

    // Save Google Sheets Webhook
    if (this.inputGoogleSheetsWebhook) {
      this.config.googleSheetsWebhook = this.inputGoogleSheetsWebhook.value.trim();
    }

    this.saveConfig();
    this.closeSettingsModal();
    this.applyHeaderBranding();
    this.render();
    this.playChime();
    this.showToast(`Updated hotel settings & floor layout successfully!`);
  }

  // --- Room Data Provider ---
  getRoomState(roomNumber, floorNumber = 1) {
    if (!this.config.roomStates[roomNumber]) {
      const numVal = parseInt(roomNumber, 10) || 101;
      const isOccupied = (numVal % 2 === 0);
      const isCleaning = (numVal % 7 === 0);
      const status = isCleaning ? 'cleaning' : (isOccupied ? 'occupied' : 'available');
      const dnd = isOccupied && (numVal % 4 === 0);

      let roomType = 'Heritage Deluxe King';
      let price = 4800;
      let bed = '1 California King';
      let area = '460 sq. ft / 42 m²';
      let capacity = '2 Adults • Non-Smoking';

      if (floorNumber === 1) {
        if (numVal % 2 === 0) {
          roomType = 'Heritage Deluxe Twin';
          price = 5200;
          bed = '2 Queen Beds';
          capacity = '3 Adults • Non-Smoking';
        } else {
          roomType = 'Heritage Deluxe King';
          price = 4800;
          bed = '1 California King';
        }
      } else if (floorNumber === 2) {
        if (numVal % 2 === 0) {
          roomType = 'Executive Valley Twin';
          price = 6600;
          bed = '2 Queen Beds';
          capacity = '3 Adults • Non-Smoking';
        } else {
          roomType = 'Executive Valley King';
          price = 6200;
          bed = '1 California King';
        }
        area = '540 sq. ft / 50 m²';
      } else if (floorNumber === 3) {
        roomType = 'Imperial Royal Suite';
        price = 9500;
        bed = '1 Grand Four-Poster King';
        area = '720 sq. ft / 67 m²';
        capacity = '3 Adults • Panoramic Snow Peaks';
      } else if (floorNumber === 4) {
        if (roomNumber === '405' || roomNumber === '406') {
          roomType = 'Presidential Sky Villa';
          price = 24000;
          bed = '2 King Bedrooms + Fireplace';
          area = '1,450 sq. ft / 135 m²';
          capacity = '5 Guests • Private Butler Service';
        } else if (['403', '404', '407', '408'].includes(roomNumber)) {
          roomType = "Governor's Heritage Suite";
          price = 13500;
          bed = '1 Four-Poster King';
          area = '880 sq. ft / 82 m²';
          capacity = '3 Guests • Valley Panorama';
        } else {
          roomType = 'Maharaja Penthouse Suite';
          price = 16000;
          bed = '1 Emperor King + Jacuzzi';
          area = '1,100 sq. ft / 102 m²';
          capacity = '4 Guests • 360° Himalayan Vista';
        }
      }

      const guestName = isOccupied ? GUEST_NAMES[numVal % GUEST_NAMES.length] : 'Vacant (Ready for Check-In)';
      const vip = isOccupied ? ((numVal % 3 === 0) ? 'Taj Club VIP' : 'Gold Member') : 'Standard Guest';

      const stewards = this.config.stewards && this.config.stewards.length ? this.config.stewards : DEFAULT_CONFIG.stewards;
      const steward = stewards[(floorNumber - 1) % stewards.length];

      this.config.roomStates[roomNumber] = {
        status,
        dnd,
        price,
        guestName,
        vip,
        lights: isOccupied,
        roomType,
        view: ROOM_VIEWS[numVal % ROOM_VIEWS.length],
        bed,
        capacity,
        area,
        steward: steward,
        sanitized: 'Today, 09:30 AM • Certified Pristine',
        checkIn: isOccupied ? 'Oct 13 – Oct 17 (4 Nights)' : 'Available Immediately',
        amenities: STANDARD_AMENITIES.slice(0, 8).map(a => a.name)
      };
    }
    return this.config.roomStates[roomNumber];
  }

  setRoomState(roomNumber, state) {
    this.config.roomStates[roomNumber] = state;
    this.saveConfig();
  }

  setSelectOrAppend(selectElement, val, fallback) {
    if (!selectElement) return;
    const targetVal = (val && String(val).trim()) || fallback || '';
    if (!targetVal) return;
    let found = false;
    for (let i = 0; i < selectElement.options.length; i++) {
      if (selectElement.options[i].value.toLowerCase() === targetVal.toLowerCase()) {
        selectElement.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = document.createElement('option');
      opt.value = targetVal;
      opt.textContent = targetVal;
      selectElement.appendChild(opt);
      selectElement.value = targetVal;
    }
  }

  // --- Room Details Modal ---
  openRoomModal(roomData) {
    this.activeRoomData = roomData;
    this.updateRoomModalView(roomData);
    this.roomModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    this.playChime();
  }

  updateRoomModalView(roomData) {
    const state = this.getRoomState(roomData.roomNumber, roomData.floorNumber);
    const currency = this.config.hotel.currency || '₹';

    this.roomModalTitle.textContent = `Room ${roomData.roomNumber}`;
    this.roomModalBadge.textContent = `Floor ${roomData.floorNumber}`;
    this.roomModalTierBadge.textContent = state.roomType || (roomData.floorNumber > 2 ? 'Maharaja Penthouse' : 'Royal Deluxe Wing');
    this.miniRoomNumber.textContent = roomData.roomNumber;

    // Currency & Price
    if (this.roomCurrencySymbol) this.roomCurrencySymbol.textContent = currency;
    if (this.roomEditPrice) this.roomEditPrice.value = state.price;

    // Door hanger preview
    if (state.dnd) {
      this.miniDoorHanger.removeAttribute('hidden');
      this.miniDoorHanger.textContent = 'DND';
      this.miniDoorHanger.style.background = 'linear-gradient(180deg, #b71c1c 0%, #8e1515 100%)';
    } else if (state.status === 'cleaning') {
      this.miniDoorHanger.removeAttribute('hidden');
      this.miniDoorHanger.textContent = 'CLEAN';
      this.miniDoorHanger.style.background = 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)';
    } else {
      this.miniDoorHanger.setAttribute('hidden', '');
    }

    // Door under light
    if (state.lights || state.status === 'occupied') {
      this.miniDoorLight.classList.add('active');
    } else {
      this.miniDoorLight.classList.remove('active');
    }

    // Populate Editable Inputs & Dropdown Lists
    this.roomEditStatus.value = state.status;
    this.roomEditGuestName.value = state.guestName;
    this.setSelectOrAppend(this.roomEditVip, state.vip, 'Standard Guest');
    this.setSelectOrAppend(this.roomEditDates, state.checkIn, 'Available Immediately');
    this.setSelectOrAppend(this.roomEditCapacity, state.capacity, '2 Adults • Non-Smoking');

    this.setSelectOrAppend(this.roomEditType, state.roomType || roomData.roomType, 'Royal Double Queen');
    this.setSelectOrAppend(this.roomEditView, state.view, 'Himalayan Ridge View');
    this.setSelectOrAppend(this.roomEditBed, state.bed, '2 Queen Beds');
    this.setSelectOrAppend(this.roomEditArea, state.area, '520 sq. ft / 48 m²');

    // Populate Stewards Dropdown
    const stewards = this.config.stewards && this.config.stewards.length ? this.config.stewards : DEFAULT_CONFIG.stewards;
    this.roomEditSteward.innerHTML = '';
    stewards.forEach(stewardName => {
      const opt = document.createElement('option');
      opt.value = stewardName;
      opt.textContent = stewardName;
      if (stewardName === state.steward) opt.selected = true;
      this.roomEditSteward.appendChild(opt);
    });

    this.setSelectOrAppend(this.roomEditSanitized, state.sanitized, 'Today, 09:30 AM • Certified Pristine');

    // Render Interactive Amenities
    this.renderAmenitiesWrap(state);

    // Quick Button labels
    this.btnToggleStatusText.textContent = state.status === 'occupied' ? 'Check Out' : 'Check In';
    this.btnToggleDndText.textContent = state.dnd ? 'DND: Active' : 'DND: Off';
  }

  renderAmenitiesWrap(state) {
    this.roomAmenitiesWrap.innerHTML = '';
    const activeList = Array.isArray(state.amenities) ? state.amenities : [];

    STANDARD_AMENITIES.forEach(amenity => {
      const isSelected = activeList.includes(amenity.name);
      const chip = document.createElement('span');
      chip.className = `amenity-chip ${isSelected ? 'active' : 'inactive'}`;
      chip.setAttribute('data-amenity', amenity.name);
      chip.textContent = amenity.name;

      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        chip.classList.toggle('inactive');
      });

      this.roomAmenitiesWrap.appendChild(chip);
    });
  }

  saveRoomDetailsFromModal() {
    if (!this.activeRoomData) return;
    const roomNumber = this.activeRoomData.roomNumber;
    const floorNumber = this.activeRoomData.floorNumber;
    const state = this.getRoomState(roomNumber, floorNumber);

    state.price = parseFloat(this.roomEditPrice.value) || state.price;
    state.status = this.roomEditStatus.value;
    state.guestName = this.roomEditGuestName.value.trim() || 'Vacant (Ready for Check-In)';
    state.vip = this.roomEditVip.value;
    state.checkIn = this.roomEditDates.value;
    state.capacity = this.roomEditCapacity.value;

    state.roomType = this.roomEditType.value || state.roomType;
    state.view = this.roomEditView.value || state.view;
    state.bed = this.roomEditBed.value || state.bed;
    state.area = this.roomEditArea.value || state.area;

    state.steward = this.roomEditSteward.value;
    state.sanitized = this.roomEditSanitized.value;
    state.lights = (state.status === 'occupied');

    // Collect active amenity chips
    const activeChips = this.roomAmenitiesWrap.querySelectorAll('.amenity-chip.active');
    state.amenities = Array.from(activeChips).map(c => c.getAttribute('data-amenity'));

    this.setRoomState(roomNumber, state);
    this.updateRoomModalView(this.activeRoomData);
    this.render();
    this.playChime();
    this.showToast(`Saved changes for Room ${roomNumber}`);
  }

  closeRoomModal() {
    this.roomModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    this.activeRoomData = null;
  }

  // --- Data Provider for Excel & Google Sheets ---
  getHotelLedgerData() {
    const currency = (this.config.hotel && this.config.hotel.currency) || '₹';
    const hotelName = (this.config.hotel && this.config.hotel.name) || 'The Grand Imperial Hotel';
    const floorsCount = this.config.floorsCount || 2;
    const roomsPerFloor = this.config.roomsPerFloor || [4, 4];
    const stewards = this.config.stewards && this.config.stewards.length ? this.config.stewards : DEFAULT_CONFIG.stewards;

    const rows = [];
    rows.push([
      'Room Number',
      'Floor',
      'Status',
      'Tariff / Night (' + currency + ')',
      'Room Type',
      'Guest Name',
      'VIP Loyalty Tier',
      'Stay Period',
      'Occupancy',
      'Bed Setup',
      'Window View',
      'Floor Area',
      'Assigned Steward',
      'Sanitized Status',
      'DND Status',
      'Active Amenities'
    ]);

    for (let f = 1; f <= floorsCount; f++) {
      const numRooms = roomsPerFloor[f - 1] || 4;
      const steward = stewards[(f - 1) % stewards.length];
      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r < 10 ? '0' + r : r}`;
        const state = this.getRoomState(roomNumber, f);
        const amenitiesStr = (state.amenities || []).join('; ');

        rows.push([
          roomNumber,
          `Floor ${f}`,
          state.status.toUpperCase(),
          state.price,
          state.roomType || 'Deluxe Room',
          state.guestName || 'Vacant',
          state.vip || 'Standard Guest',
          state.checkIn || 'Available Immediately',
          state.capacity || '2 Adults • Non-Smoking',
          state.bed || '1 King Bed',
          state.view || 'Himalayan Ridge View',
          state.area || '520 sq. ft / 48 m²',
          state.steward || steward,
          state.sanitized || 'Pristine',
          state.dnd ? 'DND Active' : 'Off',
          amenitiesStr
        ]);
      }
    }
    return { hotelName, currency, rows };
  }

  // --- Export Hotel Ledger to Microsoft Excel & Google Sheets (.CSV) ---
  exportToExcel() {
    const { hotelName, rows } = this.getHotelLedgerData();

    const escapeCsvCell = (val) => {
      const s = String(val ?? '');
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = rows.map(r => r.map(escapeCsvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = hotelName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeName}_Room_Directory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.playChime();
    this.showToast(`Exported ${rows.length - 1} rooms to Excel & Sheets (.CSV) successfully!`);
  }

  // --- Instant Clipboard Copy for Google Sheets (TSV format) ---
  async copyForGoogleSheets() {
    const { rows } = this.getHotelLedgerData();
    // TSV format is natively recognized by Google Sheets and Excel paste
    const tsvContent = rows.map(r => r.join('\t')).join('\r\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsvContent);
      } else {
        const ta = document.createElement('textarea');
        ta.value = tsvContent;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.playChime();
      this.showToast(`📋 Copied ${rows.length - 1} rooms! Open Google Sheets and press Ctrl+V to paste.`);
    } catch (err) {
      console.warn('Clipboard write error', err);
      this.showToast('Unable to copy automatically. Please use Download Excel / CSV.');
    }
  }

  // --- Live Automated Google Sheets Sync (Webhook) ---
  async syncToGoogleSheets() {
    const webhookUrl = (this.inputGoogleSheetsWebhook && this.inputGoogleSheetsWebhook.value.trim()) || this.config.googleSheetsWebhook;
    if (!webhookUrl) {
      if (this.sheetsGuideBox) this.sheetsGuideBox.removeAttribute('hidden');
      this.showToast('Please enter your Google Apps Script Web App URL first or click View Setup Script.');
      if (this.inputGoogleSheetsWebhook) this.inputGoogleSheetsWebhook.focus();
      return;
    }

    const { hotelName, rows } = this.getHotelLedgerData();
    this.showToast('Syncing live hotel ledger to Google Sheets...');

    try {
      // Save webhook to persistent config
      this.config.googleSheetsWebhook = webhookUrl;
      this.saveConfig();

      const payload = {
        hotel: hotelName,
        updatedAt: new Date().toISOString(),
        totalRooms: rows.length - 1,
        rooms: rows
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.playChime();
      this.showToast(`⚡ Live property ledger synced to Google Sheet successfully!`);
    } catch (error) {
      console.error('Google Sheets sync error:', error);
      this.showToast('⚠️ Sync request sent. Verify your Google Apps Script permissions.');
    }
  }

  // --- Toggle Google Sheets Setup Guide ---
  toggleSheetsGuide() {
    if (!this.sheetsGuideBox) return;
    const isHidden = this.sheetsGuideBox.hasAttribute('hidden');
    if (isHidden) {
      this.sheetsGuideBox.removeAttribute('hidden');
    } else {
      this.sheetsGuideBox.setAttribute('hidden', '');
    }
  }

  // --- Filtering & Searching ---
  applyFilterAndSearch() {
    const doorCards = document.querySelectorAll('.door-card');
    let firstMatch = null;

    doorCards.forEach(card => {
      const roomNum = card.getAttribute('data-room');
      const state = this.getRoomState(roomNum);
      const guestName = (state.guestName || '').toLowerCase();

      // Check Filter
      let matchesFilter = false;
      if (this.activeFilter === 'all') matchesFilter = true;
      else if (this.activeFilter === 'available' && state.status === 'available') matchesFilter = true;
      else if (this.activeFilter === 'occupied' && state.status === 'occupied') matchesFilter = true;
      else if (this.activeFilter === 'cleaning' && state.status === 'cleaning') matchesFilter = true;
      else if (this.activeFilter === 'dnd' && state.dnd) matchesFilter = true;

      // Check Search Query
      let matchesSearch = true;
      if (this.searchQuery) {
        matchesSearch = roomNum.includes(this.searchQuery) || guestName.includes(this.searchQuery);
      }

      if (matchesFilter && matchesSearch) {
        card.classList.remove('dimmed');
        if (this.searchQuery) {
          card.classList.add('search-match');
          if (!firstMatch) firstMatch = card;
        } else {
          card.classList.remove('search-match');
        }
      } else {
        card.classList.add('dimmed');
        card.classList.remove('search-match');
      }
    });

    if (firstMatch && this.searchQuery) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --- Audio Synthesis via Web Audio API ---
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChime() {
    if (!this.audioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [1046.5, 1318.5].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.65);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.7);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playKnock() {
    if (!this.audioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [0, 0.16, 0.32].forEach((delay) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now + delay);
        osc.frequency.exponentialRampToValueAtTime(45, now + delay + 0.08);

        gain.gain.setValueAtTime(0.35, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    } catch (e) {
      console.warn('Knock playback error', e);
    }
  }

  showToast(message) {
    if (!this.audioToast) return;
    this.audioToast.textContent = message;
    this.audioToast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.audioToast.classList.remove('show');
    }, 2500);
  }

  // --- Rendering Floors and Doors ---
  render() {
    const { floorsCount, roomsPerFloor } = this.config;
    const currency = this.config.hotel.currency || '₹';
    const stewards = this.config.stewards && this.config.stewards.length ? this.config.stewards : DEFAULT_CONFIG.stewards;

    let totalRooms = 0;
    let totalOccupied = 0;
    let totalAvailable = 0;
    let totalCleaning = 0;
    let totalDnd = 0;
    let totalRevenue = 0;

    this.floorsWrapper.innerHTML = '';

    // Render floors in top-down architectural order
    for (let f = floorsCount; f >= 1; f--) {
      const floorIdx = f - 1;
      const numRooms = roomsPerFloor[floorIdx] || 4;
      totalRooms += numRooms;

      let floorOccupied = 0;

      const floorBlock = document.createElement('section');
      floorBlock.className = 'floor-block';
      floorBlock.setAttribute('data-floor', f);
      floorBlock.setAttribute('aria-label', `Floor ${f}`);

      // Count floor states
      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r < 10 ? '0' + r : r}`;
        const state = this.getRoomState(roomNumber, f);
        if (state.status === 'occupied') {
          floorOccupied++;
          totalOccupied++;
          totalRevenue += state.price;
        } else if (state.status === 'cleaning') {
          totalCleaning++;
        } else {
          totalAvailable++;
        }
        if (state.dnd) totalDnd++;
      }

      const floorPct = Math.round((floorOccupied / numRooms) * 100);
      const steward = stewards[(f - 1) % stewards.length];

      // Floor header row with Occupancy Progress Bar
      const headerRow = document.createElement('div');
      headerRow.className = 'floor-header-row';
      headerRow.innerHTML = `
        <div class="floor-badge-container">
          <span class="floor-badge-title">Floor ${f}</span>
          <span class="floor-badge-count">${numRooms} ${numRooms === 1 ? 'Room' : 'Rooms'}</span>
          <span class="floor-steward-pill">&#128100; ${steward}</span>
        </div>
        <div class="floor-progress-wrap">
          <span class="floor-progress-label">${floorOccupied}/${numRooms} Occupied (${floorPct}%)</span>
          <div class="floor-progress-track">
            <div class="floor-progress-fill" style="width: ${floorPct}%"></div>
          </div>
        </div>
      `;
      floorBlock.appendChild(headerRow);

      // Doors row
      const doorsRow = document.createElement('div');
      doorsRow.className = 'doors-row';

      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r < 10 ? '0' + r : r}`;
        const state = this.getRoomState(roomNumber, f);
        const roomType = state.roomType || (f === floorsCount && floorsCount > 2 ? 'Maharaja Penthouse Suite' : (r % 2 === 0 ? 'Imperial Deluxe King' : 'Royal Double Queen'));

        const doorCard = document.createElement('div');
        doorCard.className = 'door-card';
        doorCard.setAttribute('data-room', roomNumber);
        doorCard.setAttribute('tabindex', '0');
        doorCard.setAttribute('role', 'button');
        doorCard.setAttribute('aria-label', `Room ${roomNumber}, ${state.status}`);

        // Door Knob Hanger Tag HTML
        let hangerHtml = '';
        if (state.dnd) {
          hangerHtml = '<div class="door-knob-hanger"><span>DND</span></div>';
        } else if (state.status === 'cleaning') {
          hangerHtml = '<div class="door-knob-hanger service"><span>CLEAN</span></div>';
        }

        doorCard.innerHTML = `
          <div class="door-image-wrapper">
            <img src="Door.png" alt="Door for Room ${roomNumber}" class="door-img" loading="lazy">
            <div class="door-plaque-number">${roomNumber}</div>
            <div class="door-lock-led ${state.status}"></div>
            ${hangerHtml}
            <div class="door-under-light ${(state.lights || state.status === 'occupied') ? 'active' : ''}"></div>
          </div>
          <div class="door-card-footer">
            <span class="door-status-pill ${state.status}">${state.status}</span>
            <span class="door-price-pill">${currency}${state.price.toLocaleString('en-IN')}</span>
          </div>
        `;

        const handleSelectDoor = () => {
          this.openRoomModal({
            roomNumber,
            floorNumber: f,
            roomType
          });
        };

        doorCard.addEventListener('click', handleSelectDoor);
        doorCard.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectDoor();
          }
        });

        doorsRow.appendChild(doorCard);
      }

      floorBlock.appendChild(doorsRow);

      // Clean, subtle floor divider
      if (f > 1) {
        const separator = document.createElement('div');
        separator.className = 'floor-divider';
        floorBlock.appendChild(separator);
      }

      this.floorsWrapper.appendChild(floorBlock);
    }

    // Update Header Stats
    const overallOccupancyPct = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
    if (this.statFloors) this.statFloors.textContent = floorsCount;
    if (this.statRooms) this.statRooms.textContent = totalRooms;
    if (this.statOccupancy) this.statOccupancy.textContent = `${overallOccupancyPct}%`;
    if (this.statRevenue) this.statRevenue.textContent = `${currency}${totalRevenue.toLocaleString('en-IN')}`;

    // Update Filter Counter Badges
    if (this.countAll) this.countAll.textContent = totalRooms;
    if (this.countAvailable) this.countAvailable.textContent = totalAvailable;
    if (this.countOccupied) this.countOccupied.textContent = totalOccupied;
    if (this.countCleaning) this.countCleaning.textContent = totalCleaning;
    if (this.countDnd) this.countDnd.textContent = totalDnd;

    // Apply active filters or search
    this.applyFilterAndSearch();
  }

  // --- Phase 2: AI Concierge Modal & Chat Engine ---
  openConciergeModal() {
    if (!this.conciergeModal) return;
    this.conciergeModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (this.conciergeInput) this.conciergeInput.focus();
  }

  closeConciergeModal() {
    if (!this.conciergeModal) return;
    this.conciergeModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  handleConciergeSubmit(e) {
    e.preventDefault();
    if (!this.conciergeInput) return;
    const text = this.conciergeInput.value.trim();
    if (!text) return;
    this.sendConciergeMessage(text);
    this.conciergeInput.value = '';
  }

  async sendConciergeMessage(query) {
    if (!this.conciergeStream) return;

    // Append User Message Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-msg user-msg';
    userBubble.innerHTML = `
      <div class="msg-content">${this.escapeHtml(query)}</div>
    `;
    this.conciergeStream.appendChild(userBubble);

    // Append Loading Indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-msg bot-msg typing-msg';
    typingBubble.innerHTML = `
      <div class="msg-author">ATITHI Concierge</div>
      <div class="msg-content"><em>Consulting hotel knowledge base...</em></div>
    `;
    this.conciergeStream.appendChild(typingBubble);
    this.conciergeStream.scrollTop = this.conciergeStream.scrollHeight;

    try {
      const response = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      const data = await response.json();
      typingBubble.remove();

      // Append Grounded Bot Message with Pipeline Inspector
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-msg bot-msg';

      const groundedBadge = data.is_grounded
        ? '<span class="p-inspect-badge grounded">✅ Grounded in KB</span>'
        : '<span class="p-inspect-badge handoff">🛡️ Human Handoff</span>';

      const ticketBadge = data.action_ticket
        ? `<div class="p-inspect-row"><span class="p-inspect-key">Action Ticket:</span><span class="p-inspect-badge ticket">${data.action_ticket.type} (${data.action_ticket.priority})</span></div>`
        : '';

      botBubble.innerHTML = `
        <div class="msg-author">ATITHI Concierge (The Himalayan Vista)</div>
        <div class="msg-content">${this.escapeHtml(data.reply)}</div>
        <div class="pipeline-inspect-card">
          <div class="p-inspect-header">
            <span class="p-inspect-title">🔍 Step-by-Step Pipeline Trace</span>
            ${groundedBadge}
          </div>
          <div class="p-inspect-row">
            <span class="p-inspect-key">1. Intent:</span>
            <span class="p-inspect-val">${data.intent} (${Math.round(data.confidence * 100)}% match)</span>
          </div>
          <div class="p-inspect-row">
            <span class="p-inspect-key">2. Dept:</span>
            <span class="p-inspect-val">${data.department}</span>
          </div>
          <div class="p-inspect-row">
            <span class="p-inspect-key">3. KB Fact:</span>
            <span class="p-inspect-val">${data.primary_source || 'None (Refused to prevent hallucination)'}</span>
          </div>
          <div class="p-inspect-row">
            <span class="p-inspect-key">4. Intelligence:</span>
            <span class="p-inspect-val">${data.provider ? 'ATITHI Hotel Intelligence Active' : 'Verified Knowledge Active'}</span>
          </div>
          ${ticketBadge}
        </div>
      `;
      this.conciergeStream.appendChild(botBubble);
      this.playChime();
    } catch (err) {
      typingBubble.remove();
      const errorBubble = document.createElement('div');
      errorBubble.className = 'chat-msg bot-msg';
      errorBubble.innerHTML = `
        <div class="msg-author">ATITHI Concierge</div>
        <div class="msg-content">⚠️ Unable to reach hotel concierge intelligence. Please verify system connection.</div>
      `;
      this.conciergeStream.appendChild(errorBubble);
    }

    this.conciergeStream.scrollTop = this.conciergeStream.scrollHeight;
  }

  // Phase 5: Operational Tickets & Closed Loop Operations
  openTicketsModal() {
    if (!this.ticketsModal) return;
    this.ticketsModal.hidden = false;
    this.fetchTickets();
  }

  closeTicketsModal() {
    if (!this.ticketsModal) return;
    this.ticketsModal.hidden = true;
  }

  startTicketPolling() {
    this.fetchTickets();
    this.fetchIncidents();
    if (this.ticketPollInterval) clearInterval(this.ticketPollInterval);
    this.ticketPollInterval = setInterval(() => {
      this.fetchTickets();
      this.fetchIncidents();
    }, 3000);
  }

  async fetchTickets() {
    try {
      const resp = await fetch('http://127.0.0.1:8001/api/tickets');
      if (!resp.ok) return;
      const data = await resp.json();
      this.ticketsData = data.tickets || [];

      // Counts
      const total = this.ticketsData.length;
      const openCount = this.ticketsData.filter(t => t.status === 'open').length;
      const inProgressCount = this.ticketsData.filter(t => t.status === 'in_progress').length;
      const resolvedCount = this.ticketsData.filter(t => t.status === 'resolved').length;
      const closedCount = this.ticketsData.filter(t => t.status === 'closed').length;

      // Update Header Badge
      if (this.headerTicketCount) {
        this.headerTicketCount.textContent = total;
      }
      if (this.headerTicketDot) {
        this.headerTicketDot.style.background = openCount > 0 ? '#ef4444' : (inProgressCount > 0 ? '#3b82f6' : '#10b981');
      }

      // Audio chime on newly incoming tickets
      if (openCount > this.lastOpenCount) {
        this.playChime();
        this.showToast(`🚨 New Ticket Received from Room ${this.ticketsData[0]?.room_number}!`);
      }
      this.lastOpenCount = openCount;

      // Update Filter Tab counts
      const countAll = document.getElementById('tkt-count-all');
      const countOpen = document.getElementById('tkt-count-open');
      const countInprog = document.getElementById('tkt-count-inprogress');
      const countResolved = document.getElementById('tkt-count-resolved');
      const countClosed = document.getElementById('tkt-count-closed');
      if (countAll) countAll.textContent = total;
      if (countOpen) countOpen.textContent = openCount;
      if (countInprog) countInprog.textContent = inProgressCount;
      if (countResolved) countResolved.textContent = resolvedCount;
      if (countClosed) countClosed.textContent = closedCount;

      if (!this.ticketsModal.hidden) {
        this.renderTicketsList();
      }
    } catch (e) {
      console.warn('Error fetching operational tickets:', e);
    }
  }

  renderTicketsList() {
    if (!this.ticketsListStream) return;
    
    let filtered = this.ticketsData;
    if (this.activeTktFilter !== 'all') {
      filtered = this.ticketsData.filter(t => t.status === this.activeTktFilter);
    }

    if (filtered.length === 0) {
      this.ticketsListStream.innerHTML = `
        <div class="tkt-empty-state">No ${this.activeTktFilter === 'all' ? '' : this.activeTktFilter} tickets in queue.</div>
      `;
      return;
    }

    this.ticketsListStream.innerHTML = '';
    filtered.forEach(tkt => {
      const card = document.createElement('div');
      card.className = `tkt-item-card priority-${tkt.priority || 'normal'}`;

      let actionHtml = '';
      if (tkt.status === 'open') {
        actionHtml = `
          <button class="btn-tkt-action btn-tkt-ack" data-tkt="${tkt.ticket_number}">
            ⚡ Acknowledge & Assign to Lead
          </button>
        `;
      } else if (tkt.status === 'in_progress') {
        actionHtml = `
          <button class="btn-tkt-action btn-tkt-resolve" data-tkt="${tkt.ticket_number}">
            ✅ Mark Resolved & Notify Guest
          </button>
        `;
      } else if (tkt.status === 'resolved') {
        actionHtml = `
          <span class="tkt-resolved-notice">⏳ Follow-up sent to Room ${tkt.room_number}. Waiting for Guest Confirmation...</span>
        `;
      } else if (tkt.status === 'closed') {
        actionHtml = `
          <span class="tkt-closed-notice">🎉 Loop Closed & Verified by Guest</span>
        `;
      }

      card.innerHTML = `
        <div class="tkt-card-header">
          <div class="tkt-card-left">
            <span class="tkt-badge-id">#${tkt.ticket_number}</span>
            <span class="tkt-priority-pill ${tkt.priority}">${tkt.priority}</span>
            <span class="tkt-channel-badge">via ${tkt.source_channel === 'agora_voice' ? '🎙️ Agora Voice' : (tkt.source_channel === 'qr_concierge' ? '📱 In-Room QR' : (tkt.source_channel === 'mcp_voice_agent' ? '🤖 Voice Concierge' : '💬 In-Room Chat'))}</span>
            ${(tkt.notes && tkt.notes.includes('PAY_ON_PROPERTY')) || (tkt.title && tkt.title.includes('Pay on Property')) ? '<span class="tkt-pay-property-pill" style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;border:1px solid #fde68a;">🏨 Pay on Property</span>' : ''}
          </div>
          <span class="tkt-status-badge ${tkt.status}">${tkt.status}</span>
        </div>
        <div class="tkt-card-body">
          <h4 class="tkt-card-title">${this.escapeHtml(tkt.title)}</h4>
          <p class="tkt-card-desc">${this.escapeHtml(tkt.description || '')}</p>
        </div>
        <div class="tkt-card-footer">
          <div class="tkt-meta-info">
            <span>Room: <strong>${tkt.room_number}</strong> (${tkt.guest_name || 'Guest'})</span>
            <span>Dept: <strong>${tkt.department_name || 'Operations'}</strong></span>
            ${tkt.assigned_to ? `<span>Assigned: <strong>${this.escapeHtml(tkt.assigned_to)}</strong></span>` : ''}
          </div>
          <div class="tkt-action-btns">
            ${actionHtml}
          </div>
        </div>
      `;

      // Bind action clicks
      const ackBtn = card.querySelector('.btn-tkt-ack');
      if (ackBtn) {
        ackBtn.addEventListener('click', () => this.acknowledgeTicket(tkt.ticket_number));
      }
      const resolveBtn = card.querySelector('.btn-tkt-resolve');
      if (resolveBtn) {
        resolveBtn.addEventListener('click', () => this.resolveTicket(tkt.ticket_number));
      }

      this.ticketsListStream.appendChild(card);
    });
  }

  async acknowledgeTicket(ticketNumber) {
    try {
      const resp = await fetch(`http://127.0.0.1:8001/api/tickets/${ticketNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          assigned_to: 'Ramesh Chandra (Chief Engineer)',
          resolution_notes: 'Acknowledged by duty engineering lead. Inspecting unit.'
        })
      });
      if (resp.ok) {
        this.showToast(`Ticket #${ticketNumber} acknowledged & assigned.`);
        this.fetchTickets();
      }
    } catch (e) {
      console.error('Error acknowledging ticket:', e);
    }
  }

  async resolveTicket(ticketNumber) {
    try {
      const resp = await fetch(`http://127.0.0.1:8001/api/tickets/${ticketNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: 'Inspection complete. Thermostat calibrated and hot water flow verified.'
        })
      });
      if (resp.ok) {
        this.showToast(`✅ Ticket #${ticketNumber} resolved! Proactive follow-up sent to guest.`);
        this.fetchTickets();
      }
    } catch (e) {
      console.error('Error resolving ticket:', e);
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Phase 8: In-Room QR Code Stand Methods
  openQrModal() {
    if (!this.qrModal) return;
    this.qrModal.hidden = false;
    this.updateQrStandPreview();
  }

  closeQrModal() {
    if (!this.qrModal) return;
    this.qrModal.hidden = true;
  }

  updateQrStandPreview() {
    if (!this.selectQrRoom) return;
    const room = this.selectQrRoom.value || '204';
    if (this.standRoomPill) {
      this.standRoomPill.textContent = `ROOM ${room}`;
    }
    const targetUrl = `http://localhost:8085/qr.html?room=${room}`;
    if (this.qrStandImg) {
      this.qrStandImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;
    }
    if (this.btnOpenLiveQr) {
      this.btnOpenLiveQr.href = targetUrl;
    }
  }

  // =========================================================================
  // Phase 9: Operational Intelligence & Incident Pattern Detection
  // =========================================================================

  async fetchIncidents() {
    try {
      const resp = await fetch('http://127.0.0.1:8001/api/intelligence/incidents');
      if (!resp.ok) return;
      const data = await resp.json();
      const incidents = (data.incidents || []).filter(i => i.status !== 'dismissed');

      if (this.headerIncidentCount) {
        this.headerIncidentCount.textContent = incidents.length;
      }
      if (this.headerIncidentDot) {
        this.headerIncidentDot.style.display = incidents.length > 0 ? 'inline-block' : 'none';
      }

      if (incidents.length > 0) {
        this.currentIncident = incidents[0];
        this.renderIncidentBanner(this.currentIncident);
      } else {
        this.currentIncident = null;
        if (this.incidentAlertBanner) {
          this.incidentAlertBanner.style.display = 'none';
        }
      }
    } catch (e) {
      console.warn('Error fetching incident intelligence:', e);
    }
  }

  renderIncidentBanner(inc) {
    if (!this.incidentAlertBanner || !inc) return;

    if (this.bannerSubsystemTag) {
      this.bannerSubsystemTag.textContent = inc.subsystem_name || 'Central Subsystem';
    }
    if (this.bannerIncidentTitle) {
      this.bannerIncidentTitle.textContent = inc.alert_title || 'PATTERN DETECTED • Potential Shared-System Incident';
    }
    if (this.bannerIncidentMsg) {
      this.bannerIncidentMsg.textContent = `“${inc.alert_message || ''}”`;
    }
    if (this.bannerRoomsAffected && Array.isArray(inc.rooms)) {
      this.bannerRoomsAffected.innerHTML = inc.rooms.map(r => `<span class="room-pill">Room ${r}</span>`).join('');
    }
    if (this.bannerClusterTime) {
      this.bannerClusterTime.textContent = `${inc.time_window_minutes || 17} minutes`;
    }
    if (this.bannerTktCount) {
      this.bannerTktCount.textContent = (inc.rooms && inc.rooms.length) || 3;
    }

    // Status Badge & Dispatch button state
    if (this.bannerStatusBadge) {
      this.bannerStatusBadge.className = `status-badge ${inc.status}`;
      if (inc.status === 'investigating') {
        this.bannerStatusBadge.textContent = `Investigating • ${inc.engineer_assigned || 'Chief Engineer'}`;
      } else if (inc.status === 'verified_resolved') {
        this.bannerStatusBadge.textContent = 'Verified & Cleared';
      } else {
        this.bannerStatusBadge.textContent = 'Awaiting Human Verification';
      }
    }

    if (this.btnBannerDispatch) {
      if (inc.status === 'investigating') {
        this.btnBannerDispatch.innerHTML = '<span>✅</span> Engineer Dispatched';
        this.btnBannerDispatch.style.background = 'rgba(245, 158, 11, 0.2)';
        this.btnBannerDispatch.style.border = '1px solid rgba(245, 158, 11, 0.4)';
        this.btnBannerDispatch.style.color = '#fcd34d';
      } else if (inc.status === 'verified_resolved') {
        this.btnBannerDispatch.innerHTML = '<span>✅</span> System Inspected';
        this.btnBannerDispatch.style.background = 'rgba(16, 185, 129, 0.2)';
        this.btnBannerDispatch.style.border = '1px solid rgba(16, 185, 129, 0.4)';
        this.btnBannerDispatch.style.color = '#6ee7b7';
      } else {
        this.btnBannerDispatch.innerHTML = '<span>🔧</span> Dispatch Chief Engineer';
        this.btnBannerDispatch.style.background = '';
        this.btnBannerDispatch.style.border = '';
        this.btnBannerDispatch.style.color = '';
      }
    }

    this.incidentAlertBanner.style.display = 'block';
  }

  openIncidentModal() {
    if (!this.incidentModal) return;
    const inc = this.currentIncident;
    if (inc) {
      if (this.modalIncSubsystem) this.modalIncSubsystem.textContent = inc.subsystem_name;
      if (this.modalIncStatus) this.modalIncStatus.textContent = inc.status.toUpperCase();
      if (this.modalIncRooms) this.modalIncRooms.textContent = inc.rooms.map(r => 'Room ' + r).join(', ');
      if (this.modalIncWindow) this.modalIncWindow.textContent = `${inc.time_window_minutes} Minutes`;
      if (this.modalIncDept) this.modalIncDept.textContent = inc.department || 'Maintenance & Engineering';
      if (this.modalIncEngineer) this.modalIncEngineer.textContent = inc.engineer_assigned || 'Chief Engineer Rajesh Negi (Awaiting Dispatch)';
      if (this.modalIncAlertText) this.modalIncAlertText.textContent = `“${inc.alert_message}”`;
    }
    this.incidentModal.hidden = false;
  }

  closeIncidentModal() {
    if (!this.incidentModal) return;
    this.incidentModal.hidden = true;
  }

  async dispatchEngineer() {
    if (!this.currentIncident) return;
    try {
      const resp = await fetch(`http://127.0.0.1:8001/api/intelligence/incidents/${this.currentIncident.incident_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          engineer_name: 'Chief Engineer Rajesh Negi'
        })
      });
      if (resp.ok) {
        this.playChime();
        this.showToast('🔧 Chief Engineer Rajesh Negi dispatched to Basement Plant Room!');
        this.fetchIncidents();
        if (!this.incidentModal.hidden) {
          this.openIncidentModal();
        }
      }
    } catch (e) {
      console.error('Error dispatching engineer:', e);
    }
  }

  async resolveIncident() {
    if (!this.currentIncident) return;
    try {
      const resp = await fetch(`http://127.0.0.1:8001/api/intelligence/incidents/${this.currentIncident.incident_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      });
      if (resp.ok) {
        this.showToast('✅ Central Heating Loop inspected, calibrated, and cleared by Engineering!');
        this.closeIncidentModal();
        this.fetchIncidents();
      }
    } catch (e) {
      console.error('Error resolving incident:', e);
    }
  }

  async simulatePptIncident() {
    try {
      const resp = await fetch('http://127.0.0.1:8001/api/intelligence/simulate-ppt', {
        method: 'POST'
      });
      if (resp.ok) {
        this.playChime();
        this.showToast('🚨 PPT Scenario Triggered: 3 Hot Water Complaints in 17 Mins!');
        await this.fetchIncidents();
        await this.fetchTickets();
      }
    } catch (e) {
      console.error('Error simulating PPT incident:', e);
    }
  }

  // =========================================================================
  // Phase 12: Master End-to-End Presentation Demo Methods
  // =========================================================================

  openDemoGuideModal() {
    if (!this.demoGuideModal) return;
    this.demoGuideModal.hidden = false;
  }

  closeDemoGuideModal() {
    if (!this.demoGuideModal) return;
    this.demoGuideModal.hidden = true;
  }

  logDemoTerminal(msg) {
    if (!this.demoTerminal || !this.demoTermBody) return;
    this.demoTerminal.style.display = 'block';
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.demoTermBody.appendChild(line);
    this.demoTermBody.scrollTop = this.demoTermBody.scrollHeight;
  }

  async executeScenario1() {
    this.playChime();
    this.logDemoTerminal("▶️ Running Scenario 1: Inbound Room Booking Call...");
    this.logDemoTerminal("Guest asks: \"Do you have a room for 2 people this weekend?\"");
    
    try {
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Qualifying Enquiry...";
      const resp = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Do you have a room for 2 people this weekend? I would like to book it.",
          room_number: "External Caller",
          guest_name: "Amitabh Sen",
          source_channel: "agora_voice"
        })
      });
      const data = await resp.json();
      this.logDemoTerminal(`ATITHI Brain: ${data.reply}`);
      this.logDemoTerminal(`Intent Detected: ${data.intent} (Confidence: ${data.confidence})`);
      if (data.action_ticket) {
        this.logDemoTerminal(`🎉 Booking Ticket Generated: #${data.action_ticket.ticket_number} (Tag: PAY_ON_PROPERTY)`);
        this.logDemoTerminal(`Total Tariff: ₹${data.action_ticket.total_price_inr || 9600} • Attributed to Owner Revenue Funnel!`);
      }
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Scenario 1 Complete";
      this.showToast("🎉 Scenario 1 Complete: Booking captured & synced with Owner Funnel!");
      this.fetchTickets();
    } catch (e) {
      this.logDemoTerminal(`❌ Error executing Scenario 1: ${e}`);
    }
  }

  async executeScenario2() {
    this.playChime();
    this.logDemoTerminal("▶️ Running Scenario 2: Closed-Loop Operational Complaint...");
    this.logDemoTerminal("Guest (Room 204): \"Room 204 mein garam paani nahi aa raha.\"");

    try {
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Creating Complaint Ticket...";
      const resp = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Room 204 mein garam paani nahi aa raha.",
          room_number: "204",
          guest_name: "Siddharth Verma",
          source_channel: "ai_chat"
        })
      });
      const data = await resp.json();
      this.logDemoTerminal(`ATITHI Brain: ${data.reply}`);
      const tktNum = data.action_ticket?.ticket_number;
      this.logDemoTerminal(`Ticket #${tktNum} Dispatched to Engineering & Maintenance (HIGH Priority)`);
      
      // Step 2: Staff Acknowledges
      await new Promise(r => setTimeout(r, 1200));
      this.logDemoTerminal(`⚡ Staff (Ramesh Chandra) Acknowledges Ticket #${tktNum} -> Status: IN_PROGRESS`);
      await fetch(`http://127.0.0.1:8001/api/tickets/${tktNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          assigned_to: 'Ramesh Chandra (Chief Engineer)',
          resolution_notes: 'Heater valve reset and primary riser flow checked.'
        })
      });

      // Step 3: Staff Resolves
      await new Promise(r => setTimeout(r, 1200));
      this.logDemoTerminal(`✅ Staff Resolves Ticket #${tktNum} -> Status: RESOLVED`);
      await fetch(`http://127.0.0.1:8001/api/tickets/${tktNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: 'Geyser thermostat calibrated to 55C. Hot water pressure verified.'
        })
      });

      // Step 4: ATITHI Follows Up with Guest & Guest Confirms
      await new Promise(r => setTimeout(r, 1200));
      this.logDemoTerminal(`ATITHI to Guest: "Is the hot water working now?"`);
      this.logDemoTerminal(`Guest responds: "YES, IT'S FIXED!"`);
      await fetch(`http://127.0.0.1:8001/api/tickets/${tktNum}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_satisfied: true,
          guest_feedback: 'Water is hot and running perfectly now. Thank you!'
        })
      });
      this.logDemoTerminal(`🎉 TICKET #${tktNum} CLOSED! The complete loop is closed!`);
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Scenario 2 Complete";
      this.showToast("🎉 Scenario 2 Complete: Understand -> Decide -> Act -> Track -> Confirm -> CLOSED!");
      this.fetchTickets();
    } catch (e) {
      this.logDemoTerminal(`❌ Error executing Scenario 2: ${e}`);
    }
  }

  async executeScenario3() {
    this.playChime();
    this.logDemoTerminal("▶️ Running Scenario 3: Multilingual In-Room QR Concierge...");
    this.logDemoTerminal("Guest scans QR in Room 204: \"Checkout kitne baje hai?\"");

    try {
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Querying Knowledge Base...";
      const r1 = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Checkout kitne baje hai?",
          room_number: "204",
          source_channel: "qr_concierge"
        })
      });
      const d1 = await r1.json();
      this.logDemoTerminal(`ATITHI Grounded Answer: ${d1.reply}`);

      await new Promise(r => setTimeout(r, 1200));
      this.logDemoTerminal("Guest then asks: \"Mujhe taxi chahiye.\"");
      const r2 = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Mujhe taxi chahiye.",
          room_number: "204",
          source_channel: "qr_concierge"
        })
      });
      const d2 = await r2.json();
      this.logDemoTerminal(`ATITHI Response: ${d2.reply}`);
      this.logDemoTerminal(`🎉 Taxi Request Ticket Created: #${d2.action_ticket?.ticket_number} (Department: Concierge & Travel Desk)`);
      this.logDemoTerminal("Request tracked in real-time on mobile QR screen!");
      if (this.demoTermStatus) this.demoTermStatus.textContent = "Scenario 3 Complete";
      this.showToast("🎉 Scenario 3 Complete: Knowledge retrieval + Action Ticket created!");
      this.fetchTickets();
    } catch (e) {
      this.logDemoTerminal(`❌ Error executing Scenario 3: ${e}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hotelApp = new HotelApp();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openDemo') === 'true') {
    setTimeout(() => {
      window.hotelApp.openDemoGuideModal();
    }, 400);
  }
});
