import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FirebaseLoginForm } from './FirebaseLoginForm';
import { FirebaseSignUpForm } from './FirebaseSignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function FirebaseAuthModal({ isOpen, onClose, initialMode = 'login' }: FirebaseAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot');
  };

  const handleBack = () => {
    setMode('login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h1 className="text-lg font-semibold text-slate-900">
            {mode === 'login' && 'Sign In with Firebase'}
            {mode === 'signup' && 'Sign Up with Firebase'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {mode === 'login' && (
            <FirebaseLoginForm 
              onToggleMode={handleToggleMode}
              onForgotPassword={handleForgotPassword}
            />
          )}
          {mode === 'signup' && (
            <FirebaseSignUpForm onToggleMode={handleToggleMode} />
          )}
          {mode === 'forgot' && (
            <ForgotPasswordForm onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
}