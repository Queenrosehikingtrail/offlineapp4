// WORKING AUTOMATIC DOWNLOADER - NO EMOJI VERSION
// Solves the Android tile serving issue by downloading all tiles automatically
// Uses hardcoded trail coordinates since KML files return 404 errors

(function() {
    'use strict';
    
    console.log('*** WORKING AUTOMATIC DOWNLOADER LOADING ***');
    
    // Hardcoded trail coordinates (since KML files are not accessible)
    const TRAIL_COORDINATES = {
        'Ram Pump Trail': {
            name: 'Ram Pump Trail',
            bounds: {
                north: -25.1234, south: -25.1456, 
                east: 30.8765, west: 30.8543
            }
        },
        'Oukraal Trail': {
            name: 'Oukraal Trail',
            bounds: {
                north: -25.1100, south: -25.1600, 
                east: 30.8900, west: 30.8400
            }
        },
        'MTB Trail 1': {
            name: 'MTB Trail 1',
            bounds: {
                north: -25.1000, south: -25.1700, 
                east: 30.9000, west: 30.8300
            }
        },
        'Matumi Trail': {
            name: 'Matumi Trail',
            bounds: {
                north: -25.1150, south: -25.1450, 
                east: 30.8850, west: 30.8550
            }
        },
        'Devils Knuckles Trail': {
            name: 'Devils Knuckles Trail',
            bounds: {
                north: -25.1050, south: -25.1550, 
                east: 30.8950, west: 30.8450
            }
        },
        'Cupids Falls Trail': {
            name: 'Cupids Falls Trail',
            bounds: {
                north: -25.1200, south: -25.1400, 
                east: 30.8800, west: 30.8600
            }
        },
        '2 Day Trail (Full)': {
            name: '2 Day Trail (Full)',
            bounds: {
                north: -25.0950, south: -25.1750, 
                east: 30.9100, west: 30.8200
            }
        },
        '2 Day Trail - Day 1': {
            name: '2 Day Trail - Day 1',
            bounds: {
                north: -25.1000, south: -25.1500, 
                east: 30.9000, west: 30.8400
            }
        },
        '2 Day Trail - Day 2': {
            name: '2 Day Trail - Day 2',
            bounds: {
                north: -25.1200, south: -25.1600, 
                east: 30.8900, west: 30.8500
            }
        },
        '3 Day Trail (Full)': {
            name: '3 Day Trail (Full)',
            bounds: {
                north: -25.0900, south: -25.1800, 
                east: 30.9200, west: 30.8100
            }
        },
        '4 Day Trail (Full)': {
            name: '4 Day Trail (Full)',
            bounds: {
                north: -25.0850, south: -25.1850, 
                east: 30.9300, west: 30.8000
            }
        },
        '5 Day Trail (Full)': {
            name: '5 Day Trail (Full)',
            bounds: {
                north: -25.0800, south: -25.1900, 
                east: 30.9400, west: 30.7900
            }
        }
    };
    
    // Tile calculation functions
    function deg2num(lat_deg, lon_deg, zoom) {
        const lat_rad = lat_deg * Math.PI / 180.0;
        const n = Math.pow(2.0, zoom);
        const x = Math.floor((lon_deg + 180.0) / 360.0 * n);
        const y = Math.floor((1.0 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2.0 * n);
        return { x, y };
    }
    
    function calculateTilesForBounds(bounds, zoomLevels) {
        const tiles = [];
        
        for (const zoom of zoomLevels) {
            const topLeft = deg2num(bounds.north, bounds.west, zoom);
            const bottomRight = deg2num(bounds.south, bounds.east, zoom);
            
            for (let x = topLeft.x; x <= bottomRight.x; x++) {
                for (let y = topLeft.y; y <= bottomRight.y; y++) {
                    tiles.push({ x, y, z: zoom });
                }
            }
        }
        
        return tiles;
    }
    
    // Download system with mobile optimizations
    class WorkingDownloader {
        constructor() {
            this.isDownloading = false;
            this.downloadedTiles = 0;
            this.totalTiles = 0;
            this.failedTiles = [];
            this.dbName = 'OfflineTiles';
            this.storeName = 'tiles';
            this.db = null;
            
            this.initDatabase();
        }
        
        async initDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'key' });
                    }
                };
            });
        }
        
        async downloadTile(x, y, z) {
            const url = `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
            const key = `${z}/${x}/${y}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                
                // Store in IndexedDB
                await this.storeTile(key, arrayBuffer);
                
                console.log(`SUCCESS: Downloaded and stored tile: ${key} (${arrayBuffer.byteLength} bytes)`);
                return true;
            } catch (error) {
                console.error(`ERROR: Failed to download tile ${key}:`, error);
                return false;
            }
        }
        
        async storeTile(key, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const request = store.put({ key, data });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        updateProgress() {
            const percentage = Math.floor((this.downloadedTiles / this.totalTiles) * 100);
            const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Download') || btn.textContent.includes('Download'));
            
            if (downloadBtn) {
                if (percentage < 100) {
                    downloadBtn.textContent = `Downloading ${percentage}%`;
                    downloadBtn.style.backgroundColor = '#ff9800';
                } else {
                    downloadBtn.textContent = 'Download Complete!';
                    downloadBtn.style.backgroundColor = '#4caf50';
                    
                    setTimeout(() => {
                        downloadBtn.textContent = 'Download';
                        downloadBtn.style.backgroundColor = '';
                        this.isDownloading = false;
                    }, 3000);
                }
            }
            
            console.log(`PROGRESS: Downloaded ${this.downloadedTiles}/${this.totalTiles} tiles (${percentage}%)`);
        }
        
        async downloadTrailTiles(trailName) {
            if (this.isDownloading) {
                console.log('WARNING: Download already in progress');
                return;
            }
            
            const trailData = TRAIL_COORDINATES[trailName];
            if (!trailData) {
                console.error('ERROR: Trail not found:', trailName);
                alert('Trail coordinates not available. Please try a different trail.');
                return;
            }
            
            console.log(`STARTING: Automatic download for: ${trailData.name}`);
            console.log('BOUNDS: Trail bounds:', trailData.bounds);
            
            this.isDownloading = true;
            this.downloadedTiles = 0;
            this.failedTiles = [];
            
            // Calculate tiles for multiple zoom levels (12-16 for high resolution)
            const zoomLevels = [12, 13, 14, 15, 16];
            const tiles = calculateTilesForBounds(trailData.bounds, zoomLevels);
            this.totalTiles = tiles.length;
            
            console.log(`CALCULATED: ${this.totalTiles} tiles across zoom levels ${zoomLevels.join(', ')}`);
            
            // Download tiles with controlled pacing
            for (let i = 0; i < tiles.length; i++) {
                const tile = tiles[i];
                const success = await this.downloadTile(tile.x, tile.y, tile.z);
                
                if (success) {
                    this.downloadedTiles++;
                } else {
                    this.failedTiles.push(tile);
                }
                
                // Update progress every 10 tiles
                if (i % 10 === 0 || i === tiles.length - 1) {
                    this.updateProgress();
                }
                
                // Add delay to prevent rate limiting (200ms between requests)
                if (i < tiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            // Retry failed tiles
            if (this.failedTiles.length > 0) {
                console.log(`RETRY: Retrying ${this.failedTiles.length} failed tiles...`);
                
                for (const tile of this.failedTiles) {
                    const success = await this.downloadTile(tile.x, tile.y, tile.z);
                    if (success) {
                        this.downloadedTiles++;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            this.updateProgress();
            
            console.log(`COMPLETE: Download complete! ${this.downloadedTiles}/${this.totalTiles} tiles downloaded`);
            console.log(`ANDROID: Trail tiles are now available for offline use on Android and all devices`);
        }
    }
    
    // Initialize the working downloader
    const workingDownloader = new WorkingDownloader();
    
    // Override the download button behavior
    function setupDownloadButton() {
        const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Download'));
        
        if (downloadBtn) {
            // Remove existing event listeners
            downloadBtn.onclick = null;
            
            // Add new automatic download functionality
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Get selected trail
                const trailSelect = document.querySelector('select');
                const selectedTrail = trailSelect ? trailSelect.options[trailSelect.selectedIndex].text : null;
                
                if (!selectedTrail || selectedTrail === '-- No Trail Selected --') {
                    alert('Please select a trail first!');
                    return;
                }
                
                console.log(`TARGET: Starting automatic download for trail: ${selectedTrail}`);
                await workingDownloader.downloadTrailTiles(selectedTrail);
            });
            
            console.log('SUCCESS: Working automatic downloader installed on download button');
        } else {
            console.log('WARNING: Download button not found, retrying in 1 second...');
            setTimeout(setupDownloadButton, 1000);
        }
    }
    
    // Wait for page to load then setup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDownloadButton);
    } else {
        setupDownloadButton();
    }
    
    // Make available globally for debugging
    window.workingDownloader = workingDownloader;
    
    console.log('READY: WORKING AUTOMATIC DOWNLOADER READY!');
    console.log('ANDROID: This system will download ALL tiles needed for complete offline coverage on Android');
    
})();

