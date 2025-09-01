// Wake Lock System - Queen Rose Hiking Trail App
// Prevents phone from sleeping during downloads

(function() {
    'use strict';
    
    console.log('🎯 Wake Lock System - Initializing...');
    
    window.wakeLockManager = {
        wakeLock: null,
        isSupported: 'wakeLock' in navigator,
        
        // Request a wake lock
        request: async function() {
            if (!this.isSupported) {
                console.log('Wake Lock API not supported');
                return;
            }
            
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('✅ Screen Wake Lock activated');
                
                // Listen for release events
                this.wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock released');
                    this.wakeLock = null;
                });
                
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        },
        
        // Release the wake lock
        release: async function() {
            if (this.wakeLock !== null) {
                await this.wakeLock.release();
                this.wakeLock = null;
            }
        },
        
        // Auto-activate on download start
        activateOnDownload: function() {
            console.log('🚀 Activating Wake Lock on download start');
            this.request();
        },
        
        // Auto-release on download end
        releaseOnDownloadEnd: function() {
            console.log('✅ Releasing Wake Lock on download end');
            this.release();
        }
    };
    
    // Integrate with existing download systems
    function integrateWithDownloaders() {
        // Wait for viewport downloader to be available
        const checkForDownloader = () => {
            if (window.ViewportAutoDownloader) {
                console.log('🔧 Integrating Wake Lock with Viewport Auto Downloader');
                
                // Add wake lock to download start
                const originalStart = window.ViewportAutoDownloader.prototype.startViewportDownload;
                window.ViewportAutoDownloader.prototype.startViewportDownload = async function() {
                    console.log('🚀 Wake Lock: Activating on download start');
                    window.wakeLockManager.activateOnDownload();
                    
                    try {
                        await originalStart.apply(this, arguments);
                    } finally {
                        console.log('✅ Wake Lock: Releasing on download end');
                        window.wakeLockManager.releaseOnDownloadEnd();
                    }
                };
                
                // Add wake lock release to cancel download
                const originalCancel = window.ViewportAutoDownloader.prototype.cancelDownload;
                window.ViewportAutoDownloader.prototype.cancelDownload = function() {
                    console.log('🛑 Wake Lock: Releasing on download cancel');
                    window.wakeLockManager.releaseOnDownloadEnd();
                    originalCancel.apply(this, arguments);
                };
                
                console.log('✅ Wake Lock integrated with Viewport Auto Downloader');
            } else {
                // Retry after a short delay
                setTimeout(checkForDownloader, 500);
            }
        };
        
        checkForDownloader();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', integrateWithDownloaders);
    } else {
        integrateWithDownloaders();
    }
    
})();

console.log('📦 Wake Lock System script loaded');

