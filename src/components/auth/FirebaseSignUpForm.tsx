import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Chrome, CheckCircle, Loader2 } from 'lucide-react';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';

interface FirebaseSignUpFormProps {
  onToggleMode: () => void;
}

export function FirebaseSignUpForm({ onToggleMode }: FirebaseSignUpFormProps) {
  const { signUpWithEmail, signInWithGooglePopup } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
      const { user, error } = await signUpWithEmail(
        formData.email, 
        formData.password, 
        formData.displayName
      );
      
      if (error) {
        setErrors({ general: error });
      } else if (user) {
        setSuccess(true);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});

    try {
      const { user, error } = await signInWithGooglePopup();
      if (error) {
        setErrors({ general: error });
      } else if (user) {
        setSuccess(true);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
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
          <h2 className="text-2xl font-bold text-slate-900">Account created!</h2>
          <p className="text-slate-600 mt-2">
            Welcome to LegalAI Pro. Please check your email to verify your account.
          </p>
        </div>
        <button
          onClick={onToggleMode}
          className="text-slate-900 font-medium hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
        <p className="text-slate-600 mt-2">Join LegalAI Pro and get started today</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors ${
                errors.displayName ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter your display name"
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {errors.displayName && (
            <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>
          )}
        </div>

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
              placeholder="Create a password"
              disabled={loading}
              autoComplete="new-password"
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded mt-1"
              disabled={loading}
            />
            <span className="text-sm text-slate-600">
              I agree to the{' '}
              <a href="#" className="text-slate-900 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-slate-900 hover:underline">Privacy Policy</a>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-red-600 text-sm mt-1">{errors.acceptTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
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

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome className="h-5 w-5 text-slate-600" />
        <span className="text-slate-700 font-medium">Continue with Google</span>
      </button>

      <div className="text-center">
        <p className="text-slate-600">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-slate-900 font-medium hover:underline"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}