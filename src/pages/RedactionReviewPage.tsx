import React, { useState } from 'react';
import { ArrowLeft, Shield, Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';

interface RedactionReviewPageProps {
  onBack: () => void;
  country: string;
}

export function RedactionReviewPage({ onBack, country }: RedactionReviewPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setError(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setError(null);
      }
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return false;
    }

    return true;
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Simulate redacted document analysis
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const mockAnalysis = `
## Redacted Document Analysis Report

**Document:** ${uploadedFile.name}
**Jurisdiction:** ${country}
**Analysis Date:** ${new Date().toLocaleDateString()}

### ⚠️ ANALYSIS LIMITATIONS

This analysis is based solely on visible content. Redacted sections may contain critical information that affects the overall assessment.

### Visible Content Analysis

#### Document Structure:
- **Total Pages:** 12
- **Redacted Sections:** 8 identified
- **Visible Content:** ~65%

#### Key Findings from Visible Content:

1. **Contract Type:** Service Agreement
2. **Parties:** [REDACTED] and ABC Corporation
3. **Term:** 24 months (visible)
4. **Payment Terms:** Monthly payments of [REDACTED]

### Risk Assessment: HIGH (Due to Limited Visibility)

#### Critical Gaps:
- **Financial Terms:** Payment amounts and penalties are redacted
- **Liability Clauses:** Key liability sections are not visible
- **Termination Conditions:** Termination triggers are redacted
- **Intellectual Property:** IP ownership terms are hidden

### Impact of Missing Information:

1. **Financial Risk:** Cannot assess payment obligations or penalties
2. **Legal Exposure:** Liability limitations are unknown
3. **Operational Risk:** Termination conditions are unclear
4. **Compliance Risk:** Regulatory requirements may be redacted

### Recommendations:

1. **Request Unredacted Version:** Essential for proper legal review
2. **Identify Critical Sections:** Ask specifically about:
   - Payment terms and penalties
   - Liability and indemnification
   - Termination procedures
   - Dispute resolution

3. **Professional Review:** Given the extensive redactions, professional legal counsel is strongly recommended

### Next Steps:
1. Obtain clarification on redacted financial terms
2. Request disclosure of liability provisions
3. Consult with qualified legal counsel
4. Consider risk mitigation strategies
      `;

      setAnalysisResult(mockAnalysis);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
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
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Redaction Review</h1>
                  <p className="text-sm text-slate-500">Analyze documents with redacted content</p>
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
        {/* Warning Banner */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-900">Redacted Document Analysis</h3>
              <p className="text-sm text-amber-700 mt-1">
                Our AI can analyze visible content in redacted documents while clearly noting analytical limitations. 
                Results will include impact assessments of missing information and recommendations for obtaining complete disclosure.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Redacted Document</h2>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Drop your redacted document here'}
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Supports PDF, DOC, DOCX formats up to 10MB
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              {uploadedFile && (
                <div className="mt-6">
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-amber-900">{uploadedFile.name}</p>
                        <p className="text-sm text-amber-700">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="w-full mt-4 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analyzing Redacted Document...</span>
                      </>
                    ) : (
                      <span>Analyze Redacted Document</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Analysis Scope */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Analysis Scope</h3>
              <div className="space-y-3">
                {[
                  { text: 'Visible content analysis only', icon: CheckCircle, color: 'text-green-500' },
                  { text: 'Impact assessment of missing info', icon: AlertTriangle, color: 'text-amber-500' },
                  { text: 'Risk evaluation with limitations', icon: Shield, color: 'text-blue-500' },
                  { text: 'Recommendations for clarification', icon: FileText, color: 'text-purple-500' }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={index} className="flex items-center">
                      <IconComponent className={`h-4 w-4 ${item.color} mr-3 flex-shrink-0`} />
                      <span className="text-slate-600 text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysisResult ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Analysis Results</h2>
                <div className="prose prose-slate max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                    {analysisResult}
                  </pre>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                    Download Report
                  </button>
                  <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                    Request Clarification
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Analysis Results</h2>
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Upload a redacted document to see analysis results with limitation notices
                  </p>
                </div>
              </div>
            )}

            {/* Chat Interface */}
            <ChatInterface
              context="redaction-review"
              placeholder="Ask questions about redacted document analysis..."
              systemPrompt={`You are a legal AI assistant specializing in redacted document analysis for ${country} jurisdiction. Help users understand the limitations of analyzing redacted documents and provide guidance on obtaining complete information for proper legal review.`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}