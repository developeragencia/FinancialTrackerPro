const CACHE_NAME = 'vale-cashback-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192x192.svg',
  '/valecashback-logo.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/assets/index.js',
  '/assets/index.css',
  '/login',
  '/register',
  '/client/dashboard',
  '/merchant/dashboard',
  '/admin/dashboard',
];

// Instalação e armazenamento em cache dos recursos estáticos
self.addEventListener('install', (event) => {
  // Força o ServiceWorker a se tornar ativo imediatamente, sobrescrevendo versões antigas
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto - nova versão');
        return cache.addAll(urlsToCache);
      })
  );
});

// Estratégia de cache: Cache First, então Network
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Não interceptar requisições para APIs ou websockets
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/ws') ||
      event.request.url.includes('socket.io')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache se existir
        if (response) {
          return response;
        }

        // Se não estiver no cache, busca da rede
        return fetch(event.request)
          .then((response) => {
            // Resposta básica, não pode ser armazenada em cache
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta porque ela é um stream que só pode ser consumido uma vez
            const responseToCache = response.clone();

            // Armazena em cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se falhar ao buscar da rede e for uma página HTML, retorna a página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  // Força o controle imediato de todas as páginas abertas
  event.waitUntil(clients.claim());
  
  // Limpa todos os caches antigos
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('Limpando caches antigos...');
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Excluindo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Recebe mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});