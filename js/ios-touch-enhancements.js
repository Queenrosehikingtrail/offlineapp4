/**
 * iOS Touch and Gesture Enhancements for Queen Rose Hiking Trail App
 * Optimizes touch interactions, gestures, and iOS-specific behaviors
 */

console.log('🍎 Loading iOS Touch and Gesture Enhancements...');

class iOSTouchEnhancements {
    constructor() {
        this.isIOS = this.detectIOS();
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.doubleTapTimer = null;
        this.lastTap = 0;
        
        if (this.isIOS) {
            console.log('🍎 iOS device detected - initializing iOS-specific enhancements');
            this.init();
        } else {
            console.log('📱 Non-iOS device - iOS enhancements not applied');
        }
    }
    
    detectIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
               navigator.userAgent.includes('Safari') && 'ontouchstart' in window;
    }
    
    init() {
        this.setupIOSTouchHandling();
        this.setupIOSGestureRecognition();
        this.setupIOSScrollOptimizations();
        this.setupIOSKeyboardHandling();
        this.setupIOSOrientationHandling();
        this.setupIOSHapticFeedback();
        console.log('✅ iOS touch enhancements initialized');
    }
    
    setupIOSTouchHandling() {
        // Enhanced touch event handling for iOS
        document.addEventListener('touchstart', (e) => {
            this.touchStartTime = Date.now();
            this.touchStartPos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            
            // Prevent iOS bounce scrolling on certain elements
            if (e.target.closest('.no-bounce')) {
                e.preventDefault();
            }
            
            // iOS-specific touch feedback
            this.addTouchFeedback(e.target);
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - this.touchStartTime;
            const touchEndPos = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };
            
            // Calculate touch distance
            const distance = Math.sqrt(
                Math.pow(touchEndPos.x - this.touchStartPos.x, 2) +
                Math.pow(touchEndPos.y - this.touchStartPos.y, 2)
            );
            
            // iOS tap detection with tolerance
            if (touchDuration < 300 && distance < 10) {
                this.handleIOSTap(e);
            }
            
            this.removeTouchFeedback(e.target);
        });
        
        // iOS long press detection
        document.addEventListener('touchstart', (e) => {
            this.longPressTimer = setTimeout(() => {
                this.handleIOSLongPress(e);
            }, 500);
        });
        
        document.addEventListener('touchend', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
    }
    
    setupIOSGestureRecognition() {
        let initialDistance = 0;
        let initialScale = 1;
        
        // iOS pinch gesture handling
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = 1;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                
                if (Math.abs(scale - initialScale) > 0.1) {
                    this.handleIOSPinch(scale, e);
                    initialScale = scale;
                }
            }
        }, { passive: false });
        
        // iOS swipe gesture detection
        let swipeStartX = 0;
        let swipeStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            swipeStartX = e.touches[0].clientX;
            swipeStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const swipeEndX = e.changedTouches[0].clientX;
            const swipeEndY = e.changedTouches[0].clientY;
            
            const deltaX = swipeEndX - swipeStartX;
            const deltaY = swipeEndY - swipeStartY;
            
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
                this.handleIOSSwipe(deltaX, deltaY, e);
            }
        });
    }
    
    setupIOSScrollOptimizations() {
        // iOS momentum scrolling optimization
        const scrollableElements = document.querySelectorAll('.scrollable, .modal-body, .slide-out-menu');
        
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.overflowScrolling = 'touch';
            
            // Prevent iOS rubber band scrolling
            element.addEventListener('touchstart', (e) => {
                const scrollTop = element.scrollTop;
                const scrollHeight = element.scrollHeight;
                const height = element.clientHeight;
                
                if (scrollTop === 0) {
                    element.scrollTop = 1;
                } else if (scrollTop + height === scrollHeight) {
                    element.scrollTop = scrollTop - 1;
                }
            });
        });
    }
    
    setupIOSKeyboardHandling() {
        // iOS keyboard appearance handling
        const viewport = document.querySelector('meta[name=viewport]');
        const originalViewport = viewport.content;
        
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                // Prevent iOS zoom on input focus
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                
                // Scroll input into view on iOS
                setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
        
        document.addEventListener('focusout', () => {
            // Restore original viewport
            viewport.content = originalViewport;
        });
        
        // iOS keyboard height detection
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) {
                // Keyboard is likely open
                document.body.classList.add('ios-keyboard-open');
                this.adjustForIOSKeyboard(heightDifference);
            } else {
                // Keyboard is likely closed
                document.body.classList.remove('ios-keyboard-open');
                this.restoreFromIOSKeyboard();
            }
        });
    }
    
    setupIOSOrientationHandling() {
        // iOS orientation change handling
        window.addEventListener('orientationchange', () => {
            // Delay to allow iOS to complete orientation change
            setTimeout(() => {
                // Force viewport recalculation
                const mapElement = document.getElementById('map');
                if (mapElement && window.leafletMap) {
                    window.leafletMap.invalidateSize();
                }
                
                // Trigger resize event for other components
                window.dispatchEvent(new Event('resize'));
                
                console.log('🍎 iOS orientation change handled');
            }, 500);
        });
        
        // iOS viewport height fix for Safari
        const setIOSViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setIOSViewportHeight();
        window.addEventListener('resize', setIOSViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setIOSViewportHeight, 500);
        });
    }
    
    setupIOSHapticFeedback() {
        // iOS haptic feedback (if supported)
        if ('vibrate' in navigator) {
            this.hapticFeedback = {
                light: () => navigator.vibrate(10),
                medium: () => navigator.vibrate(20),
                heavy: () => navigator.vibrate(30),
                success: () => navigator.vibrate([10, 50, 10]),
                error: () => navigator.vibrate([50, 50, 50])
            };
        } else {
            this.hapticFeedback = {
                light: () => {},
                medium: () => {},
                heavy: () => {},
                success: () => {},
                error: () => {}
            };
        }
    }
    
    // Helper methods
    getDistance(touch1, touch2) {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }
    
    addTouchFeedback(element) {
        if (element.closest('.btn, button')) {
            element.style.transform = 'scale(0.98)';
            element.style.transition = 'transform 0.1s ease';
        }
    }
    
    removeTouchFeedback(element) {
        if (element.closest('.btn, button')) {
            element.style.transform = '';
        }
    }
    
    handleIOSTap(e) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;
        
        if (timeSinceLastTap < 300) {
            // Double tap detected
            this.handleIOSDoubleTap(e);
        }
        
        this.lastTap = now;
        this.hapticFeedback.light();
    }
    
    handleIOSDoubleTap(e) {
        // Handle double tap on map for zoom
        if (e.target.closest('#map')) {
            if (window.leafletMap) {
                const center = window.leafletMap.getCenter();
                window.leafletMap.setView(center, window.leafletMap.getZoom() + 1);
            }
        }
        this.hapticFeedback.medium();
    }
    
    handleIOSLongPress(e) {
        // Handle long press for context menu or waypoint creation
        if (e.target.closest('#map')) {
            // Trigger waypoint creation on long press
            const event = new CustomEvent('ios-longpress', {
                detail: {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    target: e.target
                }
            });
            document.dispatchEvent(event);
        }
        this.hapticFeedback.heavy();
    }
    
    handleIOSPinch(scale, e) {
        // Handle pinch gesture on map
        if (e.target.closest('#map') && window.leafletMap) {
            const currentZoom = window.leafletMap.getZoom();
            const newZoom = scale > 1 ? currentZoom + 0.5 : currentZoom - 0.5;
            window.leafletMap.setZoom(newZoom);
        }
    }
    
    handleIOSSwipe(deltaX, deltaY, e) {
        // Handle swipe gestures
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                // Swipe right - open menu
                const menu = document.getElementById('slide-out-menu');
                if (menu && !menu.classList.contains('active')) {
                    document.getElementById('hamburger-menu')?.click();
                }
            } else {
                // Swipe left - close menu
                const menu = document.getElementById('slide-out-menu');
                if (menu && menu.classList.contains('active')) {
                    document.getElementById('hamburger-menu')?.click();
                }
            }
        }
        this.hapticFeedback.light();
    }
    
    adjustForIOSKeyboard(keyboardHeight) {
        // Adjust layout for iOS keyboard
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.style.height = `calc(100vh - ${keyboardHeight}px - 120px)`;
        }
    }
    
    restoreFromIOSKeyboard() {
        // Restore layout after iOS keyboard closes
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.style.height = '';
        }
    }
    
    // Public methods for external use
    triggerHaptic(type = 'light') {
        if (this.isIOS && this.hapticFeedback[type]) {
            this.hapticFeedback[type]();
        }
    }
    
    isIOSDevice() {
        return this.isIOS;
    }
}

// Initialize iOS enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.iOSEnhancements = new iOSTouchEnhancements();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = iOSTouchEnhancements;
}

console.log('✅ iOS Touch and Gesture Enhancements loaded');

