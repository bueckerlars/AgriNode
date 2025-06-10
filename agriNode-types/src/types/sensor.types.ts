import { SharingStatus } from './base.types';

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
    firmware_version?: string;
}

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

export interface RegisterSensorRequest {
    name: string;
    type: string;
    location?: string;
    unique_device_id: string;
}

export interface UpdateSensorRequest {
    name?: string;
    location?: string;
    batteryLevel?: number;
    firmware_version?: string;
}

export interface GetSensorDataRequest {
    sensorId: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
}

export interface SensorSharing {
    sharing_id: string;
    sensor_id: string;
    owner_id: string;
    shared_with_id: string;
    status: SharingStatus;
    created_at: Date;
    updated_at: Date;
}

export interface ShareSensorRequest {
    sensorId: string;
    userId: string;
}

export interface UpdateSharingStatusRequest {
    sharingId: string;
    status: SharingStatus;
} 