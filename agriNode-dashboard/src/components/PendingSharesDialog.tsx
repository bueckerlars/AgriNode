import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useSensorSharing } from "@/contexts/SensorSharingContext";
import { Badge } from "@/components/ui/badge";
import { PendingShare } from "@/api/sensorSharingApi";

interface PendingSharesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PendingSharesDialog = ({ isOpen, onClose }: PendingSharesDialogProps) => {
  const { pendingShares, acceptShare, rejectShare, loading } = useSensorSharing();

  const handleAccept = async (sharingId: string) => {
    try {
      await acceptShare(sharingId);
    } catch (error) {
      console.error("Fehler beim Akzeptieren der Freigabe:", error);
    }
  };

  const handleReject = async (sharingId: string) => {
    try {
      await rejectShare(sharingId);
    } catch (error) {
      console.error("Fehler beim Ablehnen der Freigabe:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ausstehende Sensor-Freigaben</DialogTitle>
          <DialogDescription>
            Hier können Sie Sensor-Freigaben von anderen Benutzern annehmen oder ablehnen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {pendingShares.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Keine ausstehenden Freigaben vorhanden
            </div>
          ) : (
            pendingShares.map((share: PendingShare) => (
              <div
                key={share.sharing_id}
                className="flex items-center justify-between bg-muted p-3 rounded-lg"
              >
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
                    onClick={() => handleAccept(share.sharing_id)}
                    disabled={loading}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(share.sharing_id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingSharesDialog;