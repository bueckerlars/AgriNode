export interface ApiKey {
  api_key_id: string;
  user_id: string;
  name: string;
  key: string;
  created_at: Date;
  expiration_date: Date | null;
}