import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sensor, RegisterSensorRequest, UpdateSensorRequest } from "@/types/api";
import { useSensors } from "@/contexts/SensorsContext";

interface SensorRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingSensor?: Sensor;
  onSensorSaved?: (sensor: Sensor) => void;
}

const SENSOR_TYPES = [
  { value: "AgriNode Standard", label: "AgriNode Standard" },
  { value: "AgriNode Pro", label: "AgriNode Pro" },
  { value: "AgriNode Mini", label: "AgriNode Mini" }
];

const SensorRegistrationForm = ({ isOpen, onClose, editingSensor, onSensorSaved }: SensorRegistrationFormProps) => {
  const { registerSensor, updateSensor } = useSensors();

  const [formData, setFormData] = useState<RegisterSensorRequest>({
    name: editingSensor?.name || "",
    location: editingSensor?.location || "", 
    unique_device_id: editingSensor?.unique_device_id || "",
    type: editingSensor?.type || SENSOR_TYPES[0].value
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form data when editingSensor changes
  useEffect(() => {
    if (editingSensor) {
      setFormData({
        name: editingSensor.name || "",
        location: editingSensor.location || "",
        unique_device_id: editingSensor.unique_device_id || "",
        type: editingSensor.type || SENSOR_TYPES[0].value
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        location: "",
        unique_device_id: "",
        type: SENSOR_TYPES[0].value
      });
    }
  }, [editingSensor]);
  
  const handleChange = (field: keyof RegisterSensorRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    if (!formData.name || !formData.unique_device_id) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingSensor) {
        // Update bestehenden Sensor
        const updateData: UpdateSensorRequest = {
          name: formData.name,
          location: formData.location,
        };
        
        const updatedSensor = await updateSensor(editingSensor.sensor_id, updateData);
        
        if (onSensorSaved) {
          onSensorSaved(updatedSensor);
        }
        
        toast.success("Sensor erfolgreich aktualisiert");
      } else {
        // Registriere neuen Sensor
        const newSensor = await registerSensor(formData);
        
        if (onSensorSaved) {
          onSensorSaved(newSensor);
        }
        
        toast.success("Sensor erfolgreich registriert");
      }
      
      onClose();
    } catch (error) {
      toast.error("Fehler beim Speichern des Sensors");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingSensor ? "Sensor bearbeiten" : "Neuen Sensor registrieren"}
          </DialogTitle>
          <DialogDescription>
            {editingSensor 
              ? "Aktualisieren Sie die Informationen des Sensors." 
              : "Fügen Sie einen neuen Sensor zum AgriNode-System hinzu."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="z.B. Gewächshaus Nord"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="location">Standort</Label>
            <Input 
              id="location" 
              value={formData.location || ""} 
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="z.B. Feld 1, Gewächshaus"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unique_device_id">Unique Device ID</Label>
            <Input 
              id="unique_device_id" 
              value={formData.unique_device_id} 
              onChange={(e) => handleChange("unique_device_id", e.target.value)}
              placeholder="z.B. SENSOR_1"
              disabled={!!editingSensor} // Geräte-ID kann nicht bearbeitet werden, wenn es ein Update ist
            />
          </div>
          
          {!editingSensor && (
            <div className="grid gap-2">
              <Label htmlFor="type">Sensortyp</Label>
              <Select 
                onValueChange={(value) => {
                  // Wir speichern den Typ derzeit nicht über die API, jedoch für die UI
                  // Könnte später mit einem custom field in der API ergänzt werden
                }}
                defaultValue={SENSOR_TYPES[0].value}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Wählen Sie einen Sensortyp" />
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? "Wird gespeichert..." 
              : editingSensor 
                ? "Aktualisieren" 
                : "Registrieren"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SensorRegistrationForm;
