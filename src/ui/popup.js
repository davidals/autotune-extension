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
    this.activeTabId = null;

    this.initialize();
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

    chrome.storage.sync.get('openaiApiKey', async (data) => {
      if (!data.openaiApiKey) {
        this.textContainer.textContent = 'API key missing. Please set it in options.';
        this.updateButtonState('original');
        return;
      }

      const apiKey = data.openaiApiKey;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `Help me refine my communication.

I want to improve the clarity and tone of my messages while keeping the original intent and opinions intact.

- Make the language less aggressive, more positive, and inviting.
- Keep the message concise, clear, and easy to read (avoid excessive verbosity or complex words).
- Maintain a professional yet friendly tone.
- Do not change quotes (lines that start with '>').

I will provide a message I wrote, and you will return a refined version of it in Markdown format—without any additional commentary.`,
              },
              { role: 'user', content: this.originalText },
            ],
            max_tokens: 500,
          }),
        });

        const result = await response.json();

        if (result.choices && result.choices[0].message) {
          this.enhancedText = result.choices[0].message.content;
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
    });
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
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
  popup.initialize();
}); 