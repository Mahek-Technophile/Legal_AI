import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, RefreshCw, Scale, MapPin, Clock, FileText, Users, Globe, Cloud, Settings } from 'lucide-react';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { cloudAIService } from '../../services/cloudAIService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  jurisdiction?: string;
  isLegalResponse?: boolean;
}

interface JurisdictionLegalChatProps {
  onJurisdictionChange?: (jurisdiction: string) => void;
  initialJurisdiction?: string;
}

const JURISDICTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸', legalSystem: 'Common Law' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', legalSystem: 'Common Law' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', legalSystem: 'Common Law (Civil Law in Quebec)' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', legalSystem: 'Common Law' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', legalSystem: 'Civil Law' },
  { code: 'FR', name: 'France', flag: '🇫🇷', legalSystem: 'Civil Law' }
];

export function JurisdictionLegalChat({ onJurisdictionChange, initialJurisdiction }: JurisdictionLegalChatProps) {
  const { user } = useFirebaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(initialJurisdiction || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll position management
  const { elementRef: scrollElementRef } = useScrollPosition({
    key: 'jurisdiction-legal-chat',
    restoreOnMount: false,
    saveOnUnmount: true
  });

  useEffect(() => {
    checkProviderStatus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      const minHeight = 40;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up scroll element ref
  useEffect(() => {
    if (messagesContainerRef.current && scrollElementRef) {
      scrollElementRef.current = messagesContainerRef.current;
    }
  }, [scrollElementRef]);

  const checkProviderStatus = () => {
    const status = cloudAIService.getProviderStatus();
    setProviderStatus(status);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const handleJurisdictionChange = (jurisdiction: string) => {
    setSelectedJurisdiction(jurisdiction);
    onJurisdictionChange?.(jurisdiction);
    
    // Add system message about jurisdiction change
    if (messages.length > 0) {
      const jurisdictionInfo = JURISDICTIONS.find(j => j.code === jurisdiction);
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Jurisdiction updated to **${jurisdictionInfo?.name}** (${jurisdictionInfo?.legalSystem}). I'll now provide legal guidance specific to ${jurisdictionInfo?.name} law using cloud AI.`,
        timestamp: new Date(),
        jurisdiction,
        isLegalResponse: true
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!selectedJurisdiction) {
      setError('Please select a jurisdiction before asking your legal question.');
      return;
    }

    // Check provider status
    if (!providerStatus?.configured) {
      setError(providerStatus?.message || 'No cloud AI provider configured');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      jurisdiction: selectedJurisdiction
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Generate legal response using cloud AI
      const response = await cloudAIService.generateLegalResponse(
        currentInput,
        JURISDICTIONS.find(j => j.code === selectedJurisdiction)?.name || selectedJurisdiction,
        'jurisdiction-specific legal guidance'
      );
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        jurisdiction: selectedJurisdiction,
        isLegalResponse: true
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Legal response error:', err);
      setError(`Failed to generate legal guidance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const currentProvider = cloudAIService.getCurrentProvider();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[700px]">
      {/* Enhanced Chat Header */}
      <div className="border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Jurisdiction-Specific Legal Assistant</h3>
              <p className="text-sm text-slate-500">
                {currentProvider ? `Powered by ${currentProvider.name}` : 'Cloud AI Legal Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {providerStatus?.configured ? (
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <Cloud className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {currentProvider?.name || 'Cloud AI'} Ready
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <Settings className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Setup Required</span>
              </div>
            )}
            {selectedJurisdiction && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {JURISDICTIONS.find(j => j.code === selectedJurisdiction)?.flag} {JURISDICTIONS.find(j => j.code === selectedJurisdiction)?.name}
                </span>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cloud AI Setup Notice */}
      {!providerStatus?.configured && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-800 text-sm font-medium">
                Cloud AI Setup Required
              </p>
              <p className="text-blue-700 text-xs">
                {providerStatus?.message || 'Add API keys to your .env file for OpenAI, DeepSeek, Groq, Together AI, or Hugging Face'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Jurisdiction Selection */}
      {!selectedJurisdiction && (
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="max-w-md mx-auto">
            <label htmlFor="jurisdiction" className="block text-sm font-medium text-slate-700 mb-3">
              Select your country / jurisdiction
            </label>
            <select
              id="jurisdiction"
              value={selectedJurisdiction}
              onChange={(e) => handleJurisdictionChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Choose your jurisdiction...</option>
              {JURISDICTIONS.map((jurisdiction) => (
                <option key={jurisdiction.code} value={jurisdiction.code}>
                  {jurisdiction.flag} {jurisdiction.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Legal guidance will be tailored to your selected jurisdiction's laws using cloud AI.
            </p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar"
      >
        {!selectedJurisdiction ? (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">
              Select your jurisdiction to get started with AI-powered legal guidance
            </p>
            <p className="text-xs text-slate-400">
              {providerStatus?.configured 
                ? `Responses will be tailored to your country's legal system using ${currentProvider?.name || 'Cloud AI'}`
                : 'Configure a cloud AI provider for instant legal assistance'
              }
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Scale className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">
              {providerStatus?.configured 
                ? `Ask your legal question for ${JURISDICTIONS.find(j => j.code === selectedJurisdiction)?.name}-specific AI guidance`
                : 'Configure a cloud AI provider to get started with AI legal assistance'
              }
            </p>
            <p className="text-xs text-slate-400">
              {providerStatus?.configured 
                ? `Powered by ${currentProvider?.name || 'Cloud AI'} - no local installation required`
                : 'Add API keys to .env file for instant legal assistance'
              }
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : message.isLegalResponse
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Scale className={`h-4 w-4 mt-1 flex-shrink-0 ${
                      message.isLegalResponse ? 'text-blue-600' : 'text-slate-600'
                    }`} />
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">
                      <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, index) => {
                          if (line.startsWith('## ')) {
                            return <h3 key={index} className="text-lg font-bold mt-4 mb-2 first:mt-0">{line.replace('## ', '')}</h3>;
                          }
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={index} className="font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (line.startsWith('• ')) {
                            return <li key={index} className="ml-4">{line.replace('• ', '')}</li>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={index} className="ml-4">{line.replace('- ', '')}</li>;
                          }
                          if (line.trim() === '') {
                            return <br key={index} />;
                          }
                          return <p key={index} className="mb-2">{line}</p>;
                        })}
                      </div>
                    </div>
                    <div className={`text-xs mt-2 flex items-center space-x-2 ${
                      message.role === 'user' 
                        ? 'text-slate-300' 
                        : message.isLegalResponse
                        ? 'text-blue-600'
                        : 'text-slate-500'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.jurisdiction && (
                        <>
                          <span>•</span>
                          <span>{JURISDICTIONS.find(j => j.code === message.jurisdiction)?.flag} {JURISDICTIONS.find(j => j.code === message.jurisdiction)?.name}</span>
                        </>
                      )}
                      {message.isLegalResponse && (
                        <>
                          <span>•</span>
                          <span className="font-medium">AI Legal Information</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Scale className="h-4 w-4" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-600">
                  {currentProvider ? `${currentProvider.name} is generating AI legal guidance...` : 'Generating AI legal guidance...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={checkProviderStatus}
                  className="mt-2 flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm">Try Again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Section */}
      {selectedJurisdiction && (
        <div className="border-t border-slate-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <label htmlFor="legal-question" className="block text-sm font-medium text-slate-700 mb-2">
                What's your legal question?
              </label>
              <textarea
                ref={inputRef}
                id="legal-question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={providerStatus?.configured 
                  ? `Ask your legal question about ${JURISDICTIONS.find(j => j.code === selectedJurisdiction)?.name} law...`
                  : "Configure a cloud AI provider to start asking legal questions..."
                }
                disabled={loading || !providerStatus?.configured}
                className="w-full min-w-[250px] resize-none border border-slate-300 rounded-lg px-3 py-2 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-all duration-200 ease-in-out
                           text-slate-900 placeholder-slate-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           min-h-[2.5rem] max-h-[7.5rem]
                           leading-6 text-base
                           sm:text-sm
                           hover:border-slate-400
                           focus:shadow-sm
                           custom-scrollbar"
                style={{
                  height: '40px',
                  overflowY: 'hidden'
                }}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading || !providerStatus?.configured}
              className="flex-shrink-0 bg-slate-900 text-white p-3 rounded-lg 
                         hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200 ease-in-out
                         min-h-[2.75rem] min-w-[2.75rem]
                         flex items-center justify-center
                         hover:shadow-md focus:shadow-md
                         active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          
          {/* Helper Text */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 space-y-1 sm:space-y-0">
            <p className="text-xs text-slate-500">
              {providerStatus?.configured 
                ? `Get AI-powered jurisdiction-specific legal guidance powered by ${currentProvider?.name || 'Cloud AI'}`
                : 'Add API keys to .env file for instant AI-powered legal assistance'
              }
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="hidden sm:inline">Press Enter to send</span>
              <span>{input.length} characters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}