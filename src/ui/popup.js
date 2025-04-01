import { OpenAIService } from '../services/openaiService.js';
import { TextFormatter } from '../utils/textFormatter.js';
import { EnhancementParams } from '../services/enhancementParams.js';

export class PopupManager {
  constructor() {
    this.textContainer = document.getElementById('text-container');
    this.actionButton = document.getElementById('action-button');
    this.revertButton = document.getElementById('revert-button');
    this.acceptButton = document.getElementById('accept-button');
    this.actionButtons = document.querySelector('.action-buttons');
    this.originalText = '';
    this.enhancedText = '';
    this.currentState = 'original';
    this.openaiService = new OpenAIService();
    this.enhancementParams = new EnhancementParams();
    this.activeTabId = null;
    this.sliders = {};

    this.initialize();
  }

  async initialize() {
    try {
      // Initialize OpenAI service
      const hasApiKey = await this.openaiService.initialize();
      
      if (!hasApiKey) {
        this.textContainer.textContent = 'API key missing. Please set it in options.';
        this.actionButton.disabled = true;
        return;
      }

      await this.loadSavedParameters();
      this.setupEventListeners();
      await this.loadFocusedText();
    } catch (error) {
      console.error('Initialization error:', error);
      this.textContainer.textContent = 'Error initializing. Please try again.';
      this.actionButton.disabled = true;
    }
  }

  async loadSavedParameters() {
    try {
      const result = await chrome.storage.sync.get('enhancementParams');
      const savedParams = result.enhancementParams || this.getDefaultParameters();
      
      // Initialize sliders with saved values
      Object.entries(savedParams).forEach(([param, value]) => {
        const slider = document.getElementById(`${param}-slider`);
        if (slider) {
          slider.value = value;
          this.sliders[param] = slider;
        }
      });
    } catch (error) {
      console.error('Error loading saved parameters:', error);
    }
  }

  getDefaultParameters() {
    return {
      verbosity: 50,
      formality: 50,
      tone: 50,
      complexity: 50,
      persuasiveness: 50
    };
  }

  async saveParameters() {
    try {
      const params = {};
      Object.entries(this.sliders).forEach(([param, slider]) => {
        params[param] = parseInt(slider.value);
      });
      await chrome.storage.sync.set({ enhancementParams: params });
    } catch (error) {
      console.error('Error saving parameters:', error);
    }
  }

  setupEventListeners() {
    // Setup slider event listeners
    Object.entries(this.sliders).forEach(([param, slider]) => {
      slider.addEventListener('change', () => this.saveParameters());
    });

    this.actionButton.addEventListener('click', () => this.handleEnhancement());
    this.revertButton.addEventListener('click', () => this.handleRevert());
    this.acceptButton.addEventListener('click', () => this.handleAccept());
  }

  async loadFocusedText() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we can inject the content script
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        // Try to inject the content script if it's not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/core/content.js']
        });
      }

      // Add a small delay to ensure the content script is ready
      await new Promise(resolve => setTimeout(resolve, 100));

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
    } catch (error) {
      console.error('Error loading focused text:', error);
      this.textContainer.textContent = 'Error: Could not access the page.';
      this.actionButton.disabled = true;
    }
  }

  async enhanceMessage() {
    this.actionButton.disabled = true;
    this.actionButton.textContent = 'Enhancing...';
    this.currentState = 'enhancing';

    try {
      const result = await this.openaiService.enhanceText(this.originalText);
      
      if (result) {
        this.enhancedText = result;
        this.textContainer.innerHTML = marked.parse(this.enhancedText);
        this.updateButtonState('enhanced');
      } else {
        this.textContainer.textContent = 'Error processing the request.';
        this.updateButtonState('original');
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      this.textContainer.textContent = 'Failed to fetch improved text.';
      this.updateButtonState('original');
    }
  }

  async acceptMessage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we can inject the content script
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/core/content.js']
        });
      }

      // Add a small delay to ensure the content script is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const cleanedMarkdown = TextFormatter.cleanMarkdownForSlack(this.enhancedText);
      
      await chrome.tabs.sendMessage(tab.id, {
        type: 'REPLACE_FOCUSED_TEXT',
        text: cleanedMarkdown
      });
      
      this.updateButtonState('reverting');
    } catch (error) {
      console.error('Error accepting message:', error);
      this.textContainer.textContent = 'Error: Could not update the text.';
      this.updateButtonState('original');
    }
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

  showActionButtons() {
    this.actionButton.style.display = 'none';
    this.actionButtons.style.display = 'flex';
    this.revertButton.disabled = false;
    this.acceptButton.disabled = false;
  }

  hideActionButtons() {
    this.actionButton.style.display = 'block';
    this.actionButtons.style.display = 'none';
    this.revertButton.disabled = true;
    this.acceptButton.disabled = true;
  }

  async handleEnhancement() {
    try {
      this.actionButton.disabled = true;
      this.showStatus('Enhancing text...', 'info');
      
      // Get current slider values
      const params = {};
      Object.entries(this.sliders).forEach(([param, slider]) => {
        params[param] = parseInt(slider.value);
      });
      
      const enhancedText = await this.openaiService.enhanceText(
        this.textContainer.textContent,
        params
      );
      
      this.textContainer.innerHTML = marked.parse(enhancedText);
      this.showActionButtons();
      this.showStatus('Enhancement complete!', 'success');
    } catch (error) {
      this.showStatus(error.message, 'error');
      this.actionButton.disabled = false;
    }
  }

  handleRevert() {
    this.textContainer.textContent = this.originalText;
    this.hideActionButtons();
    this.showStatus('Changes reverted', 'info');
  }

  handleAccept() {
    this.hideActionButtons();
    this.showStatus('Changes accepted', 'success');
  }

  showStatus(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
      }, 3000);
    }
  }

  getParameterSpecs() {
    return {
      verbosity: {
        min: 0,
        max: 100,
        default: 50,
        label: 'Verbosity',
        leftLabel: 'Concise',
        rightLabel: 'Detailed'
      },
      formality: {
        min: 0,
        max: 100,
        default: 50,
        label: 'Formality',
        leftLabel: 'Casual',
        rightLabel: 'Formal'
      },
      tone: {
        min: 0,
        max: 100,
        default: 50,
        label: 'Tone',
        leftLabel: 'Friendly',
        rightLabel: 'Serious'
      },
      complexity: {
        min: 0,
        max: 100,
        default: 50,
        label: 'Complexity',
        leftLabel: 'Simpler',
        rightLabel: 'Sophisticated'
      },
      persuasiveness: {
        min: 0,
        max: 100,
        default: 50,
        label: 'Persuasiveness',
        leftLabel: 'Informing',
        rightLabel: 'Convincing'
      }
    };
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 