import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Upload, MessageSquare, FileText, Shield, BookOpen, ChevronRight, Globe, Clock, CheckCircle, User, LogOut, AlertCircle } from 'lucide-react';
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { AIAuthModal } from './components/auth/AIAuthModal';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { UserProfile } from './components/profile/UserProfile';
import { useAuthGuard } from './hooks/useAuthGuard';
import { useSmoothScroll } from './hooks/useScrollPosition';
import { DocumentAnalysisPage } from './pages/DocumentAnalysisPage';
import { LegalQuestionsPage } from './pages/LegalQuestionsPage';
import { GeneralGuidancePage } from './pages/GeneralGuidancePage';
import { RedactionReviewPage } from './pages/RedactionReviewPage';

// Auth callback component
function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useFirebaseAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Successful authentication, redirect to main page
        navigate('/', { replace: true });
      } else {
        // Authentication failed, redirect to login
        navigate('/?auth=failed', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-xl mb-4">
            <Scale className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
}

function AppContent() {
  const { user, profile, signOut, loading, isConfigured } = useFirebaseAuth();
  const { requireAuth, showAuthModal, authFeature, closeAuthModal } = useAuthGuard();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [currentPage, setCurrentPage] = useState<'main' | 'document-analysis' | 'legal-questions' | 'general-guidance' | 'redaction-review'>('main');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showRegularAuthModal, setShowRegularAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const location = useLocation();
  const navigate = useNavigate();

  const { scrollToTop } = useSmoothScroll();

  // Handle auth failure from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('auth') === 'failed') {
      setShowRegularAuthModal(true);
      setAuthMode('login');
      // Clean up URL
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  // Restore user state from session
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry');
    if (savedCountry && user) {
      setSelectedCountry(savedCountry);
    }
  }, [user]);

  // Save country selection
  useEffect(() => {
    if (selectedCountry && user) {
      localStorage.setItem('selectedCountry', selectedCountry);
    }
  }, [selectedCountry, user]);

  // Handle page transitions - scroll to top for new pages only
  useEffect(() => {
    if (currentPage !== 'main') {
      // Scroll to top when navigating to service pages
      scrollToTop(false);
    }
  }, [currentPage, scrollToTop]);

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
  ];

  const services = [
    {
      id: 'document-analysis',
      title: 'Document Analysis',
      description: 'Upload contracts and legal documents for comprehensive risk assessment and clause analysis',
      icon: FileText,
      features: ['Risk Assessment', 'Clause Analysis', 'Missing Protections', 'Ambiguous Language'],
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'legal-questions',
      title: 'Legal Questions',
      description: 'Get expert guidance on specific legal situations with statutory references and next steps',
      icon: MessageSquare,
      features: ['Statutory References', 'Case Law Examples', 'Action Plans', 'Time-Sensitive Alerts'],
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      id: 'general-guidance',
      title: 'General Guidance',
      description: 'Comprehensive legal advice for broader inquiries with jurisdiction-specific answers',
      icon: BookOpen,
      features: ['Plain Language', 'Step-by-Step Plans', 'Resource Links', 'Compliance Checklists'],
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      id: 'redaction-review',
      title: 'Redaction Review',
      description: 'Analyze documents with redacted sections and assess impact of missing information',
      icon: Shield,
      features: ['Visible Content Analysis', 'Impact Assessment', 'Limitation Notices', 'Risk Evaluation'],
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear local state
      setSelectedCountry('');
      setCurrentPage('main');
      localStorage.removeItem('selectedCountry');
      // Navigate to home and scroll to top
      navigate('/', { replace: true });
      scrollToTop(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    if (!isConfigured) {
      alert('Please configure Firebase first by adding your Firebase credentials to the .env file.');
      return;
    }
    setAuthMode(mode);
    setShowRegularAuthModal(true);
  };

  const handleServiceSelect = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const canAccess = await requireAuth(service?.title || 'AI analysis');
    
    if (canAccess) {
      setCurrentPage(serviceId as any);
    }
  };

  const handleCountrySelect = async () => {
    const canAccess = await requireAuth('jurisdiction selection');
    
    if (canAccess) {
      setShowCountryModal(true);
    }
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  const closeRegularAuthModal = () => {
    setShowRegularAuthModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-xl mb-4">
            <Scale className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render specific service pages
  if (currentPage !== 'main' && user && selectedCountry) {
    const selectedCountryName = countries.find(c => c.code === selectedCountry)?.name || selectedCountry;
    
    switch (currentPage) {
      case 'document-analysis':
        return <DocumentAnalysisPage onBack={handleBackToMain} country={selectedCountryName} />;
      case 'legal-questions':
        return <LegalQuestionsPage onBack={handleBackToMain} country={selectedCountryName} />;
      case 'general-guidance':
        return <GeneralGuidancePage onBack={handleBackToMain} country={selectedCountryName} />;
      case 'redaction-review':
        return <RedactionReviewPage onBack={handleBackToMain} country={selectedCountryName} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Firebase Configuration Notice */}
      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 text-sm">
                <strong>Demo Mode:</strong> Configure Firebase to enable user authentication with email, phone, and Google sign-in.
              </p>
            </div>
            <button
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Configure Firebase
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">LegalAI Pro</h1>
                <p className="text-xs text-slate-500">Professional Legal Advisory</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedCountry && user && (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {countries.find(c => c.code === selectedCountry)?.name}
                  </span>
                </div>
              )}
              
              {user && isConfigured ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowUserProfile(true)}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {profile?.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                    disabled={!isConfigured}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                    disabled={!isConfigured}
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              <button
                onClick={handleCountrySelect}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                {selectedCountry ? 'Change Jurisdiction' : 'Select Country'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Country Selection Modal */}
      {showCountryModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Select Legal Jurisdiction</h2>
            <p className="text-slate-600 mb-6">Choose your country to receive jurisdiction-specific legal guidance and analysis.</p>
            <div className="grid grid-cols-1 gap-3">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country.code);
                    setShowCountryModal(false);
                  }}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="font-medium text-slate-900">{country.name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCountryModal(false)}
              className="mt-4 w-full py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!selectedCountry || !user ? (
          /* Welcome Screen */
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-xl mb-6">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Professional Legal AI Advisory
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Advanced AI-powered legal analysis calibrated to your jurisdiction's legal framework. 
              Get comprehensive document reviews, expert guidance, and statutory citations.
            </p>
            {!user && isConfigured && (
              <div className="flex items-center justify-center space-x-4 mb-8">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
            <button
              onClick={handleCountrySelect}
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors font-semibold text-lg"
            >
              Select Your Jurisdiction
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        ) : (
          /* Services Dashboard */
          <div>
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Legal Advisory Services
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Specialized legal analysis based on {countries.find(c => c.code === selectedCountry)?.name} legal framework. 
                Choose the service that best fits your needs.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div
                    key={service.id}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer transform hover:-translate-y-1 hover:shadow-lg ${service.color}`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <IconComponent className="h-6 w-6 text-slate-700" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                    <p className="text-slate-600 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Features Overview */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Secure & Confidential</h3>
                <p className="text-slate-600 text-sm">End-to-end encryption with automatic document purging after analysis.</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Instant Analysis</h3>
                <p className="text-slate-600 text-sm">AI-powered review delivers comprehensive results in seconds, not hours.</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Expert Knowledge</h3>
                <p className="text-slate-600 text-sm">Trained on comprehensive legal databases with current statutory references.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Scale className="h-6 w-6" />
              <span className="text-xl font-bold">LegalAI Pro</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
              Professional legal advisory powered by advanced AI. This platform provides general legal information 
              and should not be considered as legal advice. Always consult with a qualified attorney for specific legal matters.
            </p>
            <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-slate-400">
              <span>© 2025 LegalAI Pro</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Contact Support</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden reCAPTCHA container for phone auth */}
      <div id="recaptcha-container"></div>

      {/* Modals */}
      {isConfigured && (
        <>
          <AuthModal
            isOpen={showRegularAuthModal}
            onClose={closeRegularAuthModal}
            initialMode={authMode}
          />
          
          <AIAuthModal
            isOpen={showAuthModal}
            onClose={closeAuthModal}
            feature={authFeature}
          />
          
          <UserProfile
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
          />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;