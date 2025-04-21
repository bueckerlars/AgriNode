import { useEffect, useState } from "react";
import { useSensors } from "@/contexts/SensorsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { Sensor } from "@/types/sensor";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardPendingShares } from "@/components/dashboard/DashboardPendingShares";
import { DashboardDialogs } from "@/components/dashboard/DashboardDialogs";

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
            toast.success("Freigabe erfolgreich akzeptiert");
        } catch (error) {
            console.error('Fehler beim Akzeptieren der Freigabe:', error);
            toast.error('Fehler beim Akzeptieren der Freigabe');
        }
    };

    const handleRejectShare = async (sharingId: string) => {
        try {
            await rejectShare(sharingId);
            toast.success("Freigabe erfolgreich abgelehnt");
        } catch (error) {
            console.error('Fehler beim Ablehnen der Freigabe:', error);
            toast.error('Fehler beim Ablehnen der Freigabe');
        }
    };

    const handleDeleteSensor = async () => {
        if (!sensorToDelete) return;
        
        try {
            await deleteSensor(sensorToDelete);
            setSensorToDelete(null);
            setIsDeleteDialogOpen(false);
            toast.success("Sensor erfolgreich gelöscht");
            await fetchSensors();
        } catch (error) {
            console.error('Fehler beim Löschen des Sensors:', error);
            toast.error('Fehler beim Löschen des Sensors');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPendingShares();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchPendingShares]);

    useEffect(() => {
        if (pendingShares.length > previousSharesCount) {
            const newSharesCount = pendingShares.length - previousSharesCount;
            toast.info(`${newSharesCount} neue Sensor-Freigabe${newSharesCount > 1 ? 'n' : ''} verfügbar`);
        }
        setPreviousSharesCount(pendingShares.length);
    }, [pendingShares.length, previousSharesCount]);

    useEffect(() => {
        if (!sensors || !user) {
            setFilteredSensors([]);
            return;
        }

        let result = [...sensors];
        
        if (activeTab === "mine") {
            result = result.filter(sensor => sensor.user_id === user.user_id);
        } else if (activeTab === "shared") {
            result = result.filter(sensor => sensor.user_id !== user.user_id);
        }
        
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

    return (
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <DashboardHeader
                    pendingSharesCount={pendingShares.length}
                    onOpenPendingShares={() => setIsPendingSharesOpen(true)}
                    onOpenAddDialog={() => setIsAddDialogOpen(true)}
                />
                
                <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm mb-6">
                    <DashboardSearch
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    <DashboardTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        isLoading={isLoading}
                        filteredSensors={filteredSensors}
                        searchQuery={searchQuery}
                        onAddSensor={() => setIsAddDialogOpen(true)}
                        onEditSensor={setSensorToEdit}
                        onDeleteSensor={(sensorId) => {
                            setSensorToDelete(sensorId);
                            setIsDeleteDialogOpen(true);
                        }}
                    >
                        {activeTab === "shared" && (
                            <DashboardPendingShares
                                pendingShares={pendingShares}
                                onAccept={handleAcceptShare}
                                onReject={handleRejectShare}
                                loading={loading}
                            />
                        )}
                    </DashboardTabs>
                </div>
            </div>

            <DashboardDialogs
                isAddDialogOpen={isAddDialogOpen}
                isDeleteDialogOpen={isDeleteDialogOpen}
                isPendingSharesOpen={isPendingSharesOpen}
                sensorToEdit={sensorToEdit}
                onCloseAddDialog={() => {
                    setIsAddDialogOpen(false);
                    setSensorToEdit(undefined);
                }}
                onCloseDeleteDialog={() => setIsDeleteDialogOpen(false)}
                onClosePendingShares={() => setIsPendingSharesOpen(false)}
                onConfirmDelete={handleDeleteSensor}
            />
        </div>
    );
}