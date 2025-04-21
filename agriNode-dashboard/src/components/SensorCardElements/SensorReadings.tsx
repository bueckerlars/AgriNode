import { CardContent } from "@/components/ui/card";
import { Thermometer, Droplet, Sun } from "lucide-react";
import { SensorReadingsByType } from "@/types/sensor";
import { formatSensorValue } from "@/utils/sensorValueFormatters";

interface SensorReadingsProps {
  sensorData: SensorReadingsByType | null;
  loading: boolean;
}

/**
 * Zeigt die aktuellen Sensorwerte an
 * Verantwortlich für die Darstellung der verschiedenen Messwerte
 */
export function SensorReadings({ sensorData, loading }: SensorReadingsProps) {
  return (
    <CardContent>
      {loading ? (
        <div className="flex justify-center items-center h-16 text-sm text-muted-foreground">
          Lade Daten...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Thermometer className="text-agrinode-temperature mb-1" size={18} />
            <span className="text-xs">{formatSensorValue(sensorData, 'temperature')}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Droplet className="text-agrinode-humidity mb-1" size={18} />
            <span className="text-xs">{formatSensorValue(sensorData, 'humidity')}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Sun className="text-agrinode-brightness mb-1" size={18} />
            <span className="text-xs">{formatSensorValue(sensorData, 'brightness')}</span>
          </div>
        </div>
      )}
    </CardContent>
  );
}