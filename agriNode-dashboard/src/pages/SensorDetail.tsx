import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { 
  ChevronLeft, 
  Thermometer, 
  Droplet, 
  Flower, 
  Sun, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SensorDataChart from "@/components/SensorDataChart";
import SensorRegistrationForm from "@/components/SensorRegistrationForm";
import { SensorReadingsByType, SensorUpdatePayload } from "@/types/sensor";
import { Sensor, SensorData as ApiSensorData } from "@/types/api";
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
import AppSidebar from "@/components/AppSidebar";
import { useSensors } from "@/contexts/SensorsContext";
import { useSensorData } from "@/contexts/SensorDataContext";

// Zeitraumoptionen für den Auswahlmenüs
const TIME_RANGES = [
  { value: '24h', label: 'Letzte 24 Stunden' },
  { value: '48h', label: 'Letzte 48 Stunden' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: '30d', label: 'Letzte 30 Tage' },
];

const SensorDetail = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const navigate = useNavigate();
  
  const { getSensorById, updateSensor, deleteSensor } = useSensors();
  const { getSensorDataBySensorId, getSensorDataByTimeRange } = useSensorData();
  
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [sensorData, setSensorData] = useState<SensorReadingsByType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any scheduled fetch
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Set loading state to show user that data is being fetched
      setDataLoading(true);
      
      const { startTime, endTime } = getTimeRangeParams();
      
      // Add a small delay to prevent rapid successive requests
      await new Promise(resolve => {
        fetchTimeoutRef.current = window.setTimeout(() => {
          resolve(null);
        }, 300);
      });
      
      // Sensordaten für den ausgewählten Zeitraum abrufen
      const sensorDataResponse = await getSensorDataByTimeRange(
        sensorId, 
        startTime, 
        endTime, 
        abortControllerRef.current.signal
      );
      
      if (sensorDataResponse && sensorDataResponse.length > 0) {
        // Konvertiere API-Daten in das vom Frontend erwartete Format
        const formattedData: SensorReadingsByType = {
          temperature: [],
          humidity: [],
          soilMoisture: [],
          brightness: []
        };
        
        sensorDataResponse.forEach((data: ApiSensorData) => {
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
      } else {
        setSensorData({
          temperature: [],
          humidity: [],
          soilMoisture: [],
          brightness: []
        });
      }
    } catch (error) {
      // Ignore AbortError as it's expected when cancelling requests
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
        // Sensor aus dem SensorsContext abrufen
        const foundSensor = getSensorById(sensorId);
        
        if (!foundSensor) {
          toast.error("Sensor nicht gefunden");
          navigate("/");
          return;
        }
        
        setSensor(foundSensor);
        
        // Initiale Sensordaten laden
        await fetchSensorData();
        
      } catch (error) {
        console.error("Fehler beim Laden der Sensordaten:", error);
        toast.error("Fehler beim Laden der Sensordaten");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sensorId, navigate, getSensorById]);
  
  // Laden neuer Daten, wenn sich der Zeitraum ändert
  useEffect(() => {
    if (sensor) {
      fetchSensorData();
    }
  }, [selectedTimeRange]);

  // Cleanup function to cancel any in-flight requests when the component unmounts
  useEffect(() => {
    return () => {
      // Cancel any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear any scheduled fetch
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Hilfsfunktion zum Abrufen des neuesten Werts eines bestimmten Datentyps
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

  // Formatiere Sensorwerte mit den korrekten Einheiten
  const getFormattedSensorValue = (dataType: keyof SensorReadingsByType) => {
    const value = getLatestSensorValue(dataType);
    if (value === null) return 'N/A';
    
    switch(dataType) {
      case 'temperature':
        return `${value}°C`;
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
        return `${value.toFixed(0)} Lux`;
      default:
        return `${value}`;
    }
  };

  const handleSensorUpdate = async (data: SensorUpdatePayload) => {
    if (!sensor || !sensor.sensor_id) return;
    
    try {
      const updateData = {
        name: data.name,
        location: data.location,
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Daten werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!sensor) {
    return (
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sensor nicht gefunden</h2>
            <p className="text-muted-foreground mb-6">Der angeforderte Sensor existiert nicht oder wurde gelöscht.</p>
            <Button onClick={() => navigate("/")}>Zurück zur Übersicht</Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{sensor.name}</h1>
                <p className="text-muted-foreground">{sensor.location}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Batteriestand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {getBatteryIcon()}
                  <span className={`ml-2 font-medium ${getBatteryTextClass()}`}>
                    {sensor.batteryLevel ?? 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Typ</CardTitle>
              </CardHeader>
              <CardContent>{sensor.type || "Standard"}</CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ID</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  {sensor.sensor_id || "Unbekannt"}
                </code>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Letzte Aktualisierung</CardTitle>
              </CardHeader>
              <CardContent>
                {sensor.updated_at ? new Date(sensor.updated_at).toLocaleString('de-DE') : "Unbekannt"}
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sensordatenanalyse</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Zeitraum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dataLoading && (
                <div className="ml-2 animate-pulse text-sm text-muted-foreground">
                  Daten werden geladen...
                </div>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="combined">
            <TabsList className="mb-4">
              <TabsTrigger value="combined">Alle Daten</TabsTrigger>
              <TabsTrigger value="temperature">Temperatur</TabsTrigger>
              <TabsTrigger value="humidity">Luftfeuchtigkeit</TabsTrigger>
              <TabsTrigger value="soil">Bodenfeuchtigkeit</TabsTrigger>
              <TabsTrigger value="brightness">Helligkeit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="combined">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sensorData && (
                  <>
                    <SensorDataChart 
                      title="Temperatur" 
                      data={sensorData.temperature}
                      dataType="temperature"
                      selectedTimeRange={selectedTimeRange}
                    />
                    <SensorDataChart 
                      title="Luftfeuchtigkeit" 
                      data={sensorData.humidity}
                      dataType="humidity"
                      selectedTimeRange={selectedTimeRange}
                    />
                    <SensorDataChart 
                      title="Bodenfeuchtigkeit" 
                      data={sensorData.soilMoisture}
                      dataType="soilMoisture"
                      selectedTimeRange={selectedTimeRange}
                    />
                    <SensorDataChart 
                      title="Helligkeit" 
                      data={sensorData.brightness}
                      dataType="brightness"
                      selectedTimeRange={selectedTimeRange}
                    />
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="temperature">
              {sensorData && (
                <SensorDataChart 
                  title="Temperatur" 
                  data={sensorData.temperature}
                  dataType="temperature"
                  selectedTimeRange={selectedTimeRange}
                  height={500}
                />
              )}
            </TabsContent>
            
            <TabsContent value="humidity">
              {sensorData && (
                <SensorDataChart 
                  title="Luftfeuchtigkeit" 
                  data={sensorData.humidity}
                  dataType="humidity"
                  selectedTimeRange={selectedTimeRange}
                  height={500}
                />
              )}
            </TabsContent>
            
            <TabsContent value="soil">
              {sensorData && (
                <SensorDataChart 
                  title="Bodenfeuchtigkeit" 
                  data={sensorData.soilMoisture}
                  dataType="soilMoisture"
                  selectedTimeRange={selectedTimeRange}
                  height={500}
                />
              )}
            </TabsContent>
            
            <TabsContent value="brightness">
              {sensorData && (
                <SensorDataChart 
                  title="Helligkeit" 
                  data={sensorData.brightness}
                  dataType="brightness"
                  selectedTimeRange={selectedTimeRange}
                  height={500}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Dialoge */}
      <SensorRegistrationForm 
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editingSensor={sensor}
        onSensorSaved={(updatedSensor) => {
          setSensor(updatedSensor);
          setEditDialogOpen(false);
        }}
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteSensor}>
              Sensor löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SensorDetail;
