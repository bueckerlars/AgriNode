import { UserRole } from './base.types';

export interface User {
    user_id: string;
    username: string;
    email: string;
    role: UserRole;
    password: string;
    created_at: Date;
    updated_at: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ApiKey {
    api_key_id: string;
    user_id: string;
    name: string;
    key: string;
    created_at: Date;
    expiration_date: Date | null;
}

export interface CreateApiKeyRequest {
    name: string;
    expiresIn?: number; // in days
} 