import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide fallback values for development
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        debug: process.env.NODE_ENV === 'development'
      },
      global: {
        headers: {
          'X-Client-Info': 'legalai-pro@1.0.0'
        }
      }
    })
  : createClient(defaultUrl, defaultKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        debug: process.env.NODE_ENV === 'development'
      },
      global: {
        headers: {
          'X-Client-Info': 'legalai-pro@1.0.0'
        }
      }
    });

// Session management utilities
export const sessionUtils = {
  // Check if session is valid
  isSessionValid: (session: any) => {
    if (!hasValidSupabaseConfig) return false;
    if (!session || !session.access_token) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    // Check if token expires within next 5 minutes
    return expiresAt > (now + 300);
  },

  // Get session with validation
  getValidSession: async () => {
    if (!hasValidSupabaseConfig) {
      console.warn('Supabase not configured. Please set up your Supabase credentials in the .env file.');
      return null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      if (!sessionUtils.isSessionValid(session)) {
        console.log('Session invalid or expired, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
          return null;
        }
        
        return refreshedSession;
      }

      return session;
    } catch (error) {
      console.error('Error in getValidSession:', error);
      return null;
    }
  },

  // Clear all session data
  clearSession: () => {
    // Clear Supabase storage
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Clear any other auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Export configuration status for components to check
export const isSupabaseConfigured = hasValidSupabaseConfig;

// Types
export interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
  phone_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  profile_picture_url?: string;
  notification_preferences?: {
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    security_alerts: boolean;
  };
  privacy_settings?: {
    profile_visibility: 'public' | 'private';
    show_email: boolean;
    show_phone: boolean;
    data_sharing: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}