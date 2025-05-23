export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  department?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRequest {
  id: string;
  email: string;
  full_name: string;
  department: string;
  phone_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error: null | {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} 