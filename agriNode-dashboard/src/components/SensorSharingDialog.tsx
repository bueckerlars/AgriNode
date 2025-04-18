import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { useUsers } from "@/contexts/UsersContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sensor } from "@/types/sensor";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SensorSharingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: Sensor;
}

const SensorSharingDialog = ({ isOpen, onClose, sensor }: SensorSharingDialogProps) => {
  const { users } = useUsers();
  const { user } = useAuth();
  const { 
    shareSensor, 
    unshareSensor, 
    removeAllSharings, 
    getSharedUsers, 
    sharedUsers, 
    loading
  } = useSensorSharing();
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const sensorId = sensor?.sensor_id;

  useEffect(() => {
    if (isOpen && sensorId) {
      loadSharedUsers();
    }
  }, [isOpen, sensorId]);

  const loadSharedUsers = async () => {
    if (sensorId) {
      await getSharedUsers(sensorId);
    }
  };

  const handleShareSensor = async () => {
    if (!selectedUserId) {
      toast.error("Bitte wähle einen Benutzer aus.");
      return;
    }

    try {
      await shareSensor(sensorId, selectedUserId);
      setSelectedUserId("");
    } catch (error) {
      console.error("Fehler beim Teilen des Sensors:", error);
    }
  };

  const handleUnshareSensor = async (userId: string) => {
    try {
      await unshareSensor(sensorId, userId);
    } catch (error) {
      console.error("Fehler beim Aufheben der Freigabe:", error);
    }
  };

  const handleRemoveAllSharings = async () => {
    if (window.confirm("Möchten Sie wirklich alle Freigaben für diesen Sensor entfernen?")) {
      try {
        await removeAllSharings(sensorId);
      } catch (error) {
        console.error("Fehler beim Entfernen aller Freigaben:", error);
      }
    }
  };

  // Filter users that are not already shared with and exclude current user
  const availableUsers = users.filter(userItem => {
    // Exclude users who already have access
    const alreadyShared = sharedUsers[sensorId]?.some(
      sharedUser => sharedUser.user_id === userItem.user_id
    );
    
    // Exclude current user (sensor owner)
    const isCurrentUser = userItem.user_id === user?.user_id;
    
    return !alreadyShared && !isCurrentUser;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sensor teilen</DialogTitle>
          <DialogDescription>
            Teile den Sensor "{sensor?.name}" mit anderen Benutzern.
            Geteilte Benutzer können nur die Sensordaten sehen, nicht den Sensor bearbeiten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2">
            <Label htmlFor="user-select" className="col-span-1">
              Benutzer
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Benutzer auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleShareSensor}
              disabled={!selectedUserId || loading}
              size="icon"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Geteilte Benutzer</Label>
            <div className="rounded-md border p-2 min-h-24">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  Laden...
                </div>
              ) : sharedUsers[sensorId]?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sharedUsers[sensorId]?.map((sharedUser) => (
                    <Badge key={sharedUser.user_id} variant="secondary" className="flex gap-1 items-center">
                      {sharedUser.username}
                      <button
                        onClick={() => handleUnshareSensor(sharedUser.user_id)}
                        className="ml-1 rounded-full hover:bg-slate-300 p-1"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-2">
                  Dieser Sensor wurde noch mit niemandem geteilt
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {sharedUsers[sensorId]?.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleRemoveAllSharings}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle Freigaben entfernen
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SensorSharingDialog;