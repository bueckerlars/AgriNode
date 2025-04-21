import { Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingShare } from "@/api/sensorSharingApi";

interface DashboardPendingSharesProps {
    pendingShares: PendingShare[];
    onAccept: (sharingId: string) => void;
    onReject: (sharingId: string) => void;
    loading: boolean;
}

export const DashboardPendingShares = ({
    pendingShares,
    onAccept,
    onReject,
    loading
}: DashboardPendingSharesProps) => {
    if (pendingShares.length === 0) return null;

    return (
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
                                onClick={() => onAccept(share.sharing_id)}
                                disabled={loading}
                                className="text-green-600 hover:text-green-700"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReject(share.sharing_id)}
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
    );
};

export default DashboardPendingShares;