import { useState, useEffect, useRef } from "react";
import { SensorReadingsByType } from "@/types/sensor";
import { SensorData as ApiSensorData } from "@/types/api";
import { useSensorData } from "@/contexts/SensorDataContext";

/**
 * Custom Hook für das Abrufen und Verarbeiten von Sensordaten
 * Verantwortlich für die Datenabruflogik der SensorCard
 */
export function useSensorDataFetching(sensorId?: string) {
  const [sensorData, setSensorData] = useState<SensorReadingsByType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reference for abort controller to cancel requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get sensor data context
  const { getSensorDataBySensorId } = useSensorData();
  
  useEffect(() => {
    const fetchSensorData = async () => {
      if (!sensorId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Create a new AbortController instance
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Get sensor readings from context
        const apiSensorData = await getSensorDataBySensorId(sensorId, signal);
        
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
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Fehler beim Laden der Sensordaten:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSensorData();

    return () => {
      // Abort the fetch request if the component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sensorId, getSensorDataBySensorId]);

  return { sensorData, loading };
}