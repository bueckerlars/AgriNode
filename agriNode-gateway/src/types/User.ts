export interface User {
    user_id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    password: string;
    created_at: Date;
    updated_at: Date;
}