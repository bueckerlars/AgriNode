import { CardFooter } from "@/components/ui/card";
import { formatLastUpdated } from "@/utils/sensorValueFormatters";

interface SensorCardFooterProps {
  updatedAt?: Date | string;
}

/**
 * Zeigt den letzten Aktualisierungszeitpunkt des Sensors an
 * Verantwortlich für die Anzeige des Zeitstempels
 */
export function SensorCardFooter({ updatedAt }: SensorCardFooterProps) {
  return (
    <CardFooter className="pt-2">
      <div className="w-full text-xs text-muted-foreground">
        Aktualisiert: {formatLastUpdated(updatedAt)}
      </div>
    </CardFooter>
  );
}