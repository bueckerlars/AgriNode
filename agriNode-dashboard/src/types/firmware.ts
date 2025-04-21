export interface Firmware {
  firmware_id: string;
  version: string;
  file_path: string;
  checksum: string;
  active: boolean;
  created_at: string;
}