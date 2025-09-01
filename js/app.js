// js/app.js - Enhanced with Performance Monitoring
console.log('[App] Starting Queen Rose Hiking Trail App v6.0.0');

// Performance monitoring and diagnostics
const AppPerformance = {
  startTime: performance.now(),
  metrics: {},
  
  mark(name) {
    this.metrics[name] = performance.now();
    console.log(`[Performance] ${name}: ${(this.metrics[name] - this.startTime).toFixed(2)}ms`);
  },
  
  measure(name, startMark) {
    const duration = this.metrics[name] - (this.metrics[startMark] || this.startTime);
    console.log(`[Performance] ${name} duration: ${duration.toFixed(2)}ms`);
    return duration;
  },
  
  logCacheStatus() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        console.log('[Performance] Available caches:', cacheNames);
        cacheNames.forEach(cacheName => {
          caches.open(cacheName).then(cache => {
            cache.keys().then(keys => {
              console.log(`[Performance] Cache ${cacheName} contains ${keys.length} items`);
            });
          });
        });
      });
    }
  },
  
  logMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log('[Performance] Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
};

// Start performance monitoring
AppPerformance.mark('app_start');

window.isSavingWaypointGlobalFlag = false; // TRUE WINDOW-LEVEL GLOBAL
let appMainInitialized = false; // Flag for the main DOMContentLoaded block

// Define the waypoint click handler function
async function handleWaypointSaveClick() {
    console.log("[App] Waypoint button clicked! (handleWaypointSaveClick) LOG 1");
    console.log(`[App] Current window.isSavingWaypointGlobalFlag state (at entry): ${window.isSavingWaypointGlobalFlag}. LOG 1.1`);

    if (window.isSavingWaypointGlobalFlag) {
        console.log("[App] window.isSavingWaypointGlobalFlag is true. Exiting. LOG 2");
        return;
    }
    
    const waypointButton = document.getElementById("add-waypoint-btn-ui"); // Get button inside handler
    if (!waypointButton) {
        console.error("[App] Waypoint button not found inside handler. LOG 2.1");
        window.isSavingWaypointGlobalFlag = false; 
        return;
    }

    console.log("[App] Setting window.isSavingWaypointGlobalFlag and disabling button. LOG 3");
    window.isSavingWaypointGlobalFlag = true;
    waypointButton.disabled = true;
    const originalButtonText = waypointButton.textContent;
    waypointButton.textContent = "Saving...";

    try {
        console.log("[App] Inside try block. Checking saveNewWaypoint function. LOG 4");
        if (typeof saveNewWaypoint === "function") {
            console.log("[App] saveNewWaypoint IS defined. Checking geolocation API. LOG 5");
            if (navigator.geolocation) {
                console.log("[App] Geolocation API IS available. Awaiting current position... LOG 6");
                
                const position = await new Promise((resolve, reject) => {
                    console.log("[App] Geolocation Promise executor started. LOG 6.1");
                    navigator.geolocation.getCurrentPosition(
                        (pos) => { console.log("[App] Geolocation success callback. LOG 6.2"); resolve(pos); },
                        (err) => { console.log("[App] Geolocation error callback. LOG 6.3"); reject(err); },
                        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
                    );
                });
                console.log("[App] Geolocation position obtained. Proceeding. LOG 7");

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`[App] Lat: ${lat}, Lon: ${lon}. Awaiting saveNewWaypoint... LOG 8`);
                await saveNewWaypoint(lat, lon);
                console.log("[App] saveNewWaypoint call completed. LOG 9");
            } else {
                console.error("[App] Geolocation NOT supported. LOG 10");
                alert("Geolocation is not supported by this browser.");
            }
        } else {
            console.error("[App] saveNewWaypoint IS NOT defined. LOG 11");
            alert("Waypoint functionality unavailable: saveNewWaypoint not found.");
        }
    } catch (error) {
        console.error("[App] CAUGHT ERROR in try block: LOG 12", error);
        if (error && typeof error.code === "number" && error.message) { // Check if it's a GeolocationPositionError
            alert(`Could not get current location: ${error.message}.`);
        }
    } finally {
        console.log("[App] ENTERING FINALLY BLOCK. LOG 13");
        window.isSavingWaypointGlobalFlag = false;
        const finalWaypointButton = document.getElementById("add-waypoint-btn-ui"); 
        if (finalWaypointButton) {
            finalWaypointButton.disabled = false;
            finalWaypointButton.textContent = originalButtonText;
        } else {
            console.warn("[App] Waypoint button not found in finally block. LOG 13.1");
        }
        console.log("[App] EXITING FINALLY BLOCK. Button re-enabled, window.isSavingWaypointGlobalFlag cleared. LOG 14");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    AppPerformance.mark('dom_ready');
    
    if (appMainInitialized) {
        console.warn("[App] Main DOMContentLoaded handler already run. Skipping re-initialization.");
        return;
    }
    appMainInitialized = true;
    console.log("[App] Main DOMContentLoaded handler running for the first time.");
    
    // Log initial performance metrics
    AppPerformance.logCacheStatus();
    AppPerformance.logMemoryUsage();

    // Initialize Dexie DB
    const db = new Dexie("QueenRoseDB");
    db.version(1).stores({
        weather_cache: "id", // Primary key 'id'
        kml_files: "++id, name, lastModified", // Auto-incrementing primary key, index on name
        gpx_tracks: "++id, name, timestamp", // Auto-incrementing primary key for tracks
        waypoints: "++id, name, lat, lon, timestamp" // Auto-incrementing primary key for waypoints
    });
    window.db = db; // Make db globally accessible
    console.log("[App] Dexie DB initialized.");

    const navButtons = document.querySelectorAll("nav button");
    const sections = document.querySelectorAll(".app-section");
    const versionIndicator = document.getElementById("version-indicator");

    if (versionIndicator) {
        versionIndicator.textContent = `Version: ${new Date().toISOString()}`;
    }

    window.switchSection = (sectionId) => {
        console.log(`[App] Switching to section: ${sectionId}`);
        sections.forEach(section => section.classList.remove("active"));
        navButtons.forEach(button => button.classList.remove("active"));
        const activeSection = document.getElementById(`${sectionId}-section`);
        const activeButton = document.querySelector(`nav button[data-section="${sectionId}"]`);
        if (activeSection) activeSection.classList.add("active");
        else console.error(`[App] Section with ID ${sectionId}-section not found!`);
        if (activeButton) activeButton.classList.add("active");
        if (sectionId === "map" && typeof map !== "undefined" && map) map.invalidateSize();
        if (sectionId === "weather" && typeof initWeatherFeature === "function") {
            console.log("[App] Initializing weather feature...");
            initWeatherFeature(); // This function in weather_offline.js handles fetching and displaying
        }
        if (sectionId === "my-kmls" && typeof initKMLManagement === "function") initKMLManagement();
        if (sectionId === "my-waypoints" && typeof loadAndDisplaySavedWaypoints === "function") loadAndDisplaySavedWaypoints();
    };

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const sectionId = button.getAttribute("data-section");
            if (sectionId) switchSection(sectionId);
            else console.warn("[App] Button clicked without data-section attribute:", button);
        });
    });

    const kmlListContainer = document.getElementById("kml-file-list");
    if (kmlListContainer && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        kmlListContainer.innerHTML = "";
        trails.forEach(trail => {
            if (!trail.id || !trail.name) return;
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = `${trail.name} (${trail.distance || 'N/A'} km)`;
            link.dataset.trailId = trail.id;
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const selectedTrailId = event.target.dataset.trailId;
                switchSection("map");
                const trailSelectDropdown = document.getElementById("trail-select");
                if (trailSelectDropdown) trailSelectDropdown.value = selectedTrailId;
                if (typeof displayTrail === "function") displayTrail(selectedTrailId);
                else console.error("[App] displayTrail function not found!");
            });
            listItem.appendChild(link);
            kmlListContainer.appendChild(listItem);
        });
    }

    const trailDetailsContainer = document.getElementById("trail-details");
    if (trailDetailsContainer && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        trailDetailsContainer.innerHTML = "";
        trails.forEach(trail => {
            const item = document.createElement("div");
            item.classList.add("trail-item");
            item.innerHTML = `<h3>${trail.name}</h3>
                ${trail.elevationImage ? `<img src="img/elevation/${trail.elevationImage}" alt="${trail.name} Elevation Profile" style="max-width: 100%; height: auto; margin-top: 10px; margin-bottom: 10px;">` : ''}
                <p><strong>Type:</strong> ${trail.type || 'N/A'}</p>
                <p>${trail.description || 'No description available.'}</p>
                <button onclick="viewTrailOnMap('${trail.id}')">View on Map</button>`;
            trailDetailsContainer.appendChild(item);
        });
    }

    window.viewTrailOnMap = (trailId) => {
        if (trailId && typeof displayTrail === "function") {
            const trailSelect = document.getElementById("trail-select");
            if(trailSelect) trailSelect.value = trailId;
            displayTrail(trailId);
            switchSection("map");
        } else console.error(`[App] Invalid trailId (${trailId}) or displayTrail function not found.`);
    }

    const trailSelectBooking = document.getElementById("booking-trail");
    if (trailSelectBooking && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        trailSelectBooking.innerHTML = "";
        const placeholderOption = document.createElement("option");
        placeholderOption.value = ""; placeholderOption.disabled = true; placeholderOption.selected = true;
        placeholderOption.textContent = "-- Select a Trail --";
        trailSelectBooking.appendChild(placeholderOption);
        trails.forEach(trail => {
            const option = document.createElement("option");
            option.value = trail.id; option.textContent = trail.name;
            trailSelectBooking.appendChild(option);
        });
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js")
            .then(reg => console.log("[App] Service Worker registered with scope:", reg.scope))
            .catch(err => console.error("[App] Service Worker registration failed:", err));
    }

    // PWA Installation Prompt Handling
    let deferredPrompt;
    let installButton;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log("[PWA] beforeinstallprompt event fired");
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show install button or prompt user
        showInstallPrompt();
    });

    // Function to show install prompt
    function showInstallPrompt() {
        // Create install button if it doesn't exist
        if (!installButton) {
            installButton = document.createElement('button');
            installButton.textContent = '📱 Install App';
            installButton.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
                background: #2E7D32;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
            installButton.addEventListener('click', installApp);
            document.body.appendChild(installButton);
        }
        installButton.style.display = 'block';
    }

    // Function to install the app
    function installApp() {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] User accepted the install prompt');
                } else {
                    console.log('[PWA] User dismissed the install prompt');
                }
                deferredPrompt = null;
                // Hide the install button
                if (installButton) {
                    installButton.style.display = 'none';
                }
            });
        }
    }

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', (evt) => {
        console.log('[PWA] App was installed');
        // Hide the install button
        if (installButton) {
            installButton.style.display = 'none';
        }
    });

    // --- Waypoint Button Event Listener --- START ---
    const waypointButton = document.getElementById("add-waypoint-btn-ui");
    if (waypointButton) {
        console.log("[App] Waypoint button (add-waypoint-btn-ui) found. Assigning click handler.");
        waypointButton.onclick = handleWaypointSaveClick; // Assign the named function
        console.log("[App] Assigned handleWaypointSaveClick to waypoint button onclick.");
    } else {
        console.error("[App] Waypoint button (add-waypoint-btn-ui) NOT found in the DOM during main setup!");
    }
    // --- Waypoint Button Event Listener --- END ---

    switchSection("map");
    
    // Final performance measurements
    AppPerformance.mark('app_ready');
    AppPerformance.measure('app_ready', 'app_start');
    AppPerformance.measure('dom_to_ready', 'dom_ready');
    
    console.log("[App] Main DOMContentLoaded setup complete.");
    
    // Set up periodic performance monitoring
    setInterval(() => {
        AppPerformance.logMemoryUsage();
    }, 60000); // Log memory usage every minute
});

// Other DOMContentLoaded listeners for Splide and Hamburger menu remain separate
document.addEventListener("DOMContentLoaded", () => {
    const galleries = document.querySelectorAll(".accommodation-gallery");
    if (galleries.length > 0 && typeof Splide !== "undefined") {
        galleries.forEach((gallery, index) => {
            try {
                new Splide(gallery, {
                    type: 'loop', perPage: 3, perMove: 1, gap: '1rem', pagination: false,
                    breakpoints: { 768: { perPage: 1 } }
                }).mount();
            } catch (error) {
                console.error(`[App] Error initializing Splide for gallery ${index + 1}:`, error);
            }
        });
    } else if (typeof Splide === "undefined") console.error("[App] Splide library not found.");
});

document.addEventListener("DOMContentLoaded", () => {
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const slideOutMenu = document.getElementById("slide-out-menu");
    const mainContent = document.getElementById("app-content");
    if (hamburgerMenu && slideOutMenu) {
        hamburgerMenu.addEventListener("click", () => {
            slideOutMenu.classList.toggle("open");
            document.body.classList.toggle("menu-open"); 
        });
        slideOutMenu.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", () => {
                const sectionId = button.getAttribute("data-section");
                if (sectionId) {
                    if (typeof switchSection === "function") switchSection(sectionId);
                    slideOutMenu.classList.remove("open");
                    document.body.classList.remove("menu-open");
                }
            });
        });
        mainContent.addEventListener("click", (event) => {
            if (slideOutMenu.classList.contains("open") && !slideOutMenu.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                slideOutMenu.classList.remove("open");
                document.body.classList.remove("menu-open");
            }
        });
    } else console.error("[App] Hamburger menu or slide-out menu element not found.");
});

function getTrailById(trailId) {
    if (typeof trailsData !== 'undefined') return trailsData.find(trail => trail.id === trailId);
    console.error("[App] trailsData is not defined!"); return null;
}

function getAllTrails() {
    if (typeof trailsData !== 'undefined') return trailsData;
    console.error("[App] trailsData is not defined!"); return [];
}

