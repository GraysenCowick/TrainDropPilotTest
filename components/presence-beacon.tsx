"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function PresenceBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    function ping() {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname }),
      }).catch(() => {});
    }

    ping(); // immediate on mount / page change
    const interval = setInterval(ping, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
