import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Sensor, AnalysisType, TimeRange } from "@/types/api";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { useOllama } from "@/contexts/OllamaContext";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateAnalysisDialogProps {
  sensors: Sensor[];
  selectedSensorId?: string;
}

const analysisTypes = [
  { value: AnalysisType.TREND, label: "Trend-Analyse", description: "Erkennt langfristige Trends in den Sensordaten" },
  { value: AnalysisType.ANOMALY, label: "Anomalie-Erkennung", description: "Erkennt ungewöhnliche Muster oder Ausreißer in den Daten" },
  { value: AnalysisType.FORECAST, label: "Vorhersage", description: "Prognostiziert zukünftige Werte basierend auf historischen Daten" }
];

export function CreateAnalysisDialog({ sensors, selectedSensorId }: CreateAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [sensorId, setSensorId] = useState<string>(selectedSensorId || "");
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.TREND);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createAnalysis } = useAnalytics();
  const { isConnected, statusMessage, loading: loadingOllamaStatus } = useOllama();

  const handleSubmit = async () => {
    if (!sensorId || !analysisType || !startDate || !endDate) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const timeRange: TimeRange = {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };

      const result = await createAnalysis(sensorId, analysisType, timeRange);
      
      if (result) {
        setOpen(false);
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (!selectedSensorId) {
      setSensorId("");
    }
    setAnalysisType(AnalysisType.TREND);
    setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    setEndDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={!isConnected && !loadingOllamaStatus}>
          Neue Analyse starten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue KI-Analyse erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine KI-gestützte Analyse für Ihre Sensordaten. 
            Wählen Sie einen Sensor, den Analysetyp und den Zeitraum aus.
          </DialogDescription>
        </DialogHeader>
        
        {!isConnected && !loadingOllamaStatus && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {statusMessage || "Keine Verbindung zum Ollama-Dienst möglich. Bitte überprüfen Sie Ihre Verbindung."}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="sensor" className="col-span-4">
              Sensor
            </label>
            <Select
              value={sensorId}
              onValueChange={setSensorId}
              disabled={!!selectedSensorId}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Sensor auswählen" />
              </SelectTrigger>
              <SelectContent>
                {sensors.map((sensor) => (
                  <SelectItem key={sensor.sensor_id} value={sensor.sensor_id || ""}>
                    {sensor.name} ({sensor.location || "Kein Standort"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="col-span-4">
              Analysetyp
            </label>
            <Select
              value={analysisType}
              onValueChange={(value) => setAnalysisType(value as AnalysisType)}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Analysetyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                {analysisTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="date-range" className="col-span-4">
              Zeitraum
            </label>
            <div className="col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Start auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Ende auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={!sensorId || !analysisType || !startDate || !endDate || isSubmitting || !isConnected}
          >
            {isSubmitting ? "Wird erstellt..." : "Analyse erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}