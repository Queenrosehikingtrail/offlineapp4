/**
 * Working Offline Tile System for Queen Rose Hiking App
 * Clean implementation with Android/mobile optimizations integrated
 */

console.log('🚀 Loading Working Offline Tile System...');

class WorkingOfflineSystem {
    constructor() {
        this.dbName = 'HikingAppTiles';
        this.dbVersion = 1;
        this.storeName = 'tiles';
        this.db = null;
        this.isDownloading = false;
        this.downloadProgress = { current: 0, total: 0 };
        this.offlineLayer = null;
        
        // Mobile optimizations
        this.isMobile = this.detectMobile();
        this.blobUrlCache = new Map(); // Cache blob URLs for mobile reuse
        
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
            this.setupOfflineLayer();
            this.setupDownloadButton();
            console.log('✅ Working offline system initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize working offline system:', error);
        }
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database initialized successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('zoom', 'zoom', { unique: false });
                    console.log('✅ Database schema created');
                }
            };
        });
    }
    
    setupOfflineLayer() {
        // Create a custom tile layer with mobile optimizations
        const self = this;
        
        this.offlineLayer = L.tileLayer('', {
            maxZoom: 20,
            attribution: '© Google Maps',
            
            // Mobile-optimized createTile method
            createTile: function(coords, done) {
                const tile = document.createElement('img');
                const tileKey = `${coords.z}/${coords.x}/${coords.y}`;
                
                console.log(`🔧 Creating tile for ${tileKey} (Mobile: ${self.isMobile})`);
                
                // Mobile-optimized error handling
                tile.onerror = function(e) {
                    console.log(`❌ Tile load failed for ${tileKey}, trying fallback`);
                    self.handleTileError(tile, coords, done);
                };
                
                // Get offline tile with mobile optimizations
                self.getMobileTile(tileKey).then(result => {
                    if (result.success && result.url) {
                        console.log(`✅ Serving cached tile ${tileKey}`);
                        
                        // Mobile-optimized success handler
                        tile.onload = function() {
                            console.log(`✅ Tile loaded successfully ${tileKey}`);
                            done(null, tile);
                        };
                        
                        // Set the source with mobile considerations
                        tile.src = result.url;
                        
                        // Mobile-specific: Add crossorigin attribute
                        if (self.isMobile) {
                            tile.crossOrigin = 'anonymous';
                        }
                        
                    } else {
                        console.log(`🌐 No cache for ${tileKey}, using fallback`);
                        self.handleTileError(tile, coords, done);
                    }
                }).catch(error => {
                    console.error(`❌ Error retrieving tile ${tileKey}:`, error);
                    self.handleTileError(tile, coords, done);
                });
                
                return tile;
            }
        });
        
        console.log('✅ Offline tile layer created');
    }
    
    async getMobileTile(key) {
        try {
            // Mobile optimization: Check blob URL cache first
            if (this.isMobile && this.blobUrlCache.has(key)) {
                const cachedUrl = this.blobUrlCache.get(key);
                console.log(`📱 Using cached blob URL for ${key}`);
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
            console.error(`❌ Error in getMobileTile for ${key}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    async createMobileBlobUrl(blob, key) {
        try {
            // Create blob URL
            const blobUrl = URL.createObjectURL(blob);
            console.log(`📱 Created mobile blob URL for ${key}`);
            
            // Mobile validation: Test if blob URL is accessible
            return new Promise((resolve) => {
                const testImg = new Image();
                
                // Set up validation handlers
                testImg.onload = function() {
                    console.log(`✅ Mobile blob URL validated for ${key}`);
                    resolve(blobUrl);
                };
                
                testImg.onerror = function(e) {
                    console.error(`❌ Mobile blob URL validation failed for ${key}:`, e);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                };
                
                // Mobile-specific: Set timeout for validation
                setTimeout(() => {
                    console.warn(`⚠️ Mobile blob URL validation timeout for ${key}`);
                    URL.revokeObjectURL(blobUrl);
                    resolve(null);
                }, 3000); // Shorter timeout for mobile
                
                // Mobile-specific: Set crossorigin
                testImg.crossOrigin = 'anonymous';
                testImg.src = blobUrl;
            });
            
        } catch (error) {
            console.error(`❌ Error creating mobile blob URL for ${key}:`, error);
            return null;
        }
    }
    
    handleTileError(tile, coords, done) {
        // Fallback to online Google Maps
        const onlineUrl = `https://mt1.google.com/vt/lyrs=s&x=${coords.x}&y=${coords.y}&z=${coords.z}`;
        
        tile.onload = function() {
            console.log(`🌐 Online fallback loaded for ${coords.z}/${coords.x}/${coords.y}`);
            done(null, tile);
        };
        
        tile.onerror = function() {
            console.error(`❌ Both offline and online failed for ${coords.z}/${coords.x}/${coords.y}`);
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
        const downloadBtn = document.getElementById('download-map-btn');
        if (downloadBtn) {
            // Remove any existing event listeners by cloning the button
            const newBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
            
            // Add our event listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startDownload();
            });
            
            console.log('✅ Download button handler attached');
        } else {
            console.warn('⚠️ Download button not found, retrying in 1 second...');
            setTimeout(() => this.attachDownloadHandler(), 1000);
        }
    }
    
    async startDownload() {
        if (this.isDownloading) {
            console.log('⏳ Download already in progress');
            return;
        }
        
        console.log('🚀 Starting offline tile download...');
        console.log('📱 Mobile optimizations enabled:', this.isMobile);
        this.isDownloading = true;
        
        const downloadBtn = document.getElementById('download-map-btn');
        if (!downloadBtn) {
            console.error('❌ Download button not found');
            this.isDownloading = false;
            return;
        }
        
        try {
            // Get current map bounds
            // Use the correct map object
            const map = window.leafletMap;
            if (!map || !map.getBounds) {
                throw new Error('Map object not found or invalid');
            }           
            const bounds = map.getBounds();
            const currentZoom = map.getZoom();
            
            // Mobile-optimized zoom range (smaller range for mobile)
            const minZoom = Math.max(currentZoom - 1, 10);
            const maxZoom = Math.min(currentZoom + (this.isMobile ? 2 : 3), this.isMobile ? 15 : 18);
            
            const tilesToDownload = this.calculateTiles(bounds, minZoom, maxZoom);
            this.downloadProgress.total = tilesToDownload.length;
            this.downloadProgress.current = 0;
            
            console.log(`📊 Will download ${tilesToDownload.length} tiles (zoom ${minZoom}-${maxZoom})`);
            console.log(`📱 Mobile optimized range: ${this.isMobile ? 'YES' : 'NO'}`);
            
            // Update button to show progress
            downloadBtn.textContent = 'Downloading 0%';
            downloadBtn.style.backgroundColor = '#ffc107';
            downloadBtn.disabled = true;
            
            // Mobile-optimized batch size (smaller for mobile)
            const batchSize = this.isMobile ? 2 : 3;
            console.log(`📱 Using batch size: ${batchSize} (Mobile: ${this.isMobile})`);
            
            for (let i = 0; i < tilesToDownload.length; i += batchSize) {
                const batch = tilesToDownload.slice(i, i + batchSize);
                
                // Download batch in parallel
                await Promise.all(batch.map(tile => this.downloadTile(tile)));
                
                // Update progress
                this.downloadProgress.current = Math.min(i + batchSize, tilesToDownload.length);
                const progress = Math.round((this.downloadProgress.current / this.downloadProgress.total) * 100);
                downloadBtn.textContent = `Downloading ${progress}%`;
                
                // Log progress every 10 tiles
                if (i % 10 === 0) {
                    console.log(`📥 Downloaded ${this.downloadProgress.current}/${this.downloadProgress.total} tiles`);
                }
                
                // Mobile-optimized delay (longer for mobile to prevent overload)
                const delay = this.isMobile ? 300 : 200;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            console.log(`✅ Download complete! ${this.downloadProgress.current} tiles stored`);
            downloadBtn.textContent = 'Download Complete!';
            downloadBtn.style.backgroundColor = '#28a745';
            
            // Enable offline mode by replacing the satellite layer
            this.enableOfflineMode();
            
            // Reset button after 3 seconds
            setTimeout(() => {
                downloadBtn.textContent = '💾 Download';
                downloadBtn.style.backgroundColor = '#007bff';
                downloadBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('❌ Download failed:', error);
            downloadBtn.textContent = 'Download Failed';
            downloadBtn.style.backgroundColor = '#dc3545';
            
            setTimeout(() => {
                downloadBtn.textContent = '💾 Download';
                downloadBtn.style.backgroundColor = '#007bff';
                downloadBtn.disabled = false;
            }, 3000);
        } finally {
            this.isDownloading = false;
        }
    }
    
    calculateTiles(bounds, minZoom, maxZoom) {
        const tiles = [];
        const map = window.leafletMap; // Use the correct map object
        
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
    
    async downloadTile(tile) {
        const { x, y, z } = tile;
        const tileKey = `${z}/${x}/${y}`;
        
        try {
            // Check if tile already exists
            const existing = await this.getTile(tileKey);
            if (existing) {
                console.log(`⏭️ Tile already exists: ${tileKey}`);
                return;
            }
            
            // Download from Google Maps satellite layer
            const url = `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const blob = await response.blob();
                await this.storeTile(tileKey, blob, z);
                console.log(`✅ Downloaded and stored tile: ${tileKey} (${blob.size} bytes)`);
            } else {
                console.warn(`⚠️ Failed to download tile ${tileKey}: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error downloading tile ${tileKey}:`, error);
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
    
    enableOfflineMode() {
        // Replace the current satellite layer with our offline l    enableOfflineMode() {
        const map = window.leafletMap;
        if (map && window.satelliteLayer) {
            if (map.hasLayer(window.satelliteLayer)) {
                map.removeLayer(window.satelliteLayer);
            }
            map.addLayer(this.offlineLayer);
            console.log('✅ Offline mode enabled - tiles will be served from storage');
        } else {
            console.warn('⚠️ Could not enable offline mode - satellite layer not found');
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
        console.log('✅ Mobile: Cleanup completed');
    }
}

// Initialize the working offline system
window.workingOfflineSystem = new WorkingOfflineSystem();

console.log('🎯 Working Offline Tile System loaded and ready!');

// Auto-enable offline mode when system is ready and tiles are available
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.workingOfflineSystem && window.workingOfflineSystem.offlineLayer) {
            window.workingOfflineSystem.getTileCount().then(count => {
                if (count > 0) {
                    console.log(`🔧 Auto-enabling offline mode with ${count} cached tiles`);
                    window.workingOfflineSystem.enableOfflineMode();
                }
            });
        }
    }, 2000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.workingOfflineSystem) {
        window.workingOfflineSystem.cleanup();
    }
});

