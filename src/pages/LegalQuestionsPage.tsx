import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Clock, AlertCircle } from 'lucide-react';
import { JurisdictionLegalChat } from '../components/chat/JurisdictionLegalChat';

interface LegalQuestionsPageProps {
  onBack: () => void;
  country: string;
}

export function LegalQuestionsPage({ onBack, country }: LegalQuestionsPageProps) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(country || '');

  const commonQuestions = [
    "What are my rights as an employee regarding overtime pay?",
    "How do I properly terminate a contract?",
    "What should I include in a non-disclosure agreement?",
    "What are the requirements for forming an LLC?",
    "How long do I have to file a personal injury claim?",
    "What constitutes trademark infringement?"
  ];

  const handleQuestionSelect = (selectedQuestion: string) => {
    // This will be handled by the chat component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Main</span>
              </button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Legal Questions</h1>
                  <p className="text-sm text-slate-500">Get jurisdiction-specific legal guidance</p>
                </div>
              </div>
            </div>
            {selectedJurisdiction && (
              <div className="text-sm text-slate-500">
                Current: {selectedJurisdiction}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Question Suggestions Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Common Legal Questions</h2>
              <div className="space-y-2">
                {commonQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionSelect(q)}
                    className="w-full text-left p-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">What You'll Receive:</h3>
              <ul className="space-y-3">
                {[
                  'Jurisdiction-specific statutory references',
                  'Plain-language legal explanations',
                  'Practical next steps and action plans',
                  'Time-sensitive considerations and deadlines',
                  'Relevant case law examples',
                  'Risk assessment and warnings'
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Response Time Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Response Time</h4>
                  <p className="text-sm text-blue-700">
                    Typical response: 30-60 seconds with detailed, jurisdiction-specific analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
                  <p className="text-sm text-amber-700">
                    This service provides general legal information only and does not constitute legal advice. 
                    For specific legal matters, please consult with a qualified attorney in your jurisdiction.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <JurisdictionLegalChat
              initialJurisdiction={selectedJurisdiction}
              onJurisdictionChange={setSelectedJurisdiction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}