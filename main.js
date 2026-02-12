import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase + Google Maps wiring for Edge Crash dashboard.
// NOTE: You must provide real values for this config.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (error) {
  console.warn("Firebase initialization failed. Check firebaseConfig.", error);
}

let mapInstance = null;
let crashMarker = null;

function initializeMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Require Google Maps JS API to be loaded separately in the HTML.
  if (typeof google === "undefined" || !google.maps) {
    return;
  }

  mapInstance = new google.maps.Map(mapElement, {
    center: { lat: 0, lng: 0 },
    zoom: 2,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
}

function updateCrashMarker(lat, lng) {
  if (!mapInstance || typeof google === "undefined" || !google.maps) return;

  const position = { lat, lng };

  if (!crashMarker) {
    crashMarker = new google.maps.Marker({
      position,
      map: mapInstance,
      title: "Latest crash",
    });
  } else {
    crashMarker.setPosition(position);
  }

  mapInstance.setCenter(position);
  mapInstance.setZoom(12);
}

function showAlertBanner() {
  const banner = document.getElementById("alert-banner");
  if (!banner) return;
  banner.classList.add("alert-banner--visible");
}

function hideAlertBanner() {
  const banner = document.getElementById("alert-banner");
  if (!banner) return;
  banner.classList.remove("alert-banner--visible");
}

function applyCrashUiUpdate(crash) {
  const severityLevelEl = document.getElementById("severity-level");
  const severityValueEl = document.getElementById("severity-value");
  const timestampEl = document.getElementById("crash-timestamp");
  const latEl = document.getElementById("crash-lat");
  const lngEl = document.getElementById("crash-lng");
  const statusEl = document.getElementById("crash-status");
  const statusBadge = document.getElementById("status-badge");

  const severityLevel = crash.severityLevel ?? crash.level ?? "High";
  const rawG = crash.severityG ?? crash.g;
  const severityValue = crash.severityValue ?? (rawG != null ? `${rawG}g` : null) ?? "3.5g";

  const lat = crash.lat ?? crash.latitude;
  const lng = crash.lng ?? crash.longitude;

  const status = crash.status ?? "Active";
  const tsValue = crash.timestamp ?? crash.time ?? new Date().toISOString();

  if (severityLevelEl) severityLevelEl.textContent = severityLevel;
  if (severityValueEl) severityValueEl.textContent = severityValue;
  if (timestampEl) {
    timestampEl.textContent =
      typeof tsValue === "string" ? tsValue : new Date(tsValue).toLocaleString();
  }
  if (latEl && lat != null) latEl.textContent = String(lat);
  if (lngEl && lng != null) lngEl.textContent = String(lng);
  if (statusEl) statusEl.textContent = status;

  if (statusBadge) {
    statusBadge.textContent = status;
    statusBadge.classList.remove("status-badge--normal", "status-badge--active");
    statusBadge.classList.add(status === "Active" ? "status-badge--active" : "status-badge--normal");
  }

  const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;
  if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
    updateCrashMarker(latNum, lngNum);
  }
}

// Simulate-crash handler reuses the same UI logic
function simulateCrash() {
  const now = new Date();

  const demoCrash = {
    severityLevel: "High",
    severityValue: "3.5g",
    lat: 37.4219,
    lng: -122.084,
    status: "Active",
    timestamp: now.toLocaleString(),
  };

  applyCrashUiUpdate(demoCrash);
  showAlertBanner();
}

function updateSystemClock() {
  const ts = document.getElementById("system-timestamp");
  if (!ts) return;
  const now = new Date();
  ts.textContent = now.toLocaleTimeString();
}

function setupCrashListener() {
  if (!db) return;

  const crashRef = ref(db, "crashData");
  onValue(crashRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    applyCrashUiUpdate(data);
    showAlertBanner();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map (if Google Maps is loaded and we are on the overview page).
  initializeMap();

  // Wire simulate crash button (only exists on the overview page).
  const simulateBtn = document.getElementById("simulate-crash-btn");
  if (simulateBtn) {
    simulateBtn.addEventListener("click", simulateCrash);
  }

  // Ensure alert close button hides the banner.
  const alertContent = document.querySelector(".alert-banner__content");
  if (alertContent && !document.getElementById("alert-close-btn")) {
    const closeBtn = document.createElement("button");
    closeBtn.id = "alert-close-btn";
    closeBtn.type = "button";
    closeBtn.className = "alert-banner__close";
    closeBtn.setAttribute("aria-label", "Dismiss accident alert");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", hideAlertBanner);
    alertContent.appendChild(closeBtn);
  } else {
    const closeBtn = document.getElementById("alert-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", hideAlertBanner);
    }
  }

  // Start Firebase listener for realtime crashData updates.
  if (db) {
    setupCrashListener();
  }

  // Start simple system clock (header badge).
  updateSystemClock();
  setInterval(updateSystemClock, 1000);
});

