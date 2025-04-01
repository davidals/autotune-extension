import { PopupManager } from '../src/ui/popup.js';
import { OpenAIService } from '../src/services/openaiService.js';
import { TextFormatter } from '../src/utils/textFormatter.js';

// Mock the imported modules
jest.mock('../src/services/openaiService.js');
jest.mock('../src/utils/textFormatter.js');

describe('PopupManager', () => {
  let popup;
  let mockTextContainer;
  let mockActionButton;
  let mockOpenAIService;
  let mockTextFormatter;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup DOM mocks
    mockTextContainer = {
      textContent: '',
      innerHTML: ''
    };
    mockActionButton = {
      disabled: false,
      textContent: '',
      className: '',
      addEventListener: jest.fn()
    };
    document.getElementById = jest.fn(id => {
      if (id === 'text-container') return mockTextContainer;
      if (id === 'action-button') return mockActionButton;
      return null;
    });

    // Setup service mocks
    mockOpenAIService = {
      enhanceText: jest.fn()
    };
    OpenAIService.mockImplementation(() => mockOpenAIService);

    mockTextFormatter = {
      cleanMarkdownForSlack: jest.fn(text => text)
    };
    TextFormatter.cleanMarkdownForSlack = mockTextFormatter.cleanMarkdownForSlack;

    // Setup Chrome API mocks
    chrome.storage.sync.get.mockResolvedValue({ openaiApiKey: 'test-api-key' });
    chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);
    chrome.tabs.sendMessage.mockResolvedValue({ text: 'Test text' });
    chrome.scripting.executeScript.mockResolvedValue();

    // Create popup instance
    popup = new PopupManager();
  });

  describe('initialization', () => {
    it('should initialize with API key', async () => {
      await popup.initialize();
      expect(mockTextContainer.textContent).toBe('Test text');
      expect(mockActionButton.disabled).toBe(false);
    });

    it('should handle missing API key', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      await popup.initialize();
      expect(mockTextContainer.textContent).toBe('API key missing. Please set it in options.');
      expect(mockActionButton.disabled).toBe(true);
    });

    it('should handle content script injection errors', async () => {
      chrome.scripting.executeScript.mockRejectedValue(new Error('Injection failed'));
      await popup.initialize();
      expect(mockTextContainer.textContent).toBe('Error: Could not access the page.');
      expect(mockActionButton.disabled).toBe(true);
    });
  });

  describe('message enhancement', () => {
    beforeEach(async () => {
      await popup.initialize();
    });

    it('should enhance message successfully', async () => {
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced text');
      await popup.enhanceMessage();
      expect(mockTextContainer.innerHTML).toBe('Enhanced text');
      expect(mockActionButton.textContent).toBe('Accept Changes');
      expect(mockActionButton.className).toBe('accept');
    });

    it('should handle enhancement errors', async () => {
      mockOpenAIService.enhanceText.mockRejectedValue(new Error('API error'));
      await popup.enhanceMessage();
      expect(mockTextContainer.textContent).toBe('Failed to fetch improved text.');
      expect(mockActionButton.textContent).toBe('Enhance Message');
      expect(mockActionButton.className).toBe('enhance');
    });
  });

  describe('message acceptance', () => {
    beforeEach(async () => {
      await popup.initialize();
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced text');
      await popup.enhanceMessage();
    });

    it('should accept message successfully', async () => {
      await popup.acceptMessage();
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'REPLACE_FOCUSED_TEXT',
        text: 'Enhanced text'
      });
      expect(mockActionButton.textContent).toBe('Revert to Original');
      expect(mockActionButton.className).toBe('revert');
    });

    it('should handle acceptance errors', async () => {
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Update failed'));
      await popup.acceptMessage();
      expect(mockTextContainer.textContent).toBe('Error: Could not update the text.');
      expect(mockActionButton.textContent).toBe('Enhance Message');
      expect(mockActionButton.className).toBe('enhance');
    });
  });

  describe('message reversion', () => {
    beforeEach(async () => {
      await popup.initialize();
      mockOpenAIService.enhanceText.mockResolvedValue('Enhanced text');
      await popup.enhanceMessage();
      await popup.acceptMessage();
    });

    it('should revert message successfully', () => {
      popup.revertMessage();
      expect(mockTextContainer.textContent).toBe('Test text');
      expect(mockActionButton.textContent).toBe('Enhance Message');
      expect(mockActionButton.className).toBe('enhance');
    });
  });
}); 