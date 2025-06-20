import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="text-slate-600 mt-2">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Click the link in the email to reset your password.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-900 font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to sign in</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Reset your password</h2>
        <p className="text-slate-600 mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <button
        onClick={onBack}
        className="w-full inline-flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
        disabled={loading}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to sign in</span>
      </button>
    </div>
  );
}