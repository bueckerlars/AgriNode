import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sensor } from "@/types/sensor";
import { useSensorDataFetching } from "@/hooks/useSensorDataFetching";
import { useAuth } from "@/contexts/AuthContext";
import { SensorCardHeader } from "./SensorCardElements/SensorCardHeader";
import { SensorCardMetadata } from "./SensorCardElements/SensorCardMetadata";
import { SensorReadings } from "./SensorCardElements/SensorReadings";
import { SensorCardFooter } from "./SensorCardElements/SensorCardFooter";

interface SensorCardProps {
  sensor: Sensor;
  onEdit: (sensor: Sensor) => void;
  onDelete: (sensorId: string) => void;
  onShare?: (sensor: Sensor) => void;
}

const SensorCard = ({ sensor, onEdit, onDelete, onShare }: SensorCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Custom hook handles data fetching and processing
  const { sensorData, loading } = useSensorDataFetching(sensor.sensor_id);
  
  // Überprüfen, ob der aktuelle Benutzer der Besitzer des Sensors ist
  const isOwner = user?.user_id === sensor.user_id;

  const navigateToDetails = () => {
    navigate(`/sensors/${sensor.sensor_id}`);
  };
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={navigateToDetails}
    >
      <SensorCardHeader 
        sensor={sensor}
        isOwner={isOwner}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
        navigate={navigate}
      />
      
      <SensorCardMetadata 
        sensor={sensor}
      />
      
      <SensorReadings 
        sensorData={sensorData} 
        loading={loading}
      />
      
      <SensorCardFooter 
        updatedAt={sensor.updated_at}
      />
    </Card>
  );
};

export default SensorCard;
