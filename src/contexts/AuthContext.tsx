import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string, accessToken?: string) => Promise<{ error: AuthError | null }>;
  verifyPasswordResetToken: (token: string) => Promise<{ error: AuthError | null; isValid: boolean }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  logActivity: (type: string, description: string, metadata?: Record<string, any>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Rate limiting for password reset attempts
  const [resetAttempts, setResetAttempts] = useState<Map<string, { count: number; lastAttempt: number }>>(new Map());
  const MAX_RESET_ATTEMPTS = 3;
  const RESET_COOLDOWN = 15 * 60 * 1000; // 15 minutes

  // Check if Supabase is properly configured
  const checkSupabaseConnection = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return !!(supabaseUrl && 
             supabaseKey && 
             !supabaseUrl.includes('placeholder') && 
             !supabaseKey.includes('placeholder') &&
             supabaseUrl.startsWith('https://'));
  };

  // Clear all authentication data
  const clearAuthData = () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    
    // Clear any stored tokens from localStorage/sessionStorage
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Clear any other auth-related storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Rate limiting check for password reset
  const checkResetRateLimit = (email: string): { allowed: boolean; remainingTime?: number } => {
    const now = Date.now();
    const attempts = resetAttempts.get(email);
    
    if (!attempts) {
      return { allowed: true };
    }
    
    // Check if cooldown period has passed
    if (now - attempts.lastAttempt > RESET_COOLDOWN) {
      resetAttempts.delete(email);
      return { allowed: true };
    }
    
    // Check if max attempts reached
    if (attempts.count >= MAX_RESET_ATTEMPTS) {
      const remainingTime = RESET_COOLDOWN - (now - attempts.lastAttempt);
      return { allowed: false, remainingTime };
    }
    
    return { allowed: true };
  };

  // Update reset attempts counter
  const updateResetAttempts = (email: string) => {
    const now = Date.now();
    const attempts = resetAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    setResetAttempts(new Map(resetAttempts.set(email, attempts)));
  };

  // Refresh session manually
  const refreshSession = async () => {
    if (!isSupabaseConnected) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        clearAuthData();
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      clearAuthData();
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        const connected = checkSupabaseConnection();
        
        if (!connected) {
          console.log('Supabase not configured, running in demo mode');
          if (mounted) {
            setIsSupabaseConnected(false);
            setLoading(false);
          }
          return;
        }

        setIsSupabaseConnected(true);

        // Get initial session with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Error getting session:', error);
              if (error.message.includes('Invalid Refresh Token') || 
                  error.message.includes('refresh_token_not_found')) {
                // Clear invalid tokens
                clearAuthData();
                break;
              }
              throw error;
            }

            if (mounted) {
              setSession(session);
              setUser(session?.user ?? null);
              
              if (session?.user) {
                await fetchProfile(session.user.id);
                await logActivity('auth', 'Session restored', { 
                  sessionId: session.access_token.substring(0, 10) + '...' 
                });
              }
              
              setLoading(false);
            }
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error('Failed to get session after retries:', error);
              clearAuthData();
              if (mounted) setLoading(false);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearAuthData();
          setIsSupabaseConnected(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    if (checkSupabaseConnection()) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (!mounted) return;

          try {
            // Handle different auth events
            switch (event) {
              case 'SIGNED_IN':
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                  await fetchProfile(session.user.id);
                  await logActivity('auth', 'User signed in', { event });
                }
                break;
                
              case 'SIGNED_OUT':
                clearAuthData();
                await logActivity('auth', 'User signed out', { event });
                break;
                
              case 'TOKEN_REFRESHED':
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                  await fetchProfile(session.user.id);
                }
                break;
                
              case 'USER_UPDATED':
                setUser(session?.user ?? null);
                if (session?.user) {
                  await fetchProfile(session.user.id);
                }
                break;
                
              case 'PASSWORD_RECOVERY':
                // Handle password recovery event
                console.log('Password recovery event detected');
                await logActivity('auth', 'Password recovery initiated', { event });
                break;
                
              default:
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                  await fetchProfile(session.user.id);
                } else {
                  setProfile(null);
                }
            }
            
            setLoading(false);
          } catch (error) {
            console.error('Error handling auth state change:', error);
            setLoading(false);
          }
        }
      );
      authSubscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConnected) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      // Log successful signup attempt
      if (data.user) {
        await logActivity('auth', 'User signed up', { 
          email: email,
          userId: data.user.id 
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      // Session will be handled by the auth state change listener
      return { error: null };
    } catch (error) {
      console.error('Unexpected signin error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected Google signin error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    try {
      setLoading(true);
      
      // Log activity before signing out
      await logActivity('auth', 'User initiated sign out', {});
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      // Clear all auth data immediately
      clearAuthData();
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected signout error:', error);
      // Still clear auth data even if there's an error
      clearAuthData();
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    // Check rate limiting
    const rateLimitCheck = checkResetRateLimit(email);
    if (!rateLimitCheck.allowed) {
      const remainingMinutes = Math.ceil((rateLimitCheck.remainingTime || 0) / 60000);
      return { 
        error: { 
          message: `Too many password reset attempts. Please wait ${remainingMinutes} minutes before trying again.` 
        } as AuthError 
      };
    }

    try {
      // Update rate limiting counter
      updateResetAttempts(email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error };
      }

      await logActivity('auth', 'Password reset requested', { 
        email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: 'client-side' // Would be populated server-side in production
      });
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const verifyPasswordResetToken = async (token: string) => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError, isValid: false };
    }

    try {
      // Attempt to verify the session with the token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        console.error('Token verification error:', error);
        
        // Provide specific error messages for different scenarios
        let errorMessage = 'Invalid or expired reset link.';
        
        if (error.message.includes('expired')) {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'This password reset link is invalid or has already been used.';
        } else if (error.message.includes('not_found')) {
          errorMessage = 'Password reset link not found. Please request a new one.';
        }
        
        return { 
          error: { message: errorMessage } as AuthError, 
          isValid: false 
        };
      }

      await logActivity('auth', 'Password reset token verified', { 
        tokenValid: true,
        timestamp: new Date().toISOString()
      });

      return { error: null, isValid: true };
    } catch (error) {
      console.error('Unexpected token verification error:', error);
      return { 
        error: { message: 'Failed to verify reset link. Please try again.' } as AuthError, 
        isValid: false 
      };
    }
  };

  const updatePassword = async (newPassword: string, accessToken?: string) => {
    if (!isSupabaseConnected) {
      return { error: { message: 'Supabase not connected' } as AuthError };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return { error: { message: 'Password must be at least 8 characters long.' } as AuthError };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return { 
        error: { 
          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' 
        } as AuthError 
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update password error:', error);
        
        let errorMessage = 'Failed to update password.';
        
        if (error.message.includes('session_not_found')) {
          errorMessage = 'Your session has expired. Please request a new password reset link.';
        } else if (error.message.includes('same_password')) {
          errorMessage = 'New password must be different from your current password.';
        }
        
        return { error: { message: errorMessage } as AuthError };
      }

      await logActivity('auth', 'Password updated successfully', { 
        timestamp: new Date().toISOString(),
        method: accessToken ? 'reset_link' : 'authenticated_update'
      });

      return { error: null };
    } catch (error) {
      console.error('Unexpected update password error:', error);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !isSupabaseConnected) return { error: new Error('No user logged in or Supabase not connected') };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile(user.id);
      await logActivity('profile', 'Profile updated', { updates: Object.keys(updates) });

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  };

  const logActivity = async (type: string, description: string, metadata?: Record<string, any>) => {
    if (!user || !isSupabaseConnected) return;

    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        activity_type: type,
        activity_description: description,
        metadata: metadata || {},
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isSupabaseConnected,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    verifyPasswordResetToken,
    updateProfile,
    logActivity,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}