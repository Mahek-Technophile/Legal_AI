/**
 * Ollama Service for Local AI Model Integration
 * Provides interface to local Ollama models for all chat interfaces
 */

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
  }

  /**
   * Check if Ollama is running and accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('Ollama connection timeout - service may not be running');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          console.warn('Ollama service not accessible - please ensure Ollama is running on', this.baseUrl);
        } else {
          console.warn('Ollama availability check failed:', error.message);
        }
      } else {
        console.warn('Ollama availability check failed with unknown error');
      }
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<OllamaModel[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Ollama may be slow to respond');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Ollama - please ensure it is running');
        }
      }
      throw new Error('Failed to fetch available models from Ollama');
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some(model => 
        model.name === modelName || 
        model.name.startsWith(modelName) ||
        model.name === `${modelName}:latest`
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Pull/download a model
   */
  async pullModel(modelName: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status && onProgress) {
              onProgress(data.status);
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to Ollama to download ${modelName}. Please ensure Ollama is running.`);
      }
      throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate completion using Ollama
   */
  async generate(
    prompt: string,
    options: {
      model?: string;
      system?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OllamaResponse> {
    const model = options.model || this.defaultModel;
    
    try {
      const requestBody = {
        model,
        prompt,
        system: options.system,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 2000,
        },
        stream: false
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for generation

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating completion:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - AI model may be slow to respond');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Ollama - please ensure it is running');
        }
      }
      throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate streaming completion
   */
  async generateStream(
    prompt: string,
    onChunk: (chunk: OllamaStreamResponse) => void,
    options: {
      model?: string;
      system?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<void> {
    const model = options.model || this.defaultModel;
    
    try {
      const requestBody = {
        model,
        prompt,
        system: options.system,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 2000,
        },
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onChunk(data);
            if (data.done) return;
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error('Error generating streaming completion:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Ollama - please ensure it is running');
      }
      throw new Error(`Failed to generate streaming completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat completion (for conversation-style interactions)
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<OllamaResponse> {
    const model = options.model || this.defaultModel;
    
    try {
      const requestBody = {
        model,
        messages,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 2000,
        },
        stream: false
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in chat completion:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - AI model may be slow to respond');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Ollama - please ensure it is running');
        }
      }
      throw new Error(`Failed to complete chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get configuration status
   */
  async getConfigurationStatus(): Promise<{ 
    configured: boolean; 
    message: string; 
    baseUrl: string; 
    model: string;
    availableModels?: string[];
    connectionError?: boolean;
  }> {
    const isAvailable = await this.isAvailable();
    
    if (!isAvailable) {
      return {
        configured: false,
        message: `Ollama is not running or not accessible. Please start Ollama with "ollama serve" and ensure it's running on ${this.baseUrl}`,
        baseUrl: this.baseUrl,
        model: this.defaultModel,
        connectionError: true
      };
    }

    try {
      const models = await this.getModels();
      const modelNames = models.map(m => m.name);
      
      if (modelNames.length === 0) {
        return {
          configured: false,
          message: 'Ollama is running but no models are installed. Please install a model with "ollama pull llama3.2"',
          baseUrl: this.baseUrl,
          model: this.defaultModel,
          availableModels: []
        };
      }

      const hasDefaultModel = await this.isModelAvailable(this.defaultModel);

      if (!hasDefaultModel) {
        return {
          configured: false,
          message: `Model '${this.defaultModel}' is not available. Available models: ${modelNames.join(', ')}. Install with "ollama pull ${this.defaultModel}"`,
          baseUrl: this.baseUrl,
          model: this.defaultModel,
          availableModels: modelNames
        };
      }

      return {
        configured: true,
        message: `Ollama is ready with ${modelNames.length} model(s). Using: ${this.defaultModel}`,
        baseUrl: this.baseUrl,
        model: this.defaultModel,
        availableModels: modelNames
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        configured: false,
        message: `Error checking Ollama configuration: ${errorMessage}`,
        baseUrl: this.baseUrl,
        model: this.defaultModel,
        connectionError: errorMessage.includes('connect') || errorMessage.includes('fetch')
      };
    }
  }

  /**
   * Get recommended models for legal analysis
   */
  getRecommendedModels(): Array<{ name: string; description: string; size: string }> {
    return [
      {
        name: 'llama3.2',
        description: 'Meta Llama 3.2 - Latest model with improved reasoning and legal knowledge',
        size: '2.0GB'
      },
      {
        name: 'llama3.2:3b',
        description: 'Meta Llama 3.2 3B - Compact version for faster responses',
        size: '2.0GB'
      },
      {
        name: 'llama3.1:8b',
        description: 'Meta Llama 3.1 8B - Good balance of performance and speed',
        size: '4.7GB'
      },
      {
        name: 'llama3.1:70b',
        description: 'Meta Llama 3.1 70B - Highest quality, requires more resources',
        size: '40GB'
      },
      {
        name: 'mistral:7b',
        description: 'Mistral 7B - Fast and efficient for legal analysis',
        size: '4.1GB'
      },
      {
        name: 'phi3:14b',
        description: 'Microsoft Phi-3 14B - Optimized for reasoning tasks',
        size: '7.9GB'
      }
    ];
  }

  /**
   * Generate legal response using Ollama
   */
  async generateLegalResponse(
    question: string,
    jurisdiction: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are a legal information assistant specializing in ${jurisdiction} law. 

Provide comprehensive legal guidance that includes:
1. **Statutory References** - Cite relevant laws and acts from ${jurisdiction}
2. **Case Law Examples** - Share illustrative legal examples when applicable
3. **Action Plan** - Suggest practical, safe next steps
4. **Urgency Alerts** - Mention if urgent action is typically required

Format your response with clear headings and bullet points. Always include a disclaimer that this is general information only and not legal advice.

Context: ${context || 'General legal inquiry'}
Jurisdiction: ${jurisdiction}`;

    const prompt = `User's legal question: ${question}

Please provide detailed legal guidance specific to ${jurisdiction} law.`;

    try {
      const response = await this.generate(prompt, {
        system: systemPrompt,
        temperature: 0.3,
        max_tokens: 2000
      });

      return response.response;
    } catch (error) {
      throw new Error(`Failed to generate legal response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate general chat response using Ollama
   */
  async generateChatResponse(
    message: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      // Use chat endpoint for conversation context
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user' as const, content: message }
      ];

      const response = await this.chat(messages, {
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.response;
    } catch (error) {
      throw new Error(`Failed to generate chat response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const ollamaService = new OllamaService();