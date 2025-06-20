import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService, onAuthStateChange, UserProfile, isFirebaseConfigured } from '../lib/firebase';

interface FirebaseAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGooglePopup: () => Promise<{ user: User | null; error: string | null }>;
  signInWithGoogleRedirect: () => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ user: User | null; error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUpWithPhone: (phone: string, verificationCode?: string, verificationId?: string, displayName?: string) => Promise<{ user?: User | null; error?: string | null; verificationId?: string }>;
  signInWithPhone: (phone: string, verificationCode?: string, verificationId?: string) => Promise<{ user?: User | null; error?: string | null; verificationId?: string }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined || context === null) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(isFirebaseConfigured());

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userProfile = await authService.getUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Handle redirect result on app load
    authService.handleRedirectResult().then(({ user, error }) => {
      if (error) {
        console.error('Redirect result error:', error);
      }
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await authService.getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };

    const result = await authService.updateUserProfile(user.uid, updates);
    
    if (!result.error) {
      await refreshProfile();
    }
    
    return result;
  };

  // Phone authentication methods
  const signUpWithPhone = async (
    phone: string, 
    verificationCode?: string, 
    verificationId?: string, 
    displayName?: string
  ) => {
    return authService.signUpWithPhone(phone, verificationCode, verificationId, displayName);
  };

  const signInWithPhone = async (
    phone: string, 
    verificationCode?: string, 
    verificationId?: string
  ) => {
    return authService.signInWithPhone(phone, verificationCode, verificationId);
  };

  const value = {
    user,
    profile,
    loading,
    isConfigured,
    signInWithGooglePopup: authService.signInWithGooglePopup,
    signInWithGoogleRedirect: authService.signInWithGoogleRedirect,
    signUpWithEmail: authService.signUpWithEmail,
    signInWithEmail: authService.signInWithEmail,
    signUpWithPhone,
    signInWithPhone,
    resetPassword: authService.resetPassword,
    signOut: authService.signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}