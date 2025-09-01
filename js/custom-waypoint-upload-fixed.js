// Custom Waypoint Upload System - Queen Rose Hiking Trail App
// Allows users to upload waypoint files (GPX, KML, CSV) and display them on the map

console.log('🎯 Custom Waypoint Upload System - Loading...');

window.customWaypointUpload = {
    uploadedWaypoints: [],
    
    // Initialize the upload system
    init: function() {
        console.log('🎯 Initializing custom waypoint upload...');
        this.createUploadInterface();
        this.setupEventListeners();
        this.loadStoredWaypoints();
    },
    
    // Create the upload interface
    createUploadInterface: function() {
        // Find the My Waypoints section and add waypoint upload there
        const waypointsSection = document.getElementById('my-waypoints-section');
        
        if (waypointsSection && !document.getElementById('waypoint-file-input')) {
            // Find the saved waypoints container and add upload interface before it
            const savedWaypointsContainer = document.getElementById('saved-waypoints-list-container');
            
            const uploadDiv = document.createElement('div');
            uploadDiv.innerHTML = `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <h3 style="color: #2E7D32; margin-bottom: 15px;">📍 Custom Waypoint Upload</h3>
                    <p style="margin-bottom: 15px; color: #666;">Upload your own waypoint files (GPX, KML, CSV) to display them on the map.</p>
                    
                    <div style="margin-bottom: 15px;">
                        <input type="file" id="waypoint-file-input" accept=".gpx,.kml,.csv,.txt" style="margin-bottom: 10px;">
                        <button id="upload-waypoints-btn" style="background-color: #2E7D32; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                            📤 Upload Waypoints
                        </button>
                    </div>
                    
                    <div id="waypoint-upload-status" style="margin-bottom: 15px; font-weight: bold;"></div>
                    
                    <div id="uploaded-waypoints-list">
                        <h4 style="color: #2E7D32; margin-bottom: 10px;">Uploaded Waypoint Files:</h4>
                        <div id="waypoint-files-container" style="max-height: 200px; overflow-y: auto;">
                            <p style="color: #666; font-style: italic;">No waypoint files uploaded yet.</p>
                        </div>
                    </div>
                </div>
                
                <h3 style="color: #2E7D32; margin-bottom: 15px;">💾 My Saved Waypoints</h3>
            `;
            
            // Insert the upload interface before the saved waypoints container
            if (savedWaypointsContainer) {
                waypointsSection.insertBefore(uploadDiv, savedWaypointsContainer);
            } else {
                waypointsSection.appendChild(uploadDiv);
            }
            console.log('✅ Waypoint upload interface created in My Waypoints section');
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        const uploadBtn = document.getElementById('upload-waypoints-btn');
        const fileInput = document.getElementById('waypoint-file-input');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                const file = fileInput.files[0];
                if (file) {
                    this.processWaypointFile(file);
                } else {
                    this.showStatus('Please select a file first.', 'error');
                }
            });
            
            console.log('✅ Event listeners setup complete');
        }
    },
    
    // Process uploaded waypoint file
    processWaypointFile: function(file) {
        console.log('📁 Processing waypoint file:', file.name);
        this.showStatus('Processing file...', 'info');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            try {
                let waypoints = [];
                
                if (fileExtension === 'gpx') {
                    waypoints = this.parseGPX(content);
                } else if (fileExtension === 'kml') {
                    waypoints = this.parseKML(content);
                } else if (fileExtension === 'csv') {
                    waypoints = this.parseCSV(content);
                } else {
                    throw new Error('Unsupported file format');
                }
                
                if (waypoints.length > 0) {
                    this.addWaypointsToMap(waypoints, file.name);
                    this.showStatus(`Successfully uploaded ${waypoints.length} waypoints!`, 'success');
                } else {
                    this.showStatus('No waypoints found in file.', 'warning');
                }
                
            } catch (error) {
                console.error('Error processing waypoint file:', error);
                this.showStatus('Error processing file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    },
    
    // Parse GPX file
    parseGPX: function(content) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const waypoints = [];
        
        // Parse waypoints
        const wptElements = xmlDoc.getElementsByTagName('wpt');
        for (let i = 0; i < wptElements.length; i++) {
            const wpt = wptElements[i];
            const lat = parseFloat(wpt.getAttribute('lat'));
            const lon = parseFloat(wpt.getAttribute('lon'));
            const name = wpt.getElementsByTagName('name')[0]?.textContent || `Waypoint ${i + 1}`;
            const desc = wpt.getElementsByTagName('desc')[0]?.textContent || '';
            
            waypoints.push({
                lat: lat,
                lng: lon,
                name: name,
                description: desc
            });
        }
        
        console.log(`📍 Parsed ${waypoints.length} waypoints from GPX`);
        return waypoints;
    },
    
    // Parse KML file
    parseKML: function(content) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const waypoints = [];
        
        // Parse placemarks
        const placemarks = xmlDoc.getElementsByTagName('Placemark');
        for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            const name = placemark.getElementsByTagName('name')[0]?.textContent || `Waypoint ${i + 1}`;
            const desc = placemark.getElementsByTagName('description')[0]?.textContent || '';
            const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
            
            if (coordinates) {
                const coords = coordinates.trim().split(',');
                if (coords.length >= 2) {
                    waypoints.push({
                        lat: parseFloat(coords[1]),
                        lng: parseFloat(coords[0]),
                        name: name,
                        description: desc
                    });
                }
            }
        }
        
        console.log(`📍 Parsed ${waypoints.length} waypoints from KML`);
        return waypoints;
    },
    
    // Parse CSV file
    parseCSV: function(content) {
        const lines = content.split('\n');
        const waypoints = [];
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (line) {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const lat = parseFloat(parts[0]);
                    const lng = parseFloat(parts[1]);
                    const name = parts[2] || `Waypoint ${i}`;
                    const desc = parts[3] || '';
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        waypoints.push({
                            lat: lat,
                            lng: lng,
                            name: name,
                            description: desc
                        });
                    }
                }
            }
        }
        
        console.log(`📍 Parsed ${waypoints.length} waypoints from CSV`);
        return waypoints;
    },
    
    // Add waypoints to map
    addWaypointsToMap: function(waypoints, filename) {
        console.log(`🗺️ Adding ${waypoints.length} waypoints to map`);
        
        // Get map instance - try multiple possible references
        let map = null;
        if (window.leafletMap) {
            map = window.leafletMap;
            console.log('📍 Found map as window.leafletMap');
        } else if (window.map) {
            map = window.map;
            console.log('📍 Found map as window.map');
        } else if (window.myMap) {
            map = window.myMap;
            console.log('📍 Found map as window.myMap');
        } else if (window.mapInstance) {
            map = window.mapInstance;
            console.log('📍 Found map as window.mapInstance');
        } else {
            // Try to find map in global scope
            for (let key in window) {
                if (window[key] && typeof window[key] === 'object' && window[key]._container) {
                    map = window[key];
                    console.log(`📍 Found map as window.${key}`);
                    break;
                }
            }
        }
        
        if (!map) {
            console.error('❌ Map instance not found - available objects:', Object.keys(window).filter(k => k.includes('map')));
            this.showStatus('Error: Map not available. Please ensure map is loaded.', 'error');
            return;
        }
        
        console.log('✅ Map instance found:', map);
        
        // Create layer group for waypoints with custom styling
        const waypointLayer = L.layerGroup();
        
        waypoints.forEach((waypoint, index) => {
            console.log(`📍 Creating marker for: ${waypoint.name} at [${waypoint.lat}, ${waypoint.lng}]`);
            
            // Use simple circle marker that doesn't require external resources
            const marker = L.circleMarker([waypoint.lat, waypoint.lng], {
                radius: 8,
                fillColor: '#ff4444',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`<strong>${waypoint.name}</strong><br>${waypoint.description || 'Custom waypoint'}`);
            
            waypointLayer.addLayer(marker);
            console.log(`📌 Added circle marker to layer: ${waypoint.name}`);
        });
        
        // Add to map
        try {
            waypointLayer.addTo(map);
            console.log('✅ Waypoint layer added to map');
        } catch (error) {
            console.error('❌ Error adding waypoints to map:', error);
            this.showStatus('Error adding waypoints to map: ' + error.message, 'error');
            return;
        }
        
        // Store the layer for later management
        const waypointData = {
            filename: filename,
            layer: waypointLayer,
            waypoints: waypoints, // Store original waypoint data for persistence
            count: waypoints.length,
            timestamp: new Date().toLocaleDateString(),
            visible: true // Default to visible when first uploaded
        };
        
        this.uploadedWaypoints.push(waypointData);
        
        // Save to localStorage
        this.saveWaypointsToStorage();
        
        // Update UI
        this.updateWaypointsList();
        
        // Zoom to waypoints
        if (waypoints.length > 0) {
            try {
                const group = new L.featureGroup(waypointLayer.getLayers());
                map.fitBounds(group.getBounds().pad(0.1));
                console.log('✅ Map zoomed to waypoints');
            } catch (error) {
                console.log('⚠️ Could not zoom to waypoints:', error);
            }
        }
        
        console.log('✅ Waypoints added to map successfully');
        this.showStatus(`${waypoints.length} waypoints added to map and saved!`, 'success');
    },
    
    // Update waypoints list in UI
    updateWaypointsList: function() {
        const container = document.getElementById('waypoint-files-container');
        if (!container) return;
        
        if (this.uploadedWaypoints.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No waypoint files uploaded yet.</p>';
        } else {
            let html = '';
            this.uploadedWaypoints.forEach((item, index) => {
                const isVisible = item.visible !== false; // Default to visible
                const eyeIcon = isVisible ? '👁️' : '👁️‍🗨️';
                const eyeTitle = isVisible ? 'Hide waypoints' : 'Show waypoints';
                
                html += `
                    <div style="padding: 8px; border: 1px solid #ddd; margin-bottom: 5px; border-radius: 4px; background-color: white; display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex: 1;">
                            <strong>${item.filename}</strong><br>
                            <small style="color: #666;">${item.count} waypoints • ${item.timestamp}</small>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="window.customWaypointUpload.toggleWaypointVisibility(${index})" 
                                    style="background: ${isVisible ? '#4caf50' : '#9e9e9e'}; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 14px;"
                                    title="${eyeTitle}">
                                ${eyeIcon}
                            </button>
                            <button onclick="window.customWaypointUpload.removeWaypoints(${index})" 
                                    style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;"
                                    title="Remove waypoints">
                                ×
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    },
    
    // Toggle waypoint visibility
    toggleWaypointVisibility: function(index) {
        if (!this.uploadedWaypoints[index]) return;
        
        const item = this.uploadedWaypoints[index];
        const map = window.leafletMap || window.map || window.myMap;
        
        if (!map || !item.layer) {
            console.error('Map or layer not found');
            return;
        }
        
        // Toggle visibility state
        item.visible = item.visible !== false ? false : true;
        
        if (item.visible) {
            // Show waypoints
            if (!map.hasLayer(item.layer)) {
                map.addLayer(item.layer);
            }
            console.log(`👁️ Showing waypoints: ${item.filename}`);
            this.showStatus(`Showing waypoints: ${item.filename}`, 'success');
        } else {
            // Hide waypoints
            if (map.hasLayer(item.layer)) {
                map.removeLayer(item.layer);
            }
            console.log(`👁️‍🗨️ Hiding waypoints: ${item.filename}`);
            this.showStatus(`Hiding waypoints: ${item.filename}`, 'info');
        }
        
        // Save updated state to localStorage
        this.saveWaypointsToStorage();
        
        // Update UI to reflect new state
        this.updateWaypointsList();
    },

    // Remove waypoints
    removeWaypoints: function(index) {
        if (this.uploadedWaypoints[index]) {
            const map = window.leafletMap || window.map || window.myMap;
            if (map && this.uploadedWaypoints[index].layer) {
                map.removeLayer(this.uploadedWaypoints[index].layer);
            }
            this.uploadedWaypoints.splice(index, 1);
            
            // Update localStorage after removal
            this.saveWaypointsToStorage();
            
            this.updateWaypointsList();
            this.showStatus('Waypoints removed', 'info');
        }
    },
    
    // Save waypoints to localStorage
    saveWaypointsToStorage: function() {
        try {
            const waypointData = this.uploadedWaypoints.map(item => ({
                filename: item.filename,
                waypoints: item.waypoints,
                count: item.count,
                timestamp: item.timestamp,
                visible: item.visible
            }));
            
            localStorage.setItem('queenRoseWaypoints', JSON.stringify(waypointData));
            console.log('💾 Waypoints saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving waypoints to localStorage:', error);
        }
    },

    // Load waypoints from localStorage
    loadStoredWaypoints: function() {
        try {
            const stored = localStorage.getItem('queenRoseWaypoints');
            if (stored) {
                const waypointData = JSON.parse(stored);
                console.log(`📂 Loading ${waypointData.length} stored waypoint files...`);
                
                waypointData.forEach(item => {
                    if (item.waypoints && item.waypoints.length > 0) {
                        // Recreate the waypoint layer
                        this.addWaypointsToMap(item.waypoints, item.filename);
                        
                        // Set visibility state
                        const lastIndex = this.uploadedWaypoints.length - 1;
                        if (lastIndex >= 0) {
                            this.uploadedWaypoints[lastIndex].visible = item.visible;
                            
                            // Hide if it was hidden before
                            if (!item.visible) {
                                this.toggleWaypointVisibility(lastIndex);
                            }
                        }
                    }
                });
                
                console.log('✅ Stored waypoints loaded successfully');
            } else {
                console.log('📂 No stored waypoints found');
            }
        } catch (error) {
            console.error('❌ Error loading stored waypoints:', error);
        }
    },

    // Show status message
    showStatus: function(message, type) {
        const statusDiv = document.getElementById('waypoint-upload-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = type === 'error' ? '#f44336' : 
                                   type === 'success' ? '#4caf50' : 
                                   type === 'warning' ? '#ff9800' : '#2196f3';
            
            // Clear status after 5 seconds
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 5000);
        }
    }
};

// Embedded Waypoints System
window.embeddedWaypoints = {
    // Individual waypoint visibility tracking
    waypointVisibility: {},
    
    // Global visibility state
    visible: false,
    
    // Predefined waypoints that are permanently embedded in the app
    waypoints: [
        {
            id: 'queensrivercamp',
            name: 'Queens River Camp',
            lat: -25.855810353532434,
            lng: 30.839396696537733,
            category: 'Base Camp',
            icon: '🏕️'
        },
        {
            id: 'nelshoogtelogcabin',
            name: 'Nelshoogte Log Cabin',
            lat: -25.82145863212645,
            lng: 30.833962624892592,
            category: 'Accommodation',
            icon: '🏠'
        },

        {
            id: '14streams',
            name: '14 Streams',
            lat: -25.768842408433557,
            lng: 31.101396046578884,
            category: 'Water Feature',
            icon: '💧'
        },



        {
            id: 'devilsknuckelsdam',
            name: 'Devils Knuckels Dam',
            lat: -25.81086323596537,
            lng: 30.833337754011154,
            category: 'Water Feature',
            icon: '🌊'
        },


        {
            id: 'taurislogcabin',
            name: 'Tauris Log Cabin',
            lat: -25.911098308861256,
            lng: 30.928855324164033,
            category: 'Accommodation',
            icon: '🏠'
        },
        {
            id: 'matumibushcamp',
            name: 'Matumi Bush Camp',
            lat: -25.841144034639,
            lng: 30.877503007650375,
            category: 'Bush Camp',
            icon: '🏕️'
        },
        {
            id: 'alvinfalls',
            name: 'Alvin Falls',
            lat: -25.880222,
            lng: 30.859017,
            category: 'Water Feature',
            icon: '💧'
        },
        {
            id: 'cupidfallspicnicspot',
            name: 'Cupid Falls Picnic Spot',
            lat: -25.848193,
            lng: 30.844668,
            category: 'Water Feature',
            icon: '💧'
        },
        {
            id: 'damcamp',
            name: 'Dam Camp',
            lat: -25.812592,
            lng: 30.834473,
            category: 'Camping',
            icon: '🏕️'
        },
        {
            id: 'matumiwildcamp',
            name: 'Matumi Wild Camp',
            lat: -25.843226,
            lng: 30.88076,
            category: 'Camping',
            icon: '🏕️'
        },
        {
            id: 'nelshoogtehouthuis',
            name: 'Nelshoogte Houthuis',
            lat: -25.821268,
            lng: 30.833861,
            category: 'Point of Interest',
            icon: '📍'
        },
        {
            id: 'reddrumstartofjourney',
            name: 'Red Drum - Start of Journey',
            lat: -25.76744103804231,
            lng: 30.80945502966642,
            category: 'Transport',
            icon: '🚗'
        },
        {
            id: 'rolandsstaircase',
            name: 'Rolands Staircase',
            lat: -25.875108,
            lng: 30.858711,
            category: 'Point of Interest',
            icon: '📍'
        }
    ],
    
    layer: null,
    visible: false,
    
    // Initialize embedded waypoints system
    init: function() {
        console.log('🎯 Initializing embedded waypoints system...');
        this.createEmbeddedWaypointsInterface();
        this.loadVisibilityState();
    },
    
    // Create the embedded waypoints interface
    createEmbeddedWaypointsInterface: function() {
        const waypointsSection = document.getElementById('my-waypoints-section');
        
        if (waypointsSection && !document.getElementById('embedded-waypoints-container')) {
            const embeddedDiv = document.createElement('div');
            embeddedDiv.id = 'embedded-waypoints-container';
            embeddedDiv.innerHTML = `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <h3 style="color: #2E7D32; margin-bottom: 15px;">🗺️ Embedded Trail Waypoints</h3>
                    <p style="margin-bottom: 15px; color: #666;">Permanent waypoints for key locations along the Queen Rose trails.</p>
                    
                    <div style="margin-bottom: 15px;">
                        <button id="embedded-waypoints-toggle" style="background-color: #2E7D32; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                            🗺️ Show Waypoints on Map
                        </button>
                    </div>
                    
                    <div id="embedded-waypoints-status" style="margin-bottom: 15px; font-weight: bold;"></div>
                    
                    <div id="embedded-waypoints-list">
                        <h4 style="color: #2E7D32; margin-bottom: 10px;">Embedded Waypoints:</h4>
                        <div id="embedded-waypoints-container-list" style="max-height: 200px; overflow-y: auto;">
                            ${this.generateSimpleWaypointsList()}
                        </div>
                    </div>
                </div>
            `;
            
            // Insert before the upload interface
            const uploadInterface = waypointsSection.querySelector('div');
            if (uploadInterface) {
                waypointsSection.insertBefore(embeddedDiv, uploadInterface);
            } else {
                waypointsSection.appendChild(embeddedDiv);
            }
            
            // Setup toggle event listener
            const toggle = document.getElementById('embedded-waypoints-toggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.toggleVisibility(!this.visible);
                });
            }
            
            console.log('✅ Embedded waypoints interface created');
        }
    },
    
    // Generate simple HTML list of waypoints (like upload section)
    generateSimpleWaypointsList: function() {
        let html = '';
        
        this.waypoints.forEach((waypoint, index) => {
            // Initialize visibility state if not set
            if (this.waypointVisibility[waypoint.id] === undefined) {
                this.waypointVisibility[waypoint.id] = true; // Default to visible
            }
            
            const isVisible = this.waypointVisibility[waypoint.id];
            const toggleButtonStyle = isVisible ? 
                'background: #4caf50; color: white;' : 
                'background: #f44336; color: white;';
            const toggleIcon = isVisible ? '👁️' : '❌';
            
            html += `
                <div style="padding: 8px; border: 1px solid #ddd; margin-bottom: 5px; border-radius: 4px; background-color: white; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <strong>${waypoint.icon} ${waypoint.name}</strong>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.embeddedWaypoints.toggleIndividualWaypoint('${waypoint.id}')" 
                                id="toggle-${waypoint.id}"
                                style="${toggleButtonStyle} border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;"
                                title="${isVisible ? 'Hide waypoint' : 'Show waypoint'}">
                            ${toggleIcon}
                        </button>
                        <button onclick="window.embeddedWaypoints.zoomToWaypoint('${waypoint.id}')" 
                                style="background: #2196f3; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;"
                                title="Zoom to location">
                            📍
                        </button>
                    </div>
                </div>
            `;
        });
        
        return html;
    },
    
    // Toggle waypoints visibility
    toggleVisibility: function(show) {
        const map = window.leafletMap || window.map || window.myMap;
        if (!map) {
            console.error('Map instance not found');
            return;
        }
        
        if (show && !this.visible) {
            this.showWaypoints();
        } else if (!show && this.visible) {
            this.hideWaypoints();
        }
        
        // Update button text and style
        this.updateToggleButton();
        
        // Save state
        this.saveVisibilityState();
    },
    
    // Update toggle button appearance
    updateToggleButton: function() {
        const toggle = document.getElementById('embedded-waypoints-toggle');
        if (toggle) {
            if (this.visible) {
                toggle.textContent = '🗺️ Hide Waypoints from Map';
                toggle.style.backgroundColor = '#9e9e9e';
            } else {
                toggle.textContent = '🗺️ Show Waypoints on Map';
                toggle.style.backgroundColor = '#2E7D32';
            }
        }
    },
    
    // Show waypoints on map
    showWaypoints: function() {
        const map = window.leafletMap || window.map || window.myMap;
        if (!map) return;
        
        // Remove existing layer if any
        if (this.layer) {
            map.removeLayer(this.layer);
        }
        
        // Create new layer group
        this.layer = L.layerGroup();
        
        this.waypoints.forEach(waypoint => {
            const marker = L.circleMarker([waypoint.lat, waypoint.lng], {
                radius: 10,
                fillColor: '#2E7D32',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`
                <div style="text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 5px;">${waypoint.icon}</div>
                    <strong>${waypoint.name}</strong>
                </div>
            `);
            
            this.layer.addLayer(marker);
        });
        
        // Add to map
        this.layer.addTo(map);
        this.visible = true;
        
        console.log('✅ Embedded waypoints shown on map');
        
        // Show status message
        this.showStatus('Embedded waypoints shown on map', 'success');
    },
    
    // Hide waypoints from map
    hideWaypoints: function() {
        const map = window.leafletMap || window.map || window.myMap;
        if (!map || !this.layer) return;
        
        map.removeLayer(this.layer);
        this.visible = false;
        
        console.log('✅ Embedded waypoints hidden from map');
        
        // Show status message
        this.showStatus('Embedded waypoints hidden from map', 'info');
    },
    
    // Show status message
    showStatus: function(message, type) {
        const statusDiv = document.getElementById('embedded-waypoints-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = type === 'error' ? '#f44336' : 
                                   type === 'success' ? '#4caf50' : 
                                   type === 'warning' ? '#ff9800' : '#2196f3';
            
            // Clear status after 3 seconds
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        }
    },
    
    // Toggle individual waypoint visibility
    toggleIndividualWaypoint: function(waypointId) {
        // Toggle the visibility state
        this.waypointVisibility[waypointId] = !this.waypointVisibility[waypointId];
        const isVisible = this.waypointVisibility[waypointId];
        
        // Update the toggle button
        const toggleButton = document.getElementById(`toggle-${waypointId}`);
        if (toggleButton) {
            const toggleButtonStyle = isVisible ? 
                'background: #4caf50; color: white;' : 
                'background: #f44336; color: white;';
            const toggleIcon = isVisible ? '👁️' : '❌';
            
            toggleButton.style.cssText = `${toggleButtonStyle} border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;`;
            toggleButton.innerHTML = toggleIcon;
            toggleButton.title = isVisible ? 'Hide waypoint' : 'Show waypoint';
        }
        
        // Update the waypoint on the map
        this.updateIndividualWaypointOnMap(waypointId, isVisible);
        
        // Save individual visibility states
        this.saveIndividualVisibilityStates();
        
        // Show status message
        const waypoint = this.waypoints.find(w => w.id === waypointId);
        if (waypoint) {
            this.showStatus(`${waypoint.name} ${isVisible ? 'shown' : 'hidden'} on map`, 'success');
        }
    },
    
    // Update individual waypoint on map
    updateIndividualWaypointOnMap: function(waypointId, show) {
        const map = window.leafletMap || window.map || window.myMap;
        if (!map || !this.layer) return;
        
        const waypoint = this.waypoints.find(w => w.id === waypointId);
        if (!waypoint) return;
        
        // Find the marker for this waypoint
        this.layer.eachLayer(layer => {
            if (layer.getLatLng().lat === waypoint.lat && layer.getLatLng().lng === waypoint.lng) {
                if (show) {
                    // Add to map if not already there
                    if (!map.hasLayer(layer)) {
                        this.layer.addLayer(layer);
                    }
                } else {
                    // Remove from map
                    this.layer.removeLayer(layer);
                }
            }
        });
    },
    
    // Save individual visibility states to localStorage
    saveIndividualVisibilityStates: function() {
        try {
            localStorage.setItem('embeddedWaypointsIndividualVisibility', JSON.stringify(this.waypointVisibility));
        } catch (error) {
            console.error('Error saving individual waypoint visibility states:', error);
        }
    },
    
    // Load individual visibility states from localStorage
    loadIndividualVisibilityStates: function() {
        try {
            const saved = localStorage.getItem('embeddedWaypointsIndividualVisibility');
            if (saved) {
                this.waypointVisibility = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading individual waypoint visibility states:', error);
        }
    },
    
    // Zoom to specific waypoint
    zoomToWaypoint: function(waypointId) {
        const waypoint = this.waypoints.find(w => w.id === waypointId);
        if (!waypoint) return;
        
        const map = window.leafletMap || window.map || window.myMap;
        if (!map) return;
        
        // Zoom to waypoint
        map.setView([waypoint.lat, waypoint.lng], 16);
        
        // Show waypoints if not visible
        if (!this.visible) {
            const toggle = document.getElementById('embedded-waypoints-toggle');
            if (toggle) {
                toggle.checked = true;
                this.toggleVisibility(true);
            }
        }
        
        // Open popup if waypoint is on map
        if (this.layer) {
            this.layer.eachLayer(layer => {
                if (layer.getLatLng().lat === waypoint.lat && layer.getLatLng().lng === waypoint.lng) {
                    layer.openPopup();
                }
            });
        }
        
        console.log(`📍 Zoomed to waypoint: ${waypoint.name}`);
        
        // Show status message
        if (window.customWaypointUpload) {
            window.customWaypointUpload.showStatus(`Zoomed to: ${waypoint.name}`, 'success');
        }
    },
    
    // Save visibility state to localStorage
    saveVisibilityState: function() {
        try {
            localStorage.setItem('embeddedWaypointsVisible', this.visible.toString());
        } catch (error) {
            console.error('Error saving embedded waypoints state:', error);
        }
    },
    
    // Load visibility state from localStorage
    loadVisibilityState: function() {
        try {
            const saved = localStorage.getItem('embeddedWaypointsVisible');
            if (saved === 'true') {
                this.showWaypoints();
            }
            
            // Load individual visibility states
            this.loadIndividualVisibilityStates();
            
            // Update button appearance
            this.updateToggleButton();
        } catch (error) {
            console.error('Error loading embedded waypoints state:', error);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.customWaypointUpload) {
                window.customWaypointUpload.init();
            }
            if (window.embeddedWaypoints) {
                window.embeddedWaypoints.init();
            }
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (window.customWaypointUpload) {
            window.customWaypointUpload.init();
        }
        if (window.embeddedWaypoints) {
            window.embeddedWaypoints.init();
        }
    }, 1000);
}

console.log('📦 Custom Waypoint Upload System script loaded');
console.log('🗺️ Embedded Waypoints System script loaded');

