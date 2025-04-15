import { useEffect, useState } from "react";
import SensorCard from "./SensorCard";
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
  
  useEffect(() => {
    // Reset when the sensors list changes
    setVisibleSensors([]);
    
    // Show no more than 3 sensors at a time with a delay between batches
    const batchSize = 3;
    const delayBetweenBatches = 500; // milliseconds
    
    sensors.forEach((sensor, index) => {
      const batchIndex = Math.floor(index / batchSize);
      const delay = batchIndex * delayBetweenBatches;
      
      setTimeout(() => {
        setVisibleSensors(prev => [...prev, sensor]);
      }, delay);
    });
  }, [sensors]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleSensors.map((sensor) => (
        <SensorCard
          key={sensor.sensor_id}
          sensor={sensor}
          onEdit={onEdit}
          onDelete={onDelete}
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
  );
};

export default SensorCardList;