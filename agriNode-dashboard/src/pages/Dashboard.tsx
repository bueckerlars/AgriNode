import SensorCard from "@/components/SensorCard";
import SensorCardList from "@/components/SensorCardList";
import SensorRegistrationForm from "@/components/SensorRegistrationForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSensors } from "@/contexts/SensorsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { Sensor, SensorRegistrationPayload } from "@/types/sensor";
import { AlertTriangle, Bell, Leaf, Plus, Search, Clock, Check, X } from "lucide-react";
import PendingSharesDialog from "@/components/PendingSharesDialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Dashboard = () => {
    const { 
        sensors, 
        fetchSensors, 
        deleteSensor, 
        loading: isLoading 
    } = useSensors();
    const { user } = useAuth();
    const { 
        pendingShares, 
        fetchPendingShares, 
        acceptShare, 
        rejectShare, 
        loading 
    } = useSensorSharing();

    const [filteredSensors, setFilteredSensors] = useState<Sensor[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sensorToDelete, setSensorToDelete] = useState<string | null>(null);
    const [sensorToEdit, setSensorToEdit] = useState<Sensor | undefined>(undefined);
    const [activeTab, setActiveTab] = useState("all");
    const [isPendingSharesOpen, setIsPendingSharesOpen] = useState(false);
    const [previousSharesCount, setPreviousSharesCount] = useState(0);

    const handleAcceptShare = async (sharingId: string) => {
        try {
            await acceptShare(sharingId);
        } catch (error) {
            console.error('Fehler beim Akzeptieren der Freigabe:', error);
            toast.error('Fehler beim Akzeptieren der Freigabe');
        }
    };

    const handleRejectShare = async (sharingId: string) => {
        try {
            await rejectShare(sharingId);
        } catch (error) {
            console.error('Fehler beim Ablehnen der Freigabe:', error);
            toast.error('Fehler beim Ablehnen der Freigabe');
        }
    };

    // Effekt für das regelmäßige Aktualisieren der Freigaben
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPendingShares();
        }, 30000); // Alle 30 Sekunden aktualisieren

        return () => clearInterval(interval);
    }, [fetchPendingShares]);

    // Effekt für die Benachrichtigung bei neuen Freigaben
    useEffect(() => {
        if (pendingShares.length > previousSharesCount) {
            const newSharesCount = pendingShares.length - previousSharesCount;
            toast.info(`${newSharesCount} neue Sensor-Freigabe${newSharesCount > 1 ? 'n' : ''} verfügbar`);
        }
        setPreviousSharesCount(pendingShares.length);
    }, [pendingShares.length, previousSharesCount]);

    // Effekt für das Filtern der Sensoren
    useEffect(() => {
        if (!sensors || !user) {
            setFilteredSensors([]);
            return;
        }

        // Filtern nach Tab-Auswahl
        let result = [...sensors]; // Create a new array to avoid mutation
        
        if (activeTab === "mine") {
            result = result.filter(sensor => sensor.user_id === user.user_id);
        } else if (activeTab === "shared") {
            result = result.filter(sensor => sensor.user_id !== user.user_id);
        }
        
        // Suche anwenden
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                sensor =>
                    (sensor.name?.toLowerCase().includes(query) || false) ||
                    (sensor.location?.toLowerCase().includes(query) || false) ||
                    (sensor.type?.toLowerCase().includes(query) || false)
            );
        }
        
        setFilteredSensors(result);
    }, [sensors, searchQuery, activeTab, user]);
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };
    
    const handleEditSensor = (sensor: Sensor) => {
        setSensorToEdit(sensor);
        setIsAddDialogOpen(true);
    };
    
    const confirmDeleteSensor = (sensorId: string) => {
        setSensorToDelete(sensorId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteSensor = async () => {
        if (!sensorToDelete) return;
        
        try {
            await deleteSensor(sensorToDelete);
            setSensorToDelete(null);
            setIsDeleteDialogOpen(false);
            toast.success("Sensor erfolgreich gelöscht");
            await fetchSensors(); // Neu laden der Sensoren nach dem Löschen
        } catch (error) {
            console.error('Fehler beim Löschen des Sensors:', error);
            toast.error('Fehler beim Löschen des Sensors');
        }
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
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsPendingSharesOpen(true)} className="relative">
                            <Bell className="mr-2 h-4 w-4" />
                            Freigaben
                            {pendingShares.length > 0 && (
                                <div className="absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                                    {pendingShares.length}
                                </div>
                            )}
                        </Button>
                        <Button onClick={openAddDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Sensor hinzufügen
                        </Button>
                    </div>
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
                            <TabsTrigger value="mine">Meine Sensoren</TabsTrigger>
                            <TabsTrigger value="shared">Geteilte Sensoren</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="mt-0">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">Sensoren werden geladen...</p>
                                </div>
                            ) : filteredSensors.length > 0 ? (
                                <SensorCardList
                                    sensors={filteredSensors}
                                    onEdit={handleEditSensor}
                                    onDelete={confirmDeleteSensor}
                                />
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
                        
                        <TabsContent value="mine" className="mt-0">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">Sensoren werden geladen...</p>
                                </div>
                            ) : filteredSensors.length > 0 ? (
                                <SensorCardList
                                    sensors={filteredSensors}
                                    onEdit={handleEditSensor}
                                    onDelete={confirmDeleteSensor}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <h2 className="text-xl font-medium mb-2">Keine eigenen Sensoren</h2>
                                    <p className="text-muted-foreground mb-6">
                                        Sie haben noch keine eigenen Sensoren registriert.
                                    </p>
                                    <Button onClick={openAddDialog}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Sensor hinzufügen
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="shared" className="mt-0">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">Sensoren werden geladen...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Pending Shares Preview */}
                                    {pendingShares.length > 0 && (
                                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h3 className="text-lg font-medium mb-3 flex items-center text-yellow-800">
                                                <Clock className="mr-2 h-5 w-5" />
                                                Ausstehende Freigaben
                                            </h3>
                                            <div className="space-y-3">
                                                {pendingShares.map((share) => (
                                                    <div key={share.sharing_id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                                                        <div className="space-y-1">
                                                            <div className="font-medium">{share.Sensor?.name ?? 'Unbenannter Sensor'}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Von: {share.owner?.username ?? 'Unbekannter Benutzer'}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAcceptShare(share.sharing_id)}
                                                                disabled={loading}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRejectShare(share.sharing_id)}
                                                                disabled={loading}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Existing Shared Sensors List */}
                                    {filteredSensors.length > 0 ? (
                                        <SensorCardList
                                            sensors={filteredSensors}
                                            onEdit={handleEditSensor}
                                            onDelete={confirmDeleteSensor}
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <h2 className="text-xl font-medium mb-2">Keine geteilten Sensoren</h2>
                                            <p className="text-muted-foreground">
                                                Es wurden keine Sensoren mit Ihnen geteilt.
                                            </p>
                                        </div>
                                    )}
                                </>
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

            <PendingSharesDialog 
                isOpen={isPendingSharesOpen}
                onClose={() => setIsPendingSharesOpen(false)}
            />
        </div>
    );
}