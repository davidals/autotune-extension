class OptionsManager {
  constructor() {
    // API Key elements
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveButton = document.getElementById('saveButton');
    this.status = document.getElementById('status');

    // Model selection
    this.modelSelect = document.getElementById('modelSelect');

    // Parameter sliders
    this.parameters = {
      verbosity: document.getElementById('verbosity'),
      formality: document.getElementById('formality'),
      tone: document.getElementById('tone'),
      complexity: document.getElementById('complexity'),
      persuasiveness: document.getElementById('persuasiveness')
    };
  }

  async initialize() {
    await this.loadSavedSettings();
    this.setupEventListeners();
  }

  async loadSavedSettings() {
    const { 
      openaiApiKey, 
      openaiModel,
      verbosity,
      formality,
      tone,
      complexity,
      persuasiveness
    } = await chrome.storage.sync.get([
      'openaiApiKey',
      'openaiModel',
      'verbosity',
      'formality',
      'tone',
      'complexity',
      'persuasiveness'
    ]);
    
    if (openaiApiKey) {
      this.apiKeyInput.value = openaiApiKey;
    }
    
    if (openaiModel) {
      this.modelSelect.value = openaiModel;
    }

    // Load saved parameter values
    if (verbosity) this.parameters.verbosity.value = verbosity;
    if (formality) this.parameters.formality.value = formality;
    if (tone) this.parameters.tone.value = tone;
    if (complexity) this.parameters.complexity.value = complexity;
    if (persuasiveness) this.parameters.persuasiveness.value = persuasiveness;
  }

  setupEventListeners() {
    // API Key save
    this.saveButton.addEventListener('click', () => this.handleSave());

    // Model selection change
    this.modelSelect.addEventListener('change', () => this.handleModelChange());

    // Parameter slider changes
    Object.entries(this.parameters).forEach(([param, element]) => {
      element.addEventListener('input', () => this.handleParameterChange(param));
    });
  }

  async handleSave() {
    const apiKey = this.apiKeyInput.value.trim();
    if (!apiKey) {
      this.showStatus('Please enter a valid API key.', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
      this.showStatus('API key saved successfully!', 'success');
    } catch (error) {
      this.showStatus('Error saving API key. Please try again.', 'error');
      console.error('Error saving API key:', error);
    }
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

  async handleParameterChange(parameter) {
    const value = this.parameters[parameter].value;
    try {
      await chrome.storage.sync.set({ [parameter]: parseInt(value) });
      this.showStatus(`${parameter} parameter saved!`, 'success');
    } catch (error) {
      this.showStatus(`Error saving ${parameter} parameter. Please try again.`, 'error');
      console.error(`Error saving ${parameter} parameter:`, error);
    }
  }

  showStatus(message, type = 'info') {
    this.status.textContent = message;
    this.status.className = type;
    
    if (type === 'success') {
      setTimeout(() => {
        this.status.textContent = '';
        this.status.className = '';
      }, 2000);
    }
  }
}

// Initialize the options page
document.addEventListener('DOMContentLoaded', () => {
  const optionsManager = new OptionsManager();
  optionsManager.initialize();
}); 