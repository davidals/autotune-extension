/**
 * Service for interacting with OpenAI's API
 */

import { EnhancementParams } from './enhancementParams.js';

export class OpenAIService {
  constructor(enhancementParams = new EnhancementParams()) {
    this.apiKey = null;
    this.model = 'gpt-3.5-turbo'; // Default to cheapest model
    this.validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
    this.enhancementParams = enhancementParams;
  }

  /**
   * Initialize the service by loading the API key
   */
  async initialize() {
    try {
      const { apiKey } = await chrome.storage.sync.get('apiKey');
      if (apiKey) {
        this.apiKey = apiKey;
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
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

  async setApiKey(apiKey) {
    try {
      this.apiKey = apiKey;
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
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
- Verbosity: ${params.verbosity}% (0: very concise, 100: very detailed)
- Formality: ${params.formality}% (0: very casual, 100: very formal)
- Tone: ${params.tone}% (0: very serious, 100: very friendly)
- Creativity: ${params.creativity}% (0: conservative, 100: creative)
- Persuasiveness: ${params.persuasiveness}% (0: neutral, 100: very persuasive)

Please enhance the text while maintaining its core meaning and structure.`;
  }

  /**
   * Enhance text using OpenAI API
   * @param {string} text - The text to enhance
   * @returns {Promise<string>} The enhanced text
   */
  async enhanceText(text) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this._generateSystemPrompt()
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to enhance text');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
} 