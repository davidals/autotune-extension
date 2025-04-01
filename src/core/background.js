class BackgroundManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log("Extension installed!");
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") {
        console.log(`Tab updated: ${tab.url}`);
      }
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'FOCUSED_TEXT_CHANGED') {
        this.handleFocusedTextChange(message.text);
      }
    });
  }

  async handleFocusedTextChange(text) {
    try {
      await chrome.storage.local.set({ lastFocusedText: text });
    } catch (error) {
      console.error('Error saving focused text:', error);
    }
  }
}

// Initialize background script
const background = new BackgroundManager(); 