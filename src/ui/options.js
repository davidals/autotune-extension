class OptionsManager {
  constructor() {
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveButton = document.getElementById('saveButton');
    this.status = document.getElementById('status');
  }

  async initialize() {
    await this.loadSavedSettings();
    this.setupEventListeners();
  }

  async loadSavedSettings() {
    const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
    if (openaiApiKey) {
      this.apiKeyInput.value = openaiApiKey;
    }
  }

  setupEventListeners() {
    this.saveButton.addEventListener('click', () => this.handleSave());
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
      console.error('Error saving API key:', error);
      this.showStatus('Failed to save API key. Please try again.', 'error');
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

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const options = new OptionsManager();
  options.initialize();
}); 