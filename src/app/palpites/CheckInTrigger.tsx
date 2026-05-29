"use client";

import { useEffect, useRef } from "react";
import { getTodayCheckInGame, selfCheckIn } from "./actions";

interface CheckInTriggerProps {
  isLoggedIn: boolean;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckInTrigger({ isLoggedIn }: CheckInTriggerProps) {
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || ran.current || !navigator.geolocation) return;
    ran.current = true;

    (async () => {
      try {
        const game = await getTodayCheckInGame();
        if (!game) return;

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const dist = haversineMeters(
              pos.coords.latitude,
              pos.coords.longitude,
              game.restaurantLat,
              game.restaurantLng
            );
            if (dist <= game.radiusM) {
              await selfCheckIn(game.gameId);
            }
          },
          () => {}, // nega permissão → silencioso
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
        );
      } catch { /* silencioso */ }
    })();
  }, [isLoggedIn]);

  return null;
}
