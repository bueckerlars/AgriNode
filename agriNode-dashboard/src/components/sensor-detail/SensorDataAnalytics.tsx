import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SensorDataChart from "@/components/SensorDataChart";
import { SensorReadingsByType } from "@/types/sensor";

// Zeitraumoptionen für den Auswahlmenüs
const TIME_RANGES = [
  { value: '24h', label: 'Letzte 24 Stunden' },
  { value: '48h', label: 'Letzte 48 Stunden' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: '30d', label: 'Letzte 30 Tage' },
];

interface SensorDataAnalyticsProps {
  sensorData: SensorReadingsByType | null;
  selectedTimeRange: string;
  onTimeRangeChange: (value: string) => void;
  dataLoading: boolean;
}

export const SensorDataAnalytics = ({
  sensorData,
  selectedTimeRange,
  onTimeRangeChange,
  dataLoading,
}: SensorDataAnalyticsProps) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Sensordatenanalyse</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum auswählen" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dataLoading && (
            <div className="ml-2 animate-pulse text-sm text-muted-foreground">
              Daten werden geladen...
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="combined">
        <TabsList className="mb-4">
          <TabsTrigger value="combined">Alle Daten</TabsTrigger>
          <TabsTrigger value="temperature">Temperatur</TabsTrigger>
          <TabsTrigger value="humidity">Luftfeuchtigkeit</TabsTrigger>
          <TabsTrigger value="soil">Bodenfeuchtigkeit</TabsTrigger>
          <TabsTrigger value="brightness">Helligkeit</TabsTrigger>
        </TabsList>

        <TabsContent value="combined">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sensorData && (
              <>
                <SensorDataChart
                  title="Temperatur"
                  data={sensorData.temperature}
                  dataType="temperature"
                  selectedTimeRange={selectedTimeRange}
                />
                <SensorDataChart
                  title="Luftfeuchtigkeit"
                  data={sensorData.humidity}
                  dataType="humidity"
                  selectedTimeRange={selectedTimeRange}
                />
                <SensorDataChart
                  title="Bodenfeuchtigkeit"
                  data={sensorData.soilMoisture}
                  dataType="soilMoisture"
                  selectedTimeRange={selectedTimeRange}
                />
                <SensorDataChart
                  title="Helligkeit"
                  data={sensorData.brightness}
                  dataType="brightness"
                  selectedTimeRange={selectedTimeRange}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="temperature">
          {sensorData && (
            <SensorDataChart
              title="Temperatur"
              data={sensorData.temperature}
              dataType="temperature"
              selectedTimeRange={selectedTimeRange}
              height={500}
            />
          )}
        </TabsContent>

        <TabsContent value="humidity">
          {sensorData && (
            <SensorDataChart
              title="Luftfeuchtigkeit"
              data={sensorData.humidity}
              dataType="humidity"
              selectedTimeRange={selectedTimeRange}
              height={500}
            />
          )}
        </TabsContent>

        <TabsContent value="soil">
          {sensorData && (
            <SensorDataChart
              title="Bodenfeuchtigkeit"
              data={sensorData.soilMoisture}
              dataType="soilMoisture"
              selectedTimeRange={selectedTimeRange}
              height={500}
            />
          )}
        </TabsContent>

        <TabsContent value="brightness">
          {sensorData && (
            <SensorDataChart
              title="Helligkeit"
              data={sensorData.brightness}
              dataType="brightness"
              selectedTimeRange={selectedTimeRange}
              height={500}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};