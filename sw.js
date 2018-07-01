let staticCacheName = 'currency-converter-v1'

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName).then(cache => {
			return cache.addAll([
				'/ALC-currency-converter/',
				'/ALC-currency-converter/index.html',
				'/ALC-currency-converter/favicon.ico',
				'/ALC-currency-converter/src/css/main.css',
				'/ALC-currency-converter/src/js/main.js',
				'/ALC-currency-converter/src/js/idb.js',
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


