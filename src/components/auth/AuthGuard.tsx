import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showModal?: boolean;
  onModalClose?: () => void;
}

export function AuthGuard({ children, fallback, showModal = false, onModalClose }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {fallback || (
          <div className="text-center p-8">
            <p className="text-slate-600">Please log in to access this feature.</p>
          </div>
        )}
        {showModal && (
          <AuthModal
            isOpen={true}
            onClose={onModalClose || (() => {})}
            initialMode="login"
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}