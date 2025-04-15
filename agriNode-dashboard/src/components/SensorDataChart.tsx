
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SensorDataPoint, SensorDataType } from "@/types/sensor";
import { useState, useMemo } from "react";

interface SensorDataChartProps {
  title: string;
  data: SensorDataPoint[];
  dataType: SensorDataType;
  height?: number;
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

const SensorDataChart = ({ title, data, dataType, height = 300 }: SensorDataChartProps) => {
  const [timeRange, setTimeRange] = useState<string>('24h');
  
  const filteredData = useMemo(() => {
    // Angenommen, data ist nach Zeitstempel sortiert
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '48h':
        cutoffTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return data.filter(point => new Date(point.timestamp) >= cutoffTime);
  }, [data, timeRange]);
  
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '24h' || timeRange === '48h') {
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
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Zeitverlauf der Messungen</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Zeitraum wählen" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 12 }} 
              minTickGap={30}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => `${value}${unit}`}
              domain={dataType === 'temperature' ? ['auto', 'auto'] : [0, 100]}
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
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SensorDataChart;
