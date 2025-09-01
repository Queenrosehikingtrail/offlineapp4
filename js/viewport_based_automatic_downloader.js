// VIEWPORT-BASED AUTOMATIC DOWNLOADER
// This system simulates manual panning to automatically load and cache all trail tiles
// Eliminates the need for users to manually zoom and follow trails

console.log('*** LOADING VIEWPORT-BASED AUTOMATIC DOWNLOADER ***');

window.ViewportAutoDownloader = class {
    constructor() {
        this.isDownloading = false;
        this.currentViewport = 0;
        this.totalViewports = 0;
        this.originalMapView = null;
        this.downloadStartTime = null;
    }
    
    // Extract actual trail coordinates from the loaded KML layer
    getTrailCoordinates() {
        try {
            // Try to get coordinates from the current trail layer
            if (window.currentTrailLayer && window.currentTrailLayer.getLayers) {
                const layers = window.currentTrailLayer.getLayers();
                const coordinates = [];
                
                layers.forEach(layer => {
                    if (layer.getLatLngs) {
                        const latLngs = layer.getLatLngs();
                        if (Array.isArray(latLngs[0])) {
                            // Multi-dimensional array (polygon)
                            latLngs.forEach(ring => {
                                ring.forEach(coord => coordinates.push([coord.lat, coord.lng]));
                            });
                        } else {
                            // Simple array (polyline)
                            latLngs.forEach(coord => coordinates.push([coord.lat, coord.lng]));
                        }
                    }
                });
                
                if (coordinates.length > 0) {
                    console.log(`SUCCESS: Extracted ${coordinates.length} trail coordinates`);
                    return coordinates;
                }
            }
            
            // Fallback: Use map bounds if trail coordinates not available
            const map = this.getMapInstance();
            if (map && map.getBounds) {
                const bounds = map.getBounds();
                const center = bounds.getCenter();
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                
                // Create a grid of coordinates covering the map bounds
                const coordinates = [];
                const latStep = (ne.lat - sw.lat) / 10;
                const lngStep = (ne.lng - sw.lng) / 10;
                
                for (let lat = sw.lat; lat <= ne.lat; lat += latStep) {
                    for (let lng = sw.lng; lng <= ne.lng; lng += lngStep) {
                        coordinates.push([lat, lng]);
                    }
                }
                
                console.log(`FALLBACK: Using map bounds with ${coordinates.length} grid points`);
                return coordinates;
            }
            
        } catch (error) {
            console.error('Error extracting trail coordinates:', error);
        }
        
        return null;
    }
    
    // Get the map instance using various possible references
    getMapInstance() {
        const mapRefs = [
            'window.leafletMap',
            'window.map', 
            'window.myMap',
            'map'
        ];
        
        for (const ref of mapRefs) {
            try {
                const mapObj = eval(ref);
                if (mapObj && mapObj.setView && mapObj.getBounds) {
                    return mapObj;
                }
            } catch (e) {
                // Reference doesn't exist, continue
            }
        }
        
        return null;
    }
    
    // Calculate viewport positions that cover the entire trail area
    calculateViewportsForTrail(coordinates, zoomLevel = 16) {
        if (!coordinates || coordinates.length === 0) {
            return [];
        }
        
        const viewports = [];
        const viewportSize = this.getViewportSizeAtZoom(zoomLevel);
        
        // Calculate bounding box of trail
        let minLat = coordinates[0][0], maxLat = coordinates[0][0];
        let minLng = coordinates[0][1], maxLng = coordinates[0][1];
        
        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord[0]);
            maxLat = Math.max(maxLat, coord[0]);
            minLng = Math.min(minLng, coord[1]);
            maxLng = Math.max(maxLng, coord[1]);
        });
        
        // Add buffer around trail (500m in degrees, approximately)
        const buffer = 0.005;
        minLat -= buffer;
        maxLat += buffer;
        minLng -= buffer;
        maxLng += buffer;
        
        // Calculate grid of viewports to cover the area
        const latStep = viewportSize.lat * 0.8; // 80% overlap for complete coverage
        const lngStep = viewportSize.lng * 0.8;
        
        for (let lat = minLat; lat <= maxLat; lat += latStep) {
            for (let lng = minLng; lng <= maxLng; lng += lngStep) {
                viewports.push({
                    center: [lat, lng],
                    zoom: zoomLevel
                });
            }
        }
        
        console.log(`CALCULATED: ${viewports.length} viewports for zoom level ${zoomLevel}`);
        return viewports;
    }
    
    // Estimate viewport size at given zoom level (in degrees)
    getViewportSizeAtZoom(zoom) {
        // Approximate viewport size in degrees at different zoom levels
        const baseSizeAtZoom15 = { lat: 0.01, lng: 0.01 };
        const scaleFactor = Math.pow(2, 15 - zoom);
        
        return {
            lat: baseSizeAtZoom15.lat * scaleFactor,
            lng: baseSizeAtZoom15.lng * scaleFactor
        };
    }
    
    // Wait for tiles to load at current viewport
    async waitForTilesToLoad(timeout = 3000) {
        return new Promise(resolve => {
            let tilesLoaded = false;
            let loadTimeout;
            
            // Set timeout to prevent infinite waiting
            loadTimeout = setTimeout(() => {
                if (!tilesLoaded) {
                    tilesLoaded = true;
                    resolve();
                }
            }, timeout);
            
            // Try to detect when tiles are loaded
            // This is a simplified approach - in practice, tile loading detection is complex
            setTimeout(() => {
                if (!tilesLoaded) {
                    tilesLoaded = true;
                    clearTimeout(loadTimeout);
                    resolve();
                }
            }, 1500); // Wait 1.5 seconds for tiles to load
        });
    }
    
    // Update download progress
    updateProgress() {
        const percentage = Math.floor((this.currentViewport / this.totalViewports) * 100);
        const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Download') || btn.textContent.includes('Downloading') || btn.textContent.includes('Auto-Loading'));
        
        if (downloadBtn) {
            if (percentage < 100) {
                downloadBtn.textContent = `Auto-Loading ${percentage}%`;
                downloadBtn.style.backgroundColor = '#ff9800';
                downloadBtn.style.color = 'white';
            } else {
                downloadBtn.textContent = 'Auto-Load Complete!';
                downloadBtn.style.backgroundColor = '#4caf50';
                downloadBtn.style.color = 'white';
                
                setTimeout(() => {
                    downloadBtn.textContent = '💾 Download';
                    downloadBtn.style.backgroundColor = '';
                    downloadBtn.style.color = '';
                    this.isDownloading = false;
                }, 3000);
            }
        }
        
        // Log progress every 10 viewports or at completion
        if (this.currentViewport % 10 === 0 || this.currentViewport === this.totalViewports) {
            const elapsed = Date.now() - this.downloadStartTime;
            const rate = this.currentViewport / (elapsed / 1000);
            console.log(`PROGRESS: Loaded ${this.currentViewport}/${this.totalViewports} viewports (${percentage}%) - ${rate.toFixed(1)} viewports/sec`);
        }
    }
    
    // Start the automatic viewport-based download process
    async startViewportDownload() {
        if (this.isDownloading) {
            console.log('Download already in progress');
            return;
        }
        
        const map = this.getMapInstance();
        if (!map) {
            alert('Map not found. Please ensure the map is loaded.');
            return;
        }
        
        // Get trail coordinates
        const coordinates = this.getTrailCoordinates();
        if (!coordinates) {
            alert('Unable to get trail coordinates. Please select a trail first.');
            return;
        }
        
        console.log('STARTING: Viewport-based automatic download');
        this.isDownloading = true;
        this.downloadStartTime = Date.now();
        
        // Store original map view to restore later
        this.originalMapView = {
            center: map.getCenter(),
            zoom: map.getZoom()
        };
        
        // Calculate viewports for multiple zoom levels
        const zoomLevels = [14, 15, 16]; // High resolution levels
        let allViewports = [];
        
        zoomLevels.forEach(zoom => {
            const viewports = this.calculateViewportsForTrail(coordinates, zoom);
            allViewports = allViewports.concat(viewports);
        });
        
        this.totalViewports = allViewports.length;
        this.currentViewport = 0;
        
        console.log(`CALCULATED: ${this.totalViewports} total viewports across zoom levels ${zoomLevels.join(', ')}`);
        
        // Visit each viewport to load tiles
        for (const viewport of allViewports) {
            if (!this.isDownloading) {
                console.log('Download cancelled by user');
                break;
            }
            
            // Move map to viewport position
            map.setView(viewport.center, viewport.zoom);
            
            // Wait for tiles to load (simulates manual panning pause)
            await this.waitForTilesToLoad();
            
            this.currentViewport++;
            this.updateProgress();
            
            // Small delay between viewports to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Restore original map view
        if (this.originalMapView) {
            map.setView(this.originalMapView.center, this.originalMapView.zoom);
        }
        
        const totalTime = (Date.now() - this.downloadStartTime) / 1000;
        console.log(`COMPLETE: Viewport-based download finished in ${totalTime.toFixed(1)} seconds`);
        console.log('ANDROID: All trail areas should now be available offline!');
    }
    
    // Cancel the download process
    cancelDownload() {
        if (this.isDownloading) {
            this.isDownloading = false;
            
            // Restore original map view
            if (this.originalMapView) {
                const map = this.getMapInstance();
                if (map) {
                    map.setView(this.originalMapView.center, this.originalMapView.zoom);
                }
            }
            
            // Reset button
            const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Auto-Loading'));
            
            if (downloadBtn) {
                downloadBtn.textContent = '💾 Download';
                downloadBtn.style.backgroundColor = '';
                downloadBtn.style.color = '';
            }
            
            console.log('CANCELLED: Viewport-based download cancelled');
        }
    }
};

// Initialize the viewport downloader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('*** INITIALIZING VIEWPORT-BASED AUTOMATIC DOWNLOADER ***');
    
    // Create the downloader instance
    window.viewportDownloader = new window.ViewportAutoDownloader();
    
    // Wait for page to load, then override the download button
    setTimeout(() => {
        const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Download'));
        
        if (downloadBtn) {
            // Store original click handler
            const originalHandler = downloadBtn.onclick;
            
            // Remove existing event listeners
            const newBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
            
            // Add viewport-based download functionality
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('CLICKED: Starting viewport-based automatic download...');
                await window.viewportDownloader.startViewportDownload();
            });
            
            console.log('SUCCESS: Download button overridden with viewport-based system');
            console.log('READY: Click Download to start automatic viewport loading');
        } else {
            console.log('WARNING: Download button not found, will retry...');
            
            // Retry after another moment
            setTimeout(() => {
                const retryBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent.includes('Download'));
                
                if (retryBtn) {
                    const newBtn = retryBtn.cloneNode(true);
                    retryBtn.parentNode.replaceChild(newBtn, retryBtn);
                    
                    newBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await window.viewportDownloader.startViewportDownload();
                    });
                    
                    console.log('SUCCESS: Download button found and overridden on retry');
                }
            }, 2000);
        }
    }, 1000);
});

console.log('SUCCESS: Viewport-based automatic downloader loaded and ready!');

