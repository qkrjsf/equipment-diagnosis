const CACHE_NAME = 'sulbi-jindan-v31';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll 대신 개별 요청으로 처리 - 하나가 실패해도 설치 전체가 실패하지 않도록 함
      // {cache:'reload'}로 브라우저 HTTP 캐시를 건너뛰고 항상 최신을 받아옴
      return Promise.allSettled(
        ASSETS.map((url) =>
          fetch(url, { cache: 'reload' }).then((res) => {
            if (res && res.ok) return cache.put(url, res);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage(CACHE_NAME);
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 우리 사이트가 아닌 외부 도메인 요청(구글시트 API, 구글드라이브 이미지 등)은
  // 캐싱/가로채기 전혀 하지 않고 그대로 네트워크로 흘려보냄 - 항상 최신 데이터 보장
  if (new URL(req.url).origin !== self.location.origin) {
    return;
  }

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // 핵심 화면(index.html)은 네트워크를 항상 먼저 시도 - 최신 내용 우선
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 그 외 정적 자원(아이콘 등)은 캐시 우선 - 오프라인/속도에 유리
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (req.method === 'GET' && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
