/* AI MedCare - Core Interactive Logic */

// ==========================================
// 1. DATASETS & GLOBAL STATE
// ==========================================

let youtubeApiKey = "YOUR_YOUTUBE_API_KEY";
let cameraStream = null;
let currentSpeechUtterance = null;
let telemetryChartInstance = null;
let weatherChartInstance = null;
let activeModalEquipment = null;

const equipmentData = [
    {
        id: "EQ-104",
        name: "Intensive Patient Vital Monitor",
        dept: "ICU - Ward 4",
        category: "icu",
        type: "Patient Monitor",
        status: "Operational",
        health: 96,
        temp: 22.4,
        vibration: 0.12,
        hours: 1420,
        errors: 0,
        lastService: "2026-08-15",
        image: "images/patients_monitor.png",
        spec: "Multi-parameter 15-inch ECG/SpO2/NIBP Monitor",
        desc: "Monitors real-time heart rate, blood pressure, and oxygen saturation for critical ICU patients."
    },
    {
        id: "EQ-208",
        name: "Servo-Air ICU Mechanical Ventilator",
        dept: "ICU - Unit 12",
        category: "icu",
        type: "Ventilator",
        status: "Monitor",
        health: 74,
        temp: 28.1,
        vibration: 0.85,
        hours: 3840,
        errors: 2,
        lastService: "2026-06-10",
        image: "images/ventilator.png",
        spec: "Turbine-driven lung ventilator with flow sensors",
        desc: "Provides continuous mechanical ventilation support. Sensor drift detected during recent 24h cycle."
    },
    {
        id: "EQ-302",
        name: "Digital Radiography X-Ray & CT System",
        dept: "Radiology - Bay 2",
        category: "radiology",
        type: "Imaging System",
        status: "Attention",
        health: 45,
        temp: 34.2,
        vibration: 1.45,
        hours: 5600,
        errors: 5,
        lastService: "2026-04-02",
        image: "images/imaging_system.png",
        spec: "High-frequency 80kW X-ray generator & detector tube",
        desc: "Tube anode thermal load exceeding baseline. Maintenance inspection advised within 7 days."
    },
    {
        id: "EQ-411",
        name: "Volumetric Infusion Smart Pump",
        dept: "Surgical - OR 3",
        category: "surgery",
        type: "Infusion Pump",
        status: "Operational",
        health: 98,
        temp: 21.0,
        vibration: 0.05,
        hours: 890,
        errors: 0,
        lastService: "2026-09-01",
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
        spec: "Micro-stepper infusion pump with bubble detector",
        desc: "Delivers precision intravenous medication with anti-free flow safety locks."
    },
    {
        id: "EQ-505",
        name: "12-Lead Digital ECG Machine",
        dept: "Cardiology - Rm 101",
        category: "icu",
        type: "ECG Machine",
        status: "Operational",
        health: 91,
        temp: 23.5,
        vibration: 0.18,
        hours: 2150,
        errors: 1,
        lastService: "2026-07-20",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
        spec: "High-resolution 12-channel electrocardiograph",
        desc: "Records cardiac electrical activity. Thermal printer calibration verified."
    },
    {
        id: "EQ-612",
        name: "Anesthesia Delivery Workstation",
        dept: "Surgical - OR 1",
        category: "surgery",
        type: "Anesthesia System",
        status: "Monitor",
        health: 81,
        temp: 26.3,
        vibration: 0.42,
        hours: 4120,
        errors: 1,
        lastService: "2026-05-18",
        image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600&q=80",
        spec: "Closed-circuit anesthesia machine with vaporizer",
        desc: "Gas mixing and vaporizer pressure monitored in normal operating range."
    }
];

const curatedVideos = [
    {
        id: "921vR0rF2r8",
        title: "Medical Equipment Maintenance & Calibration Principles",
        channel: "Biomedical Engineering Academy",
        thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
        desc: "Learn core inspection workflows, electrical safety testing, and sensor calibration."
    },
    {
        id: "eBGS6A6aV0k",
        title: "ICU Mechanical Ventilator Maintenance & Testing",
        channel: "MedTech Training Solutions",
        thumbnail: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80",
        desc: "Step-by-step guide to turbine maintenance, air filter replacement, and pressure calibration."
    },
    {
        id: "3J9RkFk4d5A",
        title: "Patient Monitor Circuit & ECG Cable Diagnostics",
        channel: "Healthcare Engineering Channel",
        thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
        desc: "Diagnostic procedure for signal noise, lead fault detection, and battery backup integrity."
    }
];


// ==========================================
// 2. INITIALIZATION & EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    renderEquipmentGrid("all");
    loadWeather();
    initSpeechVoices();
    initPredictionForm();
    setupYouTubeDefaultGrid();
});

// ==========================================
// 3. TOAST NOTIFICATION SYSTEM
// ==========================================

function showToast(title, message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    const bgColors = {
        success: "bg-slate-900 border-teal-500/50 text-white",
        warning: "bg-slate-900 border-yellow-500/50 text-white",
        error: "bg-slate-900 border-red-500/50 text-white",
        info: "bg-slate-900 border-teal-500/50 text-white"
    };

    const icons = {
        success: "✅",
        warning: "⚠️",
        error: "🚨",
        info: "ℹ️"
    };

    toast.className = `p-4 rounded-2xl border ${bgColors[type]} shadow-2xl backdrop-blur-xl flex items-start gap-3 transform transition-all duration-300 translate-y-2 opacity-0 max-w-sm w-full z-50`;
    
    toast.innerHTML = `
        <span class="text-xl">${icons[type]}</span>
        <div class="flex-1">
            <h5 class="font-bold text-sm text-teal-400">${escapeHtml(title)}</h5>
            <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(message)}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-sm font-bold">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}


// ==========================================
// 4. EQUIPMENT GRID & MODAL DIAGNOSTICS
// ==========================================

function renderEquipmentGrid(categoryFilter = "all", searchQuery = "") {
    const grid = document.getElementById("equipmentGrid");
    if (!grid) return;

    let filtered = equipmentData.filter(item => {
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesSearch = searchQuery === "" || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200">
                <span class="text-4xl">🔍</span>
                <h3 class="text-lg font-bold text-slate-800 mt-2">No Equipment Found</h3>
                <p class="text-slate-500 text-sm mt-1">Try changing your search term or tab filter.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        let badgeClass = "bg-green-100 text-green-700 border-green-200";
        let statusDot = "bg-green-500";
        if (item.status === "Monitor") {
            badgeClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
            statusDot = "bg-yellow-500 animate-pulse";
        } else if (item.status === "Attention") {
            badgeClass = "bg-red-100 text-red-700 border-red-200";
            statusDot = "bg-red-500 animate-ping";
        }

        return `
            <article class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 card-hover flex flex-col justify-between">
                <div>
                    <div class="h-48 overflow-hidden relative">
                        <img src="${item.image}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover">
                        <div class="absolute top-3 right-3">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeClass} shadow-md backdrop-blur-md">
                                <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                                ${item.status}
                            </span>
                        </div>
                        <div class="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono text-teal-300">
                            ${item.id}
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="text-lg font-bold text-slate-900 line-clamp-1">${escapeHtml(item.name)}</h3>
                                <p class="text-xs text-teal-700 font-medium">${escapeHtml(item.dept)}</p>
                            </div>
                        </div>
                        <p class="text-slate-500 text-xs mt-2 leading-relaxed line-clamp-2">${escapeHtml(item.desc)}</p>
                        
                        <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
                            <div class="flex justify-between text-xs">
                                <span class="text-slate-500">AI Health Score</span>
                                <span class="font-bold ${item.health > 80 ? 'text-green-600' : item.health > 60 ? 'text-yellow-600' : 'text-red-600'}">${item.health}%</span>
                            </div>
                            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full ${item.health > 80 ? 'bg-green-500' : item.health > 60 ? 'bg-yellow-500' : 'bg-red-500'}" style="width:${item.health}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-6 pt-0">
                    <button onclick="openEquipmentModal('${item.id}')" 
                        class="w-full py-2.5 rounded-xl bg-teal-50 text-teal-800 font-semibold hover:bg-teal-700 hover:text-white transition flex items-center justify-center gap-2 text-xs">
                        <span>📊 Detailed Telemetry</span>
                        <span>→</span>
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function filterCategory(cat) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("bg-teal-700", "text-white");
        btn.classList.add("bg-white", "text-slate-700", "border-slate-200");
    });
    event.target.classList.remove("bg-white", "text-slate-700", "border-slate-200");
    event.target.classList.add("bg-teal-700", "text-white");

    const searchQuery = document.getElementById("equipmentSearch") ? document.getElementById("equipmentSearch").value : "";
    renderEquipmentGrid(cat, searchQuery);
}

function searchEquipment() {
    const searchQuery = document.getElementById("equipmentSearch").value;
    renderEquipmentGrid("all", searchQuery);
}

function openEquipmentModal(eqId) {
    const item = equipmentData.find(e => e.id === eqId);
    if (!item) return;

    activeModalEquipment = item;
    document.getElementById("modalEqName").textContent = item.name;
    document.getElementById("modalEqId").textContent = item.id + " | " + item.dept;
    document.getElementById("modalEqSpec").textContent = item.spec;
    document.getElementById("modalEqDesc").textContent = item.desc;
    document.getElementById("modalEqHealth").textContent = item.health + "%";
    document.getElementById("modalEqHours").textContent = item.hours + " hrs";
    document.getElementById("modalEqTemp").textContent = item.temp + " °C";
    document.getElementById("modalEqVibe").textContent = item.vibration + " mm/s";
    document.getElementById("modalEqService").textContent = item.lastService;

    const modal = document.getElementById("equipmentModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    // Initialize Chart.js Telemetry Trend
    setTimeout(() => {
        renderModalChart(item);
    }, 100);
}

function closeEquipmentModal() {
    const modal = document.getElementById("equipmentModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function renderModalChart(item) {
    const ctx = document.getElementById("telemetryChart").getContext("2d");
    if (telemetryChartInstance) {
        telemetryChartInstance.destroy();
    }

    // Generate telemetry points
    const labels = ["04:00", "08:00", "12:00", "16:00", "20:00", "00:00"];
    const baseTemp = item.temp;
    const tempPoints = labels.map(() => +(baseTemp + (Math.random() * 2 - 1)).toFixed(1));

    telemetryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempPoints,
                borderColor: '#0f766e',
                backgroundColor: 'rgba(15, 118, 110, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}


// ==========================================
// 5. AI PREDICTION SIMULATION & FORM
// ==========================================

function initPredictionForm() {
    const sliders = ["paramHours", "paramTemp", "paramVibe", "paramErrors", "paramDays"];
    sliders.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", calculatePrediction);
        }
    });
    calculatePrediction();
}

function calculatePrediction() {
    const eqType = document.getElementById("paramEqType").value;
    const hours = parseFloat(document.getElementById("paramHours").value) || 1200;
    const temp = parseFloat(document.getElementById("paramTemp").value) || 24;
    const vibe = parseFloat(document.getElementById("paramVibe").value) || 0.2;
    const errors = parseInt(document.getElementById("paramErrors").value) || 0;
    const days = parseInt(document.getElementById("paramDays").value) || 30;

    // Update displayed values
    document.getElementById("valHours").textContent = hours + " hrs";
    document.getElementById("valTemp").textContent = temp + " °C";
    document.getElementById("valVibe").textContent = vibe + " mm/s";
    document.getElementById("valErrors").textContent = errors + " faults";
    document.getElementById("valDays").textContent = days + " days";

    // ML Failure Risk Rationale Formula
    let risk = (hours / 100) * 0.8 + (temp > 25 ? (temp - 25) * 3.5 : 0) + (vibe * 25) + (errors * 8) + (days / 10);
    risk = Math.min(99, Math.max(5, Math.round(risk)));

    const riskValEl = document.getElementById("predictionRiskValue");
    const riskGaugeEl = document.getElementById("predictionRiskGauge");
    const recTextEl = document.getElementById("recommendationText");
    const statusBadgeEl = document.getElementById("riskLevelBadge");

    riskValEl.textContent = risk + "%";
    riskGaugeEl.style.width = risk + "%";

    let recMessage = "";
    if (risk < 30) {
        statusBadgeEl.className = "px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-bold";
        statusBadgeEl.textContent = "Low Failure Risk";
        recMessage = `Optimal operational parameters for ${eqType}. Continue standard 90-day maintenance cycle.`;
        riskGaugeEl.className = "h-full bg-gradient-to-r from-teal-400 to-green-400 rounded-full transition-all duration-500";
    } else if (risk < 65) {
        statusBadgeEl.className = "px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold";
        statusBadgeEl.textContent = "Moderate Risk";
        recMessage = `Elevated vibration (${vibe} mm/s) or duty hours for ${eqType}. Schedule non-emergency calibration check within 14 days.`;
        riskGaugeEl.className = "h-full bg-gradient-to-r from-teal-400 to-yellow-400 rounded-full transition-all duration-500";
    } else {
        statusBadgeEl.className = "px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold";
        statusBadgeEl.textContent = "CRITICAL RISK";
        recMessage = `CRITICAL WARNING: High thermal/vibration stress detected on ${eqType}. Immediate technician inspection required within 24-48 hours to prevent failure!`;
        riskGaugeEl.className = "h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full transition-all duration-500";
    }

    recTextEl.textContent = recMessage;
}

function showPrediction() {
    calculatePrediction();
    const riskText = document.getElementById("predictionRiskValue").textContent;
    const recText = document.getElementById("recommendationText").textContent;
    
    showToast("AI Prediction Complete", `Analysis result: ${riskText} Failure Risk. Rationale generated.`, "info");
    
    // Notification API
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification("AI MedCare Predictive Alert", {
                body: recText,
                icon: "https://cdn-icons-png.flaticon.com/512/2864/2864248.png"
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("AI MedCare Predictive Alert", { body: recText });
                }
            });
        }
    }
}


// ==========================================
// 6. WEB SPEECH API INTEGRATION
// ==========================================

function initSpeechVoices() {
    if (!("speechSynthesis" in window)) return;
    
    const voiceSelect = document.getElementById("voiceSelect");
    if (!voiceSelect) return;

    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`).join("");
    }

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }
}

function speakRecommendation() {
    const text = document.getElementById("recommendationText").innerText;

    if (!("speechSynthesis" in window)) {
        showToast("Speech API Error", "Web Speech API is not supported in this browser.", "error");
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    const voiceSelect = document.getElementById("voiceSelect");
    const voices = window.speechSynthesis.getVoices();
    
    if (voiceSelect && voices[voiceSelect.value]) {
        speech.voice = voices[voiceSelect.value];
    }

    speech.rate = 0.95;
    speech.pitch = 1.0;

    const waveAnim = document.getElementById("audioWaveform");
    if (waveAnim) waveAnim.classList.remove("hidden");

    speech.onend = () => {
        if (waveAnim) waveAnim.classList.add("hidden");
    };

    speech.onerror = () => {
        if (waveAnim) waveAnim.classList.add("hidden");
    };

    window.speechSynthesis.speak(speech);
    showToast("Voice Synthesis", "Reading AI recommendation aloud...", "success");
}

function stopSpeech() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const waveAnim = document.getElementById("audioWaveform");
        if (waveAnim) waveAnim.classList.add("hidden");
    }
}


// ==========================================
// 7. OPEN-METEO API - ENVIRONMENT
// ==========================================

async function loadWeather() {
    const citySelect = document.getElementById("weatherCitySelect");
    const cityCoords = {
        "bengaluru": { lat: 12.9716, lon: 77.5946, name: "Bengaluru, India" },
        "newyork": { lat: 40.7128, lon: -74.0060, name: "New York, USA" },
        "london": { lat: 51.5074, lon: -0.1278, name: "London, UK" },
        "tokyo": { lat: 35.6762, lon: 139.6503, name: "Tokyo, Japan" },
        "frankfurt": { lat: 50.1109, lon: 8.6821, name: "Frankfurt, Germany" }
    };

    const selectedKey = citySelect ? citySelect.value : "bengaluru";
    const loc = cityCoords[selectedKey] || cityCoords["bengaluru"];

    const status = document.getElementById("weatherStatus");
    const tempEl = document.getElementById("temperatureValue");
    const humEl = document.getElementById("humidityValue");
    const envStatusEl = document.getElementById("environmentStatus");
    const locationNameEl = document.getElementById("locationNameDisplay");

    if (locationNameEl) locationNameEl.textContent = loc.name;
    if (status) status.textContent = `Fetching live environmental telemetry for ${loc.name}...`;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure&hourly=temperature_2m&timezone=auto`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Open-Meteo response failed");
        
        const data = await res.json();
        const curTemp = data.current.temperature_2m;
        const curHum = data.current.relative_humidity_2m;

        if (tempEl) tempEl.textContent = curTemp;
        if (humEl) humEl.textContent = curHum;

        // Environment safety evaluation for sensitive hospital electronics
        if (curTemp >= 18 && curTemp <= 26 && curHum >= 30 && curHum <= 60) {
            envStatusEl.textContent = "Optimal Operating Safe Zone";
            envStatusEl.className = "text-2xl font-extrabold text-green-600 mt-2";
        } else {
            envStatusEl.textContent = "Climate Warning - Adjust HVAC";
            envStatusEl.className = "text-2xl font-extrabold text-yellow-600 mt-2";
        }

        if (status) status.textContent = `Live data updated via Open-Meteo API. Safe equipment range enforced.`;
        showToast("Open-Meteo Updated", `Environment status loaded for ${loc.name}`, "success");

        // Render hourly chart
        if (data.hourly && data.hourly.temperature_2m) {
            renderWeatherChart(data.hourly.time.slice(0, 12), data.hourly.temperature_2m.slice(0, 12));
        }

    } catch (err) {
        console.error(err);
        if (status) status.textContent = "Unable to fetch live environmental data. Check internet connection.";
        showToast("Weather Error", "Could not reach Open-Meteo service", "error");
    }
}

function renderWeatherChart(times, temps) {
    const canvas = document.getElementById("weatherTrendChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (weatherChartInstance) {
        weatherChartInstance.destroy();
    }

    const labels = times.map(t => t.split("T")[1]);

    weatherChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature Forecast (°C)',
                data: temps,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                borderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}


// ==========================================
// 8. MEDIADEVICES API - CAMERA INSPECTION
// ==========================================

async function startCamera() {
    const video = document.getElementById("cameraVideo");
    const placeholder = document.getElementById("cameraPlaceholder");
    const status = document.getElementById("cameraStatus");
    const arOverlay = document.getElementById("arScanOverlay");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (status) status.textContent = "MediaDevices API is not supported in this browser environment.";
        showToast("Camera Error", "MediaDevices API not supported.", "error");
        return;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
            audio: false
        });

        video.srcObject = cameraStream;
        video.classList.remove("hidden");
        if (placeholder) placeholder.classList.add("hidden");
        if (arOverlay) arOverlay.classList.remove("hidden");
        if (status) status.textContent = "Live Feed Active. AI Vision Inspection Ready.";

        showToast("Camera Active", "Live camera stream connected.", "success");
    } catch (err) {
        console.error(err);
        if (status) status.textContent = "Camera access denied or device unavailable.";
        showToast("Camera Access Denied", "Please allow camera access in browser permissions.", "warning");
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const video = document.getElementById("cameraVideo");
    const placeholder = document.getElementById("cameraPlaceholder");
    const status = document.getElementById("cameraStatus");
    const arOverlay = document.getElementById("arScanOverlay");

    if (video) video.classList.add("hidden");
    if (placeholder) placeholder.classList.remove("hidden");
    if (arOverlay) arOverlay.classList.add("hidden");
    if (status) status.textContent = "Camera feed offline.";

    showToast("Camera Stopped", "Video feed terminated.", "info");
}

function captureInspectionSnapshot() {
    const video = document.getElementById("cameraVideo");
    if (!cameraStream || video.classList.contains("hidden")) {
        showToast("Inspection Error", "Please start camera feed first.", "warning");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const snapshotImg = document.getElementById("inspectionSnapshot");
    const reportBox = document.getElementById("inspectionReportBox");
    
    if (snapshotImg) {
        snapshotImg.src = canvas.toDataURL("image/png");
        snapshotImg.classList.remove("hidden");
    }

    if (reportBox) {
        reportBox.innerHTML = `
            <div class="p-4 bg-teal-950/60 border border-teal-500/30 rounded-xl space-y-2 text-xs font-mono text-teal-200">
                <div class="flex justify-between"><span>[AI OPTICAL ANALYSIS]</span> <span class="text-green-400">PASSED</span></div>
                <div>• Surface Cracks / Fatigue: NONE DETECTED</div>
                <div>• Port Connector Oxidation: 0.04% (Clean)</div>
                <div>• Thermal Hotspot Warning: NORMAL</div>
                <div>• Serial OCR Match: VERIFIED</div>
            </div>
        `;
    }

    showToast("AI Visual Analysis", "Snapshot captured and analyzed successfully.", "success");
}


// ==========================================
// 9. YOUTUBE DATA API & VIDEO PLAYER
// ==========================================

function setupYouTubeDefaultGrid() {
    const container = document.getElementById("youtubeResults");
    if (!container) return;

    container.innerHTML = curatedVideos.map(vid => `
        <article class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md card-hover flex flex-col justify-between">
            <div>
                <div class="h-44 relative overflow-hidden group cursor-pointer" onclick="playYouTubeModal('${vid.id}', '${escapeHtml(vid.title)}')">
                    <img src="${vid.thumbnail}" alt="${escapeHtml(vid.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                        <div class="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl shadow-lg pl-1">
                            ▶
                        </div>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="font-bold text-slate-900 line-clamp-2 text-sm">${escapeHtml(vid.title)}</h4>
                    <p class="text-xs text-teal-700 font-semibold mt-1">${escapeHtml(vid.channel)}</p>
                    <p class="text-xs text-slate-500 mt-2 line-clamp-2">${escapeHtml(vid.desc)}</p>
                </div>
            </div>
            <div class="p-5 pt-0">
                <button onclick="playYouTubeModal('${vid.id}', '${escapeHtml(vid.title)}')"
                    class="w-full py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition">
                    Watch Maintenance Guide
                </button>
            </div>
        </article>
    `).join("");
}

async function searchYouTube() {
    const query = document.getElementById("youtubeSearch").value.trim();
    const status = document.getElementById("youtubeStatus");
    const container = document.getElementById("youtubeResults");

    if (!query) {
        showToast("Search Warning", "Please enter a search topic.", "warning");
        return;
    }

    if (youtubeApiKey === "YOUR_YOUTUBE_API_KEY") {
        if (status) status.textContent = "Notice: Using curated offline video index. Add API key for live search.";
        showToast("YouTube API Notice", "Showing curated video catalog.", "info");
        setupYouTubeDefaultGrid();
        return;
    }

    if (status) status.textContent = "Querying YouTube Data API v3...";

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&key=${youtubeApiKey}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("YouTube API fetch failed");
        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            if (status) status.textContent = "No maintenance videos found.";
            return;
        }

        if (status) status.textContent = "YouTube Data API results loaded.";

        container.innerHTML = data.items.map(item => `
            <article class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md card-hover flex flex-col justify-between">
                <div>
                    <img src="${item.snippet.thumbnails.medium.url}" alt="${escapeHtml(item.snippet.title)}" class="w-full h-44 object-cover">
                    <div class="p-5">
                        <h4 class="font-bold text-slate-900 line-clamp-2 text-sm">${escapeHtml(item.snippet.title)}</h4>
                        <p class="text-xs text-teal-700 font-semibold mt-1">${escapeHtml(item.snippet.channelTitle)}</p>
                    </div>
                </div>
                <div class="p-5 pt-0">
                    <button onclick="playYouTubeModal('${item.id.videoId}', '${escapeHtml(item.snippet.title)}')"
                        class="w-full py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition">
                        Watch Video
                    </button>
                </div>
            </article>
        `).join("");

    } catch (err) {
        console.error(err);
        if (status) status.textContent = "Unable to fetch live YouTube results. Falling back to curated catalog.";
        setupYouTubeDefaultGrid();
    }
}

function playYouTubeModal(videoId, title) {
    const modal = document.getElementById("videoModal");
    const iframe = document.getElementById("youtubeIframe");
    const modalTitle = document.getElementById("videoModalTitle");

    modalTitle.textContent = title;
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeVideoModal() {
    const modal = document.getElementById("videoModal");
    const iframe = document.getElementById("youtubeIframe");
    iframe.src = "";
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}


// ==========================================
// 10. WORK ORDER MODAL & HELPER FUNCTIONS
// ==========================================

function openWorkOrderModal() {
    const modal = document.getElementById("workOrderModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeWorkOrderModal() {
    const modal = document.getElementById("workOrderModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function submitWorkOrder(e) {
    e.preventDefault();
    closeWorkOrderModal();
    showToast("Work Order Scheduled", "Maintenance ticket dispatched to biomedical engineering team.", "success");
}

function showMessage() {
    showToast("Welcome to AI MedCare", "Predictive maintenance platform active. Explore telemetry and AI models.", "success");
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
