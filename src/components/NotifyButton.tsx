"use client";

import { useState, useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotifyButton({ babyId }: { babyId: string }) {
  const [state, setState] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setState("subscribed");
      })
    );
  }, []);

  async function subscribe() {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState("denied");
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, subscription: sub.toJSON() }),
    });

    setState("subscribed");
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("idle");
  }

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <p className="text-xs text-gray-400 text-center">
        Notifications blocked — enable them in browser settings
      </p>
    );
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        className="w-full py-2 px-4 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        🔔 Notifications on — tap to turn off
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="w-full py-2 px-4 rounded-xl text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
    >
      🔔 Notify me when available
    </button>
  );
}
