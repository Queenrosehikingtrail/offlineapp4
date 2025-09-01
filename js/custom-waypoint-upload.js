// Custom Waypoint Upload System - Queen Rose Hiking Trail App
// Allows users to upload waypoint files (GPX, KML, CSV) and display them on the map

(function() {
    'use strict';
    
    console.log('🎯 Custom Waypoint Upload System - Initializing...');
    
    window.customWaypointUpload = {
        uploadedWaypoints: [],
        
        // Initialize the upload system
        init: function() {
            this.createUploadInterface();
            this.loadStoredWaypoints();
        },
        
        // Create the upload interface
        createUploadInterface: function() {
            // Find the existing My KML Files section and add waypoint upload there
            const kmlSection = document.getElementById('my-kmls-section');
            
            if (kmlSection && !document.getElementById('waypoint-file-input')) {
                // Add waypoint upload to the existing KML section
                const uploadDiv = document.createElement('div');
                uploadDiv.innerHTML = `
                    <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
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
                `;
                
                kmlSection.appendChild(uploadDiv);
            }
            
            // Add event listeners
            this.setupEventListeners();
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
                
                // Allow drag and drop
                const uploadSection = document.getElementById('custom-waypoint-upload-section');
                uploadSection.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadSection.style.backgroundColor = '#e8f5e8';
                });
                
                uploadSection.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    uploadSection.style.backgroundColor = '#f9f9f9';
                });
                
                uploadSection.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadSection.style.backgroundColor = '#f9f9f9';
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        fileInput.files = files;
                        this.processWaypointFile(files[0]);
                    }
                });
            }
        },
        
        // Process uploaded waypoint file
        processWaypointFile: async function(file) {
            this.showStatus('Processing waypoint file...', 'info');
            
            try {
                const text = await this.readFileAsText(file);
                const waypoints = await this.parseWaypointFile(text, file.name);
                
                if (waypoints.length > 0) {
                    const waypointData = {
                        id: Date.now().toString(),
                        filename: file.name,
                        uploadDate: new Date().toISOString(),
                        waypoints: waypoints,
                        visible: true
                    };
                    
                    this.uploadedWaypoints.push(waypointData);
                    this.saveToStorage();
                    this.displayWaypoints(waypointData);
                    this.updateWaypointsList();
                    
                    this.showStatus(`✅ Successfully uploaded ${waypoints.length} waypoints from ${file.name}`, 'success');
                } else {
                    this.showStatus('No valid waypoints found in the file.', 'error');
                }
                
            } catch (error) {
                console.error('Error processing waypoint file:', error);
                this.showStatus(`Error processing file: ${error.message}`, 'error');
            }
        },
        
        // Read file as text
        readFileAsText: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        },
        
        // Parse waypoint file based on format
        parseWaypointFile: async function(text, filename) {
            const extension = filename.toLowerCase().split('.').pop();
            
            switch (extension) {
                case 'gpx':
                    return this.parseGPX(text);
                case 'kml':
                    return this.parseKML(text);
                case 'csv':
                case 'txt':
                    return this.parseCSV(text);
                default:
                    throw new Error('Unsupported file format. Please use GPX, KML, or CSV files.');
            }
        },
        
        // Parse GPX format
        parseGPX: function(text) {
            const waypoints = [];
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/xml');
            
            const wptElements = doc.querySelectorAll('wpt');
            wptElements.forEach(wpt => {
                const lat = parseFloat(wpt.getAttribute('lat'));
                const lon = parseFloat(wpt.getAttribute('lon'));
                const name = wpt.querySelector('name')?.textContent || 'Unnamed Waypoint';
                const desc = wpt.querySelector('desc')?.textContent || '';
                
                if (!isNaN(lat) && !isNaN(lon)) {
                    waypoints.push({
                        name: name,
                        description: desc,
                        latitude: lat,
                        longitude: lon,
                        type: 'uploaded'
                    });
                }
            });
            
            return waypoints;
        },
        
        // Parse KML format
        parseKML: function(text) {
            const waypoints = [];
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/xml');
            
            const placemarks = doc.querySelectorAll('Placemark');
            placemarks.forEach(placemark => {
                const name = placemark.querySelector('name')?.textContent || 'Unnamed Waypoint';
                const desc = placemark.querySelector('description')?.textContent || '';
                const coordinates = placemark.querySelector('Point coordinates')?.textContent;
                
                if (coordinates) {
                    const coords = coordinates.trim().split(',');
                    const lon = parseFloat(coords[0]);
                    const lat = parseFloat(coords[1]);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        waypoints.push({
                            name: name,
                            description: desc,
                            latitude: lat,
                            longitude: lon,
                            type: 'uploaded'
                        });
                    }
                }
            });
            
            return waypoints;
        },
        
        // Parse CSV format
        parseCSV: function(text) {
            const waypoints = [];
            const lines = text.split('\n');
            
            // Skip header if present
            let startIndex = 0;
            if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('lat'))) {
                startIndex = 1;
            }
            
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
                
                if (parts.length >= 3) {
                    // Assume format: name, latitude, longitude, description (optional)
                    const name = parts[0] || `Waypoint ${i}`;
                    const lat = parseFloat(parts[1]);
                    const lon = parseFloat(parts[2]);
                    const desc = parts[3] || '';
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        waypoints.push({
                            name: name,
                            description: desc,
                            latitude: lat,
                            longitude: lon,
                            type: 'uploaded'
                        });
                    }
                }
            }
            
            return waypoints;
        },
        
        // Display waypoints on the map
        displayWaypoints: function(waypointData) {
            const map = this.getMapInstance();
            if (!map) {
                console.error('Map instance not found, retrying in 1 second...');
                setTimeout(() => this.displayWaypoints(waypointData), 1000);
                return;
            }
            
            // Remove existing layer if it exists
            if (waypointData.layerGroup) {
                try {
                    map.removeLayer(waypointData.layerGroup);
                } catch (e) {
                    console.log('Previous layer already removed');
                }
            }
            
            // Create a layer group for this waypoint file
            const layerGroup = L.layerGroup();
            
            waypointData.waypoints.forEach((waypoint, index) => {
                const marker = L.marker([waypoint.latitude, waypoint.longitude], {
                    icon: L.divIcon({
                        className: 'custom-waypoint-marker',
                        html: `<div style="background: #2E7D32; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })
                });
                
                marker.bindPopup(`
                    <div style="max-width: 200px;">
                        <h4 style="margin: 0 0 5px 0; color: #2E7D32;">${waypoint.name}</h4>
                        ${waypoint.description ? `<p style="margin: 0; font-size: 0.9em;">${waypoint.description}</p>` : ''}
                        <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #666;">
                            Lat: ${waypoint.latitude.toFixed(6)}<br>
                            Lon: ${waypoint.longitude.toFixed(6)}<br>
                            From: ${waypointData.filename}
                        </p>
                    </div>
                `);
                
                layerGroup.addLayer(marker);
            });
            
            // Add to map and store reference
            try {
                map.addLayer(layerGroup);
                waypointData.layerGroup = layerGroup;
                
                // Zoom to show all waypoints if this is the first waypoint file
                if (this.uploadedWaypoints.length === 1) {
                    const group = new L.featureGroup(layerGroup.getLayers());
                    map.fitBounds(group.getBounds().pad(0.1));
                }
                
                console.log(`✅ Added ${waypointData.waypoints.length} waypoints to map from ${waypointData.filename}`);
                this.showStatus(`✅ ${waypointData.waypoints.length} waypoints now visible on map`, 'success');
            } catch (error) {
                console.error('Error adding waypoints to map:', error);
                this.showStatus(`Error displaying waypoints: ${error.message}`, 'error');
            }
        },
        
        // Get map instance
        getMapInstance: function() {
            // Try multiple possible map references
            if (window.map && typeof window.map.addLayer === 'function') {
                return window.map;
            }
            if (window.leafletMap && typeof window.leafletMap.addLayer === 'function') {
                return window.leafletMap;
            }
            if (window.myMap && typeof window.myMap.addLayer === 'function') {
                return window.myMap;
            }
            
            // Try to find map in global scope
            for (let key in window) {
                if (window[key] && typeof window[key].addLayer === 'function' && window[key]._container) {
                    return window[key];
                }
            }
            
            console.error('No valid Leaflet map instance found');
            return null;
        },
        
           // Update the waypoints list UI
        updateWaypointsList: function() {
            const container = document.getElementById('waypoint-files-container');
            if (!container) return;
            
            if (this.uploadedWaypoints.length === 0) {
                container.innerHTML = '<p style="color: #666; font-style: italic;">No waypoint files uploaded yet.</p>';
                return;
            }
            
            container.innerHTML = this.uploadedWaypoints.map(data => `
                <div class="waypoint-file-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #2E7D32;">${data.filename}</strong>
                            <br>
                            <small style="color: #666;">${data.waypoints.length} waypoints • ${new Date(data.uploadDate).toLocaleDateString()}</small>
                            <br>
                            <small style="color: ${data.visible ? '#2E7D32' : '#999'};">
                                ${data.visible ? '✅ Visible on map' : '👁️ Hidden from map'}
                            </small>
                        </div>
                        <div>
                            <button onclick="window.customWaypointUpload.toggleVisibility('${data.id}')" 
                                    style="margin-right: 5px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; background: white; cursor: pointer;" 
                                    title="${data.visible ? 'Hide waypoints' : 'Show waypoints'}">
                                ${data.visible ? '👁️' : '🙈'}
                            </button>
                            <button onclick="window.customWaypointUpload.removeWaypoints('${data.id}')" 
                                    style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; background: white; cursor: pointer;"
                                    title="Delete waypoints">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        },},
        
        // Toggle waypoint visibility
        toggleVisibility: function(id) {
            const data = this.uploadedWaypoints.find(w => w.id === id);
            if (data) {
                data.visible = !data.visible;
                
                if (data.layerGroup) {
                    const map = this.getMapInstance();
                    if (map) {
                        try {
                            if (data.visible) {
                                map.addLayer(data.layerGroup);
                            } else {
                                map.removeLayer(data.layerGroup);
                            }
                        } catch (error) {
                            console.error('Error toggling waypoint visibility:', error);
                        }
                    }
                }
                
                this.updateWaypointsList();
                this.saveToStorage();
            }
        },
        
        // Remove waypoints
        removeWaypoints: function(id) {
            const index = this.uploadedWaypoints.findIndex(w => w.id === id);
            if (index !== -1) {
                const data = this.uploadedWaypoints[index];
                
                // Remove from map
                if (data.layerGroup) {
                    const map = this.getMapInstance();
                    if (map) {
                        try {
                            map.removeLayer(data.layerGroup);
                        } catch (error) {
                            console.error('Error removing waypoints from map:', error);
                        }
                    }
                }
                
                // Remove from array
                this.uploadedWaypoints.splice(index, 1);
                this.updateWaypointsList();
                this.saveToStorage();
                
                this.showStatus(`Removed waypoints from ${data.filename}`, 'info');
            }
        },
        
        // Save waypoints to localStorage
        saveToStorage: function() {
            try {
                const dataToSave = this.uploadedWaypoints.map(data => ({
                    id: data.id,
                    filename: data.filename,
                    uploadDate: data.uploadDate,
                    waypoints: data.waypoints,
                    visible: data.visible
                }));
                
                localStorage.setItem('uploadedWaypoints', JSON.stringify(dataToSave));
                console.log('💾 Saved', dataToSave.length, 'waypoint files to storage');
            } catch (error) {
                console.error('Error saving waypoints to storage:', error);
            }
        },
             // Load stored waypoints from localStorage
        loadStoredWaypoints: function() {
            try {
                const stored = localStorage.getItem('uploadedWaypoints');
                if (stored) {
                    this.uploadedWaypoints = JSON.parse(stored);
                    console.log('📦 Loaded', this.uploadedWaypoints.length, 'waypoint files from storage');
                    
                    // Wait for map to be ready before displaying waypoints
                    this.waitForMapAndDisplay();
                    this.updateWaypointsList();
                }
            } catch (error) {
                console.error('Error loading stored waypoints:', error);
            }
        },
        
        // Wait for map to be ready and display waypoints
        waitForMapAndDisplay: function() {
            const checkMap = () => {
                const map = this.getMapInstance();
                if (map) {
                    console.log('🗺️ Map ready, displaying stored waypoints...');
                    this.uploadedWaypoints.forEach(waypointData => {
                        if (waypointData.visible) {
                            this.displayWaypoints(waypointData);
                        }
                    });
                } else {
                    console.log('⏳ Waiting for map to be ready...');
                    setTimeout(checkMap, 500);
                }
            };
            checkMap();
        },
        
        // Save waypoints to localStorage
        saveToStorage: function() {
            try {
                localStorage.setItem('uploadedWaypoints', JSON.stringify(this.uploadedWaypoints));
                console.log('💾 Saved', this.uploadedWaypoints.length, 'waypoint files to storage');
            } catch (error) {
                console.error('Error saving waypoints to storage:', error);
            }
        },entById('waypoint-upload-status');
            if (statusDiv) {
                statusDiv.textContent = message;
                statusDiv.style.color = type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : '#1976d2';
                
                // Clear status after 5 seconds
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 5000);
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.customWaypointUpload.init(), 1000);
        });
    } else {
        setTimeout(() => window.customWaypointUpload.init(), 1000);
    }
    
})();

console.log('📦 Custom Waypoint Upload System script loaded');

