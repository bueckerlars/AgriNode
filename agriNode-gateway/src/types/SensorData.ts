export interface SensorData {
    data_id: string;
    sensor_id: string;
    timestamp: Date;
    air_humidity: number;
    air_temperature: number;
    soil_moisture: number;
    brightness: number;
    battery_level: number;
    firmware_version?: string;
}