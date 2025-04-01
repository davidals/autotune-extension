export class OptionsManager {
  constructor() {
    // API Key elements
    this.apiKeyInput = document.getElementById('api-key');
    this.saveButton = document.getElementById('save-button');
    this.statusMessage = document.getElementById('status-message');

    // Model selection
    this.modelSelect = document.getElementById('modelSelect');

    // Parameter sliders
    this.sliders = {
      verbosity: document.getElementById('verbosity'),
      formality: document.getElementById('formality'),
      tone: document.getElementById('tone'),
      complexity: document.getElementById('complexity'),
      persuasiveness: document.getElementById('persuasiveness')
    };

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadSavedSettings();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing options:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  async loadSavedSettings() {
    try {
      // Load API key
      const result = await chrome.storage.sync.get('openaiApiKey');
      if (result.openaiApiKey) {
        this.apiKeyInput.value = result.openaiApiKey;
      }

      // Load enhancement parameters
      const paramsResult = await chrome.storage.sync.get('enhancementParams');
      const savedParams = paramsResult.enhancementParams || this.getDefaultParameters();
      
      // Initialize sliders with saved values
      Object.entries(savedParams).forEach(([param, value]) => {
        const slider = document.getElementById(`${param}-slider`);
        if (slider) {
          slider.value = value;
          this.sliders[param] = slider;
        }
      });

      // Load model selection
      const modelResult = await chrome.storage.sync.get('openaiModel');
      if (modelResult.openaiModel) {
        this.modelSelect.value = modelResult.openaiModel;
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
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

    this.saveButton.addEventListener('click', async () => {
      const apiKey = this.apiKeyInput.value.trim();
      if (!apiKey) {
        this.showStatus('Please enter an API key', 'error');
        return;
      }

      try {
        await chrome.storage.sync.set({ openaiApiKey: apiKey });
        this.showStatus('Settings saved successfully', 'success');
      } catch (error) {
        console.error('Error saving settings:', error);
        this.showStatus('Error saving settings', 'error');
      }
    });

    // Model selection change
    this.modelSelect.addEventListener('change', () => this.handleModelChange());
  }

  async handleModelChange() {
    const model = this.modelSelect.value;
    try {
      await chrome.storage.sync.set({ openaiModel: model });
      this.showStatus('Model selection saved!', 'success');
    } catch (error) {
      this.showStatus('Error saving model selection. Please try again.', 'error');
      console.error('Error saving model selection:', error);
    }
  }

  showStatus(message, type) {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
      this.statusMessage.textContent = '';
      this.statusMessage.className = 'status-message';
    }, 3000);
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
}); 