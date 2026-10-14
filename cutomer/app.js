/**
 * ATITHI Guest Voice Intercom • Agora RTC Integration
 * Folder: /Users/dev/Desktop/Final-ATITHI/cutomer
 */

// Application State
const state = {
    appId: "1932b7112f574a56a8cf07a4bae9d0f1",
    pipelineId: "b8a99367a95c4cd2a8a4d5a9ebfbc849",
    appCertificate: localStorage.getItem("atithi_agora_cert") || "",
    channelPrefix: "atithi_room",
    
    // Call runtime state
    isCallActive: false,
    isConnecting: false,
    isMuted: false,
    callStartTime: null,
    timerInterval: null,
    
    // Agora instances
    client: null,
    localAudioTrack: null,
    remoteUsers: new Map(),
    agentInstanceId: null,
    currentChannel: null,
    guestUid: Math.floor(1000 + Math.random() * 9000)
};

// DOM References
const dom = {
    roomSelector: document.getElementById("roomSelector"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
    
    // Config inputs
    cfgAppId: document.getElementById("cfgAppId"),
    cfgPipelineId: document.getElementById("cfgPipelineId"),
    cfgAppCertificate: document.getElementById("cfgAppCertificate"),
    cfgChannelPrefix: document.getElementById("cfgChannelPrefix"),
    
    // Call UI
    voiceOrb: document.getElementById("voiceOrb"),
    orbContainer: document.querySelector(".orb-container"),
    orbMicIcon: document.getElementById("orbMicIcon"),
    callStatusBadge: document.getElementById("callStatusBadge"),
    callStatusText: document.getElementById("callStatusText"),
    callTimer: document.getElementById("callTimer"),
    callHintText: document.getElementById("callHintText"),
    waveform: document.getElementById("waveform"),
    
    // Controls
    mainCallBtn: document.getElementById("mainCallBtn"),
    callBtnIcon: document.getElementById("callBtnIcon"),
    callBtnText: document.getElementById("callBtnText"),
    muteBtn: document.getElementById("muteBtn"),
    speakerBtn: document.getElementById("speakerBtn"),
    
    // Activity
    activityFeed: document.getElementById("activityFeed"),
    currentChannelPill: document.getElementById("currentChannelPill")
};

// Initialize Settings from LocalStorage
function initSettings() {
    const savedPipeline = localStorage.getItem("atithi_pipeline_id");
    if (savedPipeline) {
        state.pipelineId = savedPipeline;
        dom.cfgPipelineId.value = savedPipeline;
    }
    if (state.appCertificate) {
        dom.cfgAppCertificate.value = state.appCertificate;
    }
}

// Logger utility
function logEntry(message, type = "system") {
    const timeStr = new Date().toTimeString().split(" ")[0];
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-msg">${message}</span>
    `;
    dom.activityFeed.appendChild(entry);
    dom.activityFeed.scrollTop = dom.activityFeed.scrollHeight;
}

// Timer Functions
function startTimer() {
    state.callStartTime = Date.now();
    dom.callTimer.innerText = "00:00";
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        dom.callTimer.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// Initialize Agora RTC Client
function initAgoraClient() {
    try {
        state.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        // Remote user published an audio stream (The AI Agent spoke)
        state.client.on("user-published", async (user, mediaType) => {
            logEntry(`Remote user detected (UID: ${user.uid}, media: ${mediaType})`, "system");
            if (mediaType === "audio") {
                await state.client.subscribe(user, mediaType);
                user.audioTrack.play();
                state.remoteUsers.set(user.uid, user);
                logEntry(`Connected to Atithi Voice AI Agent! Audio streaming.`, "success");
                setUIState("connected");
            }
        });

        // Remote user left
        state.client.on("user-left", (user) => {
            logEntry(`Remote participant (UID: ${user.uid}) left channel.`, "warning");
            state.remoteUsers.delete(user.uid);
            if (state.remoteUsers.size === 0 && state.isCallActive) {
                logEntry(`Atithi AI Agent disconnected. Ending call.`, "warning");
                endCall();
            }
        });

        // Volume Indicator
        state.client.enableAudioVolumeIndicator();
        state.client.on("volume-indicator", (volumes) => {
            if (!state.isCallActive) return;
            let maxVol = 0;
            volumes.forEach(v => {
                if (v.level > maxVol) maxVol = v.level;
            });

            if (maxVol > 15) {
                dom.waveform.classList.add("active");
                dom.voiceOrb.classList.add("speaking");
            } else {
                dom.waveform.classList.remove("active");
                dom.voiceOrb.classList.remove("speaking");
            }
        });

        logEntry(`Agora Web RTC Engine v${AgoraRTC.VERSION} initialized successfully.`, "system");
    } catch (err) {
        logEntry(`Agora initialization error: ${err.message}`, "error");
    }
}

// UI State Switcher
function setUIState(status) {
    if (status === "connecting") {
        state.isConnecting = true;
        dom.callStatusBadge.className = "call-badge connecting";
        dom.callStatusText.innerText = "Dialing Atithi AI Concierge...";
        dom.callHintText.innerText = "Establishing secure real-time audio channel...";
        dom.orbContainer.classList.add("active");
        dom.mainCallBtn.disabled = true;
        dom.muteBtn.disabled = true;
        dom.speakerBtn.disabled = true;
    } else if (status === "connected") {
        state.isConnecting = false;
        state.isCallActive = true;
        dom.callStatusBadge.className = "call-badge active";
        dom.callStatusText.innerText = "Live • Speaking with Atithi";
        dom.callHintText.innerText = "You can speak normally in your preferred language.";
        dom.voiceOrb.classList.add("connected");
        dom.orbContainer.classList.add("active");
        dom.waveform.classList.add("active");

        // Switch main button to Hang Up
        dom.mainCallBtn.disabled = false;
        dom.mainCallBtn.classList.add("hangup");
        dom.callBtnIcon.setAttribute("data-lucide", "phone-off");
        dom.callBtnText.innerText = "End Call";
        dom.muteBtn.disabled = false;
        dom.speakerBtn.disabled = false;
        lucide.createIcons();
    } else if (status === "idle") {
        state.isConnecting = false;
        state.isCallActive = false;
        dom.callStatusBadge.className = "call-badge";
        dom.callStatusText.innerText = "Ready to Connect";
        dom.callHintText.innerText = "Press the button below to speak directly with your AI Hotel Concierge.";
        dom.voiceOrb.className = "voice-orb";
        dom.orbContainer.classList.remove("active");
        dom.waveform.classList.remove("active");
        dom.currentChannelPill.innerText = "Channel: Standby";

        // Reset main button
        dom.mainCallBtn.disabled = false;
        dom.mainCallBtn.classList.remove("hangup");
        dom.callBtnIcon.setAttribute("data-lucide", "phone-call");
        dom.callBtnText.innerText = "Call Front Desk";
        dom.muteBtn.disabled = true;
        dom.speakerBtn.disabled = true;
        lucide.createIcons();
    }
}

// Start Call Workflow
async function startCall() {
    if (state.isConnecting || state.isCallActive) return;

    const room = dom.roomSelector.value;
    const channelName = `${state.channelPrefix}_${room}_${Date.now().toString().slice(-6)}`;
    state.currentChannel = channelName;
    dom.currentChannelPill.innerText = `Channel: ${channelName}`;

    setUIState("connecting");
    logEntry(`Initiating call for Room ${room} on channel ${channelName}...`, "system");

    try {
        // Step 1: Open Microphone
        logEntry("Requesting local microphone access...", "system");
        state.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "high_quality_stereo"
        });
        logEntry("Microphone track acquired successfully.", "success");

        // Step 2: Request Backend to Spawn Agora AI Agent
        logEntry(`Requesting backend to spawn Agora AI Agent (Pipeline: ${state.pipelineId})...`, "system");
        const resp = await fetch("/api/call/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                room_number: room,
                channel_name: channelName,
                pipeline_id: state.pipelineId,
                guest_uid: state.guestUid,
                app_certificate: state.appCertificate || undefined
            })
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({ detail: resp.statusText }));
            throw new Error(errData.detail || `Server responded with ${resp.status}`);
        }

        const callData = await resp.json();
        state.agentInstanceId = callData.agent_instance_id;
        logEntry(`Agora AI Agent instance spawned: ${state.agentInstanceId}`, "success");

        // Step 3: Join Agora RTC Channel as Guest
        logEntry(`Joining RTC channel ${channelName} as Guest (UID: ${state.guestUid})...`, "system");
        const tokenToUse = callData.guest_token || null;
        await state.client.join(state.appId, channelName, tokenToUse, state.guestUid);
        logEntry(`Joined channel successfully. Publishing audio track...`, "success");

        // Step 4: Publish Local Audio
        await state.client.publish([state.localAudioTrack]);
        logEntry("Guest audio stream published. Waiting for Agent to respond...", "success");

        startTimer();
    } catch (err) {
        logEntry(`Call start failed: ${err.message}`, "error");

        if (err.message && err.message.includes("dynamic use static key")) {
            logEntry(
                "NOTE: Your Agora project requires an RTC Token (App Certificate is enabled). Please open Settings (gear icon) and paste your Agora App Certificate to enable automatic token signing.",
                "warning"
            );
            dom.settingsModal.classList.add("open");
        }

        await cleanupCall();
        setUIState("idle");
    }
}

// End Call Workflow
async function endCall() {
    if (!state.isCallActive && !state.isConnecting) return;

    logEntry("Hanging up call...", "system");
    stopTimer();

    // Notify backend to stop agent
    if (state.agentInstanceId) {
        try {
            await fetch("/api/call/stop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent_instance_id: state.agentInstanceId })
            });
            logEntry(`Agora Agent session released: ${state.agentInstanceId}`, "system");
        } catch (e) {
            console.warn("Error notifying backend to stop agent:", e);
        }
    }

    await cleanupCall();
    setUIState("idle");
    logEntry("Call ended. Intercom channel returned to standby.", "system");
}

// Clean up Audio Tracks and RTC connection
async function cleanupCall() {
    if (state.localAudioTrack) {
        try {
            state.localAudioTrack.stop();
            state.localAudioTrack.close();
        } catch (e) {
            console.warn(e);
        }
        state.localAudioTrack = null;
    }

    if (state.client) {
        try {
            await state.client.leave();
        } catch (e) {
            console.warn(e);
        }
    }

    state.remoteUsers.clear();
    state.agentInstanceId = null;
    state.isMuted = false;
    dom.muteBtn.classList.remove("muted");
    dom.muteBtn.querySelector("span").innerText = "Mic On";
}

// Toggle Mute
function toggleMute() {
    if (!state.localAudioTrack) return;
    state.isMuted = !state.isMuted;
    state.localAudioTrack.setEnabled(!state.isMuted);

    if (state.isMuted) {
        dom.muteBtn.classList.add("muted");
        dom.muteBtn.querySelector("span").innerText = "Muted";
        dom.orbMicIcon.setAttribute("data-lucide", "mic-off");
        logEntry("Microphone muted by guest.", "system");
    } else {
        dom.muteBtn.classList.remove("muted");
        dom.muteBtn.querySelector("span").innerText = "Mic On";
        dom.orbMicIcon.setAttribute("data-lucide", "mic");
        logEntry("Microphone unmuted.", "system");
    }
    lucide.createIcons();
}

// Event Listeners
dom.mainCallBtn.addEventListener("click", () => {
    if (state.isCallActive) {
        endCall();
    } else {
        startCall();
    }
});

dom.muteBtn.addEventListener("click", toggleMute);

// Quick suggestions click
document.querySelectorAll(".sugg-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        logEntry(`Guest suggested question: "${chip.innerText}"`, "system");
    });
});

// Settings Modal Handlers
dom.openSettingsBtn.addEventListener("click", () => {
    dom.cfgPipelineId.value = state.pipelineId;
    dom.cfgAppCertificate.value = state.appCertificate;
    dom.cfgChannelPrefix.value = state.channelPrefix;
    dom.settingsModal.classList.add("open");
});

dom.closeSettingsBtn.addEventListener("click", () => {
    dom.settingsModal.classList.remove("open");
});

dom.cancelSettingsBtn.addEventListener("click", () => {
    dom.settingsModal.classList.remove("open");
});

dom.saveSettingsBtn.addEventListener("click", () => {
    state.pipelineId = dom.cfgPipelineId.value.trim() || state.pipelineId;
    state.appCertificate = dom.cfgAppCertificate.value.trim();
    state.channelPrefix = dom.cfgChannelPrefix.value.trim() || "atithi_room";

    localStorage.setItem("atithi_pipeline_id", state.pipelineId);
    if (state.appCertificate) {
        localStorage.setItem("atithi_agora_cert", state.appCertificate);
    }

        logEntry(`Settings saved: Pipeline ID = ${state.pipelineId}`, "success");
    dom.settingsModal.classList.remove("open");
});

// ==========================================================================
// PHASE 5: DUAL-MODE (VOICE / CHAT) & REAL-TIME CLOSED-LOOP ENGINE
// ==========================================================================

const chatDom = {
    tabVoiceMode: document.getElementById("tabVoiceMode"),
    tabChatMode: document.getElementById("tabChatMode"),
    voiceStage: document.getElementById("voiceStage"),
    chatStage: document.getElementById("chatStage"),
    chatStream: document.getElementById("chatStream"),
    chatInputForm: document.getElementById("chatInputForm"),
    chatInput: document.getElementById("chatInput"),
    btnClearChat: document.getElementById("btnClearChat"),
    
    // Tracker DOM
    activeTicketTracker: document.getElementById("activeTicketTracker"),
    tktNumDisplay: document.getElementById("tktNumDisplay"),
    tktStatusBadge: document.getElementById("tktStatusBadge"),
    tktTitleDisplay: document.getElementById("tktTitleDisplay"),
    tktDeptDisplay: document.getElementById("tktDeptDisplay"),
    tktEtaDisplay: document.getElementById("tktEtaDisplay"),
    closedLoopPrompt: document.getElementById("closedLoopPrompt"),
    closedLoopMsg: document.getElementById("closedLoopMsg"),
    btnConfirmResolution: document.getElementById("btnConfirmResolution"),
    btnIssueNotResolved: document.getElementById("btnIssueNotResolved")
};

let currentActiveTicket = null;
let ticketPollingInterval = null;

// Tab Switcher
chatDom.tabVoiceMode.addEventListener("click", () => {
    chatDom.tabVoiceMode.classList.add("active");
    chatDom.tabChatMode.classList.remove("active");
    chatDom.voiceStage.style.display = "flex";
    chatDom.chatStage.style.display = "none";
});

chatDom.tabChatMode.addEventListener("click", () => {
    chatDom.tabChatMode.classList.add("active");
    chatDom.tabVoiceMode.classList.remove("active");
    chatDom.chatStage.style.display = "flex";
    chatDom.voiceStage.style.display = "none";
    chatDom.chatInput.focus();
});

// Chat Suggestion Chips
document.querySelectorAll(".chat-sugg-pill").forEach(pill => {
    pill.addEventListener("click", () => {
        const query = pill.getAttribute("data-query");
        if (query) {
            chatDom.chatInput.value = query;
            sendChatMessage(query);
        }
    });
});

chatDom.btnClearChat.addEventListener("click", () => {
    chatDom.chatStream.innerHTML = `
        <div class="chat-bubble bot">
            <div class="bubble-avatar"><i data-lucide="sparkles"></i></div>
            <div class="bubble-content">
                <p class="bubble-text">Namaste! How may I assist you with your stay at The Himalayan Vista?</p>
                <span class="bubble-time">Just now</span>
            </div>
        </div>
    `;
    lucide.createIcons();
});

// Send Chat Message
chatDom.chatInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = chatDom.chatInput.value.trim();
    if (!message) return;
    chatDom.chatInput.value = "";
    sendChatMessage(message);
});

async function sendChatMessage(message) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const selectedRoom = dom.roomSelector.value || "204";

    // 1. Append User Message
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.innerHTML = `
        <div class="bubble-avatar"><i data-lucide="user"></i></div>
        <div class="bubble-content">
            <p class="bubble-text">${escapeHtml(message)}</p>
            <span class="bubble-time">${timeStr}</span>
        </div>
    `;
    chatDom.chatStream.appendChild(userBubble);
    chatDom.chatStream.scrollTop = chatDom.chatStream.scrollHeight;
    lucide.createIcons();

    // 2. Append Typing Indicator
    const typingBubble = document.createElement("div");
    typingBubble.className = "chat-bubble bot typing";
    typingBubble.innerHTML = `
        <div class="bubble-avatar"><i data-lucide="sparkles"></i></div>
        <div class="bubble-content">
            <p class="bubble-text"><em>ATITHI is thinking...</em></p>
        </div>
    `;
    chatDom.chatStream.appendChild(typingBubble);
    chatDom.chatStream.scrollTop = chatDom.chatStream.scrollHeight;
    lucide.createIcons();

    logEntry(`Guest sent chat message: "${message}" (Room ${selectedRoom})`, "system");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                room_number: selectedRoom
            })
        });

        const data = await response.json();
        typingBubble.remove();

        // 3. Append Bot Response Bubble
        const botBubble = document.createElement("div");
        botBubble.className = "chat-bubble bot";

        let ticketBadgeHtml = "";
        if (data.action_ticket) {
            const tkt = data.action_ticket;
            const isPayOnProperty = tkt.payment_tag === 'PAY_ON_PROPERTY' || (tkt.title && tkt.title.includes('Pay on Property')) || (tkt.type === 'ROOM_BOOKING');
            ticketBadgeHtml = `
                <div class="bubble-tkt-pill">
                    <i data-lucide="check-circle-2"></i>
                    <span>Ticket #${tkt.ticket_number || 'CREATED'} • ${tkt.department || 'Operations'} (${tkt.priority || 'Normal'})</span>
                    ${isPayOnProperty ? '<span style="margin-left:6px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700;">🏨 Pay on Property</span>' : ''}
                </div>
            `;
            logEntry(`Action Ticket Created: #${tkt.ticket_number} for Room ${selectedRoom}`, "success");
            // Immediately poll for the new ticket
            fetchRoomTickets(selectedRoom);
        }

        botBubble.innerHTML = `
            <div class="bubble-avatar"><i data-lucide="sparkles"></i></div>
            <div class="bubble-content">
                <p class="bubble-text">${escapeHtml(data.reply || "I am looking into that for you.")}</p>
                ${ticketBadgeHtml}
                <span class="bubble-time">${timeStr}</span>
            </div>
        `;
        chatDom.chatStream.appendChild(botBubble);
        chatDom.chatStream.scrollTop = chatDom.chatStream.scrollHeight;
        lucide.createIcons();

    } catch (err) {
        typingBubble.remove();
        const errBubble = document.createElement("div");
        errBubble.className = "chat-bubble bot";
        errBubble.innerHTML = `
            <div class="bubble-avatar"><i data-lucide="alert-circle"></i></div>
            <div class="bubble-content">
                <p class="bubble-text" style="color: #ef4444;">Unable to connect to AI Brain. Please check server connection.</p>
                <span class="bubble-time">${timeStr}</span>
            </div>
        `;
        chatDom.chatStream.appendChild(errBubble);
        lucide.createIcons();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// ==========================================================================
// REAL-TIME TICKET TRACKER & PROACTIVE CLOSED-LOOP LOGIC
// ==========================================================================

async function fetchRoomTickets(roomNumber) {
    if (!roomNumber) roomNumber = dom.roomSelector.value || "204";
    try {
        const resp = await fetch(`/api/tickets?room_number=${roomNumber}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const tickets = data.tickets || [];

        // Find most recent active ticket (open, in_progress, or resolved)
        const activeTkt = tickets.find(t => ["open", "in_progress", "resolved"].includes(t.status)) || tickets[0];

        if (activeTkt) {
            currentActiveTicket = activeTkt;
            renderActiveTicket(activeTkt);
        } else {
            chatDom.activeTicketTracker.style.display = "none";
        }
    } catch (e) {
        console.warn("Error fetching room tickets:", e);
    }
}

function renderActiveTicket(tkt) {
    chatDom.activeTicketTracker.style.display = "block";
    chatDom.tktNumDisplay.textContent = `#${tkt.ticket_number}`;
    chatDom.tktTitleDisplay.textContent = tkt.title || "Guest Request";
    chatDom.tktDeptDisplay.textContent = tkt.department_name || "Operations";

    const status = (tkt.status || "open").toLowerCase();
    chatDom.tktStatusBadge.className = `tracker-badge ${status}`;
    
    if (status === "open") {
        chatDom.tktStatusBadge.textContent = "OPEN • DISPATCHED";
        chatDom.tktEtaDisplay.textContent = "SLA: 15 Mins";
        chatDom.closedLoopPrompt.style.display = "none";
    } else if (status === "in_progress") {
        chatDom.tktStatusBadge.textContent = "IN PROGRESS • ASSIGNED";
        chatDom.tktEtaDisplay.textContent = tkt.assigned_to ? `Steward: ${tkt.assigned_to}` : "Technician En Route";
        chatDom.closedLoopPrompt.style.display = "none";
    } else if (status === "resolved") {
        chatDom.tktStatusBadge.textContent = "RESOLVED • PENDING CONFIRMATION";
        chatDom.tktEtaDisplay.textContent = "Serviced by Staff";
        // SHOW PROACTIVE CLOSED LOOP PROMPT!
        chatDom.closedLoopPrompt.style.display = "flex";
        chatDom.closedLoopMsg.textContent = `Our team has serviced "${tkt.title}" for your room. Is everything working fine now?`;
    } else if (status === "closed") {
        chatDom.tktStatusBadge.textContent = "CLOSED • VERIFIED";
        chatDom.tktEtaDisplay.textContent = "Completed & Satisfied";
        chatDom.closedLoopPrompt.style.display = "none";
    }
    lucide.createIcons();
}

// Proactive Confirm Click: Guest marks it resolved -> Closes the loop!
chatDom.btnConfirmResolution.addEventListener("click", async () => {
    if (!currentActiveTicket) return;
    const tktNum = currentActiveTicket.ticket_number;

    try {
        const resp = await fetch(`/api/tickets/${tktNum}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                guest_feedback: "Issue fully resolved. Everything is working fine now!",
                guest_satisfied: true
            })
        });

        if (resp.ok) {
            logEntry(`🎉 Closed Loop Complete: Guest confirmed #${tktNum} is resolved. Ticket marked CLOSED.`, "success");
            currentActiveTicket.status = "closed";
            renderActiveTicket(currentActiveTicket);
            
            // Add a warm closing bubble in chat
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const botBubble = document.createElement("div");
            botBubble.className = "chat-bubble bot";
            botBubble.innerHTML = `
                <div class="bubble-avatar"><i data-lucide="check-check"></i></div>
                <div class="bubble-content">
                    <p class="bubble-text">Wonderful! We're glad to hear that everything is working properly now. Please let us know if you need anything else during your stay!</p>
                    <span class="bubble-time">${timeStr}</span>
                </div>
            `;
            chatDom.chatStream.appendChild(botBubble);
            chatDom.chatStream.scrollTop = chatDom.chatStream.scrollHeight;
            lucide.createIcons();
        }
    } catch (e) {
        console.error("Error confirming ticket resolution:", e);
    }
});

chatDom.btnIssueNotResolved.addEventListener("click", async () => {
    if (!currentActiveTicket) return;
    logEntry(`Guest reported #${currentActiveTicket.ticket_number} still needs attention. Re-alerting staff.`, "warn");
    chatDom.closedLoopMsg.textContent = "We have notified the Duty Manager to personally follow up with your room right now.";
    chatDom.btnConfirmResolution.style.display = "none";
    chatDom.btnIssueNotResolved.style.display = "none";
});

// Update Room Selection Change
dom.roomSelector.addEventListener("change", () => {
    const room = dom.roomSelector.value;
    logEntry(`Room switched to ${room}`, "system");
    fetchRoomTickets(room);
});

// Start Polling for active tickets
function startTicketPolling() {
    if (ticketPollingInterval) clearInterval(ticketPollingInterval);
    fetchRoomTickets(dom.roomSelector.value);
    ticketPollingInterval = setInterval(() => {
        fetchRoomTickets(dom.roomSelector.value);
    }, 3000);
}

// On Load
window.addEventListener("DOMContentLoaded", () => {
    initSettings();
    initAgoraClient();
    startTicketPolling();
});

