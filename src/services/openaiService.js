/**
 * Service for interacting with OpenAI's API
 */

export class OpenAIService {
  constructor() {
    this.apiKey = null;
    this.model = 'gpt-3.5-turbo'; // Default to cheapest model
    this.validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
    this.loadApiKey(); // Load API key on initialization
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
   * Enhances text using OpenAI's GPT model
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
            content: 'You are a helpful assistant that improves the tone and clarity of text while maintaining its meaning. Make the text more professional, friendly, and engaging.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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