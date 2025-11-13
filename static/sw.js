/**
 * Service Worker for Wrap It Up PWA
 * Provides offline support, caching, and performance improvements
 */

const CACHE_NAME = 'wrap-it-up-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const PRECACHE_ASSETS = [
	'/',
	'/offline',
	'/journeys',
	'/my/progress',
	'/manifest.json'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker...');
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('[SW] Pre-caching assets');
				return cache.addAll(PRECACHE_ASSETS);
			})
			.then(() => {
				console.log('[SW] Skip waiting');
				return self.skipWaiting();
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker...');
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log('[SW] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('[SW] Claiming clients');
				return self.clients.claim();
			})
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip chrome extensions and non-http(s) requests
	if (!event.request.url.startsWith('http')) {
		return;
	}

	event.respondWith(
		caches
			.match(event.request)
			.then((cachedResponse) => {
				if (cachedResponse) {
					// Return cached response
					return cachedResponse;
				}

				// Clone the request
				const fetchRequest = event.request.clone();

				return fetch(fetchRequest)
					.then((response) => {
						// Check if valid response
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}

						// Clone the response
						const responseToCache = response.clone();

						// Cache the fetched response
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});

						return response;
					})
					.catch(() => {
						// Network failed, try to serve offline page for navigation requests
						if (event.request.mode === 'navigate') {
							return caches.match(OFFLINE_URL);
						}
					});
			})
	);
});

// Background sync event (for offline form submissions)
self.addEventListener('sync', (event) => {
	console.log('[SW] Background sync:', event.tag);

	if (event.tag === 'sync-offline-queue') {
		event.waitUntil(syncOfflineQueue());
	}
});

// Sync offline queue with server
async function syncOfflineQueue() {
	try {
		// Get all pending offline actions from IndexedDB
		// This would integrate with your offline sync queue table
		console.log('[SW] Syncing offline queue...');

		// In a real implementation, you would:
		// 1. Open IndexedDB
		// 2. Get all pending sync items
		// 3. POST them to the server
		// 4. Mark as synced on success
		// 5. Retry on failure

		return Promise.resolve();
	} catch (error) {
		console.error('[SW] Sync failed:', error);
		throw error;
	}
}

// Push notification event
self.addEventListener('push', (event) => {
	console.log('[SW] Push received');

	let notificationData = {
		title: 'Wrap It Up',
		body: 'You have a new notification',
		icon: '/pwa-192x192.png',
		badge: '/pwa-192x192.png',
		tag: 'default',
		requireInteraction: false
	};

	if (event.data) {
		try {
			notificationData = {
				...notificationData,
				...event.data.json()
			};
		} catch (e) {
			console.error('[SW] Failed to parse push data:', e);
		}
	}

	event.waitUntil(
		self.registration.showNotification(notificationData.title, {
			body: notificationData.body,
			icon: notificationData.icon,
			badge: notificationData.badge,
			tag: notificationData.tag,
			requireInteraction: notificationData.requireInteraction,
			data: notificationData.data
		})
	);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification clicked');
	event.notification.close();

	const urlToOpen = event.notification.data?.url || '/';

	event.waitUntil(
		clients
			.matchAll({
				type: 'window',
				includeUncontrolled: true
			})
			.then((windowClients) => {
				// Check if there's already a window open
				for (const client of windowClients) {
					if (client.url === urlToOpen && 'focus' in client) {
						return client.focus();
					}
				}

				// Open a new window
				if (clients.openWindow) {
					return clients.openWindow(urlToOpen);
				}
			})
	);
});

console.log('[SW] Service worker loaded');
