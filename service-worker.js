// Enhanced service worker for Queen Rose Hiking Trail App - OFFLINE FIXED
const CACHE_NAME = 'queen-rose-hiking-trail-v7-offline-fixed';
const CACHE_VERSION = '7.0.0';

// Function to get the base path for the current deployment
function getBasePath() {
  return self.registration.scope;
}

// Cache versioning and update mechanism
function shouldUpdateCache() {
  return caches.open(CACHE_NAME).then(cache => {
    return cache.match('/.cache-version').then(response => {
      if (!response) return true;
      return response.text().then(version => version !== CACHE_VERSION);
    });
  });
}

// Core app files that must be cached for offline functionality
const urlsToCache = [
  './',
  './index.html',
  './phone-installation-guide.html',
  './css/styles.css',
  './css/first-aid.css',
  './css/vendor/leaflet.css',
  './css/vendor/litepicker.min.css',
  './css/vendor/splide.min.css',
  './js/app.js',
  './js/map.js',
  './js/trails.js',
  './js/gps_tracking.js',
  './js/waypoint_logic.js',
  './js/kml_management.js',
  './js/booking.js',
  './js/weather.js',
  './js/weather_offline.js',
  './js/reviews.js',
  './js/custom-kml-functions.js',
  './js/first-aid.js',
  './js/ios-touch-enhancements.js',
  './js/ios-safari-optimizations.js',
  './js/embedded_penryn_kml.js',
  './js/vendor/leaflet.js',
  './js/vendor/leaflet-gpx.min.js',
  './js/vendor/togeojson.umd.js',
  './js/vendor/dexie.js',
  './js/vendor/leaflet.dexie.min.js',
  './js/vendor/litepicker.min.js',
  './js/vendor/splide.min.js',
  './js/true-offline-tile-system.js',
  './assets/queens_river_logo.png',
  './assets/hiker_waypoint_icon_yellow.png',
  './assets/favicon.ico',
  './assets/icons/icon-16x16.png',
  './assets/icons/icon-32x32.png',
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-180x180.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/maskable-icon-192x192.png',
  './assets/icons/maskable-icon-512x512.png',
  './manifest.json'
];

// FIXED: Add KML files from kml_normalized directory with correct filenames
const kmlFiles = [
  './kml_normalized/2-DayTrail-19.2km.kml',
  './kml_normalized/2DayTrail,day1-13km.kml',
  './kml_normalized/2DayTrail,day2-6.2km.kml',
  './kml_normalized/2day1.kml',
  './kml_normalized/2day2.kml',
  './kml_normalized/2dayfull.kml',
  './kml_normalized/3-DayTrail-39.5km.kml',
  './kml_normalized/3DayTrail,day1-10.9km.kml',
  './kml_normalized/3DayTrail,day2-13km.kml',
  './kml_normalized/3DayTrail,day3-15.6km.kml',
  './kml_normalized/3day1.kml',
  './kml_normalized/3day2.kml',
  './kml_normalized/3day3.kml',
  './kml_normalized/3dayfull.kml',
  './kml_normalized/4-DayTrail-49km.kml',
  './kml_normalized/4DayTrail,day1-15.6km.kml',
  './kml_normalized/4DayTrail,day2-6.2km.kml',
  './kml_normalized/4DayTrail,day3-13km.kml',
  './kml_normalized/4DayTrail,day4-14.2km.kml',
  './kml_normalized/4day1.kml',
  './kml_normalized/4day2.kml',
  './kml_normalized/4day3.kml',
  './kml_normalized/4day4.kml',
  './kml_normalized/4dayfull.kml',
  './kml_normalized/5-DayTrail-53.5km.kml',
  './kml_normalized/5DayTrail,day1-10.9km.kml',
  './kml_normalized/5DayTrail,day2-12.5km.kml',
  './kml_normalized/5DayTrail,day3-13km.kml',
  './kml_normalized/5DayTrail,day4-6.2km.kml',
  './kml_normalized/5DayTrail,day5-10.9km.kml',
  './kml_normalized/5day1.kml',
  './kml_normalized/5day2.kml',
  './kml_normalized/5day3.kml',
  './kml_normalized/5day4.kml',
  './kml_normalized/5day5.kml',
  './kml_normalized/5dayfull.kml',
  './kml_normalized/6-DayTrail-64.7km.kml',
  './kml_normalized/6DayTrail,day1-10.9km.kml',
  './kml_normalized/6DayTrail,day2-12.5km.kml',
  './kml_normalized/6DayTrail,day3-13km.kml',
  './kml_normalized/6DayTrail,day4-6.2km.kml',
  './kml_normalized/6DayTrail,day5-6.5km.kml',
  './kml_normalized/6DayTrail,day6-15.6km.kml',
  './kml_normalized/6day1.kml',
  './kml_normalized/6day2.kml',
  './kml_normalized/6day3.kml',
  './kml_normalized/6day4.kml',
  './kml_normalized/6day5.kml',
  './kml_normalized/6day6.kml',
  './kml_normalized/6dayfull.kml',
  './kml_normalized/CupidsFallsTrail-2.8km.kml',
  './kml_normalized/DevilsKnucklesTrail-10.9km.kml',
  './kml_normalized/MTBTrail1-29.9km.kml',
  './kml_normalized/MatumiTrail-6.2km.kml',
  './kml_normalized/OukraalTrail-12.5km.kml',
  './kml_normalized/RamPumpTrail-1.6km.kml',
  './kml_normalized/cupidsfalls.kml',
  './kml_normalized/devilsknuckles.kml',
  './kml_normalized/matumi.kml',
  './kml_normalized/mtbtrail1.kml',
  './kml_normalized/oukraal.kml',
  './kml_normalized/rampump.kml'
];

// Add elevation images to cache
const elevationImages = [
  './img/elevation/2 day trail - day 1 elevation.jpg',
  './img/elevation/2 day trail - day 2 elevation.jpg',
  './img/elevation/3 day trail - day 1 elevation.jpg',
  './img/elevation/3 day trail - day 2 elevation.jpg',
  './img/elevation/3 day trail - day 3 elevation.jpg',
  './img/elevation/4 day trail - day 1 elevation.jpg',
  './img/elevation/4 day trail - day 2 elevation.jpg',
  './img/elevation/4 day trail - day 3 elevation.jpg',
  './img/elevation/4 day trail - day 4 elevation.jpg',
  './img/elevation/5 day trail - day 1 elevation.jpg',
  './img/elevation/5 day trail - day 2 elevation.jpg',
  './img/elevation/5 day trail - day 3 elevation.jpg',
  './img/elevation/5 day trail - day 4 elevation.jpg',
  './img/elevation/5 day trail - day 5 elevation.jpg',
  './img/elevation/6 day trail - day 1 elevation.jpg',
  './img/elevation/6 day trail - day 2 elevation.jpg',
  './img/elevation/6 day trail - day 3 elevation.jpg',
  './img/elevation/6 day trail - day 4 elevation.jpg',
  './img/elevation/6 day trail - day 5 elevation.jpg',
  './img/elevation/6 day trail - day 6 elevation.jpg',
  './img/elevation/Cupids Trail Elevation.jpg',
  './img/elevation/Devils Knuckles Trail Elevation.jpg',
  './img/elevation/Matumi Lane Trail Elevation.jpg',
  './img/elevation/Mountain Bike Trail Elevations.jpg',
  './img/elevation/Ou Kraal Trail Elevation.jpg',
  './img/elevation/Ram Pump Trail Elevation.jpg'
];

// Combine all resources to cache including KML files
const allResourcesToCache = [...urlsToCache, ...kmlFiles, ...elevationImages];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing OFFLINE FIXED version v7.0.0...');
  event.waitUntil(
    shouldUpdateCache().then(shouldUpdate => {
      if (!shouldUpdate) {
        console.log('[Service Worker] Cache is up to date, skipping installation');
        return self.skipWaiting();
      }
      
      return caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching core resources and KML files');
          // Store cache version
          cache.put('/.cache-version', new Response(CACHE_VERSION));
          
          // Cache files individually with enhanced error handling
          return Promise.allSettled(
            allResourcesToCache.map(url => 
              cache.add(url).catch(err => {
                console.warn(`[Service Worker] Failed to cache ${url}:`, err.message);
                // Track failed resources for retry
                if (!self.failedResources) self.failedResources = [];
                self.failedResources.push(url);
                return null;
              })
            )
          );
        })
        .then((results) => {
          const successful = results.filter(result => result.status === 'fulfilled').length;
          const failed = results.filter(result => result.status === 'rejected').length;
          console.log(`[Service Worker] Installation complete - ${successful} cached, ${failed} failed`);
          
          // Log critical failures
          if (failed > 0) {
            console.warn(`[Service Worker] ${failed} resources failed to cache. App may have reduced offline functionality.`);
          }
          
          return self.skipWaiting();
        })
        .catch(err => {
          console.error('[Service Worker] Installation failed:', err);
          // Attempt recovery by clearing corrupted cache
          return caches.delete(CACHE_NAME).then(() => {
            console.log('[Service Worker] Cleared corrupted cache, will retry on next load');
            throw err;
          });
        });
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Consolidated fetch handler for all requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const requestURL = event.request.url;
  
  // Special handling for navigation requests (HTML pages)
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept').includes('text/html'))) {
    
    console.log('[Service Worker] Navigation request for:', requestURL);
    
    event.respondWith(
      // Try cache first for navigation requests when offline
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] Returning cached navigation response');
            return cachedResponse;
          }
          
          // If not in cache, try cached index.html
          return caches.match('./index.html')
            .then(indexResponse => {
              if (indexResponse) {
                console.log('[Service Worker] Returning cached index.html');
                return indexResponse;
              }
              
              // If no cached index.html, try network
              console.log('[Service Worker] No cached navigation response, trying network');
              return fetch(event.request)
                .catch(error => {
                  console.log('[Service Worker] Navigation fetch failed:', error);
                  // Create a simple offline page as last resort
                  return new Response(
                    '<html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please reconnect to use the Queen Rose Hiking Trail App.</p></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            });
        })
    );
    return; // Exit early after handling navigation request
  }
  
  // Special handling for map tiles
  if (requestURL.includes('tile.openstreetmap.org') || 
      requestURL.includes('api.mapbox.com')) {
    
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Fetch failed for map tile, trying cache');
          return caches.match(event.request);
        })
    );
    return; // Exit early after handling map tiles
  }
  
  // Default handling for all other requests (cache first, then network)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          console.log('[Service Worker] Returning cached response for:', requestURL);
          return cachedResponse;
        }
        
        // Otherwise try to fetch from network
        console.log('[Service Worker] Cache miss, fetching from network:', requestURL);
        return fetch(event.request.clone())
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache map tiles from external sources to avoid excessive storage
                if (!requestURL.includes('tile.openstreetmap.org') && 
                    !requestURL.includes('api.mapbox.com')) {
                  console.log('[Service Worker] Caching new resource:', requestURL);
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed:', error);
            // You could return a custom offline page or fallback here
          });
      })
  );
});

console.log('[Service Worker] Script loaded - Version 3');


// Enhanced retry mechanism for failed requests
function retryFetch(request, retries = 3) {
  return fetch(request).catch(error => {
    if (retries > 0) {
      console.log(`[Service Worker] Retrying fetch (${retries} attempts left):`, request.url);
      return new Promise(resolve => {
        setTimeout(() => resolve(retryFetch(request, retries - 1)), 1000);
      });
    }
    throw error;
  });
}

// Offline status detection and user notification
function notifyOfflineStatus() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_STATUS',
        offline: !navigator.onLine,
        timestamp: Date.now()
      });
    });
  });
}

// Listen for online/offline events
self.addEventListener('online', () => {
  console.log('[Service Worker] Back online');
  notifyOfflineStatus();
});

self.addEventListener('offline', () => {
  console.log('[Service Worker] Gone offline');
  notifyOfflineStatus();
});

// Background sync for failed requests (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'retry-failed-requests') {
      console.log('[Service Worker] Background sync: retrying failed requests');
      event.waitUntil(retryFailedRequests());
    }
  });
}

function retryFailedRequests() {
  if (!self.failedResources || self.failedResources.length === 0) {
    return Promise.resolve();
  }
  
  console.log(`[Service Worker] Retrying ${self.failedResources.length} failed resources`);
  
  return caches.open(CACHE_NAME).then(cache => {
    const retryPromises = self.failedResources.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          console.log(`[Service Worker] Successfully cached on retry: ${url}`);
          return cache.put(url, response);
        }
      }).catch(err => {
        console.warn(`[Service Worker] Retry failed for: ${url}`, err.message);
      })
    );
    
    return Promise.allSettled(retryPromises).then(() => {
      self.failedResources = []; // Clear the failed resources list
    });
  });
}

console.log('[Service Worker] Enhanced offline functionality loaded');

