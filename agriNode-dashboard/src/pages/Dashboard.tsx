import SensorCard from "@/components/SensorCard";
import SensorRegistrationForm from "@/components/SensorRegistrationForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSensors } from "@/contexts/SensorsContext";
import { Sensor, SensorRegistrationPayload } from "@/types/sensor";
import { AlertTriangle, Leaf, Plus, Search, Battery, BatteryLow, BatteryMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Dashboard = () => {
    const { sensors, fetchSensors, loading: isLoading } = useSensors();
    const [filteredSensors, setFilteredSensors] = useState<Sensor[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sensorToDelete, setSensorToDelete] = useState<string | null>(null);
    const [sensorToEdit, setSensorToEdit] = useState<Sensor | undefined>(undefined);
    const [activeTab, setActiveTab] = useState("all");
    
    useEffect(() => {
      console.log(sensors);
    }, []);

    useEffect(() => {
      let result = sensors.map(sensor => ({
        sensor_id: sensor.sensor_id,
        user_id: sensor.user_id,
        unique_device_id: sensor.unique_device_id,
        registered_at: sensor.registered_at,
        name: sensor.name,
        location: sensor.location,
        type: sensor.type,
        batteryLevel: sensor.batteryLevel,
        updated_at: sensor.updated_at,
      }));
      
      // Filterung nach Batteriestand
      if (activeTab === "critical") {
        result = result.filter(sensor => (sensor.batteryLevel ?? 0) < 20);
      } else if (activeTab === "low") {
        result = result.filter(sensor => {
          const level = sensor.batteryLevel ?? 0;
          return level >= 20 && level < 50;
        });
      } else if (activeTab === "good") {
        result = result.filter(sensor => (sensor.batteryLevel ?? 0) >= 50);
      }
      
      // Suche anwenden
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          sensor =>
            sensor.name.toLowerCase().includes(query) ||
            sensor.location.toLowerCase().includes(query) ||
            sensor.type.toLowerCase().includes(query)
        );
      }
      
      setFilteredSensors(result);
    }, [sensors, searchQuery, activeTab]);
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };
    
    const handleAddSensor = (data: SensorRegistrationPayload) => {

    };
    
    const handleEditSensor = (sensor: Sensor) => {
      setSensorToEdit(sensor);
      setIsAddDialogOpen(true);
    };
    
    const handleUpdateSensor = (data: any) => {

    };
    
    const confirmDeleteSensor = (sensorId: string) => {
      setSensorToDelete(sensorId);
      setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteSensor = () => {
      if (!sensorToDelete) return;
      
      // Simulation eines API-Aufrufs zum Löschen eines Sensors
      // setSensors(prev => prev.filter(sensor => sensor.id !== sensorToDelete));
      setSensorToDelete(null);
      setIsDeleteDialogOpen(false);
      
      toast.success("Sensor erfolgreich gelöscht");
    };
    
    const openAddDialog = () => {
      setSensorToEdit(undefined);
      setIsAddDialogOpen(true);
    };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold flex items-center">
              <Leaf className="mr-2 text-agrinode-primary" />
              AgriNode Dashboard
            </h1>
            <p className="text-muted-foreground">
              Überwachen und verwalten Sie Ihre Sensoren
            </p>
          </div>
          
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Sensor hinzufügen
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm mb-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Sensoren durchsuchen..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Alle Sensoren</TabsTrigger>
              <TabsTrigger value="critical" className="flex items-center">
                <BatteryLow className="mr-1 h-4 w-4 text-red-500" />
                Kritisch
              </TabsTrigger>
              <TabsTrigger value="low" className="flex items-center">
                <Battery className="mr-1 h-4 w-4 text-yellow-500" />
                Niedrig
              </TabsTrigger>
              <TabsTrigger value="good" className="flex items-center">
                <BatteryMedium className="mr-1 h-4 w-4 text-green-500" />
                Gut
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Sensoren werden geladen...</p>
                </div>
              ) : filteredSensors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSensors.map((sensor) => (
                    <SensorCard
                      key={sensor.sensor_id}
                      sensor={sensor}
                      onEdit={handleEditSensor}
                      onDelete={confirmDeleteSensor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                  <h2 className="text-xl font-medium mb-2">Keine Sensoren gefunden</h2>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Keine Sensoren entsprechen Ihren Suchkriterien."
                      : "Es wurden noch keine Sensoren registriert."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={openAddDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Sensor hinzufügen
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="critical" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Sensoren werden geladen...</p>
                </div>
              ) : filteredSensors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSensors.map((sensor) => (
                    <SensorCard
                      key={sensor.sensor_id}
                      sensor={sensor}
                      onEdit={handleEditSensor}
                      onDelete={confirmDeleteSensor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-medium mb-2">Keine Sensoren mit kritischem Batteriestand</h2>
                  <p className="text-muted-foreground">
                    Es wurden keine Sensoren mit kritischem Batteriestand gefunden.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="low" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Sensoren werden geladen...</p>
                </div>
              ) : filteredSensors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSensors.map((sensor) => (
                    <SensorCard
                      key={sensor.sensor_id}
                      sensor={sensor}
                      onEdit={handleEditSensor}
                      onDelete={confirmDeleteSensor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-medium mb-2">Keine Sensoren mit niedrigem Batteriestand</h2>
                  <p className="text-muted-foreground">
                    Es wurden keine Sensoren mit niedrigem Batteriestand gefunden.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="good" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Sensoren werden geladen...</p>
                </div>
              ) : filteredSensors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSensors.map((sensor) => (
                    <SensorCard
                      key={sensor.sensor_id}
                      sensor={sensor}
                      onEdit={handleEditSensor}
                      onDelete={confirmDeleteSensor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-medium mb-2">Keine Sensoren mit gutem Batteriestand</h2>
                  <p className="text-muted-foreground">
                    Es wurden keine Sensoren mit gutem Batteriestand gefunden.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialoge */}
      <SensorRegistrationForm
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setSensorToEdit(undefined);
        }}
        editingSensor={sensorToEdit}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Sensor wird dauerhaft aus dem System entfernt.
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

}