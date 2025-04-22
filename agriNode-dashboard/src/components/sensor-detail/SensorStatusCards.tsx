import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { Sensor } from "@/types/api";

interface SensorStatusCardsProps {
  sensor: Sensor;
}

export const SensorStatusCards = ({ sensor }: SensorStatusCardsProps) => {
  const getBatteryIcon = () => {
    const level = sensor?.batteryLevel ?? 0;
    
    if (level < 20) {
      return <BatteryLow className="h-5 w-5 text-red-500" />;
    } else if (level < 50) {
      return <Battery className="h-5 w-5 text-yellow-500" />;
    } else if (level < 80) {
      return <BatteryMedium className="h-5 w-5 text-green-500" />;
    } else {
      return <BatteryFull className="h-5 w-5 text-green-600" />;
    }
  };
  
  const getBatteryTextClass = () => {
    const level = sensor?.batteryLevel ?? 0;
    
    if (level < 20) {
      return 'text-red-600';
    } else if (level < 50) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-2">
            {getBatteryIcon()}
            <span className={`ml-2 font-medium ${getBatteryTextClass()}`}>
              {sensor.batteryLevel ?? 0}%
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Aktualisiert: {new Date(sensor.updated_at).toLocaleString('de-DE')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Gerät</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">{sensor.type || "Standard"}</div>
          {sensor.firmware_version && (
            <div className="text-sm text-muted-foreground">
              Firmware: v{sensor.firmware_version}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Standort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">{sensor.location || "Nicht angegeben"}</div>
          <div className="text-sm text-muted-foreground">
            Registriert: {new Date(sensor.registered_at).toLocaleDateString('de-DE')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mb-1 break-all">
            {sensor.sensor_id}
          </div>
          <div className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 break-all">
            {sensor.unique_device_id}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};