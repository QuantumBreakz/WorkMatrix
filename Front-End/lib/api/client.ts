import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

interface QueuedRequest<T> {
  config: InternalAxiosRequestConfig;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  retryCount: number;
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://cfxmnmjjfjhztgznzebm.supabase.co',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request queue for offline support
let requestQueue: QueuedRequest<AxiosResponse>[] = [];
let isProcessingQueue = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Process queued requests
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue[0];
    try {
      const response = await apiClient(request.config);
      request.resolve(response);
      requestQueue.shift();
    } catch (error) {
      if (request.retryCount < MAX_RETRIES) {
        request.retryCount++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * request.retryCount));
        continue;
      }
      request.reject(error);
      requestQueue.shift();
    }
  }
  
  isProcessingQueue = false;
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null;
    
    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token if needed
    const csrfToken = typeof window !== 'undefined' ? document.cookie.match('(^|;)\\s*XSRF-TOKEN\\s*=\\s*([^;]+)')?.pop() : null;
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Check if we're online
    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Queue the request for later
      return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
        const queuedRequest: QueuedRequest<InternalAxiosRequestConfig> = {
          config,
          resolve,
          reject,
          retryCount: 0,
        };
        requestQueue.push(queuedRequest as QueuedRequest<AxiosResponse>);
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('supabase.auth.refreshToken');
        if (refreshToken) {
          const response = await apiClient.post('/auth/v1/token', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          localStorage.setItem('supabase.auth.token', access_token);
          localStorage.setItem('supabase.auth.refreshToken', refresh_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Handle different types of errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          toast.error('Please log in to continue');
          // Redirect to login if needed
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Handle forbidden
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          // Handle not found
          toast.error('The requested resource was not found');
          break;
        case 429:
          // Handle rate limiting
          toast.error('Too many requests. Please try again later');
          // Add request to queue with exponential backoff
          if (originalRequest) {
            return new Promise<AxiosResponse>((resolve, reject) => {
              const queuedRequest: QueuedRequest<AxiosResponse> = {
                config: originalRequest,
                resolve,
                reject,
                retryCount: 0,
              };
              requestQueue.push(queuedRequest);
            });
          }
          break;
        case 500:
          // Handle server error
          toast.error('An unexpected error occurred. Please try again later');
          // Retry request if it's not a POST/PUT/DELETE
          if (originalRequest && !['post', 'put', 'delete'].includes(originalRequest.method?.toLowerCase() || '')) {
            return new Promise<AxiosResponse>((resolve, reject) => {
              const queuedRequest: QueuedRequest<AxiosResponse> = {
                config: originalRequest,
                resolve,
                reject,
                retryCount: 0,
              };
              requestQueue.push(queuedRequest);
            });
          }
          break;
        default:
          // Handle other errors
          const errorMessage = error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
            ? String(error.response.data.message)
            : 'An error occurred';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // Handle network errors
      toast.error('Network error. Please check your connection');
      // Queue request for retry when online
      if (originalRequest) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          const queuedRequest: QueuedRequest<AxiosResponse> = {
            config: originalRequest,
            resolve,
            reject,
            retryCount: 0,
          };
          requestQueue.push(queuedRequest);
        });
      }
    } else {
      // Handle other errors
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// Start processing queue when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processQueue();
  });
}

export default apiClient; 