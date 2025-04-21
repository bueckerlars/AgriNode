import { BatteryLow, Battery, BatteryMedium, BatteryFull } from "lucide-react";

/**
 * Gibt das passende Batterie-Icon basierend auf dem Ladestand zurück
 */
export function getBatteryIcon(level: number = 0) {
  if (level < 20) {
    return BatteryLow;
  } else if (level < 50) {
    return Battery;
  } else if (level < 80) {
    return BatteryMedium;
  } else {
    return BatteryFull;
  }
}

/**
 * Gibt die passende CSS-Klasse für die Batterietext-Farbe zurück
 */
export function getBatteryTextClass(level: number = 0) {
  if (level < 20) {
    return 'text-red-500';
  } else if (level < 50) {
    return 'text-yellow-500';
  } else {
    return 'text-green-600';
  }
}

/**
 * Formatiert den Batteriestatus als Text
 */
export function getBatteryText(level: number = 0) {
  return `${level}%`;
}