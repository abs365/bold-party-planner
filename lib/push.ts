// Client-side helper for subscribing to Web Push notifications

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Send VAPID public key to the service worker so it can handle pushsubscriptionchange
function sendVapidKeyToSW(registration: ServiceWorkerRegistration, key: string) {
  const target = registration.active ?? registration.installing ?? registration.waiting;
  target?.postMessage({ type: "SET_VAPID_KEY", key });
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — push notifications disabled");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // Store subscription via API
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  // Give the service worker the VAPID key so it can handle pushsubscriptionchange
  sendVapidKeyToSW(registration, publicKey);

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  // Use getRegistrations() instead of .ready to avoid hanging when no SW is installed
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return false;

  const subscription = await registrations[0].pushManager.getSubscription();
  return subscription !== null;
}

// Wire up the PUSH_SUBSCRIPTION_CHANGED message from the service worker.
// Call once on app mount (e.g. in ServiceWorkerRegistration component).
export function listenForSubscriptionChange(onChanged: () => void): () => void {
  if (!("serviceWorker" in navigator)) return () => {};

  const handler = (event: MessageEvent) => {
    if ((event.data as { type?: string })?.type === "PUSH_SUBSCRIPTION_CHANGED") {
      onChanged();
    }
  };

  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}
