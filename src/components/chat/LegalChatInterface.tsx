import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, RefreshCw, Scale, MapPin, Clock, FileText, Users, Cloud, Settings } from 'lucide-react';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { processUserMessage, shouldTriggerGreeting } from '../../utils/greetingDetection';
import { cloudAIService } from '../../services/cloudAIService';
import { 
  isLegalQuery, 
  extractJurisdiction, 
  validateLegalQuery,
  type LegalQuery 
} from '../../utils/legalAssistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGreeting?: boolean;
  isLegalResponse?: boolean;
  jurisdiction?: string;
}

interface LegalChatInterfaceProps {
  context: string;
  placeholder?: string;
  initialMessage?: string;
  systemPrompt?: string;
  country?: string;
}

export function LegalChatInterface({ 
  context, 
  placeholder = "Ask your legal question...", 
  initialMessage = "",
  systemPrompt = "You are a legal information assistant.",
  country
}: LegalChatInterfaceProps) {
  const { user } = useFirebaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [currentJurisdiction, setCurrentJurisdiction] = useState<string | undefined>(country);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll position management for messages container
  const { elementRef: scrollElementRef } = useScrollPosition({
    key: `legal-chat-${context}`,
    restoreOnMount: false,
    saveOnUnmount: true
  });

  useEffect(() => {
    setInput(initialMessage);
  }, [initialMessage]);

  useEffect(() => {
    checkProviderStatus();
  }, []);

  // Auto-resize textarea functionality
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

  const logActivity = async (type: string, description: string, metadata?: Record<string, any>) => {
    // Mock activity logging for Firebase
    console.log('Activity logged:', { type, description, metadata });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Check provider status first
    if (!providerStatus?.configured) {
      setError(providerStatus?.message || 'No cloud AI provider configured');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      jurisdiction: currentJurisdiction
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Log user activity
      await logActivity('legal_chat', `User sent message in ${context}`, { 
        context, 
        messageLength: userMessage.content.length,
        hasJurisdiction: !!currentJurisdiction,
        provider: providerStatus.activeProvider
      });

      // Check if message is a greeting first
      const greetingResult = processUserMessage(currentInput);
      
      if (greetingResult.isGreeting && shouldTriggerGreeting(currentInput)) {
        // Handle greeting with legal advisor response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: greetingResult.response!,
          timestamp: new Date(),
          isGreeting: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        await logActivity('legal_chat', `AI provided legal advisor greeting in ${context}`, { 
          context,
          greetingDetected: true,
          provider: providerStatus.activeProvider
        });
      } else if (isLegalQuery(currentInput)) {
        // Handle legal query with cloud AI
        const extractedJurisdiction = extractJurisdiction(currentInput) || currentJurisdiction;
        
        const legalQuery: LegalQuery = {
          message: currentInput,
          jurisdiction: extractedJurisdiction,
          context
        };

        // Validate query completeness
        const validation = validateLegalQuery(legalQuery);
        
        let responseContent: string;
        
        if (!validation.isValid && validation.clarifyingQuestions.length > 0) {
          // Generate clarifying questions
          responseContent = generateClarifyingQuestionsResponse(validation.clarifyingQuestions, currentInput);
        } else {
          // Generate structured legal response using cloud AI
          responseContent = await cloudAIService.generateLegalResponse(
            currentInput,
            extractedJurisdiction || 'General',
            context
          );
          
          // Update jurisdiction if extracted
          if (extractedJurisdiction && extractedJurisdiction !== currentJurisdiction) {
            setCurrentJurisdiction(extractedJurisdiction);
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          isLegalResponse: true,
          jurisdiction: extractedJurisdiction
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        await logActivity('legal_chat', `AI provided legal guidance in ${context}`, { 
          context,
          jurisdiction: extractedJurisdiction,
          responseLength: responseContent.length,
          provider: providerStatus.activeProvider
        });
      } else {
        // Handle general conversation using cloud AI
        const conversationHistory = messages.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await cloudAIService.generateChatResponse(
          currentInput,
          systemPrompt,
          conversationHistory
        );
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        await logActivity('legal_chat', `AI provided general response in ${context}`, { 
          context, 
          responseLength: response.length,
          provider: providerStatus.activeProvider
        });
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateClarifyingQuestionsResponse = (questions: string[], originalMessage: string): string => {
    return `To provide accurate legal guidance, I need additional information about your situation.

**Your Question**: ${originalMessage}

**Please provide the following details**:

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Why This Information Matters**: Legal advice must be specific to your jurisdiction and circumstances. Providing these details ensures I can give you accurate, relevant guidance with proper legal citations and next steps.

**Once you provide this information**, I can offer detailed guidance including:
• Applicable laws and statutes with citations
• Your legal rights and obligations  
• Practical next steps and deadlines
• Relevant government agencies and resources
• When to consult with a qualified attorney`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleRetry = () => {
    setError(null);
    checkProviderStatus();
  };

  const currentProvider = cloudAIService.getCurrentProvider();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
      {/* Enhanced Chat Header */}
      <div className="border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Legal Information Assistant</h3>
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
                <span className="text-sm font-medium text-red-700">
                  Setup Required
                </span>
              </div>
            )}
            {currentJurisdiction && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {currentJurisdiction}
                </span>
              </div>
            )}
            <button
              onClick={checkProviderStatus}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Refresh</span>
            </button>
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

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Scale className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">
              {providerStatus?.configured 
                ? 'Ask legal questions and get AI-powered guidance with proper citations'
                : 'Configure a cloud AI provider to get started with AI-powered legal assistance'
              }
            </p>
            <p className="text-xs text-slate-400">
              {providerStatus?.configured 
                ? `Powered by ${currentProvider?.name || 'Cloud AI'} - no local installation required`
                : 'Add API keys to .env file for instant legal assistance'
              }
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : message.isGreeting
                  ? 'bg-green-50 text-green-900 border border-green-200'
                  : message.isLegalResponse
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Scale className={`h-4 w-4 mt-1 flex-shrink-0 ${
                    message.isGreeting ? 'text-green-600' : 
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
                      : message.isGreeting
                      ? 'text-green-600'
                      : message.isLegalResponse
                      ? 'text-blue-600'
                      : 'text-slate-500'
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.isGreeting && (
                      <>
                        <span>•</span>
                        <span className="font-medium">Legal Advisor</span>
                      </>
                    )}
                    {message.isLegalResponse && (
                      <>
                        <span>•</span>
                        <span className="font-medium">AI Legal Information</span>
                      </>
                    )}
                    {message.jurisdiction && (
                      <>
                        <span>•</span>
                        <span>{message.jurisdiction}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Scale className="h-4 w-4" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-600">
                  {currentProvider ? `${currentProvider.name} is analyzing your legal question...` : 'Generating AI response...'}
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
                  onClick={handleRetry}
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
      <div className="border-t border-slate-200 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={providerStatus?.configured ? placeholder : "Configure a cloud AI provider to start asking legal questions..."}
              disabled={loading || !providerStatus?.configured}
              className="w-full min-w-[250px] resize-none border border-slate-300 rounded-lg px-3 py-2 
                         focus:ring-2 focus:ring-slate-500 focus:border-transparent 
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
              ? `Ask specific legal questions for detailed guidance powered by ${currentProvider?.name || 'Cloud AI'}`
              : 'Add API keys to .env file for instant AI-powered legal assistance'
            }
          </p>
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="hidden sm:inline">Press Enter to send</span>
            <span>{input.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}