// Fixed Automatic Trail Downloader System
// Addresses slow tile loading, network issues, and rate limiting

class FixedAutomaticTrailDownloader {
    constructor() {
        this.isDownloading = false;
        this.downloadProgress = 0;
        this.totalTiles = 0;
        this.downloadedTiles = 0;
        this.failedTiles = 0;
        this.retryAttempts = 3;
        this.requestDelay = 200; // 200ms delay between requests to avoid rate limiting
        this.timeoutDuration = 10000; // 10 second timeout per tile
        
        console.log('🤖 Fixed Automatic Trail Downloader initialized');
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDownloadButton());
        } else {
            this.setupDownloadButton();
        }
    }
    
    setupDownloadButton() {
        console.log('🔧 Setting up fixed download button...');
        
        // Find the download button
        const downloadBtn = document.querySelector('button[onclick*="downloadOfflineTiles"], button:contains("Download")');
        if (!downloadBtn) {
            // Find by text content
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.includes('Download')) {
                    this.replaceDownloadButton(btn);
                    return;
                }
            }
            console.error('❌ Download button not found');
            return;
        }
        
        this.replaceDownloadButton(downloadBtn);
    }
    
    replaceDownloadButton(originalBtn) {
        console.log('🔄 Replacing download button with fixed version...');
        
        // Remove existing onclick handlers
        originalBtn.onclick = null;
        originalBtn.removeAttribute('onclick');
        
        // Add new click handler
        originalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startSmartDownload();
        });
        
        console.log('✅ Fixed download button ready');
    }
    
    async startSmartDownload() {
        if (this.isDownloading) {
            console.log('⚠️ Download already in progress');
            return;
        }
        
        console.log('🚀 Starting smart trail download...');
        this.isDownloading = true;
        this.downloadProgress = 0;
        this.downloadedTiles = 0;
        this.failedTiles = 0;
        
        try {
            // Update button state
            this.updateDownloadButton('🤖 Smart Download Starting...', true);
            
            // Get map bounds for current view
            const bounds = this.getMapBounds();
            if (!bounds) {
                throw new Error('Could not get map bounds');
            }
            
            // Calculate tiles for multiple zoom levels
            const tilesToDownload = this.calculateSmartTiles(bounds);
            this.totalTiles = tilesToDownload.length;
            
            console.log(`📊 Smart download: ${this.totalTiles} tiles across zoom levels 12-16`);
            this.updateDownloadButton(`🤖 Downloading ${this.totalTiles} tiles...`, true);
            
            // Download tiles with smart pacing
            await this.downloadTilesWithSmartPacing(tilesToDownload);
            
            // Verify download success
            const successRate = ((this.downloadedTiles / this.totalTiles) * 100).toFixed(1);
            console.log(`✅ Smart download complete! ${this.downloadedTiles}/${this.totalTiles} tiles (${successRate}%)`);
            
            if (this.failedTiles > 0) {
                console.log(`⚠️ ${this.failedTiles} tiles failed - this is normal for edge areas`);
            }
            
            this.updateDownloadButton('✅ Smart Download Complete!', false);
            
            // Enable offline mode
            this.enableSmartOfflineMode();
            
            // Reset button after 3 seconds
            setTimeout(() => {
                this.updateDownloadButton('💾 Download', false);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Smart download failed:', error);
            this.updateDownloadButton('❌ Download Failed', false);
            setTimeout(() => {
                this.updateDownloadButton('💾 Download', false);
            }, 3000);
        } finally {
            this.isDownloading = false;
        }
    }
    
    getMapBounds() {
        // Try different map objects
        let map = null;
        
        if (window.leafletMap && window.leafletMap.getBounds) {
            map = window.leafletMap;
        } else if (window.map && window.map.getBounds) {
            map = window.map;
        } else {
            console.error('❌ No accessible map object found');
            return null;
        }
        
        const bounds = map.getBounds();
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        console.log('📍 Map bounds:', {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
            center: { lat: center.lat, lng: center.lng },
            zoom: zoom
        });
        
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
            center: { lat: center.lat, lng: center.lng },
            zoom: zoom
        };
    }
    
    calculateSmartTiles(bounds) {
        const tiles = [];
        
        // Download tiles for zoom levels 12-16 (overview to high detail)
        for (let zoom = 12; zoom <= 16; zoom++) {
            const zoomTiles = this.calculateTilesForZoom(bounds, zoom);
            tiles.push(...zoomTiles);
        }
        
        // Remove duplicates
        const uniqueTiles = tiles.filter((tile, index, self) => 
            index === self.findIndex(t => t.x === tile.x && t.y === tile.y && t.z === tile.z)
        );
        
        console.log(`📊 Calculated ${uniqueTiles.length} unique tiles across zoom levels 12-16`);
        return uniqueTiles;
    }
    
    calculateTilesForZoom(bounds, zoom) {
        // Convert lat/lng bounds to tile coordinates
        const minTileX = Math.floor(this.lngToTileX(bounds.west, zoom));
        const maxTileX = Math.floor(this.lngToTileX(bounds.east, zoom));
        const minTileY = Math.floor(this.latToTileY(bounds.north, zoom));
        const maxTileY = Math.floor(this.latToTileY(bounds.south, zoom));
        
        const tiles = [];
        
        for (let x = minTileX; x <= maxTileX; x++) {
            for (let y = minTileY; y <= maxTileY; y++) {
                tiles.push({ x, y, z: zoom });
            }
        }
        
        console.log(`📊 Zoom ${zoom}: ${tiles.length} tiles (${minTileX}-${maxTileX}, ${minTileY}-${maxTileY})`);
        return tiles;
    }
    
    lngToTileX(lng, zoom) {
        return (lng + 180) / 360 * Math.pow(2, zoom);
    }
    
    latToTileY(lat, zoom) {
        return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    }
    
    async downloadTilesWithSmartPacing(tiles) {
        console.log('🚀 Starting smart paced download...');
        
        // Process tiles in small batches with delays
        const batchSize = 2; // Only 2 concurrent downloads to avoid rate limiting
        
        for (let i = 0; i < tiles.length; i += batchSize) {
            const batch = tiles.slice(i, i + batchSize);
            
            // Download batch concurrently
            const batchPromises = batch.map(tile => this.downloadTileWithRetry(tile));
            await Promise.allSettled(batchPromises);
            
            // Update progress
            this.downloadProgress = Math.round((i + batchSize) / tiles.length * 100);
            this.updateDownloadButton(`🤖 Downloading ${this.downloadProgress}%`, true);
            
            // Delay between batches to avoid rate limiting
            if (i + batchSize < tiles.length) {
                await this.delay(this.requestDelay);
            }
        }
    }
    
    async downloadTileWithRetry(tile) {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                await this.downloadSingleTile(tile);
                this.downloadedTiles++;
                return;
            } catch (error) {
                console.log(`⚠️ Tile ${tile.x},${tile.y},${tile.z} failed attempt ${attempt}:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    // Wait longer between retries
                    await this.delay(this.requestDelay * attempt);
                } else {
                    this.failedTiles++;
                    console.log(`❌ Tile ${tile.x},${tile.y},${tile.z} failed after ${this.retryAttempts} attempts`);
                }
            }
        }
    }
    
    async downloadSingleTile(tile) {
        // Use the correct Google Maps tile URL format
        const tileUrl = `https://mt1.google.com/vt/lyrs=s&x=${tile.x}&y=${tile.y}&z=${tile.z}`;
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout after ${this.timeoutDuration}ms`));
            }, this.timeoutDuration);
            
            fetch(tileUrl)
                .then(response => {
                    clearTimeout(timeout);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // Store in IndexedDB
                    return this.storeTileInIndexedDB(tile, blob);
                })
                .then(() => {
                    resolve();
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }
    
    async storeTileInIndexedDB(tile, blob) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('OfflineTiles', 1);
            
            request.onerror = () => reject(new Error('IndexedDB error'));
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tiles')) {
                    db.createObjectStore('tiles', { keyPath: 'key' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['tiles'], 'readwrite');
                const store = transaction.objectStore('tiles');
                
                const key = `${tile.z}/${tile.x}/${tile.y}`;
                store.put({ key, blob, timestamp: Date.now() });
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(new Error('Transaction failed'));
            };
        });
    }
    
    enableSmartOfflineMode() {
        console.log('🔧 Enabling smart offline mode...');
        
        // Find the map and add offline layer
        const map = window.leafletMap || window.map;
        if (!map) {
            console.error('❌ Cannot enable offline mode - no map found');
            return;
        }
        
        // Create offline tile layer
        const offlineLayer = L.tileLayer('', {
            attribution: '© Google Maps (Offline)',
            maxZoom: 18
        });
        
        // Override the createTile method for offline serving
        offlineLayer.createTile = (coords, done) => {
            const tile = document.createElement('img');
            const key = `${coords.z}/${coords.x}/${coords.y}`;
            
            // Try to get tile from IndexedDB
            this.getTileFromIndexedDB(key)
                .then(blob => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        tile.src = url;
                        tile.onload = () => {
                            URL.revokeObjectURL(url);
                            done(null, tile);
                        };
                    } else {
                        // Fallback to online
                        const onlineUrl = `https://mt1.google.com/vt/lyrs=s&x=${coords.x}&y=${coords.y}&z=${coords.z}`;
                        tile.src = onlineUrl;
                        tile.onload = () => done(null, tile);
                    }
                })
                .catch(() => {
                    // Fallback to online
                    const onlineUrl = `https://mt1.google.com/vt/lyrs=s&x=${coords.x}&y=${coords.y}&z=${coords.z}`;
                    tile.src = onlineUrl;
                    tile.onload = () => done(null, tile);
                });
            
            return tile;
        };
        
        // Replace existing satellite layer
        map.eachLayer(layer => {
            if (layer._url && layer._url.includes('lyrs=s')) {
                map.removeLayer(layer);
            }
        });
        
        map.addLayer(offlineLayer);
        console.log('✅ Smart offline mode enabled');
    }
    
    async getTileFromIndexedDB(key) {
        return new Promise((resolve) => {
            const request = indexedDB.open('OfflineTiles', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['tiles'], 'readonly');
                const store = transaction.objectStore('tiles');
                const getRequest = store.get(key);
                
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    resolve(result ? result.blob : null);
                };
                
                getRequest.onerror = () => resolve(null);
            };
            
            request.onerror = () => resolve(null);
        });
    }
    
    updateDownloadButton(text, disabled) {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent.includes('Download') || btn.textContent.includes('Smart Download') || btn.textContent.includes('🤖')) {
                btn.textContent = text;
                btn.disabled = disabled;
                if (disabled) {
                    btn.style.opacity = '0.6';
                } else {
                    btn.style.opacity = '1';
                }
                break;
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the fixed automatic trail downloader
console.log('🚀 Initializing Fixed Automatic Trail Downloader...');
window.fixedTrailDownloader = new FixedAutomaticTrailDownloader();

