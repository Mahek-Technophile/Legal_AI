import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';

interface GeneralGuidancePageProps {
  onBack: () => void;
  country: string;
}

export function GeneralGuidancePage({ onBack, country }: GeneralGuidancePageProps) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const legalTopics = [
    {
      category: 'Business Law',
      topics: ['Contract Law', 'Business Formation', 'Intellectual Property', 'Employment Law', 'Corporate Governance']
    },
    {
      category: 'Personal Law',
      topics: ['Family Law', 'Real Estate Law', 'Consumer Rights', 'Personal Injury', 'Estate Planning']
    },
    {
      category: 'Regulatory',
      topics: ['Tax Law', 'Immigration Law', 'Environmental Law', 'Securities Law', 'Healthcare Law']
    },
    {
      category: 'Dispute Resolution',
      topics: ['Civil Litigation', 'Arbitration', 'Mediation', 'Appeals', 'Settlement Negotiations']
    }
  ];

  const filteredTopics = legalTopics.map(category => ({
    ...category,
    topics: category.topics.filter(topic =>
      topic.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.topics.length > 0);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic(`I need guidance on ${topic} in ${country}. Please provide comprehensive information including key principles, common issues, and practical considerations.`);
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
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">General Guidance</h1>
                  <p className="text-sm text-slate-500">Comprehensive legal information</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Jurisdiction: {country}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Topics Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Legal Topics</h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Topic Categories */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTopics.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="font-medium text-slate-900 mb-2">{category.category}</h3>
                    <div className="space-y-1">
                      {category.topics.map((topic, topicIndex) => (
                        <button
                          key={topicIndex}
                          onClick={() => handleTopicSelect(topic)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedTopic === topic
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Inquiry */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Custom Inquiry</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="custom-topic" className="block text-sm font-medium text-slate-700 mb-2">
                    Legal Topic or Area
                  </label>
                  <input
                    type="text"
                    id="custom-topic"
                    placeholder="Enter your legal topic..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="custom-description" className="block text-sm font-medium text-slate-700 mb-2">
                    Specific Guidance Needed
                  </label>
                  <textarea
                    id="custom-description"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Describe what specific guidance you're looking for..."
                    className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Guidance Features */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">What You'll Get</h3>
              <ul className="space-y-3">
                {[
                  'Plain language explanations',
                  'Step-by-step action plans',
                  'Relevant legal resources',
                  'Compliance checklists',
                  'Risk considerations',
                  'Best practices'
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface
              context="general-guidance"
              placeholder="Ask for legal guidance on any topic..."
              initialMessage={customTopic}
              systemPrompt={`You are a comprehensive legal AI assistant for ${country} jurisdiction. Provide detailed guidance on legal topics with clear explanations, practical steps, compliance requirements, and relevant resources. Structure your responses with clear headings and actionable advice.`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}