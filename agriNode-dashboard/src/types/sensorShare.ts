import { SharingStatus } from "@/api/sensorSharingApi";

export interface SensorSharing {
  sharing_id: string;
  sensor_id: string;
  owner_id: string;
  shared_with_id: string;
  status: SharingStatus;
  created_at: Date;
  updated_at: Date;
}