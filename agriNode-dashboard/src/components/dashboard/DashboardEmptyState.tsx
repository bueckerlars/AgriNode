import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardEmptyStateProps {
    title: string;
    message: string;
    showAddButton: boolean;
    onAddClick?: () => void;
}

export const DashboardEmptyState = ({
    title,
    message,
    showAddButton,
    onAddClick
}: DashboardEmptyStateProps) => {
    return (
        <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-medium mb-2">{title}</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            {showAddButton && (
                <Button onClick={onAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sensor hinzufügen
                </Button>
            )}
        </div>
    );
};