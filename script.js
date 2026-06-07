// 1. CONFIGURATION AT DEFAULT SETTINGS
const ADMIN_PIN = "1234"; 

const defaultGames = [
    { name: "Mobile Legends", icon: "https://img.icons8.com/color/96/mobile-legends.png", package: "com.mobile.legends" },
    { name: "Roblox", icon: "https://img.icons8.com/color/96/roblox.png", package: "com.roblox.client" },
    { name: "Call of Duty", icon: "https://img.icons8.com/color/96/call-of-duty-modern-warfare-default.png", package: "com.activision.callofduty.shooter" },
    { name: "Facebook", icon: "https://img.icons8.com/color/96/facebook-new.png", package: "com.facebook.katana" },
    { name: "Google Chrome", icon: "https://img.icons8.com/color/96/chrome.png", package: "com.android.chrome" },
    { name: "Gmail", icon: "https://img.icons8.com/color/96/gmail-new.png", package: "com.google.android.gm" }
];

let gameList = JSON.parse(localStorage.getItem("vendoGames")) || defaultGames;
let isFreePlayActive = false;

// 2. RENDERING SYSTEM
function renderGames() {
    const container = document.getElementById("gamesContainer");
    if (!container) return;
    container.innerHTML = ""; 

    gameList.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";
        
        card.onclick = function() {
            launchAndroidGame(game.package, game.name);
        };

        card.innerHTML = `
            <img src="${game.icon}" alt="${game.name}">
            <h3>${game.name}</h3>
            <p>Tap to Open</p>
        `;
        container.appendChild(card);
    });
}

// 3. GAME & APP LAUNCHER
function launchAndroidGame(packageName, appName) {
    if (typeof fully !== 'undefined') {
        if (appName === "Google Chrome" || appName === "Gmail") {
            if(confirm("Gusto mo bang mag-Switch Account o mag-log-in ng bagong Google Email?")) {
                fully.loadUrl("https://accounts.google.com/AddSession");
                return;
            }
        }
        fully.startApplication(packageName);
    } else {
        alert("💻 Simulation: Opening -> " + appName);
    }
}

// 4. THE COIN SWITCH SYSTEM (DITO KUKONTROLIN ANG LOCK SCREEN MO)
function setupHardwareTimerConnection() {
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            function updateLockState() {
                const lockScreen = document.getElementById("lockScreen");

                // Kapag naka-charge (May hulog ang Allan timer) o naka FREE PLAY ang admin
                if (battery.charging || isFreePlayActive) {
                    // ITATAGO ANG LOCK SCREEN AT LALABAS ANG MGA APPS
                    lockScreen.style.display = "none";
                } else {
                    // WALANG BARYA -> EKSAGTONG LALABAS YUNG RE-DESIGNED LOCK SCREEN MO
                    lockScreen.style.display = "flex";
                }
            }
            updateLockState();
            battery.addEventListener('chargingchange', updateLockState);
        });
    }
}

// 5. ADMIN PORTAL LOGIC
function promptAdminPin() {
    const enteredPin = prompt("👤 Enter Owner Security PIN:");
    if (enteredPin === ADMIN_PIN) {
        openAdminDashboard();
    } else if (enteredPin !== null) {
        alert("❌ Incorrect Admin PIN Access!");
    }
}

function openAdminDashboard() {
    document.getElementById("adminModal").style.display = "flex";
    loadTabletAppsToDropdown();
}

function closeAdminDashboard() {
    document.getElementById("adminModal").style.display = "none";
}

function loadTabletAppsToDropdown() {
    const dropdown = document.getElementById("tabletAppDropdown");
    if (!dropdown) return;

    if (typeof fully !== 'undefined') {
        let appsJson = fully.getAppList(); 
        let apps = JSON.parse(appsJson);
        dropdown.innerHTML = '<option value="">-- Choose an Installed Game/App --</option>';
        apps.sort((a, b) => a.name.localeCompare(b.name));
        apps.forEach(app => {
            let option = document.createElement("option");
            option.value = app.packageName;
            option.text = app.name;
            dropdown.appendChild(option);
        });
    } else {
        dropdown.innerHTML = `
            <option value="">-- PC Simulation Mode --</option>
            <option value="com.tencent.ig">PUBG Mobile</option>
        `;
    }
}

function addSelectedGameFromTablet() {
    const dropdown = document.getElementById("tabletAppDropdown");
    const selectedPackage = dropdown.value;
    const selectedName = dropdown.options[dropdown.selectedIndex].text;

    if (!selectedPackage) {
        alert("❌ Pumili muna ng app sa listahan!");
        return;
    }

    let isDuplicate = gameList.some(game => game.package === selectedPackage);
    if (isDuplicate) {
        alert("⚠️ Ang app na ito ay kasalukuyan nang naka-display!");
        return;
    }

    let appIcon = "https://img.icons8.com/color/96/controller.png"; 
    if (typeof fully !== 'undefined') {
        appIcon = "data:image/png;base64," + fully.getAppIconBase64(selectedPackage);
    }

    gameList.push({ name: selectedName, icon: appIcon, package: selectedPackage });
    localStorage.setItem("vendoGames", JSON.stringify(gameList));
    renderGames();
    alert(`✅ Successfully Added: ${selectedName}`);
}

function unlockFreePlay() {
    isFreePlayActive = !isFreePlayActive;
    alert(isFreePlayActive ? "🔓 Free Play Enabled! Lalabas na ang mga apps." : "🔒 Free Play Disabled! Balik sa lock screen.");
    closeAdminDashboard();
    setupHardwareTimerConnection(); // Re-trigger checking
}

function clearSavedGames() {
    if (confirm("⚠️ Ibalik sa default apps?")) {
        localStorage.removeItem("vendoGames");
        gameList = defaultGames;
        renderGames();
        alert("✅ System reset successful!");
        closeAdminDashboard();
    }
}

window.onload = function() {
    renderGames();
    setupHardwareTimerConnection();
};
