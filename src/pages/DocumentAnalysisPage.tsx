import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Loader2, Shield, AlertTriangle, Download, History, Trash2, FolderOpen, Server, RefreshCw, Play } from 'lucide-react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { ChatInterface } from '../components/chat/ChatInterface';
import { documentAnalysisService, DocumentAnalysisResult, BatchAnalysisResult } from '../services/documentAnalysis';
import { ReportExportService } from '../services/reportExport';

interface DocumentAnalysisPageProps {
  onBack: () => void;
  country: string;
}

export function DocumentAnalysisPage({ onBack, country }: DocumentAnalysisPageProps) {
  const { user } = useFirebaseAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'batch' | 'models'>('upload');
  const [analysisHistory, setAnalysisHistory] = useState<DocumentAnalysisResult[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchAnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<Array<{ name: string; description: string; size: string }>>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<string>('');

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadAnalysisHistory();
    } else if (activeTab === 'models') {
      loadModels();
    }
  }, [activeTab]);

  const checkConfiguration = async () => {
    try {
      const status = await documentAnalysisService.getConfigurationStatus();
      setConfigStatus(status);
      if (status.availableModels) {
        setAvailableModels(status.availableModels);
      }
      if (status.recommendedModels) {
        setRecommendedModels(status.recommendedModels);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setConfigStatus({
        configured: false,
        message: 'Failed to check Ollama configuration'
      });
    }
  };

  const loadModels = async () => {
    try {
      const models = await documentAnalysisService.getAvailableModels();
      setAvailableModels(models);
      const recommended = documentAnalysisService.getRecommendedModels();
      setRecommendedModels(recommended);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    setLoadingHistory(true);
    try {
      const [analyses, batches] = await Promise.all([
        documentAnalysisService.getAnalysisHistory(20),
        documentAnalysisService.getBatchAnalysisHistory(10)
      ]);
      setAnalysisHistory(analyses);
      setBatchHistory(batches);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress('Starting download...');
    
    try {
      await documentAnalysisService.pullModel(modelName, (progress) => {
        setPullProgress(progress);
      });
      
      setPullProgress('Download completed!');
      await loadModels();
      await checkConfiguration();
      
      setTimeout(() => {
        setPullingModel(null);
        setPullProgress('');
      }, 2000);
    } catch (error) {
      console.error('Error pulling model:', error);
      setError(`Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPullingModel(null);
      setPullProgress('');
    }
  };

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
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => validateFile(file));
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => validateFile(file));
      
      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        setError(null);
      }
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload TXT, PDF, DOC, or DOCX files only.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return false;
    }

    return true;
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    if (!configStatus?.configured) {
      setError(configStatus?.message || 'Ollama is not properly configured');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setBatchResult(null);

    try {
      if (uploadedFiles.length === 1) {
        // Single file analysis
        const file = uploadedFiles[0];
        const documentContent = await documentAnalysisService.extractTextFromFile(file);
        
        const result = await documentAnalysisService.analyzeDocument({
          content: documentContent,
          jurisdiction: country,
          analysisType: 'comprehensive',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

        setAnalysisResult(result);
      } else {
        // Batch analysis
        const result = await documentAnalysisService.batchAnalyzeDocuments(uploadedFiles, country);
        setBatchResult(result);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'json' | 'html', analysis: DocumentAnalysisResult) => {
    setExporting(true);
    try {
      switch (format) {
        case 'pdf':
          await ReportExportService.exportToPDF(analysis);
          break;
        case 'json':
          await ReportExportService.exportToJSON(analysis);
          break;
        case 'html':
          await ReportExportService.exportToHTML(analysis);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      const success = await documentAnalysisService.deleteAnalysis(id);
      if (success) {
        setAnalysisHistory(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
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
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Document Analysis</h1>
                  <p className="text-sm text-slate-500">Local AI-powered legal document review</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {configStatus?.configured ? (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Ollama Ready</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <Server className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Ollama Required</span>
                </div>
              )}
              <button
                onClick={checkConfiguration}
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Refresh</span>
              </button>
              <div className="text-sm text-slate-500">
                Jurisdiction: {country}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Warning */}
      {!configStatus?.configured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-amber-800 text-sm font-medium">
                  Ollama Setup Required
                </p>
                <p className="text-amber-700 text-xs">
                  {configStatus?.message || 'Ollama is not running or configured properly'}
                </p>
              </div>
            </div>
            <div className="text-amber-700 text-xs space-y-1">
              <p><strong>To get started:</strong></p>
              <p>1. Install Ollama: <code className="bg-amber-100 px-1 rounded">curl -fsSL https://ollama.ai/install.sh | sh</code></p>
              <p>2. Start Ollama: <code className="bg-amber-100 px-1 rounded">ollama serve</code></p>
              <p>3. Pull a model: <code className="bg-amber-100 px-1 rounded">ollama pull llama3.1:8b</code></p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'upload', label: 'Upload & Analyze', icon: Upload },
                { id: 'models', label: 'AI Models', icon: Server },
                { id: 'history', label: 'Analysis History', icon: History },
                { id: 'batch', label: 'Batch Analysis', icon: FolderOpen }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">AI Model Management</h2>
              
              {/* Current Status */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-2">Current Status</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Ollama URL:</strong> {import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'}</p>
                  <p><strong>Default Model:</strong> {import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      configStatus?.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {configStatus?.configured ? 'Connected' : 'Disconnected'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Available Models */}
              {availableModels.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-slate-900 mb-3">Installed Models</h3>
                  <div className="space-y-2">
                    {availableModels.map((model) => (
                      <div key={model} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-900">{model}</span>
                        </div>
                        <span className="text-sm text-green-700">Ready</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Models */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Recommended Models for Legal Analysis</h3>
                <div className="space-y-3">
                  {recommendedModels.map((model) => {
                    const isInstalled = availableModels.includes(model.name);
                    const isPulling = pullingModel === model.name;
                    
                    return (
                      <div key={model.name} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {isInstalled ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Server className="h-5 w-5 text-slate-400" />
                            )}
                            <div>
                              <h4 className="font-medium text-slate-900">{model.name}</h4>
                              <p className="text-sm text-slate-600">{model.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-slate-500">{model.size}</span>
                            {isInstalled ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Installed</span>
                            ) : isPulling ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-600">Downloading...</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePullModel(model.name)}
                                disabled={!configStatus?.configured}
                                className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                <Download className="h-3 w-3" />
                                <span>Install</span>
                              </button>
                            )}
                          </div>
                        </div>
                        {isPulling && pullProgress && (
                          <div className="mt-2 text-sm text-blue-600">
                            {pullProgress}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Setup Instructions */}
              {!configStatus?.configured && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>1. Install Ollama:</strong></p>
                    <code className="block bg-blue-100 p-2 rounded">curl -fsSL https://ollama.ai/install.sh | sh</code>
                    
                    <p><strong>2. Start Ollama service:</strong></p>
                    <code className="block bg-blue-100 p-2 rounded">ollama serve</code>
                    
                    <p><strong>3. Pull a recommended model:</strong></p>
                    <code className="block bg-blue-100 p-2 rounded">ollama pull llama3.1:8b</code>
                    
                    <p className="mt-3"><strong>Note:</strong> Ollama runs locally on your machine, ensuring complete privacy and no external API dependencies.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Documents</h2>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">
                    Drop your legal documents here or click to browse
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Supports TXT, PDF, DOC, DOCX formats up to 10MB each
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium text-slate-900">Uploaded Files ({uploadedFiles.length})</h3>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium text-green-900">{file.name}</p>
                            <p className="text-sm text-green-700">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || !configStatus?.configured}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>
                            {uploadedFiles.length === 1 ? 'Analyzing with Local AI...' : 'Processing Batch...'}
                          </span>
                        </>
                      ) : (
                        <span>
                          {uploadedFiles.length === 1 ? 'Analyze with Local AI' : `Analyze ${uploadedFiles.length} Documents`}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Analysis Features */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Local AI Features</h3>
                <div className="space-y-3">
                  {[
                    'Complete privacy - no data leaves your machine',
                    'No API costs or rate limits',
                    'PDF, DOC, DOCX, and TXT support',
                    'Comprehensive risk assessment',
                    'Legal compliance checking',
                    'Jurisdiction-specific analysis',
                    'Batch processing support',
                    'Export to PDF, HTML, JSON',
                    'Offline operation capability'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {analysisResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">Analysis Results</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExport('pdf', analysisResult)}
                        disabled={exporting}
                        className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport('html', analysisResult)}
                        disabled={exporting}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>HTML</span>
                      </button>
                      <button
                        onClick={() => handleExport('json', analysisResult)}
                        disabled={exporting}
                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className={`p-4 rounded-lg border mb-6 ${getRiskColor(analysisResult.riskAssessment.level)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Risk Assessment</h3>
                      <span className="font-bold">{analysisResult.riskAssessment.level}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm">Risk Score:</span>
                      <div className="flex-1 bg-white rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-current" 
                          style={{ width: `${analysisResult.riskAssessment.score * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{analysisResult.riskAssessment.score}/10</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {analysisResult.riskAssessment.factors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-slate-700">{analysisResult.summary}</p>
                  </div>

                  {/* Key Findings */}
                  {analysisResult.keyFindings.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Key Findings</h3>
                      <div className="space-y-3">
                        {analysisResult.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                            {getSeverityIcon(finding.severity)}
                            <div>
                              <h4 className="font-medium text-slate-900">{finding.category}</h4>
                              <p className="text-sm text-slate-600">{finding.finding}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Problematic Clauses */}
                  {analysisResult.problematicClauses.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Problematic Clauses</h3>
                      <div className="space-y-4">
                        {analysisResult.problematicClauses.map((clause, index) => (
                          <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <h4 className="font-medium text-red-900 mb-2">Issue Found</h4>
                            <p className="text-sm text-red-800 mb-2 italic">"{clause.clause}"</p>
                            <p className="text-sm text-red-700 mb-2"><strong>Problem:</strong> {clause.issue}</p>
                            <p className="text-sm text-red-700"><strong>Suggestion:</strong> {clause.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Legal Citations */}
                  {analysisResult.legalCitations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Legal Citations</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <ul className="space-y-1">
                          {analysisResult.legalCitations.map((citation, index) => (
                            <li key={index} className="text-sm text-blue-800">• {citation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {analysisResult.nextSteps.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
                      <ol className="space-y-2">
                        {analysisResult.nextSteps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="bg-slate-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-slate-700 text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : batchResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Batch Analysis Results</h2>
                  
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-sm">{batchResult.completedFiles}/{batchResult.totalFiles} files</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(batchResult.completedFiles / batchResult.totalFiles) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-700 mt-2">Status: {batchResult.status}</p>
                  </div>

                  {batchResult.results.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900">Analysis Results</h3>
                      {batchResult.results.map((result, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{result.documentInfo.fileName}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(result.riskAssessment.level)}`}>
                              {result.riskAssessment.level}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{result.summary}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setAnalysisResult(result)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleExport('pdf', result)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Export PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {batchResult.errors.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-red-900 mb-2">Errors</h3>
                      <div className="space-y-2">
                        {batchResult.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Analysis Results</h2>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">
                      Upload documents to see detailed analysis results here
                    </p>
                    {!configStatus?.configured && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 justify-center mb-2">
                          <Server className="h-5 w-5 text-yellow-600" />
                          <p className="text-yellow-800 text-sm font-medium">
                            Ollama Setup Required
                          </p>
                        </div>
                        <p className="text-yellow-700 text-sm">
                          {configStatus?.message || 'Please install and configure Ollama to use local AI analysis'}
                        </p>
                        <button
                          onClick={() => setActiveTab('models')}
                          className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          View Setup Instructions
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              <ChatInterface
                context="document-analysis"
                placeholder="Ask questions about your document analysis..."
                systemPrompt={`You are a legal AI assistant specializing in document analysis for ${country} jurisdiction. Help users understand their document analysis results and provide additional legal guidance.`}
                country={country}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Analysis History</h2>
            
            {loadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Loading history...</p>
              </div>
            ) : analysisHistory.length > 0 ? (
              <div className="space-y-4">
                {analysisHistory.map((analysis) => (
                  <div key={analysis.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{analysis.documentInfo.fileName}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(analysis.riskAssessment.level)}`}>
                          {analysis.riskAssessment.level}
                        </span>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id!)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{analysis.summary}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{new Date(analysis.documentInfo.analysisDate).toLocaleDateString()}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setAnalysisResult(analysis)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleExport('pdf', analysis)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No analysis history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}