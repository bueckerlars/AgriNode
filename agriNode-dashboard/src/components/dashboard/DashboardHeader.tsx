import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
    pendingSharesCount: number;
    onOpenPendingShares: () => void;
    onOpenAddDialog: () => void;
}

export const DashboardHeader = ({
    pendingSharesCount,
    onOpenPendingShares,
    onOpenAddDialog
}: DashboardHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold mb-4 md:mb-0">Meine Sensoren</h1>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onOpenPendingShares} className="relative">
                    <Bell className="mr-2 h-4 w-4" />
                    Freigaben
                    {pendingSharesCount > 0 && (
                        <div className="absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                            {pendingSharesCount}
                        </div>
                    )}
                </Button>
                <Button onClick={onOpenAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sensor hinzufügen
                </Button>
            </div>
        </div>
    );
};