import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorDataPoint, SensorDataType } from "@/types/sensor";
import { useMemo } from "react";

interface SensorDataChartProps {
  title: string;
  data: SensorDataPoint[];
  dataType: SensorDataType;
  height?: number;
  selectedTimeRange: string;
}

const COLORS = {
  temperature: "#FF5252",
  humidity: "#64B5F6",
  soilMoisture: "#8B5E3C",
  brightness: "#FFEB3B"
};

const UNITS = {
  temperature: "°C",
  humidity: "%",
  soilMoisture: "%",
  brightness: "%"
};

const TIME_RANGES = [
  { value: '24h', label: 'Letzte 24 Stunden' },
  { value: '48h', label: 'Letzte 48 Stunden' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: '30d', label: 'Letzte 30 Tage' },
];

// Erweiterte Datenpunkte mit numerischem Zeitstempel
interface ProcessedDataPoint {
  timestamp: string;
  timestampMs: number;
  value: number;
}

// Konstanten für die Umrechnung der Bodenfeuchtigkeit
const SOIL_MOISTURE_MIN = 300; // 100% feucht
const SOIL_MOISTURE_MAX = 650; // 0% feucht (trocken)
const SOIL_MOISTURE_RANGE = SOIL_MOISTURE_MAX - SOIL_MOISTURE_MIN;

const SensorDataChart = ({ title, data, dataType, height = 300, selectedTimeRange }: SensorDataChartProps) => {
  
  // Berechne Start- und Endzeitpunkt basierend auf dem ausgewählten Zeitraum
  const { startTime, endTime, domain } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    
    switch (selectedTimeRange) {
      case '48h':
        start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return { 
      startTime: start.toISOString(), 
      endTime: now.toISOString(),
      domain: [start.getTime(), now.getTime()]
    };
  }, [selectedTimeRange]);
  
  // Verarbeite die Daten und füge numerische Zeitstempel hinzu
  const processedData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => {
      let value = point.value;
      
      // Für Bodenfeuchtigkeit: umrechnen der Rohwerte in Prozent (wie in SensorDetail.tsx und SensorCard.tsx)
      if (dataType === 'soilMoisture') {
        // Stelle sicher, dass der Wert innerhalb der Grenzen liegt
        const boundedValue = Math.max(SOIL_MOISTURE_MIN, Math.min(SOIL_MOISTURE_MAX, value));
        
        // Berechne den Prozentsatz: invertiert, da niedrigere Werte höhere Feuchtigkeit bedeuten
        value = Math.round(((SOIL_MOISTURE_MAX - boundedValue) / SOIL_MOISTURE_RANGE) * 100);
      }
      
      return {
        ...point,
        value,
        timestampMs: new Date(point.timestamp).getTime()
      };
    });
  }, [data, dataType]);
  
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (selectedTimeRange === '24h' || selectedTimeRange === '48h') {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };
  
  const dataColor = COLORS[dataType];
  const unit = UNITS[dataType];
  
  const formatTooltipValue = (value: number) => {
    return `${value}${unit}`;
  };
  
  // Funktion zum Generieren von Ticks auf der X-Achse
  const generateXAxisTicks = () => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const ticks = [];
    
    let interval;
    let numTicks;
    
    // Bestimme die Anzahl und den Abstand der Ticks basierend auf dem Zeitbereich
    switch (selectedTimeRange) {
      case '24h':
        numTicks = 6; // Alle 4 Stunden
        break;
      case '48h':
        numTicks = 8; // Alle 6 Stunden
        break;
      case '7d':
        numTicks = 7; // Ein Tick pro Tag
        break;
      case '30d':
        numTicks = 6; // Ungefähr ein Tick alle 5 Tage
        break;
      default:
        numTicks = 6;
    }
    
    interval = Math.floor((end - start) / (numTicks - 1));
    
    for (let i = 0; i < numTicks; i++) {
      ticks.push(start + i * interval);
    }
    
    return ticks;
  };
  
  // Erstelle einen leeren Datenpunkt für den Anfang und das Ende des Zeitbereichs,
  // um sicherzustellen, dass der gesamte Zeitbereich angezeigt wird
  const enhancedData = useMemo(() => {
    if (processedData.length === 0) return [];
    
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    
    // Nur hinzufügen, wenn die Daten nicht bereits den gesamten Bereich abdecken
    const needsStartBoundary = !processedData.some(point => point.timestampMs <= startMs);
    const needsEndBoundary = !processedData.some(point => point.timestampMs >= endMs);
    
    let result = [...processedData];
    
    // Optional: Wenn keine Daten am Anfang/Ende des Bereichs vorhanden sind, 
    // füge unsichtbare Datenpunkte hinzu, um die Achse zu strecken
    if (needsStartBoundary) {
      result.unshift({
        timestamp: startTime,
        timestampMs: startMs,
        value: null as unknown as number // Wird nicht gerendert, hilft nur bei der Skalierung
      });
    }
    
    if (needsEndBoundary) {
      result.push({
        timestamp: endTime,
        timestampMs: endMs,
        value: null as unknown as number // Wird nicht gerendert, hilft nur bei der Skalierung
      });
    }
    
    return result;
  }, [processedData, startTime, endTime]);
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Keine Daten verfügbar</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Bestimme den passenden Y-Achsen-Domain basierend auf dem Datentyp
  const getYAxisDomain = () => {
    switch(dataType) {
      case 'temperature':
        return ['auto', 'auto']; // Temperatur kann negativ sein
      case 'soilMoisture':
      case 'humidity':
      case 'brightness':
      default:
        return [0, 100]; // Prozentuale Werte von 0-100%
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Zeitverlauf der Messungen</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={enhancedData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="timestampMs" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }} 
              domain={domain}
              type="number"
              scale="time"
              allowDataOverflow
              ticks={generateXAxisTicks()}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => `${value}${unit}`}
              domain={getYAxisDomain()}
            />
            <Tooltip 
              formatter={(value: number) => formatTooltipValue(value)}
              labelFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={title} 
              stroke={dataColor} 
              activeDot={{ r: 5 }} 
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SensorDataChart;
