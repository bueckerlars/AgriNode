import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sensor, SensorData } from "@/types/api";
import { useSensors } from "@/contexts/SensorsContext";
import { useSensorData } from "@/contexts/SensorDataContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SensorPredictions } from "@/components/SensorPredictions";

// Definiere die verfügbaren Messwerte
const MEASUREMENTS = [
  { key: 'avgTemp', name: 'Temperatur', color: '#FF5252', unit: '°C' },
  { key: 'avgHumidity', name: 'Luftfeuchtigkeit', color: '#2196F3', unit: '%' },
  { key: 'avgSoilMoisture', name: 'Bodenfeuchtigkeit', color: '#8B5E3C', unit: '%' },
  { key: 'avgBrightness', name: 'Helligkeit', color: '#FFC107', unit: ' lx' }
] as const;

type MeasurementKey = typeof MEASUREMENTS[number]['key'];

interface AggregatedData {
  avgTemp: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgBrightness: number;
  maxTemp: number;
  maxHumidity: number;
  maxSoilMoisture: number;
  maxBrightness: number;
  minTemp: number;
  minHumidity: number;
  minSoilMoisture: number;
  minBrightness: number;
}

interface DailyData {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgBrightness: number;
}

export const Analysis = () => {
  const { sensors } = useSensors();
  const { getSensorDataByTimeRange } = useSensorData();
  const [selectedSensor, setSelectedSensor] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SensorData[]>([]);
  const [chartView, setChartView] = useState<string>("combined");
  const [selectedMeasurements, setSelectedMeasurements] = useState<MeasurementKey[]>(
    MEASUREMENTS.map(m => m.key)
  );

  const timeRanges = [
    { value: "7d", label: "Letzte 7 Tage" },
    { value: "14d", label: "Letzte 14 Tage" },
    { value: "30d", label: "Letzter Monat" },
    { value: "90d", label: "Letzte 3 Monate" }
  ];

  useEffect(() => {
    if (selectedSensor && timeRange) {
      fetchAnalysisData();
    }
  }, [selectedSensor, timeRange]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const days = parseInt(timeRange);
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const data = await getSensorDataByTimeRange(
        selectedSensor,
        startDate.toISOString(),
        now.toISOString()
      );

      setData(data);

      // Aggregierte Daten berechnen
      const aggregated = calculateAggregatedData(data);
      setAggregatedData(aggregated);

      // Tägliche Durchschnitte berechnen
      const daily = calculateDailyAverages(data);
      setDailyData(daily);
    } catch (error) {
      console.error("Fehler beim Laden der Analysedaten:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregatedData = (data: SensorData[]): AggregatedData => {
    const initial = {
      avgTemp: 0, avgHumidity: 0, avgSoilMoisture: 0, avgBrightness: 0,
      maxTemp: -Infinity, maxHumidity: -Infinity, maxSoilMoisture: -Infinity, maxBrightness: -Infinity,
      minTemp: Infinity, minHumidity: Infinity, minSoilMoisture: Infinity, minBrightness: Infinity
    };

    // Funktion zur Umrechnung der Bodenfeuchtigkeit
    const convertSoilMoisture = (value: number): number => {
      const MIN_VALUE = 300; // 100% feucht
      const MAX_VALUE = 650; // 0% feucht (trocken)
      const range = MAX_VALUE - MIN_VALUE;
      
      // Stelle sicher, dass der Wert innerhalb der Grenzen liegt
      const boundedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
      
      // Berechne Prozentsatz: invertiert, da niedrigere Werte höhere Feuchtigkeit bedeuten
      return Math.round(((MAX_VALUE - boundedValue) / range) * 100);
    };

    const sums = data.reduce((acc, reading) => {
      const soilMoisturePercent = convertSoilMoisture(reading.soil_moisture || 0);

      // Durchschnitte
      acc.avgTemp += reading.air_temperature || 0;
      acc.avgHumidity += reading.air_humidity || 0;
      acc.avgSoilMoisture += soilMoisturePercent;
      acc.avgBrightness += reading.brightness || 0;

      // Maxima
      acc.maxTemp = Math.max(acc.maxTemp, reading.air_temperature || -Infinity);
      acc.maxHumidity = Math.max(acc.maxHumidity, reading.air_humidity || -Infinity);
      acc.maxSoilMoisture = Math.max(acc.maxSoilMoisture, soilMoisturePercent);
      acc.maxBrightness = Math.max(acc.maxBrightness, reading.brightness || -Infinity);

      // Minima
      acc.minTemp = Math.min(acc.minTemp, reading.air_temperature || Infinity);
      acc.minHumidity = Math.min(acc.minHumidity, reading.air_humidity || Infinity);
      acc.minSoilMoisture = Math.min(acc.minSoilMoisture, soilMoisturePercent);
      acc.minBrightness = Math.min(acc.minBrightness, reading.brightness || Infinity);

      return acc;
    }, initial);

    const count = data.length || 1;
    return {
      ...sums,
      avgTemp: sums.avgTemp / count,
      avgHumidity: sums.avgHumidity / count,
      avgSoilMoisture: sums.avgSoilMoisture / count,
      avgBrightness: sums.avgBrightness / count
    };
  };

  const calculateDailyAverages = (data: SensorData[]): DailyData[] => {
    // Funktion zur Umrechnung der Bodenfeuchtigkeit
    const convertSoilMoisture = (value: number): number => {
      const MIN_VALUE = 300; // 100% feucht
      const MAX_VALUE = 650; // 0% feucht (trocken)
      const range = MAX_VALUE - MIN_VALUE;
      
      // Stelle sicher, dass der Wert innerhalb der Grenzen liegt
      const boundedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
      
      // Berechne Prozentsatz: invertiert, da niedrigere Werte höhere Feuchtigkeit bedeuten
      return Math.round(((MAX_VALUE - boundedValue) / range) * 100);
    };

    const dailyMap = new Map<string, {
      tempSum: number;
      humSum: number;
      soilSum: number;
      brightSum: number;
      count: number;
    }>();

    data.forEach(reading => {
      const date = new Date(reading.timestamp).toISOString().split('T')[0];
      const current = dailyMap.get(date) || {
        tempSum: 0, humSum: 0, soilSum: 0, brightSum: 0, count: 0
      };

      const soilMoisturePercent = convertSoilMoisture(reading.soil_moisture || 0);

      dailyMap.set(date, {
        tempSum: current.tempSum + (reading.air_temperature || 0),
        humSum: current.humSum + (reading.air_humidity || 0),
        soilSum: current.soilSum + soilMoisturePercent,
        brightSum: current.brightSum + (reading.brightness || 0),
        count: current.count + 1
      });
    });

    return Array.from(dailyMap.entries()).map(([date, sums]) => ({
      date,
      avgTemp: sums.tempSum / sums.count,
      avgHumidity: sums.humSum / sums.count,
      avgSoilMoisture: sums.soilSum / sums.count,
      avgBrightness: sums.brightSum / sums.count
    }));
  };

  // Hilfsfunktion für das Rendern eines einzelnen Diagramms
  const renderChart = (
    data: DailyData[],
    dataKey: string,
    name: string,
    color: string,
    unit: string
  ) => (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis unit={unit} />
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}${unit}`, name]} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={name} 
            stroke={color} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sensor Analyse</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          value={selectedSensor}
          onValueChange={setSelectedSensor}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wähle einen Sensor" />
          </SelectTrigger>
          <SelectContent>
            {sensors.map((sensor) => (
              <SelectItem key={sensor.sensor_id} value={sensor.sensor_id || ""}>
                {sensor.name} ({sensor.location || "Kein Standort"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Zeitraum wählen" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Lade Analysedaten...</div>
      ) : (
        <>
          {/* Prognosen */}
          {data && data.length > 0 && (
            <div className="mb-6">
              <SensorPredictions sensorData={data} />
            </div>
          )}

          {/* Aggregierte Daten */}
          {aggregatedData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temperatur</CardTitle>
                  <CardDescription>Durchschnitt, Min/Max</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.avgTemp.toFixed(1)}°C</div>
                  <div className="text-sm text-muted-foreground">
                    Min: {aggregatedData.minTemp.toFixed(1)}°C / Max: {aggregatedData.maxTemp.toFixed(1)}°C
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Luftfeuchtigkeit</CardTitle>
                  <CardDescription>Durchschnitt, Min/Max</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.avgHumidity.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">
                    Min: {aggregatedData.minHumidity.toFixed(1)}% / Max: {aggregatedData.maxHumidity.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bodenfeuchtigkeit</CardTitle>
                  <CardDescription>Durchschnitt, Min/Max</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.avgSoilMoisture.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">
                    Min: {aggregatedData.minSoilMoisture.toFixed(1)}% / Max: {aggregatedData.maxSoilMoisture.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Helligkeit</CardTitle>
                  <CardDescription>Durchschnitt, Min/Max</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.avgBrightness.toFixed(1)} lx</div>
                  <div className="text-sm text-muted-foreground">
                    Min: {aggregatedData.minBrightness.toFixed(1)} lx / Max: {aggregatedData.maxBrightness.toFixed(1)} lx
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Diagramme */}
          {aggregatedData && (
            <Card className="mb-6">
              <CardHeader className="space-y-2">
                <CardTitle>Tägliche Entwicklung</CardTitle>
                <CardDescription>Durchschnittswerte pro Tag</CardDescription>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Tabs defaultValue="combined" value={chartView} onValueChange={setChartView}>
                    <TabsList>
                      <TabsTrigger value="combined">Kombiniert</TabsTrigger>
                      <TabsTrigger value="separate">Getrennt</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Select
                    value={JSON.stringify(selectedMeasurements)}
                    onValueChange={(value) => setSelectedMeasurements(JSON.parse(value))}
                  >
                    <SelectTrigger className="w-[240px]">
                      <SelectValue>
                        {selectedMeasurements.length === MEASUREMENTS.length 
                          ? "Alle Messwerte" 
                          : `${selectedMeasurements.length} Filter aktiv`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENTS.map((measurement) => {
                        const isSelected = selectedMeasurements.includes(measurement.key);
                        return (
                          <SelectItem 
                            key={measurement.key} 
                            value={JSON.stringify([
                              ...selectedMeasurements.filter(m => m !== measurement.key), 
                              ...(isSelected ? [] : [measurement.key])
                            ])}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                                {isSelected && (
                                  <div className="h-2 w-2 rounded-sm bg-primary" />
                                )}
                              </div>
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: measurement.color }} 
                              />
                              <span>{measurement.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {chartView === "combined" ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            const measurement = MEASUREMENTS.find(m => m.name === name);
                            return [`${value.toFixed(1)}${measurement?.unit || ''}`, name];
                          }}
                        />
                        <Legend />
                        {MEASUREMENTS.filter(m => selectedMeasurements.includes(m.key)).map((measurement) => (
                          <Line 
                            key={measurement.key}
                            type="monotone" 
                            dataKey={measurement.key} 
                            name={measurement.name} 
                            stroke={measurement.color} 
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {MEASUREMENTS.filter(m => selectedMeasurements.includes(m.key)).map((measurement) => (
                      renderChart(
                        dailyData,
                        measurement.key,
                        measurement.name,
                        measurement.color,
                        measurement.unit
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Analysis;
