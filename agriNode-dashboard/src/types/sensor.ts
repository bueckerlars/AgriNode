export interface Sensor {
  sensor_id?: string;
  user_id: string;
  name: string;
  type: string;
  location?: string;
  unique_device_id: string;
  registered_at?: Date;
  updated_at?: Date;
  batteryLevel?: number;
  firmware_version?: string;
}

export interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  brightness: number;
  batteryLevel?: number;
}

export interface SensorDataPoint {
  timestamp: string;
  value: number;
}

export interface SensorReadingsByType {
  temperature: SensorDataPoint[];
  humidity: SensorDataPoint[];
  soilMoisture: SensorDataPoint[];
  brightness: SensorDataPoint[];
}

export type SensorDataType = 'temperature' | 'humidity' | 'soilMoisture' | 'brightness';

// Diese Typen wären für den tatsächlichen API-Aufruf
export interface SensorRegistrationPayload {
  name: string;
  location: string;
  type: string;
  uniqueId?: string; 
}

export interface SensorUpdatePayload extends SensorRegistrationPayload {
  id: string;
}

// Funktion zum Generieren von Mockdaten für Diagramme
export function generateMockSensorData(days: number = 7): SensorReadingsByType {
  const now = new Date();
  const data: SensorReadingsByType = {
    temperature: [],
    humidity: [],
    soilMoisture: [],
    brightness: []
  };
  
  // 24 * 7 Stunden = 1 Woche als Stundendaten
  for (let i = 0; i < 24 * days; i++) {
    const timestamp = new Date(now.getTime() - (24 * days - i) * 60 * 60 * 1000).toISOString();
    
    // Realistische Werte mit Tageszyklen
    const hourOfDay = new Date(timestamp).getHours();
    
    // Temperatur: 15-30°C mit Tageszyklus
    const baseTemp = 15 + (hourOfDay > 6 && hourOfDay < 18 ? 10 : 0);
    const temp = baseTemp + Math.sin(i / 24 * Math.PI) * 5 + (Math.random() * 2 - 1);
    
    // Luftfeuchtigkeit: 30-90% mit Gegenzyklus zur Temperatur
    const baseHumidity = 60 - (hourOfDay > 6 && hourOfDay < 18 ? 20 : 0);
    const humidity = baseHumidity + Math.sin(i / 24 * Math.PI + Math.PI) * 20 + (Math.random() * 10 - 5);
    
    // Bodenfeuchtigkeit: 20-80% mit langsameren Änderungen
    const baseSoil = 50 + Math.sin(i / 72 * Math.PI) * 25;
    const soil = baseSoil + (Math.random() * 5 - 2.5);
    
    // Helligkeit: 0-100% mit klarem Tageszyklus
    let brightness = 0;
    if (hourOfDay >= 6 && hourOfDay <= 20) {
      // Tagsüber - Glockenkurve mit Maximum um 13 Uhr
      brightness = 100 * Math.exp(-Math.pow((hourOfDay - 13) / 5, 2));
      // Füge etwas Rauschen und Wolkeneffekte hinzu
      brightness = brightness * (0.85 + Math.random() * 0.15);
    }
    
    data.temperature.push({ timestamp, value: Math.round(temp * 10) / 10 });
    data.humidity.push({ timestamp, value: Math.round(Math.max(0, Math.min(100, humidity))) });
    data.soilMoisture.push({ timestamp, value: Math.round(Math.max(0, Math.min(100, soil))) });
    data.brightness.push({ timestamp, value: Math.round(Math.max(0, Math.min(100, brightness))) });
  }
  
  return data;
}
