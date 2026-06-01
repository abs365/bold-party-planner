// ELBOLD Service Worker — v1
// Strategy: network-first for navigation, cache-first for static assets, offline fallback

const CACHE_NAME = "elbold-v1";
const OFFLINE_URL = "/offline";
const STATIC_CACHE_NAME = "elbold-static-v1";

const PRECACHE_URLS = [OFFLINE_URL];

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/icons\//,
  /\/screenshots\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/,
];

// Stored by the main thread after subscribing (see lib/push.ts sendVapidKeyToSW)
let vapidPublicKey = null;

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Message (receives VAPID key from main thread) ─────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VAPID_KEY") {
    vapidPublicKey = event.data.key;
  }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // Never intercept API routes — always hit the network
  if (url.pathname.startsWith("/api/")) return;

  // Never intercept Next.js internals
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Static assets — cache-first, then network, then store
  if (STATIC_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Navigation — network-first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(OFFLINE_URL);
    return (
      cached ??
      new Response(
        "<!doctype html><html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>",
        { status: 503, headers: { "Content-Type": "text/html" } }
      )
    );
  }
}

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "ELBOLD", body: event.data.text() };
  }

  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag ?? "elbold-notification",
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: data.url ?? "/" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "ELBOLD", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});

// ── Push subscription renewal ──────────────────────────────────────────────────
// Fires when the browser invalidates the existing subscription (key rotation, expiry).
// Requires the VAPID public key — sent by the main thread via postMessage after any
// successful subscribe call. Without it we cannot re-subscribe here.

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = self.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener("pushsubscriptionchange", (event) => {
  if (!vapidPublicKey) {
    // No key stored — ask the client page to re-subscribe
    event.waitUntil(
      self.clients
        .matchAll({ type: "window" })
        .then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" })
          );
        })
    );
    return;
  }

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
      .then((subscription) =>
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      )
      .catch((err) => {
        console.error("[SW] pushsubscriptionchange re-subscribe failed:", err);
      })
  );
});
