import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SensorPageHeader } from "@/components/sensor-detail/SensorPageHeader";
import { SensorStatusCards } from "@/components/sensor-detail/SensorStatusCards";
import { SensorCurrentReadings } from "@/components/sensor-detail/SensorCurrentReadings";
import { SensorDataAnalytics } from "@/components/sensor-detail/SensorDataAnalytics";
import SensorRegistrationForm from "@/components/SensorRegistrationForm";
import SensorSharingDialog from "@/components/SensorSharingDialog";
import AppSidebar from "@/components/AppSidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { SensorReadingsByType } from "@/types/sensor";
import { Sensor, SensorData as ApiSensorData, UpdateSensorRequest } from "@/types/api";
import { useSensors } from "@/contexts/SensorsContext";
import { useSensorData } from "@/contexts/SensorDataContext";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { useAuth } from "@/contexts/AuthContext";
import sensorApi from "@/api/sensorApi";

const SensorDetail = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSensorById, updateSensor, deleteSensor, fetchSensors, sensors } = useSensors();
  const { getSensorDataByTimeRange } = useSensorData();
  const { removeShare } = useSensorSharing();
  
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [sensorData, setSensorData] = useState<SensorReadingsByType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  
  // Add controller reference for fetch cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  // Add fetch timeout reference
  const fetchTimeoutRef = useRef<number | null>(null);

  // Funktion zur Umwandlung des ausgewählten Zeitraums in Datum und Zeit für die API
  const getTimeRangeParams = () => {
    const now = new Date();
    let startTime = new Date();
    
    switch (selectedTimeRange) {
      case '48h':
        startTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    };
  };

  const fetchSensorData = async () => {
    if (!sensorId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setDataLoading(true);
      
      const { startTime, endTime } = getTimeRangeParams();
      
      await new Promise(resolve => {
        fetchTimeoutRef.current = window.setTimeout(resolve, 300);
      });
      
      const sensorDataResponse = await getSensorDataByTimeRange(
        sensorId, 
        startTime, 
        endTime, 
        abortControllerRef.current.signal
      );
      
      if (sensorDataResponse && sensorDataResponse.length > 0) {
        const formattedData: SensorReadingsByType = {
          temperature: [],
          humidity: [],
          soilMoisture: [],
          brightness: []
        };
        
        sensorDataResponse.forEach((data: ApiSensorData) => {
          const timestamp = data.timestamp;
          
          if (data.air_temperature !== undefined) {
            formattedData.temperature.push({ timestamp, value: data.air_temperature });
          }
          if (data.air_humidity !== undefined) {
            formattedData.humidity.push({ timestamp, value: data.air_humidity });
          }
          if (data.soil_moisture !== undefined) {
            formattedData.soilMoisture.push({ timestamp, value: data.soil_moisture });
          }
          if (data.brightness !== undefined) {
            formattedData.brightness.push({ timestamp, value: data.brightness });
          }
        });
        
        setSensorData(formattedData);
      } else {
        setSensorData({
          temperature: [],
          humidity: [],
          soilMoisture: [],
          brightness: []
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Fehler beim Laden der Sensordaten:", error);
        toast.error("Fehler beim Laden der Sensordaten");
      }
    } finally {
      setDataLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  useEffect(() => {
    if (!sensorId) return;
    
    setLoading(true);
    
    const fetchData = async () => {
      try {
        if (sensors.length === 0) {
          await fetchSensors();
        }
        
        const foundSensor = getSensorById(sensorId);
        
        if (!foundSensor) {
          try {
            const sensor = await sensorApi.getSensorById(sensorId);
            if (sensor) {
              setSensor(sensor);
              await fetchSensorData();
              return;
            } else {
              toast.error("Sensor nicht gefunden");
              navigate("/");
              return;
            }
          } catch (error) {
            console.error("Fehler beim Laden des spezifischen Sensors:", error);
            toast.error("Sensor nicht gefunden");
            navigate("/");
            return;
          }
        }
        
        setSensor(foundSensor);
        await fetchSensorData();
        
      } catch (error) {
        console.error("Fehler beim Laden der Sensordaten:", error);
        toast.error("Fehler beim Laden der Sensordaten");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sensorId, navigate, getSensorById, fetchSensors, sensors.length]);
  
  useEffect(() => {
    if (sensor) {
      fetchSensorData();
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);
  
  const handleSensorUpdate = async (sensor: Sensor) => {
    if (!sensor || !sensor.sensor_id) return;
    
    try {
      const updateData: UpdateSensorRequest = {
        name: sensor.name,
        location: sensor.location,
      };
      
      const updatedSensor = await updateSensor(sensor.sensor_id, updateData);
      setSensor(updatedSensor);
      setEditDialogOpen(false);
      toast.success("Sensor erfolgreich aktualisiert");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Sensors:", error);
      toast.error("Fehler beim Aktualisieren des Sensors");
    }
  };
  
  const handleDeleteSensor = async () => {
    if (!sensor || !sensor.sensor_id) return;
    
    try {
      await deleteSensor(sensor.sensor_id);
      setDeleteDialogOpen(false);
      toast.success("Sensor erfolgreich gelöscht");
      navigate("/");
    } catch (error) {
      console.error("Fehler beim Löschen des Sensors:", error);
      toast.error("Fehler beim Löschen des Sensors");
    }
  };

  const handleRemoveShare = async () => {
    if (!sensor) return;
    
    try {
      await removeShare(sensor.sensor_id);
      toast.success("Freigabe erfolgreich entfernt");
      navigate('/');
    } catch (error) {
      console.error("Fehler beim Entfernen der Freigabe:", error);
      toast.error("Fehler beim Entfernen der Freigabe");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" className="mx-auto text-agrinode-primary" />
            <p className="text-xl text-muted-foreground">Daten werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!sensor) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sensor nicht gefunden</h2>
            <p className="text-muted-foreground mb-6">
              Der angeforderte Sensor existiert nicht oder wurde gelöscht.
            </p>
            <Button onClick={() => navigate("/")}>Zurück zur Übersicht</Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = sensor.user_id === (user?.user_id || '');

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <SensorPageHeader
            sensor={sensor}
            isOwner={isOwner}
            onEdit={() => setEditDialogOpen(true)}
            onShare={() => setSharingDialogOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
            onRemoveShare={handleRemoveShare}
          />
          
          <SensorStatusCards sensor={sensor} />
          
          <SensorCurrentReadings 
            sensorData={sensorData} 
            loading={dataLoading}
          />
          
          <SensorDataAnalytics
            sensorData={sensorData}
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            dataLoading={dataLoading}
          />
        </div>
      </div>

      <SensorRegistrationForm 
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editingSensor={sensor}
        onSensorSaved={handleSensorUpdate}
      />
      
      <SensorSharingDialog
        isOpen={sharingDialogOpen}
        onClose={() => setSharingDialogOpen(false)}
        sensor={sensor}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Sensor "{sensor.name}" wird dauerhaft aus dem System entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleDeleteSensor}
            >
              Sensor löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SensorDetail;
