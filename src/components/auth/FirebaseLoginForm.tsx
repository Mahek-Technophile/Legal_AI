import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Chrome, CheckCircle, Loader2 } from 'lucide-react';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';

interface FirebaseLoginFormProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

export function FirebaseLoginForm({ onToggleMode, onForgotPassword }: FirebaseLoginFormProps) {
  const { signInWithEmail, signInWithGooglePopup, signInWithGoogleRedirect } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authMethod, setAuthMethod] = useState<'popup' | 'redirect'>('popup');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { user, error } = await signInWithEmail(formData.email, formData.password);
      
      if (error) {
        setErrors({ general: error });
      } else if (user) {
        setSuccess(true);
        // Redirect will be handled by the auth context
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (method: 'popup' | 'redirect') => {
    setLoading(true);
    setErrors({});
    setAuthMethod(method);

    try {
      if (method === 'popup') {
        const { user, error } = await signInWithGooglePopup();
        if (error) {
          setErrors({ general: error });
        } else if (user) {
          setSuccess(true);
        }
      } else {
        const { error } = await signInWithGoogleRedirect();
        if (error) {
          setErrors({ general: error });
        }
        // For redirect, the page will reload
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred with Google sign in. Please try again.' });
    } finally {
      if (method === 'popup') {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back!</h2>
          <p className="text-slate-600 mt-2">
            You have been successfully signed in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-slate-600 mt-2">Sign in to your LegalAI Pro account</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errors.general}</p>
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
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-slate-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.email || !formData.password}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleGoogleSignIn('popup')}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome className="h-5 w-5 text-slate-600" />
          <span className="text-slate-700 font-medium">Continue with Google (Popup)</span>
        </button>

        <button
          onClick={() => handleGoogleSignIn('redirect')}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome className="h-5 w-5 text-slate-600" />
          <span className="text-slate-700 font-medium">Continue with Google (Redirect)</span>
        </button>
      </div>

      <div className="text-center">
        <p className="text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-slate-900 font-medium hover:underline"
            disabled={loading}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}