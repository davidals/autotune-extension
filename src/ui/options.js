export class OptionsManager {
  constructor() {
    // API Key elements
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveButton = document.getElementById('saveButton');
    this.statusMessage = document.getElementById('status');

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
      console.error('autotune.options: Error initializing options:', error);
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
      
      console.log('autotune.options: Loading saved parameters:', savedParams);
      
      // Initialize sliders with saved values
      Object.entries(this.sliders).forEach(([param, slider]) => {
        if (slider && savedParams[param] !== undefined) {
          slider.value = savedParams[param];
          console.log(`autotune.options: Setting ${param} slider to ${savedParams[param]}`);
        }
      });

      // Load model selection
      const modelResult = await chrome.storage.sync.get('openaiModel');
      if (modelResult.openaiModel && this.modelSelect) {
        this.modelSelect.value = modelResult.openaiModel;
        console.log('autotune.options: Loaded model:', modelResult.openaiModel);
      }
    } catch (error) {
      console.error('autotune.options: Error loading saved settings:', error);
      throw error;
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
        if (slider) {
          params[param] = parseInt(slider.value);
        }
      });
      
      console.log('autotune.options: Saving parameters:', params);
      await chrome.storage.sync.set({ enhancementParams: params });
      this.showStatus('Parameters saved successfully', 'success');
    } catch (error) {
      console.error('autotune.options: Error saving parameters:', error);
      this.showStatus('Error saving parameters', 'error');
    }
  }

  setupEventListeners() {
    // Setup slider event listeners
    Object.entries(this.sliders).forEach(([param, slider]) => {
      if (slider) {
        slider.addEventListener('change', () => {
          console.log(`autotune.options: ${param} slider changed to ${slider.value}`);
          this.saveParameters();
        });
      }
    });

    if (this.saveButton) {
      this.saveButton.addEventListener('click', async () => {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
          this.showStatus('Please enter an API key', 'error');
          return;
        }

        try {
          await chrome.storage.sync.set({ openaiApiKey: apiKey });
          this.showStatus('API key saved successfully', 'success');
        } catch (error) {
          console.error('autotune.options: Error saving API key:', error);
          this.showStatus('Error saving API key', 'error');
        }
      });
    }

    // Model selection change
    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', () => {
        console.log('autotune.options: Model changed to:', this.modelSelect.value);
        this.handleModelChange();
      });
    }
  }

  async handleModelChange() {
    const model = this.modelSelect.value;
    try {
      await chrome.storage.sync.set({ openaiModel: model });
      this.showStatus('Model selection saved!', 'success');
    } catch (error) {
      this.showStatus('Error saving model selection. Please try again.', 'error');
      console.error('autotune.options: Error saving model selection:', error);
    }
  }

  showStatus(message, type) {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
      this.statusMessage.className = `status-message ${type}`;
      setTimeout(() => {
        this.statusMessage.textContent = '';
        this.statusMessage.className = 'status-message';
      }, 3000);
    }
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
}); 