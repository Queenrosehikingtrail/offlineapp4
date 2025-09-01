/**
 * Mobile-Optimized Offline Tile System for Queen Rose Hiking Trail App
 * Fixes Android blob URL loading issues and provides reliable offline tile serving
 */

class MobileOfflineTileSystem {
    constructor() {
        this.db = null;
        this.storeName = 'tiles';
        this.isDownloading = false;
        this.downloadProgress = { current: 0, total: 0 };
        this.offlineLayer = null;
        this.blobUrlCache = new Map(); // Cache blob URLs to avoid recreation
        this.tileCache = new Map(); // Cache tile elements for reuse
        
        console.log('📱 Mobile Offline Tile System initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.initDatabase();
            this.createOfflineLayer();
            this.setupDownloadButton();
            console.log('✅ Mobile Offline Tile System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Mobile Offline Tile System:', error);
        }
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('HikingAppTiles', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Mobile: IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    console.log('✅ Mobile: Object store created');
                }
            };
        });
    }
    
    createOfflineLayer() {
        const self = this;
        
        this.offlineLayer = L.tileLayer('', {
            maxZoom: 20,
            attribution: '© Google Maps',
            
            // Mobile-optimized createTile method
            createTile: function(coords, done) {
                const tile = document.createElement('img');
                const tileKey = `${coords.z}/${coords.x}/${coords.y}`;
                
                console.log(`📱 Mobile: Creating tile for ${tileKey}`);
                
                // Set up error handling first
                tile.onerror = function() {
                    console.log(`❌ Mobile: Tile load failed for ${tileKey}, trying fallback`);
                    self.handleTileError(tile, coords, done);
                };
                
                // Try to get offline tile
                self.getMobileTile(tileKey).then(result => {
                    if (result.success && result.url) {
                        console.log(`✅ Mobile: Serving cached tile ${tileKey}`);
                        
                        // Set up success handler
                        tile.onload = function() {
                            console.log(`✅ Mobile: Tile loaded successfully ${tileKey}`);
                            done(null, tile);
                        };
                        
                        // Set the source
                        tile.src = result.url;
                        
                    } else {
                        console.log(`🌐 Mobile: No cache for ${tileKey}, using fallback`);
                        self.handleTileError(tile, coords, done);
                    }
                }).catch(error => {
                    console.error(`❌ Mobile: Error retrieving tile ${tileKey}:`, error);
                    self.handleTileError(tile, coords, done);
                });
                
                return tile;
            }
        });
        
        console.log('✅ Mobile: Offline tile layer created');
    }
    
    async getMobileTile(key) {
        try {
            // Check blob URL cache first
            if (this.blobUrlCache.has(key)) {
                const cachedUrl = this.blobUrlCache.get(key);
                console.log(`📱 Mobile: Using cached blob URL for ${key}`);
                return { success: true, url: cachedUrl };
            }
            
            // Get blob from IndexedDB
            const blob = await this.getTile(key);
            if (!blob) {
                return { success: false, error: 'No blob found' };
            }
            
            // Create and validate blob URL
            const blobUrl = await this.createValidatedBlobUrl(blob, key);
            if (blobUrl) {
                // Cache the blob URL for reuse
                this.blobUrlCache.set(key, blobUrl);
                return { success: true, url: blobUrl };
            } else {
                return { success: false, error: 'Blob URL creation failed' };
            }
            
        } catch (error) {
            console.error(`❌ Mobile: Error in getMobileTile for ${key}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    async createValidatedBlobUrl(blob, key) {
        try {
            // Create blob URL
            const blobUrl = URL.createObjectURL(blob);
            console.log(`📱 Mobile: Created blob URL for ${key}: ${blobUrl.substring(0, 50)}...`);
            
            // Validate blob URL by testing if it's accessible
            return new Promise((resolve) => {
                const testImg = new Image();
                
                testImg.onload = function() {
                    console.log(`✅ Mobile: Blob URL validated for ${key}`);
                    resolve(blobUrl);
                };
                
                testImg.onerror = function() {
                    console.error(`❌ Mobile: Blob URL validation failed for ${key}`);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                };
                
                // Set a timeout for validation
                setTimeout(() => {
                    console.warn(`⚠️ Mobile: Blob URL validation timeout for ${key}`);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                }, 5000);
                
                testImg.src = blobUrl;
            });
            
        } catch (error) {
            console.error(`❌ Mobile: Error creating blob URL for ${key}:`, error);
            return null;
        }
    }
    
    handleTileError(tile, coords, done) {
        // Fallback to online Google Maps
        const onlineUrl = `https://mt1.google.com/vt/lyrs=s&x=${coords.x}&y=${coords.y}&z=${coords.z}`;
        
        tile.onload = function() {
            console.log(`🌐 Mobile: Online fallback loaded for ${coords.z}/${coords.x}/${coords.y}`);
            done(null, tile);
        };
        
        tile.onerror = function() {
            console.error(`❌ Mobile: Both offline and online failed for ${coords.z}/${coords.x}/${coords.y}`);
            done(new Error('Tile load failed'), null);
        };
        
        tile.src = onlineUrl;
    }
    
    setupDownloadButton() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachDownloadHandler());
        } else {
            this.attachDownloadHandler();
        }
    }
    
    attachDownloadHandler() {
        // Find the download button using multiple strategies
        let downloadButton = document.querySelector('button[onclick*="downloadOfflineTiles"]');
        
        if (!downloadButton) {
            // Try to find by text content
            const buttons = Array.from(document.querySelectorAll('button'));
            downloadButton = buttons.find(btn => 
                btn.textContent.includes('Download') || btn.textContent.includes('💾'));
        }
        
        if (downloadButton) {
            // Remove existing handlers
            downloadButton.onclick = null;
            
            // Add our mobile-optimized handler
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startMobileDownload();
            });
            
            console.log('✅ Mobile: Download button handler attached');
        } else {
            console.warn('⚠️ Mobile: Download button not found');
        }
    }
    
    async startMobileDownload() {
        if (this.isDownloading) {
            console.log('⚠️ Mobile: Download already in progress');
            return;
        }
        
        try {
            this.isDownloading = true;
            this.updateDownloadButton('Downloading 0%', true);
            
            // Get current map bounds
            const map = window.leafletMap;
            if (!map || !map.getBounds) {
                throw new Error('Map object not found or invalid');
            }
            
            const bounds = map.getBounds();
            const currentZoom = map.getZoom();
            
            // Calculate tiles for multiple zoom levels (mobile-optimized range)
            const minZoom = Math.max(10, currentZoom - 1);
            const maxZoom = Math.min(16, currentZoom + 3);
            
            console.log(`📱 Mobile: Calculating tiles for zoom ${minZoom}-${maxZoom}`);
            const tiles = this.calculateTiles(bounds, minZoom, maxZoom);
            
            console.log(`📱 Mobile: Will download ${tiles.length} tiles`);
            this.downloadProgress = { current: 0, total: tiles.length };
            
            // Download tiles in smaller batches for mobile
            const batchSize = 2; // Smaller batch size for mobile
            for (let i = 0; i < tiles.length; i += batchSize) {
                const batch = tiles.slice(i, i + batchSize);
                await this.downloadBatch(batch);
                
                // Update progress
                this.downloadProgress.current = Math.min(i + batchSize, tiles.length);
                const percentage = Math.round((this.downloadProgress.current / this.downloadProgress.total) * 100);
                this.updateDownloadButton(`Downloading ${percentage}%`, true);
                
                // Small delay between batches for mobile performance
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`✅ Mobile: Download complete! ${tiles.length} tiles stored`);
            this.updateDownloadButton('Download Complete!', false, 'success');
            
            // Reset button after delay
            setTimeout(() => {
                this.updateDownloadButton('💾 Download', false);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Mobile: Download failed:', error);
            this.updateDownloadButton('Download Failed', false, 'error');
            
            setTimeout(() => {
                this.updateDownloadButton('💾 Download', false);
            }, 3000);
        } finally {
            this.isDownloading = false;
        }
    }
    
    calculateTiles(bounds, minZoom, maxZoom) {
        const tiles = [];
        const map = window.leafletMap;
        
        for (let z = minZoom; z <= maxZoom; z++) {
            const nwTile = map.project(bounds.getNorthWest(), z).divideBy(256).floor();
            const seTile = map.project(bounds.getSouthEast(), z).divideBy(256).floor();
            
            for (let x = nwTile.x; x <= seTile.x; x++) {
                for (let y = nwTile.y; y <= seTile.y; y++) {
                    tiles.push({ x, y, z });
                }
            }
        }
        
        return tiles;
    }
    
    async downloadBatch(tiles) {
        const promises = tiles.map(tile => this.downloadTile(tile));
        await Promise.all(promises);
    }
    
    async downloadTile(tile) {
        const { x, y, z } = tile;
        const tileKey = `${z}/${x}/${y}`;
        
        try {
            // Check if tile already exists
            const existingTile = await this.getTile(tileKey);
            if (existingTile) {
                console.log(`⏭️ Mobile: Tile ${tileKey} already cached`);
                return;
            }
            
            // Download from Google Maps
            const url = `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const blob = await response.blob();
            await this.storeTile(tileKey, blob, z);
            
            console.log(`✅ Mobile: Downloaded and stored tile: ${tileKey} (${blob.size} bytes)`);
            
        } catch (error) {
            console.error(`❌ Mobile: Failed to download tile ${tileKey}:`, error);
        }
    }
    
    async storeTile(key, blob, zoom) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const tileData = {
                key: key,
                blob: blob,
                zoom: zoom,
                timestamp: Date.now()
            };
            
            const request = store.put(tileData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async getTile(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.blob : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    updateDownloadButton(text, disabled, status = '') {
        let downloadButton = document.querySelector('button[onclick*="downloadOfflineTiles"]');
        
        if (!downloadButton) {
            // Try to find by text content
            const buttons = Array.from(document.querySelectorAll('button'));
            downloadButton = buttons.find(btn => 
                btn.textContent.includes('Download') || btn.textContent.includes('💾'));
        }
        
        if (downloadButton) {
            downloadButton.textContent = text;
            downloadButton.disabled = disabled;
            
            // Update button styling based on status
            downloadButton.className = downloadButton.className.replace(/\b(downloading|success|error)\b/g, '');
            if (status) {
                downloadButton.classList.add(status);
            }
        }
    }
    
    enableOfflineMode() {
        const map = window.leafletMap;
        if (map && this.offlineLayer) {
            // Remove existing satellite layers
            map.eachLayer(function(layer) {
                if (layer._url && layer._url.includes('google.com')) {
                    map.removeLayer(layer);
                }
            });
            
            // Add our mobile offline layer
            map.addLayer(this.offlineLayer);
            console.log('✅ Mobile: Offline mode enabled');
        } else {
            console.warn('⚠️ Mobile: Could not enable offline mode');
        }
    }
    
    async getTileCount() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Cleanup method for memory management
    cleanup() {
        // Revoke all cached blob URLs
        for (const [key, url] of this.blobUrlCache) {
            URL.revokeObjectURL(url);
        }
        this.blobUrlCache.clear();
        this.tileCache.clear();
        console.log('✅ Mobile: Cleanup completed');
    }
}

// Initialize the mobile offline tile system
console.log('📱 Initializing Mobile Offline Tile System...');
window.mobileOfflineSystem = new MobileOfflineTileSystem();

// Auto-enable offline mode when system is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.mobileOfflineSystem && window.mobileOfflineSystem.offlineLayer) {
            window.mobileOfflineSystem.enableOfflineMode();
        }
    }, 2000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.mobileOfflineSystem) {
        window.mobileOfflineSystem.cleanup();
    }
});

