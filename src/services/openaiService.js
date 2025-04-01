/**
 * Service for interacting with OpenAI's API
 */

import { EnhancementParams } from './enhancementParams.js';

export class OpenAIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.model = 'gpt-3.5-turbo'; // Default to cheapest model
    this.validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
    this.enhancementParams = new EnhancementParams();
  }

  /**
   * Initialize the service by loading the API key
   */
  async initialize() {
    try {
      const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
      if (openaiApiKey) {
        this.apiKey = openaiApiKey;
        return true;
      }
      return false;
    } catch (error) {
      console.error('autotune.services.openai: Failed to load API key:', error);
      return false;
    }
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Check if the service has a valid API key
   */
  hasValidApiKey() {
    return !!this.apiKey;
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get('openaiApiKey');
      this.apiKey = result?.openaiApiKey || null;
    } catch (error) {
      throw new Error('Storage error');
    }
  }

  async loadModel() {
    try {
      const result = await chrome.storage.sync.get('openaiModel');
      if (result?.openaiModel && this.validModels.includes(result.openaiModel)) {
        this.model = result.openaiModel;
      }
    } catch (error) {
      throw new Error('Storage error');
    }
  }

  async setModel(model) {
    if (!this.validModels.includes(model)) {
      throw new Error('Invalid model name');
    }
    try {
      this.model = model;
      await chrome.storage.sync.set({ openaiModel: model });
    } catch (error) {
      throw new Error('Storage error');
    }
  }

  async getApiKey() {
    return this.apiKey;
  }

  async getModel() {
    return this.model;
  }

  /**
   * Generate the system prompt with enhancement parameters
   * @returns {string} The system prompt
   */
  _generateSystemPrompt() {
    const params = this.enhancementParams.getPromptParameters();
    
    return `You are a professional writing assistant. Enhance the provided text according to these parameters:

- Verbosity (${params.verbosity}):
  * 0: Extremely concise, using minimal words to convey meaning
  * 100: Thoroughly detailed, including comprehensive explanations and examples

- Formality (${params.formality}):
  * 0: Very casual, using everyday language, contractions, and informal expressions
  * 100: Highly formal, using sophisticated vocabulary and proper grammar structures

- Tone (${params.tone}):
  * 0: Serious and professional, maintaining a business-like demeanor
  * 100: Friendly and approachable, using warm and engaging language

- Complexity (${params.complexity}):
  * 0: Simple and straightforward, using basic vocabulary and clear sentence structures
  * 100: Sophisticated and nuanced, using advanced vocabulary and complex sentence patterns

- Persuasiveness (${params.persuasiveness}):
  * 0: Informative and neutral, focusing on presenting facts objectively
  * 100: Convincing and compelling, using persuasive techniques and emotional appeal

Please enhance the text while maintaining its core meaning and ensuring it reads naturally.`;
  }

  /**
   * Enhance text using OpenAI's API
   * @param {string} text The text to enhance
   * @param {Object} params Enhancement parameters
   * @returns {Promise<string>} The enhanced text
   */
  async enhanceText(text, params) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    // Set each parameter individually
    if (params.verbosity !== undefined) this.enhancementParams.setVerbosity(params.verbosity);
    if (params.formality !== undefined) this.enhancementParams.setFormality(params.formality);
    if (params.tone !== undefined) this.enhancementParams.setTone(params.tone);
    if (params.complexity !== undefined) this.enhancementParams.setComplexity(params.complexity);
    if (params.persuasiveness !== undefined) this.enhancementParams.setPersuasiveness(params.persuasiveness);

    const systemPrompt = this._generateSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ];

    console.log('autotune.services.openai: Making API request:', {
      model: this.model,
      parameters: params,
      textLength: text.length
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('autotune.services.openai: API request failed:', error);
        throw new Error(`API request failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('autotune.services.openai: API request error:', error);
      throw error;
    }
  }
} 