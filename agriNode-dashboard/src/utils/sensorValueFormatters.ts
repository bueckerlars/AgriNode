import { SensorDataType, SensorReadingsByType } from "@/types/sensor";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

/**
 * Gibt den neuesten Wert für einen bestimmten Sensortyp zurück
 */
export function getLatestSensorValue(
  sensorData: SensorReadingsByType | null,
  dataType: keyof SensorReadingsByType
): number | null {
  if (!sensorData || !sensorData[dataType] || sensorData[dataType].length === 0) {
    return null;
  }
  
  // Sortiere nach Zeitstempel (neueste zuerst) und nimm den ersten Wert
  const sortedData = [...sensorData[dataType]].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return sortedData[0].value;
}

/**
 * Formatiert Sensorwerte mit den korrekten Einheiten
 */
export function formatSensorValue(
  sensorData: SensorReadingsByType | null,
  dataType: SensorDataType
): string {
  const value = getLatestSensorValue(sensorData, dataType);
  if (value === null) return 'N/A';
  
  switch(dataType) {
    case 'temperature':
      return `${value.toFixed(0)}°C`;
    case 'humidity':
      return `${value.toFixed(0)}%`;
    case 'soilMoisture':
      // Convert from raw sensor range (650=dry, 300=wet) to percentage (0-100%)
      const MIN_VALUE = 300; // 100% wet
      const MAX_VALUE = 650; // 0% wet (dry)
      const range = MAX_VALUE - MIN_VALUE;
      
      // Ensure the value is within bounds
      const boundedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
      
      // Calculate percentage: inverted since lower values mean higher moisture
      const percentage = Math.round(((MAX_VALUE - boundedValue) / range) * 100);
      return `${percentage}%`;
    case 'brightness':
      return `${value.toFixed(0)} lx`;
    default:
      return `${value}`;
  }
}

/**
 * Formatiert einen Zeitstempel als relative Zeit
 */
export function formatLastUpdated(timestamp?: Date | string): string {
  if (!timestamp) return 'Unbekannt';
  
  try {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: de
    });
  } catch (error) {
    return 'Unbekannt';
  }
}