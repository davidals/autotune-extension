import { OpenAIService } from '../services/openaiService.js';
import { TextFormatter } from '../utils/textFormatter.js';

class PopupManager {
  constructor() {
    this.textContainer = document.getElementById('text-container');
    this.actionButton = document.getElementById('action-button');
    this.originalText = '';
    this.enhancedText = '';
    this.currentState = 'original';
    this.openaiService = null;
  }

  async initialize() {
    // Get API key from storage
    const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
    if (!openaiApiKey) {
      this.textContainer.textContent = 'API key missing. Please set it in options.';
      this.actionButton.disabled = true;
      return;
    }

    this.openaiService = new OpenAIService(openaiApiKey);
    this.setupEventListeners();
    await this.loadFocusedText();
  }

  setupEventListeners() {
    this.actionButton.addEventListener('click', async () => {
      switch (this.currentState) {
        case 'original':
          await this.enhanceMessage();
          break;
        case 'enhanced':
          await this.acceptMessage();
          break;
        case 'reverting':
          this.revertMessage();
          break;
      }
    });
  }

  async loadFocusedText() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FOCUSED_TEXT' });
    
    if (chrome.runtime.lastError) {
      this.textContainer.textContent = 'No text or no permission.';
      this.actionButton.disabled = true;
      return;
    }

    this.originalText = response?.text?.trim();
    if (!this.originalText) {
      this.textContainer.textContent = 'No text captured.';
      this.actionButton.disabled = true;
      return;
    }

    this.textContainer.textContent = this.originalText;
    this.updateButtonState('original');
  }

  async enhanceMessage() {
    this.actionButton.disabled = true;
    this.actionButton.textContent = 'Enhancing...';
    this.currentState = 'enhancing';

    try {
      this.enhancedText = await this.openaiService.enhanceText(this.originalText);
      this.textContainer.innerHTML = marked.parse(this.enhancedText);
      this.updateButtonState('enhanced');
    } catch (error) {
      console.error('OpenAI API error:', error);
      this.textContainer.textContent = 'Failed to fetch improved text.';
      this.updateButtonState('original');
    }
  }

  async acceptMessage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const cleanedMarkdown = TextFormatter.cleanMarkdownForSlack(this.enhancedText);
    
    await chrome.tabs.sendMessage(tab.id, {
      type: 'REPLACE_FOCUSED_TEXT',
      text: cleanedMarkdown
    });
    
    this.updateButtonState('reverting');
  }

  revertMessage() {
    this.textContainer.textContent = this.originalText;
    this.updateButtonState('original');
  }

  updateButtonState(state) {
    this.currentState = state;
    this.actionButton.disabled = false;
    
    switch (state) {
      case 'original':
        this.actionButton.textContent = 'Enhance Message';
        this.actionButton.className = 'enhance';
        break;
      case 'enhanced':
        this.actionButton.textContent = 'Accept Changes';
        this.actionButton.className = 'accept';
        break;
      case 'reverting':
        this.actionButton.textContent = 'Revert to Original';
        this.actionButton.className = 'revert';
        break;
      case 'enhancing':
        this.actionButton.textContent = 'Enhancing...';
        this.actionButton.className = 'enhance';
        break;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
  popup.initialize();
}); 