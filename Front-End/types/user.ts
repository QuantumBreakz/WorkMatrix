export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  designation?: string;
  marital_status?: string;
  employment_status?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  role?: 'employee' | 'admin';
  status?: 'active' | 'inactive' | 'pending';
  last_login?: string;
  preferences?: UserPreferences;
  security?: UserSecurity;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
}

export interface UserSecurity {
  two_factor_enabled?: boolean;
  last_password_change?: string;
}

export interface SecurityFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
  two_factor_enabled: boolean;
}

export interface ProfileFormData {
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  marital_status?: string;
  employment_status?: string;
  profile_picture?: string;
} 