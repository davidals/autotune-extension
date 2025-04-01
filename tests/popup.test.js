import { PopupManager } from '../src/ui/popup.js';
import { OpenAIService } from '../src/services/openaiService.js';

// Mock chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    lastError: null
  }
};

// Mock marked library
global.marked = {
  parse: jest.fn(text => text)
};

// Mock OpenAIService
jest.mock('../src/services/openaiService.js');

describe('PopupManager', () => {
  let popupManager;
  let mockOpenAIService;
  let consoleSpy;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="text-container"></div>
      <button id="action-button"></button>
      <select id="model-select">
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
      </select>
    `;

    // Reset mocks
    jest.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({ openaiApiKey: 'test-key' });
    chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);
    chrome.tabs.sendMessage.mockResolvedValue({ text: 'Test text' });
    chrome.scripting.executeScript.mockResolvedValue([]);

    // Mock OpenAIService
    mockOpenAIService = {
      getModel: jest.fn().mockResolvedValue('gpt-3.5-turbo'),
      setModel: jest.fn().mockResolvedValue(true),
      enhanceText: jest.fn().mockResolvedValue('Enhanced text')
    };
    OpenAIService.mockImplementation(() => mockOpenAIService);

    // Mock console.error
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Create PopupManager instance
    popupManager = new PopupManager();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should initialize with API key', async () => {
      await popupManager.initialize();
      expect(popupManager.openaiService).toBeDefined();
      expect(popupManager.textContainer.textContent).toBe('Test text');
    });

    it('should handle missing API key', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({});
      await popupManager.initialize();
      expect(popupManager.textContainer.textContent).toBe('API key missing. Please set it in options.');
      expect(popupManager.actionButton.disabled).toBe(true);
    });

    it('should load model on initialization', async () => {
      await popupManager.initialize();
      expect(mockOpenAIService.getModel).toHaveBeenCalled();
      expect(popupManager.modelSelect.value).toBe('gpt-3.5-turbo');
    });

    it('should handle text loading errors', async () => {
      chrome.tabs.sendMessage.mockRejectedValueOnce(new Error('Failed to load text'));
      await popupManager.initialize();
      expect(popupManager.textContainer.textContent).toBe('Error: Could not access the page.');
      expect(popupManager.actionButton.disabled).toBe(true);
    });
  });

  describe('model selection', () => {
    beforeEach(async () => {
      await popupManager.initialize();
    });

    it('should save model when changed', async () => {
      popupManager.modelSelect.value = 'gpt-4';
      await popupManager.modelSelect.dispatchEvent(new Event('change'));
      expect(mockOpenAIService.setModel).toHaveBeenCalledWith('gpt-4');
    });

    it('should handle model save errors', async () => {
      mockOpenAIService.setModel.mockRejectedValueOnce(new Error('Failed to save model'));
      
      popupManager.modelSelect.value = 'gpt-4';
      await popupManager.modelSelect.dispatchEvent(new Event('change'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving model:', expect.any(Error));
    });

    it('should have all required model options', () => {
      const options = Array.from(popupManager.modelSelect.options).map(opt => opt.value);
      expect(options).toContain('gpt-3.5-turbo');
      expect(options).toContain('gpt-4');
      expect(options).toContain('gpt-4-turbo');
    });

    it('should persist model selection across page loads', async () => {
      // First initialization
      await popupManager.initialize();
      expect(popupManager.modelSelect.value).toBe('gpt-3.5-turbo');

      // Change model
      mockOpenAIService.getModel.mockResolvedValueOnce('gpt-4');
      popupManager.modelSelect.value = 'gpt-4';
      await popupManager.modelSelect.dispatchEvent(new Event('change'));

      // Create new instance and initialize
      popupManager = new PopupManager();
      await popupManager.initialize();
      expect(popupManager.modelSelect.value).toBe('gpt-4');
    });
  });

  describe('text enhancement', () => {
    beforeEach(async () => {
      await popupManager.initialize();
    });

    it('should enhance text with selected model', async () => {
      // Set model to GPT-4
      popupManager.modelSelect.value = 'gpt-4';
      await popupManager.modelSelect.dispatchEvent(new Event('change'));

      // Enhance text
      await popupManager.enhanceMessage();
      
      // Verify the correct model was used
      expect(mockOpenAIService.setModel).toHaveBeenCalledWith('gpt-4');
      expect(mockOpenAIService.enhanceText).toHaveBeenCalledWith('Test text');
      expect(popupManager.textContainer.innerHTML).toBe('Enhanced text');
    });

    it('should use the last selected model for enhancement', async () => {
      // Set model to GPT-4
      mockOpenAIService.getModel.mockResolvedValueOnce('gpt-4');
      await popupManager.loadModel();
      expect(popupManager.modelSelect.value).toBe('gpt-4');

      // Enhance text
      await popupManager.enhanceMessage();
      expect(mockOpenAIService.enhanceText).toHaveBeenCalledWith('Test text');
    });

    it('should handle enhancement errors', async () => {
      mockOpenAIService.enhanceText.mockRejectedValueOnce(new Error('Enhancement failed'));
      
      await popupManager.enhanceMessage();
      
      expect(consoleSpy).toHaveBeenCalledWith('OpenAI API error:', expect.any(Error));
      expect(popupManager.textContainer.textContent).toBe('Failed to fetch improved text.');
    });

    it('should disable enhance button while processing', async () => {
      const enhancePromise = popupManager.enhanceMessage();
      expect(popupManager.actionButton.disabled).toBe(true);
      expect(popupManager.actionButton.textContent).toBe('Enhancing...');
      await enhancePromise;
    });
  });
}); 