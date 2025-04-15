export interface Sensor {
    sensor_id: string;
    user_id: string;
    name: string;
    type: string;
    location?: string;
    unique_device_id: string;
    registered_at: Date;
    updated_at: Date;
    batteryLevel?: number;
}