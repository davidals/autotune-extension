import { OpenAIService } from '../services/openaiService.js';
import { TextFormatter } from '../utils/textFormatter.js';
import { EnhancementParams } from '../services/enhancementParams.js';

console.log('autotune.popup: Extension popup loaded');

export class PopupManager {
  constructor() {
    console.log('autotune.popup: Initializing PopupManager');
    this.textContainer = document.getElementById('text-container');
    this.enhanceButton = document.getElementById('enhance-button');
    this.revertButton = document.getElementById('revert-button');
    this.acceptButton = document.getElementById('accept-button');
    this.loadingSpinner = document.getElementById('loading-spinner');
    this.originalText = '';
    this.enhancedText = '';
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
        this.enhanceButton.disabled = true;
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
      this.enhanceButton.disabled = true;
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

    this.enhanceButton.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('autotune.popup: Enhance button clicked');
      this.handleEnhancement();
    });

    this.revertButton.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('autotune.popup: Revert button clicked');
      this.handleRevert();
    });

    this.acceptButton.addEventListener('click', (e) => {
      e.stopPropagation();
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
        this.enhanceButton.disabled = true;
        return;
      }

      this.originalText = response?.text?.trim();
      if (!this.originalText) {
        console.log('autotune.popup: No text captured');
        this.textContainer.textContent = 'No text captured.';
        this.enhanceButton.disabled = true;
        return;
      }

      console.log('autotune.popup: Text captured successfully');
      this.textContainer.textContent = this.originalText;
      this.hideActionButtons();
    } catch (error) {
      console.error('autotune.popup: Error loading focused text:', error);
      this.textContainer.textContent = 'Error: Could not access the page.';
      this.enhanceButton.disabled = true;
    }
  }

  async enhanceMessage() {
    this.enhanceButton.disabled = true;
    this.enhanceButton.textContent = 'Enhancing...';
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

  async handleRevert() {
    try {
      this.showStatus('Reverting changes...', 'info');
      
      // Revert the popup text
      this.textContainer.textContent = this.originalText;
      
      // Send revert message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/core/content.js']
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      await chrome.tabs.sendMessage(tab.id, {
        type: 'REPLACE_FOCUSED_TEXT',
        text: this.originalText
      });
      
      this.hideActionButtons();
      this.showStatus('Changes reverted', 'success');
    } catch (error) {
      console.error('autotune.popup: Error reverting changes:', error);
      this.showStatus(error.message, 'error');
    }
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

  updateButtonState(state) {
    this.currentState = state;
    this.enhanceButton.disabled = false;
    
    switch (state) {
      case 'original':
        this.enhanceButton.textContent = 'Enhance Message';
        this.enhanceButton.className = 'enhance';
        break;
      case 'enhanced':
        this.enhanceButton.textContent = 'Accept Changes';
        this.enhanceButton.className = 'accept';
        break;
      case 'reverting':
        this.enhanceButton.textContent = 'Revert to Original';
        this.enhanceButton.className = 'revert';
        break;
      case 'enhancing':
        this.enhanceButton.textContent = 'Enhancing...';
        this.enhanceButton.className = 'enhance';
        break;
    }
  }

  showActionButtons() {
    this.enhanceButton.style.display = 'none';
    this.revertButton.style.display = 'inline-block';
    this.acceptButton.style.display = 'inline-block';
  }

  hideActionButtons() {
    this.enhanceButton.style.display = 'inline-block';
    this.revertButton.style.display = 'none';
    this.acceptButton.style.display = 'none';
  }

  async handleEnhancement() {
    try {
      // Disable button and show loading state immediately
      this.enhanceButton.disabled = true;
      this.loadingSpinner.style.display = 'block';
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
      
      // Use the original text for enhancement
      const enhancedText = await this.openaiService.enhanceText(
        this.originalText,
        params
      );
      
      // Store the enhanced text
      this.enhancedText = enhancedText;
      
      // Update UI with enhanced text
      this.textContainer.innerHTML = marked.parse(enhancedText);
      
      // Show success message and action buttons
      this.showStatus('Enhancement complete!', 'success');
      this.showActionButtons();
    } catch (error) {
      console.error('autotune.popup: Enhancement error:', error);
      this.showStatus(error.message, 'error');
      this.enhanceButton.disabled = false;
    } finally {
      // Hide loading spinner
      this.loadingSpinner.style.display = 'none';
    }
  }

  showStatus(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
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