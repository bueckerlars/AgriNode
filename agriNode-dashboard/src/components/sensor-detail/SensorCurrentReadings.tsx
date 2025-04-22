import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplet, Flower, Sun } from "lucide-react";
import { SensorReadingsByType } from "@/types/sensor";
import { SensorValueCard } from "./SensorValueCard";

interface SensorCurrentReadingsProps {
  sensorData: SensorReadingsByType | null;
  loading?: boolean;
}

export const SensorCurrentReadings = ({ sensorData, loading = false }: SensorCurrentReadingsProps) => {
  // Hilfsfunktion zum Abrufen des neuesten Werts eines bestimmten Datentyps
  const getLatestSensorValue = (dataType: keyof SensorReadingsByType) => {
    if (!sensorData || !sensorData[dataType] || sensorData[dataType].length === 0) {
      return null;
    }
    
    // Sortiere nach Zeitstempel (neueste zuerst) und nimm den ersten Wert
    const sortedData = [...sensorData[dataType]].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedData[0].value;
  };

  // Formatiere Sensorwerte mit den korrekten Einheiten
  const getFormattedSensorValue = (dataType: keyof SensorReadingsByType) => {
    const value = getLatestSensorValue(dataType);
    if (value === null) return 'N/A';
    
    switch(dataType) {
      case 'temperature':
        return `${value}°C`;
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
        return `${value.toFixed(0)} Lux`;
      default:
        return `${value}`;
    }
  };

  return (
    <div className="mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Aktuelle Werte</CardTitle>
          <CardDescription>
            Letzte erfasste Sensordaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SensorValueCard
              icon={Thermometer}
              iconColorClass="text-agrinode-temperature"
              label="Temperatur"
              value={getFormattedSensorValue('temperature')}
              isLoading={loading}
            />
            
            <SensorValueCard
              icon={Droplet}
              iconColorClass="text-agrinode-humidity"
              label="Luftfeuchtigkeit"
              value={getFormattedSensorValue('humidity')}
              isLoading={loading}
            />
            
            <SensorValueCard
              icon={Flower}
              iconColorClass="text-agrinode-soil"
              label="Bodenfeuchtigkeit"
              value={getFormattedSensorValue('soilMoisture')}
              isLoading={loading}
            />
            
            <SensorValueCard
              icon={Sun}
              iconColorClass="text-agrinode-brightness"
              label="Helligkeit"
              value={getFormattedSensorValue('brightness')}
              isLoading={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};