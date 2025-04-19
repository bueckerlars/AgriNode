import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorData } from "@/types/api";
import { formatDistanceToNow, addHours } from "date-fns";
import { de } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

interface SensorPredictionsProps {
  sensorData: SensorData[];
}

interface Prediction {
  type: "soilMoisture" | "temperature" | "humidity" | "brightness";
  criticalValue: number;
  currentValue: number;
  trend: number; // Änderung pro Stunde
  timeUntilCritical: number | null; // Stunden bis zum kritischen Wert
  status: "critical" | "warning" | "ok";
}

const THRESHOLDS = {
  soilMoisture: {
    critical: 20, // Unter 20% ist kritisch
    warning: 30, // Unter 30% ist eine Warnung
  },
  temperature: {
    criticalLow: 5, // Unter 5°C ist kritisch
    criticalHigh: 35, // Über 35°C ist kritisch
    warningLow: 10, // Unter 10°C ist eine Warnung
    warningHigh: 30, // Über 30°C ist eine Warnung
  },
  humidity: {
    criticalLow: 20, // Unter 20% ist kritisch
    criticalHigh: 90, // Über 90% ist kritisch
    warningLow: 30, // Unter 30% ist eine Warnung
    warningHigh: 80, // Über 80% ist eine Warnung
  },
  brightness: {
    criticalLow: 1000, // Unter 1000 lx ist kritisch (zu dunkel für die meisten Pflanzen)
    criticalHigh: 100000, // Über 100000 lx ist kritisch (direktes Sonnenlicht)
    warningLow: 2000, // Unter 2000 lx ist eine Warnung
    warningHigh: 80000, // Über 80000 lx ist eine Warnung
  }
};

export const SensorPredictions = ({ sensorData }: SensorPredictionsProps) => {
  // Berechne Prognosen basierend auf den letzten 24 Stunden Daten
  const predictions = useMemo(() => {
    if (!sensorData.length) return [];

    // Sortiere Daten nach Zeitstempel
    const sortedData = [...sensorData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Nehme nur die letzten 24h Datenpunkte für die Trendberechnung
    const last24h = sortedData.filter(reading => {
      const readingTime = new Date(reading.timestamp).getTime();
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      return readingTime >= twentyFourHoursAgo;
    });

    if (last24h.length < 2) return []; // Brauchen mindestens 2 Datenpunkte

    const calculateTrend = (values: number[]) => {
      const hoursBetweenFirstAndLast = 
        (new Date(last24h[last24h.length - 1].timestamp).getTime() - 
         new Date(last24h[0].timestamp).getTime()) / (1000 * 60 * 60);
      
      const totalChange = values[values.length - 1] - values[0];
      return totalChange / hoursBetweenFirstAndLast;
    };

    const predictions: Prediction[] = [];

    // Bodenfeuchtigkeit
    const soilMoistureValues = last24h.map(d => {
      // Umrechnung von Rohwerten (650=trocken, 300=nass) in Prozent (0-100%)
      const MIN_VALUE = 300; // 100% feucht
      const MAX_VALUE = 650; // 0% feucht (trocken)
      const range = MAX_VALUE - MIN_VALUE;
      
      // Stelle sicher, dass der Wert innerhalb der Grenzen liegt
      const boundedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, d.soil_moisture));
      
      // Berechne Prozentsatz: invertiert, da niedrigere Werte höhere Feuchtigkeit bedeuten
      return Math.round(((MAX_VALUE - boundedValue) / range) * 100);
    });

    const currentSoilMoisture = soilMoistureValues[soilMoistureValues.length - 1];
    const soilMoistureTrend = calculateTrend(soilMoistureValues);
    
    let timeUntilCriticalSoilMoisture = null;
    if (soilMoistureTrend < 0) { // Nur wenn der Trend negativ ist
      timeUntilCriticalSoilMoisture = 
        (THRESHOLDS.soilMoisture.critical - currentSoilMoisture) / soilMoistureTrend;
    }

    predictions.push({
      type: "soilMoisture",
      criticalValue: THRESHOLDS.soilMoisture.critical,
      currentValue: currentSoilMoisture,
      trend: soilMoistureTrend,
      timeUntilCritical: timeUntilCriticalSoilMoisture,
      status: 
        currentSoilMoisture <= THRESHOLDS.soilMoisture.critical ? "critical" :
        currentSoilMoisture <= THRESHOLDS.soilMoisture.warning ? "warning" : "ok"
    });

    // Helligkeit
    const brightnessValues = last24h.map(d => d.brightness);
    const currentBrightness = brightnessValues[brightnessValues.length - 1];
    const brightnessTrend = calculateTrend(brightnessValues);
    
    let timeUntilCriticalBrightness = null;
    if (brightnessTrend < 0 && currentBrightness > THRESHOLDS.brightness.criticalLow) {
      timeUntilCriticalBrightness = 
        (THRESHOLDS.brightness.criticalLow - currentBrightness) / brightnessTrend;
    } else if (brightnessTrend > 0 && currentBrightness < THRESHOLDS.brightness.criticalHigh) {
      timeUntilCriticalBrightness = 
        (THRESHOLDS.brightness.criticalHigh - currentBrightness) / brightnessTrend;
    }

    predictions.push({
      type: "brightness",
      criticalValue: currentBrightness < THRESHOLDS.brightness.warningLow 
        ? THRESHOLDS.brightness.criticalLow 
        : THRESHOLDS.brightness.criticalHigh,
      currentValue: currentBrightness,
      trend: brightnessTrend,
      timeUntilCritical: timeUntilCriticalBrightness,
      status: 
        currentBrightness <= THRESHOLDS.brightness.criticalLow || 
        currentBrightness >= THRESHOLDS.brightness.criticalHigh ? "critical" :
        currentBrightness <= THRESHOLDS.brightness.warningLow || 
        currentBrightness >= THRESHOLDS.brightness.warningHigh ? "warning" : "ok"
    });

    return predictions;
  }, [sensorData]);

  if (!predictions.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prognosen</CardTitle>
        <CardDescription>Vorhersagen basierend auf den Sensordaten der letzten 24 Stunden</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {predictions.map((prediction) => {
            let statusColor = "text-green-500";
            let icon = null;
            if (prediction.status === "critical") {
              statusColor = "text-red-500";
              icon = <AlertTriangle className="h-5 w-5 text-red-500" />;
            } else if (prediction.status === "warning") {
              statusColor = "text-yellow-500";
              icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            }

            return (
              <div key={prediction.type} className="space-y-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <h3 className="font-medium">
                    {prediction.type === "soilMoisture" ? "Bodenfeuchtigkeit" : 
                     prediction.type === "temperature" ? "Temperatur" : 
                     prediction.type === "brightness" ? "Helligkeit" : "Luftfeuchtigkeit"}
                  </h3>
                </div>

                <div className="grid gap-1">
                  <p className={statusColor}>
                    Aktueller Wert: {prediction.currentValue.toFixed(1)}
                    {prediction.type === "temperature" ? "°C" : 
                     prediction.type === "brightness" ? " lx" : "%"}
                  </p>
                  
                  <p>
                    Trend: {prediction.trend > 0 ? "+" : ""}
                    {prediction.trend.toFixed(2)}
                    {prediction.type === "temperature" ? "°C" : 
                     prediction.type === "brightness" ? " lx" : "%"} pro Stunde
                  </p>

                  {prediction.timeUntilCritical !== null && prediction.timeUntilCritical > 0 && (
                    <p className="text-red-500">
                      Kritischer Wert wird voraussichtlich in{" "}
                      {formatDistanceToNow(addHours(new Date(), prediction.timeUntilCritical), {
                        locale: de,
                        addSuffix: true
                      })} erreicht
                    </p>
                  )}

                  {prediction.status === "critical" && (
                    <p className="text-red-500 font-medium">
                      Sofortige Aktion erforderlich!
                    </p>
                  )}
                  {prediction.status === "warning" && (
                    <p className="text-yellow-500">
                      Beobachtung empfohlen
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};