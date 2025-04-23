import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sensor, SensorData } from "@/types/api";
import { useSensors } from "@/contexts/SensorsContext";
import { useSensorData } from "@/contexts/SensorDataContext";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { useOllama } from "@/contexts/OllamaContext";
import { useSearchParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CreateAnalysisDialog } from "@/components/CreateAnalysisDialog";
import { AnalyticsResults } from "@/components/AnalyticsResults";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Definiere die verfügbaren Messwerte
const MEASUREMENTS = [
  { key: 'temperature', name: 'Temperatur', color: '#FF5252', unit: '°C' },
  { key: 'humidity', name: 'Luftfeuchtigkeit', color: '#2196F3', unit: '%' },
  { key: 'soilMoisture', name: 'Bodenfeuchtigkeit', color: '#8B5E3C', unit: '%' },
  { key: 'brightness', name: 'Helligkeit', color: '#FFC107', unit: ' lx' }
] as const;

type MeasurementKey = typeof MEASUREMENTS[number]['key'];

interface DailyData {
  date: string;
  [key: string]: string | number; // Dynamische Felder für jeden Sensor
}

export const Analysis = () => {
  const { sensors } = useSensors();
  const { getSensorDataByTimeRange } = useSensorData();
  const { analytics, loadingAnalytics, deleteAnalysis, refreshAnalytics } = useAnalytics();
  const { isConnected, statusMessage, loading: loadingOllamaStatus, checkOllamaStatus } = useOllama();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState<{ [sensorId: string]: SensorData[] }>({});
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [chartView, setChartView] = useState<string>("combined");
  const [selectorKey, setSelectorKey] = useState<number>(0); // Neuer State für den Selector-Reset
  const [selectedMeasurements, setSelectedMeasurements] = useState<MeasurementKey[]>(
    MEASUREMENTS.map(m => m.key)
  );
  const [activeTab, setActiveTab] = useState<string>("data-analysis");

  const timeRanges = useMemo(() => [
    { value: "7d", label: "Letzte 7 Tage" },
    { value: "14d", label: "Letzte 14 Tage" },
    { value: "30d", label: "Letzter Monat" },
    { value: "90d", label: "Letzte 3 Monate" }
  ], []);

  // URL-Parameter beim Laden der Komponente verarbeiten
  useEffect(() => {
    const sensorIds = searchParams.get("sensorIds")?.split(",") || [];
    const validSensorIds = sensorIds.filter(id => sensors.some(s => s.sensor_id === id));
    if (validSensorIds.length > 0) {
      setSelectedSensors(validSensorIds);
    }
    
    const tab = searchParams.get("tab");
    if (tab === "ai-analysis") {
      setActiveTab("ai-analysis");
    }
  }, [searchParams, sensors]);

  // Aktualisiere die URL wenn sich die ausgewählten Sensoren oder der Tab ändern
  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (selectedSensors.length > 0) {
      params.sensorIds = selectedSensors.join(",");
    }
    
    if (activeTab === "ai-analysis") {
      params.tab = "ai-analysis";
    }
    
    setSearchParams(params);
  }, [selectedSensors, activeTab, setSearchParams]);

  // Daten für alle ausgewählten Sensoren laden
  useEffect(() => {
    if (selectedSensors.length > 0 && timeRange) {
      fetchAnalysisData();
    }
  }, [selectedSensors, timeRange]);

  const fetchAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const days = parseInt(timeRange);
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Daten für jeden ausgewählten Sensor abrufen
      const dataPromises = selectedSensors.map(sensorId => 
        getSensorDataByTimeRange(
          sensorId,
          startDate.toISOString(),
          now.toISOString()
        )
      );

      const allData = await Promise.all(dataPromises);
      const newSensorData: { [sensorId: string]: SensorData[] } = {};
      
      selectedSensors.forEach((sensorId, index) => {
        newSensorData[sensorId] = allData[index];
      });

      setSensorData(newSensorData);
      calculateDailyAverages(newSensorData);
    } catch (error) {
      console.error("Fehler beim Laden der Analysedaten:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSensors, timeRange, getSensorDataByTimeRange]);

  const calculateDailyAverages = useCallback((data: { [sensorId: string]: SensorData[] }) => {
    const dailyMap = new Map<string, { [key: string]: { sum: number; count: number } }>();

    // Für jeden Sensor
    Object.entries(data).forEach(([sensorId, sensorReadings]) => {
      const sensor = sensors.find(s => s.sensor_id === sensorId);
      if (!sensor) return;

      sensorReadings.forEach(reading => {
        const date = new Date(reading.timestamp).toISOString().split('T')[0];
        const dailyData = dailyMap.get(date) || {};

        // Temperaturdaten
        if (reading.air_temperature !== undefined) {
          const key = `temperature_${sensorId}`;
          dailyData[key] = dailyData[key] || { sum: 0, count: 0 };
          dailyData[key].sum += reading.air_temperature;
          dailyData[key].count += 1;
        }

        // Luftfeuchtigkeitsdaten
        if (reading.air_humidity !== undefined) {
          const key = `humidity_${sensorId}`;
          dailyData[key] = dailyData[key] || { sum: 0, count: 0 };
          dailyData[key].sum += reading.air_humidity;
          dailyData[key].count += 1;
        }

        // Bodenfeuchtigkeitsdaten
        if (reading.soil_moisture !== undefined) {
          const moisturePercent = convertSoilMoisture(reading.soil_moisture);
          const key = `soilMoisture_${sensorId}`;
          dailyData[key] = dailyData[key] || { sum: 0, count: 0 };
          dailyData[key].sum += moisturePercent;
          dailyData[key].count += 1;
        }

        // Helligkeitsdaten
        if (reading.brightness !== undefined) {
          const key = `brightness_${sensorId}`;
          dailyData[key] = dailyData[key] || { sum: 0, count: 0 };
          dailyData[key].sum += reading.brightness;
          dailyData[key].count += 1;
        }

        dailyMap.set(date, dailyData);
      });
    });

    // Berechne Durchschnitte
    const averagedData = Array.from(dailyMap.entries())
      .map(([date, values]) => {
        const result: DailyData = { date };
        
        Object.entries(values).forEach(([key, { sum, count }]) => {
          result[key] = count > 0 ? sum / count : 0;
        });
        
        return result;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyData(averagedData);
  }, [sensors]);

  const convertSoilMoisture = useCallback((value: number): number => {
    const MIN_VALUE = 300; // 100% feucht
    const MAX_VALUE = 650; // 0% feucht (trocken)
    const range = MAX_VALUE - MIN_VALUE;
    
    const boundedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
    return Math.round(((MAX_VALUE - boundedValue) / range) * 100);
  }, []);

  const handleSensorSelect = useCallback((sensorId: string) => {
    setSelectedSensors(prev => {
      if (prev.includes(sensorId)) {
        return prev.filter(id => id !== sensorId);
      } else {
        return [...prev, sensorId];
      }
    });
    // Reset des Selectors nach jeder Auswahl
    setSelectorKey(prev => prev + 1);
  }, []);

  const getSensorName = useCallback((sensorId: string) => {
    const sensor = sensors.find(s => s.sensor_id === sensorId);
    return sensor ? `${sensor.name} (${sensor.location || 'Kein Standort'})` : sensorId;
  }, [sensors]);

  // Hilfsfunktion für das Rendern eines einzelnen Diagramms
  const renderChart = useCallback((
    data: DailyData[],
    measurementType: MeasurementKey,
    title: string,
    unit: string
  ) => {
    // Berechne Start- und Enddatum basierend auf dem timeRange
    const endDate = new Date();
    const days = parseInt(timeRange);
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return (
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              domain={[startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]}
              type="category"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis unit={unit} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const sensorId = name.split('_')[1];
                return [`${value.toFixed(1)}${unit}`, getSensorName(sensorId)];
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend formatter={(value) => {
              const sensorId = value.split('_')[1];
              return getSensorName(sensorId);
            }} />
            {selectedSensors.map((sensorId, index) => (
              <Line
                key={sensorId}
                type="monotone"
                dataKey={`${measurementType}_${sensorId}`}
                name={`${measurementType}_${sensorId}`}
                stroke={MEASUREMENTS[index % MEASUREMENTS.length].color}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, [timeRange, getSensorName, selectedSensors]);

  // Gruppiere fertige und ausstehende Analysen
  const { pendingAnalytics, completedAnalytics } = useMemo(() => {
    const pending = analytics.filter(a => a.status === 'pending' || a.status === 'processing');
    const completed = analytics
      .filter(a => a.status === 'completed' || a.status === 'failed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return { pendingAnalytics: pending, completedAnalytics: completed };
  }, [analytics]);

  // Sensorfilterung für Dropdown
  const availableSensors = useMemo(() => {
    return sensors.filter(sensor => !selectedSensors.includes(sensor.sensor_id || ""));
  }, [sensors, selectedSensors]);

  // Messwert-Filterungsoption
  const measurementFilterValue = useMemo(() => {
    return JSON.stringify(selectedMeasurements);
  }, [selectedMeasurements]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sensor Analyse</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="data-analysis">Datenanalyse</TabsTrigger>
          <TabsTrigger value="ai-analysis">KI-Analyse</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data-analysis" className="space-y-4">
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {selectedSensors.map((sensorId) => (
                <Badge 
                  key={sensorId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {getSensorName(sensorId)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleSensorSelect(sensorId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                key={selectorKey}
                onValueChange={handleSensorSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sensor hinzufügen" />
                </SelectTrigger>
                <SelectContent>
                  {availableSensors.map((sensor) => (
                    <SelectItem key={sensor.sensor_id} value={sensor.sensor_id || ""}>
                      {sensor.name} ({sensor.location || "Kein Standort"})
                    </SelectItem>
                  ))}
                  {availableSensors.length === 0 && (
                    <SelectItem value="no-sensors" disabled>
                      Keine weiteren Sensoren verfügbar
                    </SelectItem>
                  )}
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
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Analysedaten...</div>
          ) : selectedSensors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bitte wählen Sie mindestens einen Sensor aus.
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle>Tägliche Entwicklung</CardTitle>
                  <CardDescription>Vergleich der Durchschnittswerte pro Tag</CardDescription>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Tabs defaultValue="combined" value={chartView} onValueChange={setChartView}>
                      <TabsList>
                        <TabsTrigger value="combined">Kombiniert</TabsTrigger>
                        <TabsTrigger value="separate">Getrennt</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Select
                      value={measurementFilterValue}
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
                          <XAxis 
                            dataKey="date" 
                            domain={[
                              new Date(new Date().getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              new Date().toISOString().split('T')[0]
                            ]}
                            type="category"
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              const [type, sensorId] = name.split('_');
                              const measurement = MEASUREMENTS.find(m => m.key === type);
                              return [`${value.toFixed(1)}${measurement?.unit || ''}`, getSensorName(sensorId)];
                            }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Legend 
                            formatter={(value) => {
                              const [type, sensorId] = value.split('_');
                              const measurement = MEASUREMENTS.find(m => m.key === type);
                              return `${getSensorName(sensorId)} - ${measurement?.name}`;
                            }}
                          />
                          {selectedSensors.map((sensorId) => (
                            MEASUREMENTS.filter(m => selectedMeasurements.includes(m.key)).map((measurement) => (
                              <Line
                                key={`${sensorId}_${measurement.key}`}
                                type="monotone"
                                dataKey={`${measurement.key}_${sensorId}`}
                                name={`${measurement.key}_${sensorId}`}
                                stroke={measurement.color}
                                dot={false}
                                connectNulls
                              />
                            ))
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {MEASUREMENTS.filter(m => selectedMeasurements.includes(m.key)).map((measurement) => (
                        <div key={measurement.key}>
                          <h3 className="font-medium mb-2">{measurement.name}</h3>
                          {renderChart(
                            dailyData,
                            measurement.key,
                            measurement.name,
                            measurement.unit
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">KI-Analyse der Sensordaten</h2>
              <p className="text-muted-foreground">
                Starten Sie KI-gestützte Analysen Ihrer Sensordaten für tiefergehende Einblicke
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  refreshAnalytics();
                  checkOllamaStatus();
                }}
                disabled={loadingAnalytics}
              >
                <RefreshCw className={`h-4 w-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              </Button>
              <CreateAnalysisDialog sensors={sensors} selectedSensorId={selectedSensors[0]} />
            </div>
          </div>

          {!isConnected && !loadingOllamaStatus && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{statusMessage || "Keine Verbindung zum Ollama-Dienst möglich. KI-Analysen sind derzeit nicht verfügbar."}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkOllamaStatus}
                >
                  Erneut prüfen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loadingAnalytics ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Lade KI-Analysen...</p>
            </div>
          ) : pendingAnalytics.length === 0 && completedAnalytics.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-background">
              <h3 className="text-lg font-medium mb-2">Keine Analysen vorhanden</h3>
              <p className="text-muted-foreground mb-6">
                Sie haben noch keine KI-Analysen für Ihre Sensoren erstellt.
              </p>
              <CreateAnalysisDialog sensors={sensors} selectedSensorId={selectedSensors[0]} />
            </div>
          ) : (
            <div>
              {/* Aktive Analysen */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Laufende und ausstehende Analysen</h3>
                <div className="space-y-4">
                  {pendingAnalytics.map((a) => {
                    const sensorName = getSensorName(a.sensor_id);
                    return (
                      <AnalyticsResults
                        key={a.analytics_id}
                        analytics={a}
                        sensorName={sensorName}
                        onDelete={deleteAnalysis}
                        isExpanded={true} // Laufende Analysen immer ausgeklappt anzeigen
                      />
                    );
                  })}
                  {pendingAnalytics.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Keine laufenden Analysen vorhanden
                    </p>
                  )}
                </div>
              </div>

              {/* Abgeschlossene Analysen */}
              <Separator />
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Abgeschlossene Analysen</h3>
                <div className="space-y-4">
                  {completedAnalytics.map((a, index) => {
                    const sensorName = getSensorName(a.sensor_id);
                    // Die neueste Analyse (index === 0) wird aufgeklappt angezeigt
                    return (
                      <AnalyticsResults
                        key={a.analytics_id}
                        analytics={a}
                        sensorName={sensorName}
                        onDelete={deleteAnalysis}
                        isExpanded={index === 0} // Die neueste Analyse ist aufgeklappt
                      />
                    );
                  })}
                  {completedAnalytics.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Keine abgeschlossenen Analysen vorhanden
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
