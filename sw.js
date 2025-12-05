// Nombre del caché. Incrementa el número si has cambiado assets o el HTML.
const CACHE_NAME = 'nande-pasantia-cache-v4'; 
// Aseguramos que 'index.html' se llama correctamente en tu proyecto.
const APP_SHELL = 'index (3).html'; // <-- Corregido para coincidir con tu nombre de archivo

// Lista de archivos para cachear.
const urlsToCache = [
    APP_SHELL,
    '/', 
    'logo_intro.png', 
    'logo_main.png', 
    'intro.mp4',
    // La librería externa, ¡es esencial!
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js' 
];

// Evento de Instalación (guarda los archivos iniciales en caché)
self.addEventListener('install', event => {
    // Forzar la activación del nuevo Service Worker inmediatamente
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando archivos estáticos');
                // Intentamos cachear todos los archivos. Si falla, al menos el archivo principal debe ser intentado.
                return cache.addAll(urlsToCache).catch(error => {
                    console.warn('Algunos archivos no se pudieron cachear (ej. el video o librerías externas que fallaron).', error);
                    // Aseguramos que el shell (la interfaz principal) se cachee como fallback.
                    return caches.open(CACHE_NAME).then(fallbackCache => fallbackCache.add(APP_SHELL));
                });
            })
    );
});

// Evento de Fetch (sirve los archivos desde caché)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then(response => {
                // Estrategia: Cache, luego Network (sirve la caché si existe)
                if (response) {
                    return response;
                }

                // Si la solicitud no está en caché (ej. una CDN), intentar la red.
                return fetch(event.request).catch(() => {
                    // Si la red falla (estamos offline), devolver el shell de la aplicación como fallback.
                    // Esto asegura que la interfaz principal siempre cargue.
                    return caches.match(APP_SHELL);
                });
            })
    );
});

// Evento de Activación (limpia cachés viejos)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché viejo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Asegura que el SW tome control inmediatamente
    );
});
