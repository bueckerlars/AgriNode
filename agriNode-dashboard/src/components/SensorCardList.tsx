import { useEffect, useState } from "react";
import SensorCard from "./SensorCard";
import SensorSharingDialog from "./SensorSharingDialog";
import { Sensor } from "@/types/sensor";

interface SensorCardListProps {
  sensors: Sensor[];
  onEdit: (sensor: Sensor) => void;
  onDelete: (sensorId: string) => void;
}

/**
 * A component that staggers the rendering of SensorCard components to prevent too many
 * simultaneous API requests which can cause resource exhaustion in the browser.
 */
const SensorCardList = ({ sensors, onEdit, onDelete }: SensorCardListProps) => {
  const [visibleSensors, setVisibleSensors] = useState<Sensor[]>([]);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  
  // Effekt für das stufenweise Laden der Sensoren
  useEffect(() => {
    // Timeout-IDs für die Cleanup-Funktion speichern
    const timeouts: NodeJS.Timeout[] = [];
    
    // Reset when the sensors list changes
    setVisibleSensors([]);
    
    // Show no more than 3 sensors at a time with a delay between batches
    const batchSize = 3;
    const delayBetweenBatches = 500; // milliseconds
    
    sensors.forEach((sensor, index) => {
      const batchIndex = Math.floor(index / batchSize);
      const delay = batchIndex * delayBetweenBatches;
      
      const timeout = setTimeout(() => {
        setVisibleSensors(prev => {
          // Überprüfen ob der Sensor bereits angezeigt wird
          if (prev.some(s => s.sensor_id === sensor.sensor_id)) {
            return prev;
          }
          return [...prev, sensor];
        });
      }, delay);
      
      timeouts.push(timeout);
    });

    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      setVisibleSensors([]); // Reset beim Unmount
    };
  }, [sensors]);
  
  const handleShare = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setSharingDialogOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSensors.map((sensor) => (
          <SensorCard
            key={sensor.sensor_id}
            sensor={sensor}
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={handleShare}
          />
        ))}
        {sensors.length > visibleSensors.length && (
          <div className="col-span-full text-center py-3">
            <p className="text-sm text-muted-foreground animate-pulse">
              Lade weitere Sensoren...
            </p>
          </div>
        )}
      </div>

      {/* SensorSharingDialog */}
      {selectedSensor && (
        <SensorSharingDialog
          isOpen={sharingDialogOpen}
          onClose={() => setSharingDialogOpen(false)}
          sensor={selectedSensor}
        />
      )}
    </>
  );
};

export default SensorCardList;