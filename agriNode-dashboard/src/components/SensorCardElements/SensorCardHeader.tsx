import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Share2, BarChart, Ban, ExternalLink, Edit, Trash2 } from "lucide-react";
import { NavigateFunction } from "react-router-dom";
import { Sensor } from "@/types/sensor";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { toast } from "sonner";

interface SensorCardHeaderProps {
  sensor: Sensor;
  isOwner: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  onEdit: (sensor: Sensor) => void;
  onDelete: (sensorId: string) => void;
  onShare?: (sensor: Sensor) => void;
  navigate: NavigateFunction;
}

/**
 * Header der SensorCard mit Titel und Dropdown-Menü
 * Verantwortlich für Interaktionen mit dem Sensor (Bearbeiten, Löschen, Teilen)
 */
export function SensorCardHeader({
  sensor,
  isOwner,
  isMenuOpen,
  setIsMenuOpen,
  onEdit,
  onDelete,
  onShare,
  navigate
}: SensorCardHeaderProps) {
  const { removeShare } = useSensorSharing();

  const handleRemoveShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeShare(sensor.sensor_id);
      toast.success("Freigabe erfolgreich entfernt");
    } catch (error) {
      console.error("Fehler beim Entfernen der Freigabe:", error);
      toast.error("Fehler beim Entfernen der Freigabe");
    }
  };

  return (
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
              e.stopPropagation();
              navigate(`/sensors/${sensor.sensor_id}`);
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Details anzeigen
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(`/analysis?sensorIds=${sensor.sensor_id}`);
            }}>
              <BarChart className="h-4 w-4 mr-2" />
              Analyse anzeigen
            </DropdownMenuItem>
            
            {/* Für geteilte Sensoren (nicht-Eigentümer) */}
            {!isOwner && (
              <DropdownMenuItem 
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveShare(e);
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                Freigabe entfernen
              </DropdownMenuItem>
            )}
            
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
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(sensor.sensor_id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  );
}