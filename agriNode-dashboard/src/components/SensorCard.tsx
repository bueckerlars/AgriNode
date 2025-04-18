import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Thermometer, Droplet, Sun, Flower, Battery, BatteryLow, BatteryMedium, BatteryFull, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Sensor, SensorReadingsByType, SensorDataPoint } from "@/types/sensor";
import { SensorData as ApiSensorData } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useSensorData } from "@/contexts/SensorDataContext";
import { useAuth } from "@/contexts/AuthContext";

interface SensorCardProps {
  sensor: Sensor;
  onEdit: (sensor: Sensor) => void;
  onDelete: (sensorId: string) => void;
  onShare?: (sensor: Sensor) => void; // Neue Prop für die Teilen-Funktion
}

const SensorCard = ({ sensor, onEdit, onDelete, onShare }: SensorCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sensorData, setSensorData] = useState<SensorReadingsByType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reference for abort controller to cancel requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get sensor data context
  const { getSensorDataBySensorId } = useSensorData();
  
  // Überprüfen, ob der aktuelle Benutzer der Besitzer des Sensors ist
  const isOwner = user?.user_id === sensor.user_id;
  
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        // Create a new AbortController instance
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Get sensor readings from context
        const apiSensorData = await getSensorDataBySensorId(sensor.sensor_id || "", signal);
        
        // Convert API data to the format expected by the component
        if (apiSensorData && apiSensorData.length > 0) {
          const formattedData: SensorReadingsByType = {
            temperature: [],
            humidity: [],
            soilMoisture: [],
            brightness: []
          };
          
          apiSensorData.forEach((data: ApiSensorData) => {
            const timestamp = data.timestamp;
            
            if (data.air_temperature !== undefined) {
              formattedData.temperature.push({
                timestamp,
                value: data.air_temperature
              });
            }
            
            if (data.air_humidity !== undefined) {
              formattedData.humidity.push({
                timestamp,
                value: data.air_humidity
              });
            }
            
            if (data.soil_moisture !== undefined) {
              formattedData.soilMoisture.push({
                timestamp,
                value: data.soil_moisture
              });
            }
            
            if (data.brightness !== undefined) {
              formattedData.brightness.push({
                timestamp,
                value: data.brightness
              });
            }
          });
          
          setSensorData(formattedData);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Fehler beim Laden der Sensordaten:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (sensor.sensor_id) {
      fetchSensorData();
    }

    return () => {
      // Abort the fetch request if the component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sensor.sensor_id, getSensorDataBySensorId]);
  
  // Hilfsfunktion, um den aktuellsten Wert für einen bestimmten Sensortyp zu holen
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
  
  // Hilfsfunktion für die formatierte Anzeige der Sensorwerte mit korrekten Einheiten
  const getFormattedSensorValue = (dataType: keyof SensorReadingsByType) => {
    const value = getLatestSensorValue(dataType);
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
        return `${value.toFixed(0)}`;
      default:
        return `${value}`;
    }
  };
  
  const getBatteryIcon = () => {
    const level = sensor.batteryLevel ?? 0;
    
    if (level < 20) {
      return <BatteryLow className="w-4 h-4 text-red-500" />;
    } else if (level < 50) {
      return <Battery className="w-4 h-4 text-yellow-500" />;
    } else if (level < 80) {
      return <BatteryMedium className="w-4 h-4 text-green-500" />;
    } else {
      return <BatteryFull className="w-4 h-4 text-green-600" />;
    }
  };
  
  const getBatteryText = () => {
    const level = sensor.batteryLevel ?? 0;
    return `${level}%`;
  };
  
  const getLastUpdatedText = () => {
    try {
      return formatDistanceToNow(new Date(sensor.updated_at), { 
        addSuffix: true,
        locale: de
      });
    } catch (error) {
      return 'Unbekannt';
    }
  };

  const navigateToDetails = () => {
    navigate(`/sensors/${sensor.sensor_id}`);
  };
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={navigateToDetails}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{sensor.name}</CardTitle>
            <CardDescription>{sensor.location}</CardDescription>
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation(); // Verhindert, dass der Klick auf den Button auch die Karte auslöst
                }}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation(); // Verhindert, dass der Klick auf das Menüitem auch die Karte auslöst
                navigate(`/sensors/${sensor.sensor_id}`);
              }}>
                Details anzeigen
              </DropdownMenuItem>
              
              {/* Nur anzeigen, wenn der aktuelle Benutzer der Besitzer ist */}
              {isOwner && (
                <>
                  {/* Neue Option zum Teilen des Sensors */}
                  {onShare && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onShare(sensor);
                    }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Teilen
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(sensor);
                  }}>
                    Bearbeiten
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sensor.sensor_id);
                    }}
                  >
                    Löschen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex space-x-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center">
            {getBatteryIcon()}
            <span className="ml-1.5">{getBatteryText()}</span>
          </div>
          <div>{sensor.type}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Thermometer className="text-agrinode-temperature mb-1" size={18} />
            <span className="text-xs">{getFormattedSensorValue('temperature')}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Droplet className="text-agrinode-humidity mb-1" size={18} />
            <span className="text-xs">{getFormattedSensorValue('humidity')}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-agrinode-light rounded">
            <Sun className="text-agrinode-brightness mb-1" size={18} />
            <span className="text-xs">{getFormattedSensorValue('brightness')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full text-xs text-muted-foreground">
          Aktualisiert: {getLastUpdatedText()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SensorCard;
