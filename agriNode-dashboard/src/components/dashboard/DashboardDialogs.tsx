import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SensorRegistrationForm from "@/components/SensorRegistrationForm";
import PendingSharesDialog from "@/components/PendingSharesDialog";
import { Sensor } from "@/types/sensor";

interface DashboardDialogsProps {
    isAddDialogOpen: boolean;
    isDeleteDialogOpen: boolean;
    isPendingSharesOpen: boolean;
    sensorToEdit?: Sensor;
    onCloseAddDialog: () => void;
    onCloseDeleteDialog: () => void;
    onClosePendingShares: () => void;
    onConfirmDelete: () => void;
}

export const DashboardDialogs = ({
    isAddDialogOpen,
    isDeleteDialogOpen,
    isPendingSharesOpen,
    sensorToEdit,
    onCloseAddDialog,
    onCloseDeleteDialog,
    onClosePendingShares,
    onConfirmDelete
}: DashboardDialogsProps) => {
    return (
        <>
            <SensorRegistrationForm
                isOpen={isAddDialogOpen}
                onClose={onCloseAddDialog}
                editingSensor={sensorToEdit}
            />
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={onCloseDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Der Sensor wird dauerhaft aus dem System entfernt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirmDelete}>
                            Sensor löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PendingSharesDialog 
                isOpen={isPendingSharesOpen}
                onClose={onClosePendingShares}
            />
        </>
    );
};