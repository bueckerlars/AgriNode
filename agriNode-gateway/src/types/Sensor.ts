export interface Sensor {
    sensor_id: string;
    user_id: string;
    name: string;
    description?: string;
    unique_device_id: string;
    registered_at: Date;
    updated_at: Date;
}