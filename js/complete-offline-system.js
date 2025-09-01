/**
 * Complete Offline Tile System for Queen Rose Hiking Trail App
 * Integrates mobile-optimized blob URL handling with the existing working system
 * Fixes Android tile serving issues while maintaining compatibility
 */

class CompleteOfflineTileSystem {
    constructor() {
        this.db = null;
        this.storeName = 'tiles';
        this.isDownloading = false;
        this.downloadProgress = { current: 0, total: 0 };
        this.offlineLayer = null;
        this.blobUrlCache = new Map(); // Cache blob URLs for mobile compatibility
        this.isMobile = this.detectMobile();
        
        console.log('🚀 Complete Offline Tile System initializing...');
        console.log('📱 Mobile device detected:', this.isMobile);
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    async init() {
        try {
            await this.initDatabase();
            this.createOfflineLayer();
            this.setupDownloadButton();
            console.log('✅ Complete Offline Tile System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Complete Offline Tile System:', error);
        }
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('HikingAppTiles', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Complete: IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    console.log('✅ Complete: Object store created');
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
                
                console.log(`🔧 Complete: Creating tile for ${tileKey} (Mobile: ${self.isMobile})`);
                
                // Mobile-optimized error handling
                tile.onerror = function(e) {
                    console.log(`❌ Complete: Tile load failed for ${tileKey}, trying fallback`);
                    self.handleTileError(tile, coords, done);
                };
                
                // Get offline tile with mobile optimizations
                self.getOptimizedTile(tileKey).then(result => {
                    if (result.success && result.url) {
                        console.log(`✅ Complete: Serving cached tile ${tileKey}`);
                        
                        // Mobile-optimized success handler
                        tile.onload = function() {
                            console.log(`✅ Complete: Tile loaded successfully ${tileKey}`);
                            done(null, tile);
                        };
                        
                        // Set the source with mobile considerations
                        tile.src = result.url;
                        
                        // Mobile-specific: Add crossorigin attribute
                        if (self.isMobile) {
                            tile.crossOrigin = 'anonymous';
                        }
                        
                    } else {
                        console.log(`🌐 Complete: No cache for ${tileKey}, using fallback`);
                        self.handleTileError(tile, coords, done);
                    }
                }).catch(error => {
                    console.error(`❌ Complete: Error retrieving tile ${tileKey}:`, error);
                    self.handleTileError(tile, coords, done);
                });
                
                return tile;
            }
        });
        
        console.log('✅ Complete: Offline tile layer created');
    }
    
    async getOptimizedTile(key) {
        try {
            // Mobile optimization: Check blob URL cache first
            if (this.isMobile && this.blobUrlCache.has(key)) {
                const cachedUrl = this.blobUrlCache.get(key);
                console.log(`📱 Complete: Using cached blob URL for ${key}`);
                return { success: true, url: cachedUrl };
            }
            
            // Get blob from IndexedDB
            const blob = await this.getTile(key);
            if (!blob) {
                return { success: false, error: 'No blob found' };
            }
            
            // Mobile-optimized blob URL creation
            if (this.isMobile) {
                const blobUrl = await this.createMobileBlobUrl(blob, key);
                if (blobUrl) {
                    // Cache the blob URL for mobile reuse
                    this.blobUrlCache.set(key, blobUrl);
                    return { success: true, url: blobUrl };
                } else {
                    return { success: false, error: 'Mobile blob URL creation failed' };
                }
            } else {
                // Desktop: Use standard blob URL creation
                const blobUrl = URL.createObjectURL(blob);
                return { success: true, url: blobUrl };
            }
            
        } catch (error) {
            console.error(`❌ Complete: Error in getOptimizedTile for ${key}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    async createMobileBlobUrl(blob, key) {
        try {
            // Create blob URL
            const blobUrl = URL.createObjectURL(blob);
            console.log(`📱 Complete: Created mobile blob URL for ${key}`);
            
            // Mobile validation: Test if blob URL is accessible
            return new Promise((resolve) => {
                const testImg = new Image();
                
                // Set up validation handlers
                testImg.onload = function() {
                    console.log(`✅ Complete: Mobile blob URL validated for ${key}`);
                    resolve(blobUrl);
                };
                
                testImg.onerror = function(e) {
                    console.error(`❌ Complete: Mobile blob URL validation failed for ${key}:`, e);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                };
                
                // Mobile-specific: Set timeout for validation
                setTimeout(() => {
                    console.warn(`⚠️ Complete: Mobile blob URL validation timeout for ${key}`);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                }, 3000); // Shorter timeout for mobile
                
                // Mobile-specific: Set crossorigin
                testImg.crossOrigin = 'anonymous';
                testImg.src = blobUrl;
            });
            
        } catch (error) {
            console.error(`❌ Complete: Error creating mobile blob URL for ${key}:`, error);
            return null;
        }
    }
    
    handleTileError(tile, coords, done) {
        // Fallback to online Google Maps
        const onlineUrl = `https://mt1.google.com/vt/lyrs=s&x=${coords.x}&y=${coords.y}&z=${coords.z}`;
        
        tile.onload = function() {
            console.log(`🌐 Complete: Online fallback loaded for ${coords.z}/${coords.x}/${coords.y}`);
            done(null, tile);
        };
        
        tile.onerror = function() {
            console.error(`❌ Complete: Both offline and online failed for ${coords.z}/${coords.x}/${coords.y}`);
            done(new Error('Tile load failed'), null);
        };
        
        // Mobile-specific: Set crossorigin for online tiles too
        if (this.isMobile) {
            tile.crossOrigin = 'anonymous';
        }
        
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
            
            // Add our complete system handler
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startCompleteDownload();
            });
            
            console.log('✅ Complete: Download button handler attached');
        } else {
            console.warn('⚠️ Complete: Download button not found');
        }
    }
    
    async startCompleteDownload() {
        if (this.isDownloading) {
            console.log('⚠️ Complete: Download already in progress');
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
            
            // Mobile-optimized zoom range
            const minZoom = Math.max(10, currentZoom - 1);
            const maxZoom = Math.min(this.isMobile ? 15 : 16, currentZoom + (this.isMobile ? 2 : 3));
            
            console.log(`🔧 Complete: Calculating tiles for zoom ${minZoom}-${maxZoom} (Mobile: ${this.isMobile})`);
            const tiles = this.calculateTiles(bounds, minZoom, maxZoom);
            
            console.log(`🔧 Complete: Will download ${tiles.length} tiles`);
            this.downloadProgress = { current: 0, total: tiles.length };
            
            // Mobile-optimized batch size
            const batchSize = this.isMobile ? 2 : 3;
            for (let i = 0; i < tiles.length; i += batchSize) {
                const batch = tiles.slice(i, i + batchSize);
                await this.downloadBatch(batch);
                
                // Update progress
                this.downloadProgress.current = Math.min(i + batchSize, tiles.length);
                const percentage = Math.round((this.downloadProgress.current / this.downloadProgress.total) * 100);
                this.updateDownloadButton(`Downloading ${percentage}%`, true);
                
                // Mobile-optimized delay
                await new Promise(resolve => setTimeout(resolve, this.isMobile ? 150 : 100));
            }
            
            console.log(`✅ Complete: Download complete! ${tiles.length} tiles stored`);
            this.updateDownloadButton('Download Complete!', false, 'success');
            
            // Auto-enable offline mode
            setTimeout(() => {
                this.enableOfflineMode();
            }, 1000);
            
            // Reset button after delay
            setTimeout(() => {
                this.updateDownloadButton('💾 Download', false);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Complete: Download failed:', error);
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
                console.log(`⏭️ Complete: Tile ${tileKey} already cached`);
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
            
            console.log(`✅ Complete: Downloaded and stored tile: ${tileKey} (${blob.size} bytes)`);
            
        } catch (error) {
            console.error(`❌ Complete: Failed to download tile ${tileKey}:`, error);
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
            
            // Add our complete offline layer
            map.addLayer(this.offlineLayer);
            console.log('✅ Complete: Offline mode enabled');
        } else {
            console.warn('⚠️ Complete: Could not enable offline mode');
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
    
    // Mobile-optimized cleanup method
    cleanup() {
        // Revoke all cached blob URLs
        for (const [key, url] of this.blobUrlCache) {
            URL.revokeObjectURL(url);
        }
        this.blobUrlCache.clear();
        console.log('✅ Complete: Cleanup completed');
    }
}

// Initialize the complete offline tile system
console.log('🚀 Initializing Complete Offline Tile System...');
window.completeOfflineSystem = new CompleteOfflineTileSystem();

// Auto-enable offline mode when system is ready and tiles are available
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.completeOfflineSystem && window.completeOfflineSystem.offlineLayer) {
            window.completeOfflineSystem.getTileCount().then(count => {
                if (count > 0) {
                    console.log(`🔧 Complete: Auto-enabling offline mode with ${count} cached tiles`);
                    window.completeOfflineSystem.enableOfflineMode();
                }
            });
        }
    }, 2000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.completeOfflineSystem) {
        window.completeOfflineSystem.cleanup();
    }
});

