import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Share2, Trash2, Ban, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sensor } from "@/types/api";

interface SensorPageHeaderProps {
  sensor: Sensor;
  isOwner: boolean;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  onRemoveShare: () => void;
}

export const SensorPageHeader = ({
  sensor,
  isOwner,
  onEdit,
  onShare,
  onDelete,
  onRemoveShare,
}: SensorPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{sensor.name}</h1>
          <p className="text-muted-foreground">{sensor.location}</p>
        </div>
      </div>

      <div className="flex space-x-2">
        {!isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={onRemoveShare}
          >
            <Ban className="h-4 w-4 mr-2" />
            Freigabe entfernen
          </Button>
        )}

        {isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/analysis?sensorIds=${sensor.sensor_id}`)}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Analyse
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Teilen
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};