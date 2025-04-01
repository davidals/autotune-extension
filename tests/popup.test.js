import { PopupManager } from '../src/ui/popup.js';
import { OpenAIService } from '../src/services/openaiService.js';
import { EnhancementParams } from '../src/services/enhancementParams.js';
import { EnhancementControls } from '../src/ui/enhancementControls.js';

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

// Mock services
jest.mock('../src/services/openaiService.js');
jest.mock('../src/services/enhancementParams.js');
jest.mock('../src/ui/enhancementControls.js');

describe('PopupManager', () => {
  let popup;
  let mockStorage;
  let mockTabs;
  let mockScripting;
  let consoleSpy;
  let mockOpenAIService;
  let mockEnhancementParams;
  let mockEnhancementControls;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="container">
        <select id="model-select">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
        <div id="enhancement-controls">
          <div class="slider-container">
            <label for="verbosity">Verbosity</label>
            <input type="range" id="verbosity" min="0" max="100" value="50">
            <span class="value-display">50</span>
          </div>
          <div class="slider-container">
            <label for="formality">Formality</label>
            <input type="range" id="formality" min="0" max="100" value="50">
            <span class="value-display">50</span>
          </div>
          <div class="slider-container">
            <label for="tone">Tone</label>
            <input type="range" id="tone" min="0" max="100" value="50">
            <span class="value-display">50</span>
          </div>
          <div class="slider-container">
            <label for="creativity">Creativity</label>
            <input type="range" id="creativity" min="0" max="100" value="50">
            <span class="value-display">50</span>
          </div>
          <div class="slider-container">
            <label for="persuasiveness">Persuasiveness</label>
            <input type="range" id="persuasiveness" min="0" max="100" value="50">
            <span class="value-display">50</span>
          </div>
        </div>
        <div id="text-container"></div>
        <button id="action-button">Enhance Text</button>
        <button id="revert-button">Revert Text</button>
        <button id="accept-button">Accept Changes</button>
      </div>
    `;

    // Mock chrome APIs
    mockStorage = {
      get: jest.fn(),
      set: jest.fn()
    };
    mockTabs = {
      query: jest.fn(),
      sendMessage: jest.fn()
    };
    mockScripting = {
      executeScript: jest.fn()
    };
    global.chrome = {
      storage: { sync: mockStorage },
      tabs: mockTabs,
      scripting: mockScripting
    };

    // Mock console.error
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock OpenAIService
    mockOpenAIService = {
      initialize: jest.fn(),
      getApiKey: jest.fn(),
      getModel: jest.fn(),
      setModel: jest.fn(),
      enhanceText: jest.fn()
    };
    OpenAIService.mockImplementation(() => mockOpenAIService);

    // Mock EnhancementParams
    mockEnhancementParams = {
      initialize: jest.fn(),
      setValue: jest.fn(),
      getValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    };
    EnhancementParams.mockImplementation(() => mockEnhancementParams);

    // Mock EnhancementControls
    mockEnhancementControls = {
      initialize: jest.fn()
    };
    EnhancementControls.mockImplementation(() => mockEnhancementControls);

    // Reset chrome API mocks
    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();

    // Create PopupManager instance
    popup = new PopupManager();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with API key and capture text', async () => {
      // Setup mocks
      mockOpenAIService.getApiKey.mockResolvedValue('test-api-key');
      mockOpenAIService.getModel.mockResolvedValue('gpt-4');
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.tabs.sendMessage.mockResolvedValue({ text: 'Test text' });

      // Initialize
      await popup.initialize();

      // Verify service initialization
      expect(mockOpenAIService.initialize).toHaveBeenCalled();
      expect(mockEnhancementParams.initialize).toHaveBeenCalled();
      expect(mockEnhancementControls.initialize).toHaveBeenCalled();

      // Verify text capture
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'GET_FOCUSED_TEXT' });

      // Verify UI state
      expect(document.getElementById('text-container').textContent).toBe('Test text');
      expect(document.getElementById('action-button').disabled).toBe(false);
      expect(document.getElementById('revert-button').disabled).toBe(true);
      expect(document.getElementById('accept-button').disabled).toBe(true);
    });

    it('should handle missing API key', async () => {
      // Setup mocks
      mockOpenAIService.getApiKey.mockResolvedValue(null);

      // Initialize
      await popup.initialize();

      // Verify UI state
      expect(document.getElementById('text-container').textContent).toBe('Please set your OpenAI API key in the extension options.');
      expect(document.getElementById('action-button').disabled).toBe(true);
      expect(document.getElementById('revert-button').disabled).toBe(true);
      expect(document.getElementById('accept-button').disabled).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Setup mocks
      mockOpenAIService.initialize.mockRejectedValue(new Error('Init failed'));

      // Initialize
      await popup.initialize();

      // Verify error handling
      expect(document.getElementById('text-container').textContent).toBe('Failed to initialize. Please try again.');
      expect(document.getElementById('action-button').disabled).toBe(true);
      expect(document.getElementById('revert-button').disabled).toBe(true);
      expect(document.getElementById('accept-button').disabled).toBe(true);
    });
  });

  describe('Text Enhancement Flow', () => {
    beforeEach(async () => {
      // Setup initial state
      mockOpenAIService.getApiKey.mockResolvedValue('test-api-key');
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.tabs.sendMessage.mockResolvedValue({ text: 'Test text' });
      await popup.initialize();
    });

    it('should enhance text and update display', async () => {
      // Setup mocks
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced test text');

      // Trigger enhancement
      await popup._enhanceText();

      // Verify enhancement process
      expect(document.getElementById('text-container').textContent).toBe('Enhanced test text');
      expect(document.getElementById('action-button').disabled).toBe(false);
      expect(document.getElementById('revert-button').disabled).toBe(false);
      expect(document.getElementById('accept-button').disabled).toBe(false);
    });

    it('should handle enhancement errors', async () => {
      // Setup mocks
      mockOpenAIService.enhanceText.mockRejectedValue(new Error('Enhancement failed'));

      // Trigger enhancement
      await popup._enhanceText();

      // Verify error handling
      expect(document.getElementById('text-container').textContent).toBe('Failed to enhance text: Enhancement failed');
      expect(document.getElementById('action-button').disabled).toBe(false);
      expect(document.getElementById('revert-button').disabled).toBe(true);
      expect(document.getElementById('accept-button').disabled).toBe(true);
    });

    it('should revert to original text', async () => {
      // Setup mocks
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced test text');
      await popup._enhanceText();

      // Trigger revert
      await popup._revertText();

      // Verify revert
      expect(document.getElementById('text-container').textContent).toBe('Test text');
      expect(document.getElementById('revert-button').disabled).toBe(false);
      expect(document.getElementById('accept-button').disabled).toBe(true);
    });

    it('should accept changes and update source', async () => {
      // Setup mocks
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced test text');
      await popup._enhanceText();

      // Trigger accept
      await popup._acceptText();

      // Verify accept process
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'REPLACE_FOCUSED_TEXT',
        text: 'Enhanced test text'
      });
      expect(document.getElementById('text-container').textContent).toBe('Changes applied successfully!');
      expect(document.getElementById('accept-button').disabled).toBe(false);
    });

    it('should handle accept errors', async () => {
      // Setup mocks
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced test text');
      await popup._enhanceText();
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Accept failed'));

      // Trigger accept
      await popup._acceptText();

      // Verify error handling
      expect(document.getElementById('text-container').textContent).toBe('Failed to apply changes: Accept failed');
      expect(document.getElementById('accept-button').disabled).toBe(false);
    });
  });

  describe('model selection', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValueOnce({ apiKey: 'test-key' });
      await popup.initialize();
    });

    it('should save model when changed', async () => {
      await popup.modelSelect.dispatchEvent(new Event('change'));
      expect(popup.modelSelect.value).toBe('gpt-3.5-turbo');
    });

    it('should handle model save errors', async () => {
      const error = new Error('Failed to save model');
      jest.spyOn(popup.openaiService, 'setModel').mockRejectedValueOnce(error);
      await popup.modelSelect.dispatchEvent(new Event('change'));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save model:', error);
    });

    it('should have all required model options', () => {
      const options = Array.from(popup.modelSelect.options).map(o => o.value);
      expect(options).toContain('gpt-3.5-turbo');
      expect(options).toContain('gpt-4');
      expect(options).toContain('gpt-4-turbo');
    });
  });
}); 