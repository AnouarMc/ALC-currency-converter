let staticCacheName = 'currency-converter-v1'

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName).then(cache => {
			return cache.addAll([
				'/',
				'/index.html',
				'/favicon.ico',
				'/src/css/main.css',
				'/src/js/main.js',
				'/src/js/idb.js',
				'https://free.currencyconverterapi.com/api/v5/currencies'
			])
		})
	)
})



self.addEventListener('fetch', event => {
	return event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request)
		})
	)
})

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					return cacheName.startsWith('currency-converter-v') && 
							cacheName !== staticCacheName;
				}).map(cacheName => {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('message', event => {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});


