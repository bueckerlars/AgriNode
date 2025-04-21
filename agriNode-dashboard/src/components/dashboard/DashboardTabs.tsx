import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sensor } from "@/types/sensor";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SensorCardList from "@/components/SensorCardList";
import { ReactNode } from "react";
import { DashboardEmptyState } from "./DashboardEmptyState";

interface DashboardTabsProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    isLoading: boolean;
    filteredSensors: Sensor[];
    searchQuery: string;
    onAddSensor: () => void;
    onEditSensor: (sensor: Sensor) => void;
    onDeleteSensor: (sensorId: string) => void;
    children?: ReactNode;
}

export const DashboardTabs = ({
    activeTab,
    onTabChange,
    isLoading,
    filteredSensors,
    searchQuery,
    onAddSensor,
    onEditSensor,
    onDeleteSensor,
    children
}: DashboardTabsProps) => {
    const renderLoadingState = () => (
        <div className="text-center py-12">
            <p className="text-muted-foreground">Sensoren werden geladen...</p>
        </div>
    );

    return (
        <Tabs defaultValue="all" value={activeTab} onValueChange={onTabChange}>
            <TabsList className="mb-4">
                <TabsTrigger value="all">Alle Sensoren</TabsTrigger>
                <TabsTrigger value="mine">Meine Sensoren</TabsTrigger>
                <TabsTrigger value="shared">Geteilte Sensoren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
                {isLoading ? renderLoadingState() : (
                    filteredSensors.length > 0 ? (
                        <SensorCardList
                            sensors={filteredSensors}
                            onEdit={onEditSensor}
                            onDelete={onDeleteSensor}
                        />
                    ) : (
                        <DashboardEmptyState
                            title="Keine Sensoren gefunden"
                            message={searchQuery
                                ? "Keine Sensoren entsprechen Ihren Suchkriterien."
                                : "Es wurden noch keine Sensoren registriert."
                            }
                            showAddButton={!searchQuery}
                            onAddClick={onAddSensor}
                        />
                    )
                )}
            </TabsContent>
            
            <TabsContent value="mine" className="mt-0">
                {isLoading ? renderLoadingState() : (
                    filteredSensors.length > 0 ? (
                        <SensorCardList
                            sensors={filteredSensors}
                            onEdit={onEditSensor}
                            onDelete={onDeleteSensor}
                        />
                    ) : (
                        <DashboardEmptyState
                            title="Keine eigenen Sensoren"
                            message="Sie haben noch keine eigenen Sensoren registriert."
                            showAddButton={true}
                            onAddClick={onAddSensor}
                        />
                    )
                )}
            </TabsContent>
            
            <TabsContent value="shared" className="mt-0">
                {isLoading ? renderLoadingState() : (
                    <>
                        {children}
                        
                        {filteredSensors.length > 0 ? (
                            <SensorCardList
                                sensors={filteredSensors}
                                onEdit={onEditSensor}
                                onDelete={onDeleteSensor}
                            />
                        ) : (
                            <DashboardEmptyState
                                title="Keine geteilten Sensoren"
                                message="Es wurden keine Sensoren mit Ihnen geteilt."
                                showAddButton={false}
                            />
                        )}
                    </>
                )}
            </TabsContent>
        </Tabs>
    );
};

export default DashboardTabs;