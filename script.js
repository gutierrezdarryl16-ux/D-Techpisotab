const lockScreen = document.getElementById('lock-screen');
const gameMenu = document.getElementById('game-menu');
const statusBadge = document.getElementById('status-badge');
const hwIndicator = document.getElementById('hardware-indicator');
const adminModal = document.getElementById('admin-modal');
const timeCounter = document.getElementById('time-counter');

let isOverrideActive = null;
let secretClicks = 0;
let totalSeconds = 0; 
let countdownInterval = null;

// Anti-cheating guard: Huwag payagan ang mouse/touch long presses
document.addEventListener('contextmenu', e => e.preventDefault());

// SENSING THE HARDWARE CHARGER FEED
if ('getBattery' in navigator) {
    navigator.getBattery().then(function(battery) {
        battery.addEventListener('chargingchange', function() {
            evaluateDeviceState(battery.charging);
        });
        evaluateDeviceState(battery.charging); // Run check upon launch
    });
}

function evaluateDeviceState(chargingStatus) {
    if (isOverrideActive !== null) return;

    if (chargingStatus) {
        // CHARGER DETECTED (May barya sa Allan Timer)
        if(totalSeconds <= 0) {
            totalSeconds = 20 * 60; // Default simulated time: 20 Mins (₱5)
        }
        startVisualTimer();
        
        lockScreen.classList.add('hidden');
        gameMenu.classList.remove('hidden');
        statusBadge.innerText = "🟢 D-TECH PAID TIME ACTIVE";
        statusBadge.className = "bg-emerald-950 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-emerald-800";
        hwIndicator.innerText = "D-TECH Engine: USB Power Feed Detected (Timer: ON)";
    } else {
        // CHARGER PULLED OUT (Ubos na ang oras sa Allan Timer)
        stopVisualTimer();
        lockScreen.classList.remove('hidden');
        gameMenu.classList.add('hidden');
        statusBadge.innerText = "🔴 INSERT COIN";
        statusBadge.className = "bg-red-950 text-red-400 px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-red-800";
        hwIndicator.innerText = "D-TECH Engine: USB Power Cutoff (Timer: OFF)";
    }
}

// COIN SIMULATION LOGIC (₱5 = 20 Mins, ₱1 = 4 Mins)
function simulateCoin(amount) {
    if(amount === 5) {
        totalSeconds += 20 * 60; 
    } else if(amount === 1) {
        totalSeconds += 4 * 60;  
    }
    updateTimerDisplay();
}

function startVisualTimer() {
    clearInterval(countdownInterval);
    updateTimerDisplay();
    countdownInterval = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(countdownInterval);
            isOverrideActive = false; 
            evaluateDeviceState(false); // Force lock when digital timer ends
        }
    }, 1000);
}

function stopVisualTimer() {
    clearInterval(countdownInterval);
}

function updateTimerDisplay() {
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    timeCounter.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// DEEP LINK EXECUTION (Opens native Android games)
function launchApp(deeplink) {
    window.location.href = deeplink;
}

// OWNER PORTAL LOGIC (Tap 5 times on bottom right to unlock)
function openAdminPortal() {
    secretClicks++;
    if (secretClicks >= 5) {
        secretClicks = 0;
        let accessCode = prompt("Enter D-TECH Master Administrator PIN:");
        if (accessCode === "1234") {
            adminModal.classList.remove('hidden');
        } else {
            alert("Unauthorized access attempt blocked.");
        }
    }
}

function closeAdminPortal() { adminModal.classList.add('hidden'); }

function setAdminOverride(state) {
    isOverrideActive = state;
    closeAdminPortal();
    if (state) {
        lockScreen.classList.add('hidden');
        gameMenu.classList.remove('hidden');
        statusBadge.innerText = "🔧 D-TECH MAINTENANCE UNLOCK";
        statusBadge.className = "bg-yellow-950 text-yellow-400 px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-yellow-800";
    } else {
        lockScreen.classList.remove('hidden');
        gameMenu.classList.add('hidden');
        statusBadge.innerText = "🔧 D-TECH MAINTENANCE LOCKED";
        statusBadge.className = "bg-red-950 text-red-400 px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-red-800";
    }
}

function clearAdminOverride() {
    isOverrideActive = null;
    totalSeconds = 0;
    closeAdminPortal();
    if ('getBattery' in navigator) {
        navigator.getBattery().then(bt => evaluateDeviceState(bt.charging));
    }
}