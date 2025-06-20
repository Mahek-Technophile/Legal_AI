/**
 * Cloud AI Service for Legal Questions
 * Supports multiple cloud AI providers with free tiers
 */

export interface CloudAIProvider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  headers: Record<string, string>;
  requestFormat: 'openai' | 'custom';
}

export interface CloudAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LegalResponse {
  response: string;
  jurisdiction?: string;
  citations?: string[];
  nextSteps?: string[];
  deadlines?: string[];
  agencies?: string[];
}

class CloudAIService {
  private providers: Record<string, CloudAIProvider> = {};
  private activeProvider: string;

  constructor() {
    this.initializeProviders();
    this.activeProvider = this.selectActiveProvider();
  }

  private initializeProviders() {
    // OpenAI Configuration
    if (import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key') {
      this.providers.openai = {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        requestFormat: 'openai'
      };
    }

    // DeepSeek Configuration (DISABLED - insufficient balance)
    // if (import.meta.env.VITE_DEEPSEEK_API_KEY && import.meta.env.VITE_DEEPSEEK_API_KEY !== 'your_deepseek_api_key') {
    //   this.providers.deepseek = {
    //     name: 'DeepSeek',
    //     baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    //     model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
    //     apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    //     headers: {
    //       'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
    //       'Content-Type': 'application/json'
    //     },
    //     requestFormat: 'openai'
    //   };
    // }

    // Groq Configuration (Free tier available) - PRIMARY PROVIDER
    if (import.meta.env.VITE_GROQ_API_KEY && import.meta.env.VITE_GROQ_API_KEY !== 'your_groq_api_key') {
      this.providers.groq = {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant',
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        requestFormat: 'openai'
      };
    }

    // Together AI Configuration (Free tier available)
    if (import.meta.env.VITE_TOGETHER_API_KEY && import.meta.env.VITE_TOGETHER_API_KEY !== 'your_together_api_key') {
      this.providers.together = {
        name: 'Together AI',
        baseUrl: 'https://api.together.xyz/v1',
        model: import.meta.env.VITE_TOGETHER_MODEL || 'meta-llama/Llama-3-8b-chat-hf',
        apiKey: import.meta.env.VITE_TOGETHER_API_KEY,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        requestFormat: 'openai'
      };
    }

    // Hugging Face Configuration (Free tier available)
    if (import.meta.env.VITE_HUGGINGFACE_API_KEY && import.meta.env.VITE_HUGGINGFACE_API_KEY !== 'your_huggingface_api_key') {
      this.providers.huggingface = {
        name: 'Hugging Face',
        baseUrl: 'https://api-inference.huggingface.co/models',
        model: import.meta.env.VITE_HUGGINGFACE_MODEL || 'microsoft/DialoGPT-large',
        apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        requestFormat: 'custom'
      };
    }
  }

  private selectActiveProvider(): string {
    // Use environment variable preference if set
    const preferredProvider = import.meta.env.VITE_AI_PROVIDER;
    if (preferredProvider && this.providers[preferredProvider]) {
      return preferredProvider;
    }

    // Fallback order: prioritize Groq as primary, then other free tiers
    const fallbackOrder = ['groq', 'together', 'huggingface', 'openai'];
    
    for (const provider of fallbackOrder) {
      if (this.providers[provider]) {
        return provider;
      }
    }

    return '';
  }

  /**
   * Check if any cloud AI provider is configured
   */
  isConfigured(): boolean {
    return Object.keys(this.providers).length > 0 && this.activeProvider !== '';
  }

  /**
   * Get provider status information
   */
  getProviderStatus(): {
    configured: boolean;
    activeProvider?: string;
    availableProviders: string[];
    message: string;
  } {
    const availableProviders = Object.keys(this.providers);
    
    if (!this.isConfigured()) {
      return {
        configured: false,
        availableProviders: [],
        message: 'No cloud AI providers configured. Please add API keys to your .env file for Groq, OpenAI, Together AI, or Hugging Face.'
      };
    }

    const provider = this.providers[this.activeProvider];
    return {
      configured: true,
      activeProvider: this.activeProvider,
      availableProviders,
      message: `Using ${provider.name} (${provider.model}) for AI-powered legal assistance.`
    };
  }

  /**
   * Generate legal response with jurisdiction-specific guidance
   */
  async generateLegalResponse(
    question: string,
    jurisdiction: string,
    context?: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('No cloud AI provider configured. Please add API keys to your .env file.');
    }

    const systemPrompt = this.buildLegalSystemPrompt(jurisdiction, context);
    const userPrompt = this.buildLegalUserPrompt(question, jurisdiction);

    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.3,
        max_tokens: 2000
      });

      return response.content;
    } catch (error) {
      console.error('Legal response generation error:', error);
      throw new Error(`Failed to generate legal response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate general chat response
   */
  async generateChatResponse(
    message: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('No cloud AI provider configured. Please add API keys to your .env file.');
    }

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user' as const, content: message }
      ];

      const response = await this.generateCompletion(messages, {
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.content;
    } catch (error) {
      console.error('Chat response generation error:', error);
      throw new Error(`Failed to generate chat response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Core completion generation method
   */
  private async generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<CloudAIResponse> {
    const provider = this.providers[this.activeProvider];
    
    if (provider.requestFormat === 'openai') {
      return this.generateOpenAICompletion(provider, messages, options);
    } else {
      return this.generateCustomCompletion(provider, messages, options);
    }
  }

  /**
   * Generate completion using OpenAI-compatible API
   */
  private async generateOpenAICompletion(
    provider: CloudAIProvider,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { temperature?: number; max_tokens?: number }
  ): Promise<CloudAIResponse> {
    const requestBody = {
      model: provider.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1500,
      stream: false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`Invalid response format from ${provider.name}`);
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`${provider.name} request timeout - please try again`);
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to ${provider.name} - please check your internet connection`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate completion using custom API format (e.g., Hugging Face)
   */
  private async generateCustomCompletion(
    provider: CloudAIProvider,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { temperature?: number; max_tokens?: number }
  ): Promise<CloudAIResponse> {
    // For Hugging Face and other custom formats
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const requestBody = {
      inputs: prompt,
      parameters: {
        temperature: options.temperature || 0.7,
        max_new_tokens: options.max_tokens || 1500,
        return_full_text: false
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${provider.baseUrl}/${provider.model}`, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      let content = '';
      if (Array.isArray(data) && data[0] && data[0].generated_text) {
        content = data[0].generated_text;
      } else if (data.generated_text) {
        content = data.generated_text;
      } else {
        throw new Error(`Invalid response format from ${provider.name}`);
      }

      return { content };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`${provider.name} request timeout - please try again`);
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to ${provider.name} - please check your internet connection`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Build system prompt for legal responses
   */
  private buildLegalSystemPrompt(jurisdiction: string, context?: string): string {
    return `You are a legal information assistant specializing in ${jurisdiction} law. 

Provide comprehensive legal guidance that includes:

**Response Structure:**
1. **Legal Framework** - Cite relevant laws, statutes, and regulations from ${jurisdiction}
2. **Key Rights & Obligations** - Explain what the law says about the situation
3. **Practical Steps** - Provide actionable next steps
4. **Important Deadlines** - Mention any time-sensitive requirements
5. **Professional Guidance** - When to consult with a qualified attorney

**Formatting Guidelines:**
- Use clear headings with **bold text**
- Include bullet points for lists
- Cite specific statutes and regulations where applicable
- Provide practical, actionable advice

**Context:** ${context || 'General legal inquiry'}
**Jurisdiction:** ${jurisdiction}

**Important:** Always include a disclaimer that this is general legal information only and not legal advice. For specific legal matters, recommend consulting with a qualified attorney in ${jurisdiction}.`;
  }

  /**
   * Build user prompt for legal questions
   */
  private buildLegalUserPrompt(question: string, jurisdiction: string): string {
    return `Legal Question for ${jurisdiction}:

${question}

Please provide detailed legal guidance specific to ${jurisdiction} law, including relevant statutes, practical next steps, and when professional legal counsel should be sought.`;
  }

  /**
   * Get available providers for UI display
   */
  getAvailableProviders(): Array<{ id: string; name: string; model: string; configured: boolean }> {
    const allProviders = [
      { id: 'groq', name: 'Groq', defaultModel: 'llama-3.1-8b-instant' },
      { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o-mini' },
      { id: 'together', name: 'Together AI', defaultModel: 'meta-llama/Llama-3-8b-chat-hf' },
      { id: 'huggingface', name: 'Hugging Face', defaultModel: 'microsoft/DialoGPT-large' }
      // DeepSeek removed from available providers list
    ];

    return allProviders.map(provider => ({
      id: provider.id,
      name: provider.name,
      model: this.providers[provider.id]?.model || provider.defaultModel,
      configured: !!this.providers[provider.id]
    }));
  }

  /**
   * Switch active provider
   */
  switchProvider(providerId: string): boolean {
    if (this.providers[providerId]) {
      this.activeProvider = providerId;
      return true;
    }
    return false;
  }

  /**
   * Get current provider info
   */
  getCurrentProvider(): { id: string; name: string; model: string } | null {
    if (!this.activeProvider || !this.providers[this.activeProvider]) {
      return null;
    }

    const provider = this.providers[this.activeProvider];
    return {
      id: this.activeProvider,
      name: provider.name,
      model: provider.model
    };
  }
}

export const cloudAIService = new CloudAIService();