import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ollamaService } from './ollamaService';

// Set up PDF.js worker using local import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface DocumentAnalysisResult {
  id?: string;
  summary: string;
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    factors: string[];
  };
  keyFindings: {
    category: string;
    finding: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  recommendations: string[];
  missingClauses: string[];
  problematicClauses: {
    clause: string;
    issue: string;
    suggestion: string;
  }[];
  legalCitations: string[];
  nextSteps: string[];
  documentInfo: {
    fileName: string;
    fileSize: number;
    fileType: string;
    jurisdiction: string;
    analysisDate: string;
  };
}

export interface DocumentAnalysisRequest {
  content: string;
  documentType?: string;
  jurisdiction: string;
  analysisType: 'comprehensive' | 'risk-only' | 'compliance';
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface BatchAnalysisResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  results: DocumentAnalysisResult[];
  errors: string[];
  createdAt: string;
}

class DocumentAnalysisService {
  constructor() {
    console.log('Document Analysis Service initialized with Ollama');
  }

  async isConfigured(): Promise<boolean> {
    return await ollamaService.isAvailable();
  }

  async getConfigurationStatus(): Promise<{ 
    configured: boolean; 
    message: string; 
    availableModels?: string[];
    recommendedModels?: Array<{ name: string; description: string; size: string }>;
  }> {
    const isAvailable = await ollamaService.isAvailable();
    
    if (!isAvailable) {
      return {
        configured: false,
        message: 'Ollama is not running. Please start Ollama service on your local machine.',
        recommendedModels: ollamaService.getRecommendedModels()
      };
    }

    try {
      const models = await ollamaService.getModels();
      const modelNames = models.map(m => m.name);
      
      if (modelNames.length === 0) {
        return {
          configured: false,
          message: 'Ollama is running but no models are installed. Please pull a model first.',
          availableModels: [],
          recommendedModels: ollamaService.getRecommendedModels()
        };
      }

      const defaultModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b';
      const hasDefaultModel = await ollamaService.isModelAvailable(defaultModel);

      if (!hasDefaultModel) {
        return {
          configured: false,
          message: `Default model '${defaultModel}' is not available. Available models: ${modelNames.join(', ')}`,
          availableModels: modelNames,
          recommendedModels: ollamaService.getRecommendedModels()
        };
      }

      return {
        configured: true,
        message: `Ollama is ready with ${modelNames.length} model(s). Using: ${defaultModel}`,
        availableModels: modelNames
      };
    } catch (error) {
      return {
        configured: false,
        message: `Error checking Ollama configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendedModels: ollamaService.getRecommendedModels()
      };
    }
  }

  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const configStatus = await this.getConfigurationStatus();
    if (!configStatus.configured) {
      throw new Error(configStatus.message);
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      const systemPrompt = this.buildSystemPrompt(request.jurisdiction);
      
      const response = await ollamaService.generate(prompt, {
        system: systemPrompt,
        temperature: 0.1,
        max_tokens: 4000
      });

      let result: DocumentAnalysisResult;
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(response.response);
        result = {
          ...parsed,
          documentInfo: {
            fileName: request.fileName,
            fileSize: request.fileSize,
            fileType: request.fileType,
            jurisdiction: request.jurisdiction,
            analysisDate: new Date().toISOString()
          }
        };
      } catch (parseError) {
        // Fallback to text parsing if JSON parsing fails
        result = this.parseTextResponse(response.response, request);
      }

      // Save to database
      const savedResult = await this.saveAnalysisResult(result);
      return savedResult;

    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchAnalyzeDocuments(files: File[], jurisdiction: string): Promise<BatchAnalysisResult> {
    const configStatus = await this.getConfigurationStatus();
    if (!configStatus.configured) {
      throw new Error(configStatus.message);
    }

    const batchId = crypto.randomUUID();
    const batchResult: BatchAnalysisResult = {
      id: batchId,
      status: 'pending',
      totalFiles: files.length,
      completedFiles: 0,
      results: [],
      errors: [],
      createdAt: new Date().toISOString()
    };

    // Save initial batch record
    await this.saveBatchResult(batchResult);

    // Process files sequentially
    batchResult.status = 'processing';
    await this.saveBatchResult(batchResult);

    for (const file of files) {
      try {
        const content = await this.extractTextFromFile(file);
        
        // Truncate content if too long
        const truncatedContent = content.length > 12000 ? content.substring(0, 12000) + '...' : content;
        
        const request: DocumentAnalysisRequest = {
          content: truncatedContent,
          jurisdiction,
          analysisType: 'comprehensive',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        };

        const result = await this.analyzeDocument(request);
        batchResult.results.push(result);
        batchResult.completedFiles++;
        
        // Small delay between requests to prevent overwhelming the local model
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        batchResult.errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Update progress
      await this.saveBatchResult(batchResult);
    }

    batchResult.status = 'completed';
    await this.saveBatchResult(batchResult);

    return batchResult;
  }

  private buildSystemPrompt(jurisdiction: string): string {
    return `You are a legal document analysis expert specializing in ${jurisdiction} law. 

Your task is to analyze legal documents and provide comprehensive, structured analysis with specific legal citations and practical recommendations.

CRITICAL: You must respond with valid JSON format only. Do not include any text before or after the JSON object.

The JSON structure must be:
{
  "summary": "Brief overview of the document and main purpose",
  "riskAssessment": {
    "level": "LOW or MEDIUM or HIGH or CRITICAL",
    "score": 1-10,
    "factors": ["list of specific risk factors found"]
  },
  "keyFindings": [
    {
      "category": "Contract Terms",
      "finding": "specific finding description",
      "severity": "info or warning or critical"
    }
  ],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "missingClauses": ["missing protective clause 1", "missing clause 2"],
  "problematicClauses": [
    {
      "clause": "exact problematic text",
      "issue": "what is wrong",
      "suggestion": "how to fix it"
    }
  ],
  "legalCitations": ["relevant law or statute for ${jurisdiction}"],
  "nextSteps": ["immediate action 1", "follow-up action 2"]
}

Focus on:
- Contract enforceability under ${jurisdiction} law
- Risk exposure and liability issues
- Missing protective clauses
- Ambiguous terms that could cause disputes
- Compliance with ${jurisdiction} regulations

Provide specific, actionable insights based on ${jurisdiction} legal framework.`;
  }

  private buildAnalysisPrompt(request: DocumentAnalysisRequest): string {
    return `Analyze this legal document for ${request.jurisdiction} jurisdiction:

Document Type: ${request.documentType || 'Legal Document'}
Analysis Type: ${request.analysisType}
File: ${request.fileName}

Document Content:
${request.content}

Provide a comprehensive legal analysis focusing on:
1. Risk assessment and scoring (1-10 scale)
2. Key findings with severity levels
3. Specific problematic clauses with exact text
4. Missing protective clauses
5. Actionable recommendations
6. Relevant legal citations for ${request.jurisdiction}
7. Immediate next steps

Remember to respond with valid JSON only.`;
  }

  private parseTextResponse(text: string, request: DocumentAnalysisRequest): DocumentAnalysisResult {
    // Enhanced fallback parsing for non-JSON responses
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to extract structured information from text
    let summary = 'Document analysis completed using local AI model.';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    let riskScore = 5;
    const recommendations: string[] = [];
    const keyFindings: any[] = [];
    
    // Look for risk indicators in the text
    const riskKeywords = {
      'CRITICAL': ['critical', 'severe', 'major risk', 'high risk', 'dangerous'],
      'HIGH': ['high', 'significant', 'important', 'concerning'],
      'LOW': ['low', 'minor', 'minimal', 'acceptable']
    };
    
    const lowerText = text.toLowerCase();
    for (const [level, keywords] of Object.entries(riskKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        riskLevel = level as any;
        break;
      }
    }
    
    // Extract recommendations (look for numbered lists or bullet points)
    const recPattern = /(?:recommendation|suggest|should|must|need to)[\s\S]*?(?:\n|$)/gi;
    const recMatches = text.match(recPattern);
    if (recMatches) {
      recommendations.push(...recMatches.slice(0, 5).map(match => match.trim()));
    }
    
    // Try to find a summary in the first few lines
    if (lines.length > 0) {
      summary = lines.slice(0, 3).join(' ').substring(0, 300);
    }

    return {
      summary,
      riskAssessment: {
        level: riskLevel,
        score: riskScore,
        factors: ['Analysis completed with local AI model', 'Manual review recommended for detailed assessment']
      },
      keyFindings: [
        {
          category: 'AI Analysis',
          finding: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
          severity: 'info'
        }
      ],
      recommendations: recommendations.length > 0 ? recommendations : ['Review the full analysis text', 'Consult with legal counsel for detailed review'],
      missingClauses: [],
      problematicClauses: [],
      legalCitations: [`${request.jurisdiction} applicable law`],
      nextSteps: ['Review full analysis text', 'Consult legal professional if needed'],
      documentInfo: {
        fileName: request.fileName,
        fileSize: request.fileSize,
        fileType: request.fileType,
        jurisdiction: request.jurisdiction,
        analysisDate: new Date().toISOString()
      }
    };
  }

  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    
    if (fileType === 'text/plain') {
      return this.extractTextFromTxt(file);
    } else if (fileType === 'application/pdf') {
      return this.extractTextFromPdf(file);
    } else if (fileType === 'application/msword' || 
               fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.extractTextFromDoc(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private async extractTextFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }
          
          if (!fullText.trim()) {
            throw new Error('No text content found in PDF. The PDF might be image-based or corrupted.');
          }
          
          resolve(fullText);
        } catch (error) {
          reject(new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async extractTextFromDoc(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          
          if (!result.value.trim()) {
            throw new Error('No text content found in document.');
          }
          
          resolve(result.value);
        } catch (error) {
          reject(new Error(`Failed to extract text from document: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read document file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async saveAnalysisResult(result: DocumentAnalysisResult): Promise<DocumentAnalysisResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, skipping database save');
        return result;
      }

      const { data, error } = await supabase
        .from('document_analyses')
        .insert({
          user_id: user.id,
          file_name: result.documentInfo.fileName,
          file_type: result.documentInfo.fileType,
          file_size: result.documentInfo.fileSize,
          jurisdiction: result.documentInfo.jurisdiction,
          analysis_result: result,
          risk_level: result.riskAssessment.level,
          risk_score: result.riskAssessment.score
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save analysis result:', error);
        return result;
      }

      return { ...result, id: data.id };
    } catch (error) {
      console.error('Error saving analysis result:', error);
      return result;
    }
  }

  private async saveBatchResult(batchResult: BatchAnalysisResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('batch_analyses')
        .upsert({
          id: batchResult.id,
          user_id: user.id,
          status: batchResult.status,
          total_files: batchResult.totalFiles,
          completed_files: batchResult.completedFiles,
          results: batchResult.results,
          errors: batchResult.errors,
          created_at: batchResult.createdAt,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving batch result:', error);
    }
  }

  async getAnalysisHistory(limit = 10): Promise<DocumentAnalysisResult[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(item => ({
        ...item.analysis_result,
        id: item.id
      }));
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  async getBatchAnalysisHistory(limit = 10): Promise<BatchAnalysisResult[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('batch_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching batch analysis history:', error);
      return [];
    }
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('document_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }
  }

  // Model management methods
  async pullModel(modelName: string, onProgress?: (progress: string) => void): Promise<void> {
    return ollamaService.pullModel(modelName, onProgress);
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await ollamaService.getModels();
      return models.map(m => m.name);
    } catch (error) {
      return [];
    }
  }

  getRecommendedModels(): Array<{ name: string; description: string; size: string }> {
    return ollamaService.getRecommendedModels();
  }
}

export const documentAnalysisService = new DocumentAnalysisService();