import { CardContent } from "@/components/ui/card";
import { Sensor } from "@/types/sensor";
import { getBatteryIcon, getBatteryText, getBatteryTextClass } from "@/utils/batteryIndicatorUtils";

interface SensorCardMetadataProps {
  sensor: Sensor;
}

/**
 * Metadaten des Sensors: Batteriestatus und Sensorinformationen
 * Verantwortlich für die Anzeige von Batteriestatus und Gerätedetails
 */
export function SensorCardMetadata({ sensor }: SensorCardMetadataProps) {
  const BatteryIcon = getBatteryIcon(sensor.batteryLevel);
  const batteryTextClass = getBatteryTextClass(sensor.batteryLevel);
  const batteryText = getBatteryText(sensor.batteryLevel);

  return (
    <CardContent className="pb-2">
      <div className="flex space-x-4 mb-3 text-sm text-muted-foreground">
        <div className="flex items-center">
          <BatteryIcon className={`w-4 h-4 ${batteryTextClass}`} />
          <span className={`ml-1.5 ${batteryTextClass}`}>{batteryText}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{sensor.type}</span>
          {sensor.firmware_version && (
            <>
              <span>·</span>
              <span>v{sensor.firmware_version}</span>
            </>
          )}
        </div>
      </div>
    </CardContent>
  );
}