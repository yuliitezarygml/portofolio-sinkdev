// Service Worker для кеширования и оптимизации производительности

const CACHE_NAME = 'SinkDev-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Ресурсы для кеширования
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Добавьте другие статические ресурсы
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Очистка старых кешей
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== API_CACHE && 
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Кеширование API запросов
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Обновляем кеш в фоне
            fetch(request).then((fetchResponse) => {
              cache.put(request, fetchResponse.clone());
            }).catch(() => {});
            return response;
          }
          
          return fetch(request).then((fetchResponse) => {
            // Кешируем только успешные GET запросы
            if (fetchResponse.ok && request.method === 'GET') {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Возвращаем кешированный ответ при ошибке сети
            return cache.match(request);
          });
        });
      })
    );
    return;
  }

  // Кеширование статических ресурсов
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((fetchResponse) => {
          // Кешируем статические ресурсы
          if (fetchResponse.ok && 
              (url.pathname.endsWith('.js') || 
               url.pathname.endsWith('.css') || 
               url.pathname.endsWith('.woff2') ||
               url.pathname.endsWith('.png') ||
               url.pathname.endsWith('.jpg'))) {
            
            // Клонируем response перед использованием
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return fetchResponse;
        }).catch(() => {
          // Fallback для навигационных запросов
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});