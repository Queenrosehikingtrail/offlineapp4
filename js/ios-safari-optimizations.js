/**
 * iOS Safari-Specific Optimizations for Queen Rose Hiking Trail App
 * Addresses Safari-specific issues and enhances performance on iOS devices
 */

console.log('🍎 Loading iOS Safari Optimizations...');

class iOSSafariOptimizations {
    constructor() {
        this.isSafari = this.detectSafari();
        this.isIOS = this.detectIOS();
        this.safariVersion = this.getSafariVersion();
        
        if (this.isSafari || this.isIOS) {
            console.log(`🍎 Safari/iOS detected (v${this.safariVersion}) - applying optimizations`);
            this.init();
        }
    }
    
    detectSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
               navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    }
    
    detectIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    getSafariVersion() {
        const match = navigator.userAgent.match(/Version\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    
    init() {
        this.fixSafariMemoryLeaks();
        this.optimizeSafariPerformance();
        this.fixSafariViewportIssues();
        this.enhanceSafariGeolocation();
        this.fixSafariDateIssues();
        this.optimizeSafariLocalStorage();
        this.fixSafariScrollIssues();
        this.enhanceSafariPWASupport();
        console.log('✅ iOS Safari optimizations initialized');
    }
    
    fixSafariMemoryLeaks() {
        // Safari memory leak prevention
        let imageCache = new Map();
        let maxCacheSize = 50;
        
        // Override image loading to prevent memory leaks
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'img') {
                element.addEventListener('load', function() {
                    // Manage image cache size
                    if (imageCache.size >= maxCacheSize) {
                        const firstKey = imageCache.keys().next().value;
                        const oldImg = imageCache.get(firstKey);
                        if (oldImg && oldImg.src) {
                            URL.revokeObjectURL(oldImg.src);
                        }
                        imageCache.delete(firstKey);
                    }
                    imageCache.set(this.src, this);
                });
                
                element.addEventListener('error', function() {
                    console.warn('🍎 Safari image load error:', this.src);
                });
            }
            
            return element;
        };
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            imageCache.forEach((img, src) => {
                if (src.startsWith('blob:')) {
                    URL.revokeObjectURL(src);
                }
            });
            imageCache.clear();
        });
    }
    
    optimizeSafariPerformance() {
        // Safari-specific performance optimizations
        
        // Optimize requestAnimationFrame for Safari
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(this, function(timestamp) {
                // Safari performance optimization
                if (performance.now() - timestamp > 16.67) {
                    // Skip frame if too much time has passed
                    return;
                }
                callback(timestamp);
            });
        };
        
        // Safari garbage collection hints
        if (window.gc && typeof window.gc === 'function') {
            setInterval(() => {
                if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
                    window.gc();
                }
            }, 30000);
        }
        
        // Safari-specific event listener optimization
        const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (passiveEvents.includes(type) && typeof options !== 'object') {
                options = { passive: true };
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
    
    fixSafariViewportIssues() {
        // Safari viewport height fix
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Safari-specific viewport meta tag adjustment
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport && this.isIOS) {
                viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
            }
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 500);
        });
        
        // Safari address bar handling
        let lastHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDiff = Math.abs(currentHeight - lastHeight);
            
            if (heightDiff > 100) {
                // Likely address bar show/hide
                setTimeout(() => {
                    if (window.leafletMap) {
                        window.leafletMap.invalidateSize();
                    }
                }, 300);
            }
            lastHeight = currentHeight;
        });
    }
    
    enhanceSafariGeolocation() {
        // Safari geolocation enhancements
        if (navigator.geolocation) {
            const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
            const originalWatchPosition = navigator.geolocation.watchPosition;
            
            // Enhanced getCurrentPosition for Safari
            navigator.geolocation.getCurrentPosition = function(success, error, options = {}) {
                const safariOptions = {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000,
                    ...options
                };
                
                return originalGetCurrentPosition.call(this, 
                    (position) => {
                        console.log('🍎 Safari geolocation success');
                        success(position);
                    },
                    (err) => {
                        console.warn('🍎 Safari geolocation error:', err);
                        if (error) error(err);
                    },
                    safariOptions
                );
            };
            
            // Enhanced watchPosition for Safari
            navigator.geolocation.watchPosition = function(success, error, options = {}) {
                const safariOptions = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                    ...options
                };
                
                return originalWatchPosition.call(this, success, error, safariOptions);
            };
        }
    }
    
    fixSafariDateIssues() {
        // Safari date parsing fixes
        const originalDateParse = Date.parse;
        Date.parse = function(dateString) {
            // Safari date format fixes
            if (typeof dateString === 'string') {
                // Fix common date format issues in Safari
                dateString = dateString.replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6');
            }
            return originalDateParse.call(this, dateString);
        };
    }
    
    optimizeSafariLocalStorage() {
        // Safari localStorage optimization and error handling
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        
        localStorage.setItem = function(key, value) {
            try {
                return originalSetItem.call(this, key, value);
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    console.warn('🍎 Safari localStorage quota exceeded, clearing old data');
                    // Clear old cache data
                    for (let i = 0; i < localStorage.length; i++) {
                        const storageKey = localStorage.key(i);
                        if (storageKey && storageKey.startsWith('cache_')) {
                            localStorage.removeItem(storageKey);
                        }
                    }
                    // Retry
                    return originalSetItem.call(this, key, value);
                }
                throw e;
            }
        };
        
        localStorage.getItem = function(key) {
            try {
                return originalGetItem.call(this, key);
            } catch (e) {
                console.warn('🍎 Safari localStorage error:', e);
                return null;
            }
        };
    }
    
    fixSafariScrollIssues() {
        // Safari scroll behavior fixes
        if (this.isIOS) {
            // Fix iOS Safari scroll momentum
            document.addEventListener('touchstart', function(e) {
                const scrollableParent = e.target.closest('.scrollable, .modal-body');
                if (scrollableParent) {
                    const scrollTop = scrollableParent.scrollTop;
                    const scrollHeight = scrollableParent.scrollHeight;
                    const height = scrollableParent.clientHeight;
                    
                    if (scrollTop === 0) {
                        scrollableParent.scrollTop = 1;
                    } else if (scrollTop + height === scrollHeight) {
                        scrollableParent.scrollTop = scrollTop - 1;
                    }
                }
            });
            
            // Fix iOS Safari rubber band scrolling
            document.addEventListener('touchmove', function(e) {
                if (e.target.closest('body') && !e.target.closest('.scrollable, .modal-body')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    enhanceSafariPWASupport() {
        // Safari PWA enhancements
        if (this.isIOS) {
            // Detect if running as PWA
            const isStandalone = window.navigator.standalone || 
                               window.matchMedia('(display-mode: standalone)').matches;
            
            if (isStandalone) {
                document.body.classList.add('ios-pwa-mode');
                
                // Handle iOS PWA navigation
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a[href]');
                    if (link && link.hostname !== window.location.hostname) {
                        e.preventDefault();
                        window.open(link.href, '_blank');
                    }
                });
                
                // iOS PWA status bar handling
                const statusBarHeight = this.getIOSStatusBarHeight();
                document.documentElement.style.setProperty('--ios-status-bar-height', `${statusBarHeight}px`);
            }
            
            // Safari PWA install prompt handling
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                // Show custom install button for Safari
                const installButton = document.getElementById('pwa-install-button');
                if (installButton) {
                    installButton.style.display = 'block';
                    installButton.addEventListener('click', () => {
                        if (deferredPrompt) {
                            deferredPrompt.prompt();
                            deferredPrompt.userChoice.then((choiceResult) => {
                                console.log('🍎 PWA install choice:', choiceResult.outcome);
                                deferredPrompt = null;
                            });
                        }
                    });
                }
            });
        }
    }
    
    getIOSStatusBarHeight() {
        // Calculate iOS status bar height
        if (this.isIOS) {
            const screenHeight = screen.height;
            const windowHeight = window.innerHeight;
            const heightDiff = screenHeight - windowHeight;
            
            // Estimate status bar height based on device
            if (heightDiff > 100) return 44; // iPhone X and newer
            if (heightDiff > 50) return 20;  // Older iPhones
            return 0; // iPad or unknown
        }
        return 0;
    }
    
    // Safari-specific utility methods
    isSafariPrivateMode() {
        return new Promise((resolve) => {
            try {
                localStorage.setItem('safari-private-test', '1');
                localStorage.removeItem('safari-private-test');
                resolve(false);
            } catch (e) {
                resolve(true);
            }
        });
    }
    
    optimizeForSafari() {
        // General Safari optimization method
        if (this.isSafari) {
            // Disable Safari's automatic text size adjustment
            document.documentElement.style.webkitTextSizeAdjust = '100%';
            
            // Optimize Safari rendering
            document.documentElement.style.webkitFontSmoothing = 'antialiased';
            document.documentElement.style.mozOsxFontSmoothing = 'grayscale';
            
            // Safari-specific meta tags
            const metaTags = [
                { name: 'format-detection', content: 'telephone=no' },
                { name: 'format-detection', content: 'date=no' },
                { name: 'format-detection', content: 'address=no' },
                { name: 'format-detection', content: 'email=no' }
            ];
            
            metaTags.forEach(tag => {
                if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                    const meta = document.createElement('meta');
                    meta.name = tag.name;
                    meta.content = tag.content;
                    document.head.appendChild(meta);
                }
            });
        }
    }
}

// Initialize Safari optimizations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.iOSSafariOptimizations = new iOSSafariOptimizations();
    
    // Apply general Safari optimizations
    if (window.iOSSafariOptimizations.isSafari || window.iOSSafariOptimizations.isIOS) {
        window.iOSSafariOptimizations.optimizeForSafari();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = iOSSafariOptimizations;
}

console.log('✅ iOS Safari Optimizations loaded');

