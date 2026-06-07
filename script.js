// ==========================================
// D-TECH PISOTAB VENDO - MAIN SCRIPT
// ==========================================

// Mga default na apps na lalabas agad sa unang bukas
const defaultApps = [
    { name: "YouTube", package: "com.google.android.youtube", icon: "🌐" },
    { name: "Mobile Legends", package: "com.mobile.legends", icon: "🎮" },
    { name: "Roblox", package: "com.roblox.client", icon: "🕹️" }
];

// Kuhanin ang mga apps mula sa Local Storage (Permanenteng Memorya), kung wala, gamitin ang default
let installedApps = JSON.parse(localStorage.getItem('vendo_apps')) || defaultApps;

// Variables para sa Oras at Barya
let remainingTime = parseInt(localStorage.getItem('vendo_time')) || 0;
let timeInterval = null;

// ==========================================
// 1. PAG-ALIS AT PAGPAPAKITA NG LOCK SCREEN
// ==========================================
function updateScreenState() {
    const lockScreen = document.getElementById('lockScreen');
    const mainDashboard = document.getElementById('mainDashboard');

    if (remainingTime > 0) {
        // May oras: Itago ang lock screen, ipakita ang mga laro
        if (lockScreen) lockScreen.style.display = 'none';
        if (mainDashboard) mainDashboard.style.display = 'block';
        startTimer();
    } else {
        // Ubos na ang oras: Ipakita ang pulang lock screen framework
        if (lockScreen) lockScreen.style.display = 'flex';
        if (mainDashboard) mainDashboard.style.display = 'none';
        stopTimer();
    }
}

// ==========================================
// 2. TOTOONG PAGBUKAS NG APP (FULLY KIOSK)
// ==========================================
function launchApp(packageName) {
    if (remainingTime <= 0) {
        alert("Maghulog ng barya muna para makapaglaro!");
        return;
    }

    // Sinusuri kung nasa loob ng Fully Kiosk Browser app ang CP
    if (typeof fully !== 'undefined') {
        try {
            // Ito ang totoong utos na bubukas sa Android App mo
            fully.startApplication(packageName);
        } catch (error) {
            alert("Hindi mahanap ang app na ito sa cellphone. Siguraduhing naka-install ang package: " + packageName);
        }
    } else {
        // Fallback/Simulation kung tinetest mo lang sa laptop o regular Google Chrome
        alert(" [SIMULATION MODE]\nNaka-on ang oras kaya bubukas dapat ang totoong app.\nPackage Name: " + packageName);
    }
}

// ==========================================
// 3. PAGPAPALAKAD NG ORAS (TIMER)
// ==========================================
function startTimer() {
    if (timeInterval) return; // Wag doblehin ang timer kung umaandar na

    timeInterval = setInterval(() => {
        if (remainingTime > 0) {
            remainingTime--;
            localStorage.setItem('vendo_time', remainingTime);
            updateTimerDisplay();
        } else {
            clearInterval(timeInterval);
            timeInterval = null;
            updateScreenState();
        }
    }, 1000);
}

// Patayin ang timer kapag ubos na ang oras
function stopTimer() {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
}

// I-update ang text ng oras sa dashboard (MM:SS format)
function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) timerDisplay.innerText = formattedTime;
}

// ==========================================
// 4. COIN SLOT LISTENER (ANTI-SPAM & ACCUMULATION)
// ==========================================
// Ang function na ito ang tatawagin ng iyong hardware interface (Websocket/HTTP request)
// Awtomatiko nitong idinaragdag at pinatatapong ang oras kahit mag-spam ang user
function receiveCoinSignal(coinValue) {
    let minutesToAdd = 0;

    // Set up ng rates: Baguhin ang minuto depende sa gusto mong presyo
    if (coinValue === 1) {
        minutesToAdd = 5;   // 1 Piso = 5 Minuto
    } else if (coinValue === 5) {
        minutesToAdd = 25;  // 5 Piso = 25 Minuto
    } else if (coinValue === 10) {
        minutesToAdd = 60;  // 10 Piso = 60 Minuto
    }

    if (minutesToAdd > 0) {
        // MATALINONG PAGPAPATONG (Accumulation): Idagdag sa kasalukuyang natitirang oras
        remainingTime += (minutesToAdd * 60);
        
        // Permanenteng i-save agad sa memorya para iwas-kupit kahit mag-restart ang CP
        localStorage.setItem('vendo_time', remainingTime);
        
        // Agarang i-update ang screen para alam ng user na pumasok ang barya nila
        updateTimerDisplay();
        updateScreenState();
    }
}

// ==========================================
// 5. ADMIN DASHBOARD ACTIONS (CRUD)
// ==========================================
function renderAppList() {
    const appGrid = document.getElementById('appGrid');
    const adminAppList = document.getElementById('adminAppList');
    
    if (!appGrid) return;

    // Linisin ang mga lumang listahan bago i-render ang bago
    appGrid.innerHTML = '';
    if (adminAppList) adminAppList.innerHTML = '';

    installedApps.forEach((app, index) => {
        // I-render sa Main Screen (Dashboard ng Laro)
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        appCard.onclick = () => launchApp(app.package);
        appCard.innerHTML = `
            <div class="app-icon">${app.icon || '📱'}</div>
            <div class="app-name">${app.name}</div>
        `;
        appGrid.appendChild(appCard);

        // I-render sa Loob ng Admin Panel (Para sa Delete Button)
        if (adminAppList) {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-app-item';
            adminItem.style.display = 'flex';
            adminItem.style.justifyContent = 'space-between';
            adminItem.style.alignItems = 'center';
            adminItem.style.marginBottom = '10px';
            adminItem.style.padding = '5px';
            adminItem.style.borderBottom = '1px solid #eee';
            
            adminItem.innerHTML = `
                <div><strong>${app.name}</strong> (${app.package})</div>
                <button onclick="deleteApp(${index})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Burahin</button>
            `;
            adminAppList.appendChild(adminItem);
        }
    });
}

// Magdagdag ng bagong app galing sa Admin Input
function addNewApp() {
    const nameInput = document.getElementById('appNameInput');
    const packageInput = document.getElementById('appPackageInput');
    
    if (!nameInput || !packageInput || !nameInput.value || !packageInput.value) {
        alert("Paki-sulat ang App Name at Package Name!");
        return;
    }

    const newApp = {
        name: nameInput.value.trim(),
        package: packageInput.value.trim(),
        icon: "🎮" // Default icon para sa mga bagong laro
    };

    installedApps.push(newApp);
    localStorage.setItem('vendo_apps', JSON.stringify(installedApps)); // Permanenteng save sa CP
    
    nameInput.value = '';
    packageInput.value = '';
    
    renderAppList();
    alert("Matagumpay na idinagdag ang bagong app!");
}

// Burahin ang app sa listahan
function deleteApp(index) {
    if (confirm("Sigurado ka bang gusto mong burahin ang app na ito?")) {
        installedApps.splice(index, 1);
        localStorage.setItem('vendo_apps', JSON.stringify(installedApps));
        renderAppList();
    }
}

// I-reset ang buong listahan sa original na laro
function resetAppsToDefault() {
    if (confirm("Gusto mo bang ibalik sa default apps ang iyong vendo?")) {
        installedApps = [...defaultApps];
        localStorage.setItem('vendo_apps', JSON.stringify(installedApps));
        renderAppList();
    }
}

// ==========================================
// 6. MGA PIN / ACCESS CONTROLS
// ==========================================
function checkAdminPIN() {
    const pinInput = prompt("Enter Admin PIN:");
    if (pinInput === "1234") { 
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'block';
    } else if (pinInput !== null) {
        alert("Maling PIN! Subukan ulit.");
    }
}

function closeAdmin() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
}

// Mag-simulate ng hulog barya gamit ang Admin Buttons (Pang-test ng Owner)
function addSimulatedTime(minutes) {
    remainingTime += (minutes * 60);
    localStorage.setItem('vendo_time', remainingTime);
    updateTimerDisplay();
    updateScreenState();
}

// ==========================================
// 7. INITIALIZATION (PAGBUKAS NG WEBSITE)
// ==========================================
window.onload = function() {
    renderAppList();
    updateTimerDisplay();
    updateScreenState();
};
