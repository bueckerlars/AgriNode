export interface Firmware {
    firmware_id: string;
    version: string;
    file_path: string;
    active: boolean;
    created_at: Date;
    checksum: string;
}

export interface CreateFirmwareInput {
    version: string;
    file_path: string;
    checksum: string;
    active?: boolean;
}