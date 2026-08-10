"use client";
import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 25000;

export default function PresenceHeartbeat() {
  const intervalRef = useRef(null);

  useEffect(() => {
    function sendOnline() {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: true }),
        keepalive: true,
      }).catch(() => {});
    }
    function sendOffline() {
      navigator.sendBeacon?.("/api/presence/offline");
    }
    function startHeartbeat() {
      sendOnline();
      intervalRef.current = setInterval(sendOnline, HEARTBEAT_MS);
    }
    function stopHeartbeat() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        stopHeartbeat();
        sendOffline();
      }
    }

    startHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendOffline);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendOffline);
    };
  }, []);

  return null;
}