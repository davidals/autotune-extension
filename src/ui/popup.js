import { OpenAIService } from '../services/openaiService.js';
import { TextFormatter } from '../utils/textFormatter.js';
import { EnhancementParams } from '../services/enhancementParams.js';

console.log('autotune.popup: Extension popup loaded');

export class PopupManager {
  constructor() {
    console.log('autotune.popup: Initializing PopupManager');
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
    this.modelSelect = document.getElementById('model-select');

    this.initialize();
  }

  async initialize() {
    try {
      const hasApiKey = await this.openaiService.initialize();
      
      if (!hasApiKey) {
        console.log('autotune.popup: No API key found');
        this.textContainer.textContent = 'API key missing. Please set it in options.';
        this.actionButton.disabled = true;
        return;
      }

      console.log('autotune.popup: API key found, loading parameters...');
      await this.loadSavedParameters();
      
      // Load the saved model
      await this.openaiService.loadModel();
      const currentModel = await this.openaiService.getModel();
      if (this.modelSelect && currentModel) {
        this.modelSelect.value = currentModel;
        console.log('autotune.popup: Loaded model:', currentModel);
      }
      
      this.setupEventListeners();
      await this.loadFocusedText();
    } catch (error) {
      console.error('autotune.popup: Initialization error:', error);
      this.textContainer.textContent = 'Error initializing. Please try again.';
      this.actionButton.disabled = true;
    }
  }

  async loadSavedParameters() {
    try {
      const result = await chrome.storage.sync.get(['enhancementParams', 'openaiModel']);
      const savedParams = result.enhancementParams || this.getDefaultParameters();
      const savedModel = result.openaiModel || 'gpt-3.5-turbo';
      
      console.log('autotune.popup: Loaded parameters:', savedParams);
      console.log('autotune.popup: Selected model:', savedModel);
      
      if (this.modelSelect) {
        this.modelSelect.value = savedModel;
      }
      
      // Initialize all required parameters
      const requiredParams = ['verbosity', 'formality', 'tone', 'complexity', 'persuasiveness'];
      requiredParams.forEach(param => {
        const slider = document.getElementById(`${param}-slider`);
        if (slider) {
          slider.value = savedParams[param] || 50;
          this.sliders[param] = slider;
          console.log(`autotune.popup: Initialized ${param} slider with value ${slider.value}`);
        } else {
          console.error(`autotune.popup: Missing slider for parameter ${param}`);
        }
      });
    } catch (error) {
      console.error('autotune.popup: Error loading saved parameters:', error);
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
      await chrome.storage.sync.set({ 
        enhancementParams: params,
        openaiModel: this.modelSelect?.value || 'gpt-3.5-turbo'
      });
    } catch (error) {
      console.error('autotune.popup: Error saving parameters:', error);
    }
  }

  setupEventListeners() {
    Object.entries(this.sliders).forEach(([param, slider]) => {
      slider.addEventListener('change', () => {
        console.log(`autotune.popup: ${param} slider changed to ${slider.value}`);
        this.saveParameters();
      });
    });

    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', () => {
        console.log('autotune.popup: Model changed to:', this.modelSelect.value);
        this.saveParameters();
      });
    }

    this.actionButton.addEventListener('click', () => {
      console.log('autotune.popup: Enhance button clicked');
      this.handleEnhancement();
    });
    this.revertButton.addEventListener('click', () => {
      console.log('autotune.popup: Revert button clicked');
      this.handleRevert();
    });
    this.acceptButton.addEventListener('click', () => {
      console.log('autotune.popup: Accept button clicked');
      this.handleAccept();
    });
  }

  async loadFocusedText() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/core/content.js']
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FOCUSED_TEXT' });
      
      if (chrome.runtime.lastError) {
        console.error('autotune.popup: Error getting focused text:', chrome.runtime.lastError);
        this.textContainer.textContent = 'No text or no permission.';
        this.actionButton.disabled = true;
        return;
      }

      this.originalText = response?.text?.trim();
      if (!this.originalText) {
        console.log('autotune.popup: No text captured');
        this.textContainer.textContent = 'No text captured.';
        this.actionButton.disabled = true;
        return;
      }

      console.log('autotune.popup: Text captured successfully');
      this.textContainer.textContent = this.originalText;
      this.updateButtonState('original');
    } catch (error) {
      console.error('autotune.popup: Error loading focused text:', error);
      this.textContainer.textContent = 'Error: Could not access the page.';
      this.actionButton.disabled = true;
    }
  }

  async enhanceMessage() {
    this.actionButton.disabled = true;
    this.actionButton.textContent = 'Enhancing...';
    this.currentState = 'enhancing';

    try {
      const params = {};
      Object.entries(this.sliders).forEach(([param, slider]) => {
        params[param] = parseInt(slider.value);
      });

      const model = this.modelSelect?.value || 'gpt-3.5-turbo';
      console.log('autotune.popup: Enhancing text with parameters:', {
        ...params,
        model
      });
      
      const result = await this.openaiService.enhanceText(this.originalText, params);
      
      if (result) {
        this.enhancedText = result;
        this.textContainer.innerHTML = marked.parse(this.enhancedText);
        this.updateButtonState('enhanced');
      } else {
        this.textContainer.textContent = 'Error processing the request.';
        this.updateButtonState('original');
      }
    } catch (error) {
      console.error('autotune.popup: OpenAI API error:', error);
      this.textContainer.textContent = 'Failed to fetch improved text.';
      this.updateButtonState('original');
    }
  }

  async acceptMessage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/core/content.js']
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const cleanedMarkdown = TextFormatter.cleanMarkdownForSlack(this.enhancedText);
      
      await chrome.tabs.sendMessage(tab.id, {
        type: 'REPLACE_FOCUSED_TEXT',
        text: cleanedMarkdown
      });
      
      this.updateButtonState('reverting');
    } catch (error) {
      console.error('autotune.popup: Error accepting message:', error);
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
      
      const params = {};
      Object.entries(this.sliders).forEach(([param, slider]) => {
        params[param] = parseInt(slider.value);
      });
      
      const model = this.modelSelect?.value || 'gpt-3.5-turbo';
      console.log('autotune.popup: Enhancing text with parameters:', {
        ...params,
        model
      });
      
      // Set the model before enhancing
      await this.openaiService.setModel(model);
      
      const enhancedText = await this.openaiService.enhanceText(
        this.textContainer.textContent,
        params
      );
      
      this.textContainer.innerHTML = marked.parse(enhancedText);
      this.showActionButtons();
      this.showStatus('Enhancement complete!', 'success');
    } catch (error) {
      console.error('autotune.popup: Enhancement error:', error);
      this.showStatus(error.message, 'error');
      this.actionButton.disabled = false;
    }
  }

  handleRevert() {
    this.revertMessage();
    this.hideActionButtons();
    this.showStatus('Changes reverted', 'info');
  }

  async handleAccept() {
    try {
      this.showStatus('Accepting changes...', 'info');
      await this.acceptMessage();
      this.hideActionButtons();
      this.showStatus('Changes accepted', 'success');
    } catch (error) {
      console.error('autotune.popup: Error accepting changes:', error);
      this.showStatus(error.message, 'error');
    }
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