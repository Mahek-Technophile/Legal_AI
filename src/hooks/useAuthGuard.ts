import { useState, useCallback } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

export function useAuthGuard() {
  const { user, isConfigured } = useFirebaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFeature, setAuthFeature] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const requireAuth = useCallback(async (featureName: string = 'this feature') => {
    setIsCheckingAuth(true);
    
    try {
      if (!isConfigured) {
        alert('Please configure Firebase first to enable authentication features.');
        return false;
      }
      
      // Check if user exists
      if (!user) {
        setAuthFeature(featureName);
        setShowAuthModal(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in requireAuth:', error);
      setAuthFeature(featureName);
      setShowAuthModal(true);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  }, [user, isConfigured]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthFeature('');
  }, []);

  // Check if user has valid authentication
  const isAuthenticated = useCallback(() => {
    return !!(user && isConfigured);
  }, [user, isConfigured]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
    requireAuth,
    showAuthModal,
    authFeature,
    closeAuthModal,
    isCheckingAuth,
  };
}