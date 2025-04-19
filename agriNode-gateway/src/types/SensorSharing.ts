export type SharingStatus = 'pending' | 'accepted' | 'rejected';

export interface SensorSharing {
    sharing_id: string;
    sensor_id: string;
    owner_id: string;
    shared_with_id: string;
    status: SharingStatus;
    created_at: Date;
    updated_at: Date;
}