import { OpenAIService } from '../src/services/openaiService.js';
import { EnhancementParams } from '../src/services/enhancementParams.js';

// Mock chrome.storage.sync
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('OpenAIService', () => {
  let service;
  let mockStorage;
  let mockTabs;
  let mockScripting;
  let enhancementParams;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset chrome storage mock implementation
    chrome.storage.sync.get.mockImplementation(() => Promise.resolve({}));
    chrome.storage.sync.set.mockImplementation(() => Promise.resolve());
    // Create new service instance
    service = new OpenAIService();

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

    // Create EnhancementParams instance
    enhancementParams = new EnhancementParams();
    service = new OpenAIService(enhancementParams);
  });

  describe('model selection', () => {
    test('should initialize with default model', async () => {
      const model = await service.getModel();
      expect(model).toBe('gpt-3.5-turbo');
    });

    test('should load saved model from storage', async () => {
      // Setup mock to return a saved model
      chrome.storage.sync.get.mockImplementation(() => 
        Promise.resolve({ openaiModel: 'gpt-4' })
      );
      
      // Create new service instance and load model
      service = new OpenAIService();
      await service.loadModel();
      
      const model = await service.getModel();
      expect(model).toBe('gpt-4');
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('openaiModel');
    });

    test('should save and retrieve model', async () => {
      await service.setModel('gpt-4');
      const model = await service.getModel();
      
      expect(model).toBe('gpt-4');
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        openaiModel: 'gpt-4'
      });
    });

    test('should use selected model for API calls', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Enhanced text' } }]
          })
        })
      );

      await service.setModel('gpt-4');
      await service.setApiKey('test-key');
      await service.enhanceText('test text');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"gpt-4"')
        })
      );
    });

    test('should handle storage errors when saving model', async () => {
      const storageError = new Error('Storage error');
      chrome.storage.sync.set.mockImplementation(() => 
        Promise.reject(storageError)
      );

      await expect(service.setModel('gpt-4'))
        .rejects
        .toThrow('Storage error');
    });

    test('should handle storage errors when loading model', async () => {
      const storageError = new Error('Storage error');
      chrome.storage.sync.get.mockImplementation(() => 
        Promise.reject(storageError)
      );

      await expect(service.loadModel())
        .rejects
        .toThrow('Storage error');
    });

    test('should validate model name', async () => {
      await expect(service.setModel('invalid-model'))
        .rejects
        .toThrow('Invalid model name');
    });

    test('should ignore invalid saved model', async () => {
      chrome.storage.sync.get.mockImplementation(() => 
        Promise.resolve({ openaiModel: 'invalid-model' })
      );
      
      await service.loadModel();
      const model = await service.getModel();
      expect(model).toBe('gpt-3.5-turbo');
    });
  });

  describe('API key management', () => {
    test('should initialize with null API key', async () => {
      const apiKey = await service.getApiKey();
      expect(apiKey).toBeNull();
    });

    test('should load saved API key from storage', async () => {
      chrome.storage.sync.get.mockImplementation(() => 
        Promise.resolve({ openaiApiKey: 'test-key' })
      );
      
      await service.loadApiKey();
      const apiKey = await service.getApiKey();
      expect(apiKey).toBe('test-key');
    });

    test('should save and retrieve API key', async () => {
      await service.setApiKey('test-key');
      const apiKey = await service.getApiKey();
      
      expect(apiKey).toBe('test-key');
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        openaiApiKey: 'test-key'
      });
    });

    test('should handle storage errors when saving API key', async () => {
      const storageError = new Error('Storage error');
      chrome.storage.sync.set.mockImplementation(() => 
        Promise.reject(storageError)
      );

      await expect(service.setApiKey('test-key'))
        .rejects
        .toThrow('Storage error');
    });

    test('should handle storage errors when loading API key', async () => {
      const storageError = new Error('Storage error');
      chrome.storage.sync.get.mockImplementation(() => 
        Promise.reject(storageError)
      );

      await expect(service.loadApiKey())
        .rejects
        .toThrow('Storage error');
    });
  });

  describe('text enhancement', () => {
    beforeEach(async () => {
      await service.setApiKey('test-key');
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Enhanced text' } }]
          })
        })
      );
    });

    test('should enhance text successfully', async () => {
      const result = await service.enhanceText('test text');
      expect(result).toBe('Enhanced text');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key'
          }
        })
      );
    });

    test('should throw error if API key not set', async () => {
      service = new OpenAIService();
      await expect(service.enhanceText('test text'))
        .rejects
        .toThrow('OpenAI API key not set');
    });

    test('should handle API errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: { message: 'API error' }
          })
        })
      );

      await expect(service.enhanceText('test text'))
        .rejects
        .toThrow('API error');
    });
  });

  describe('enhancement parameters integration', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({ apiKey: 'test-key' });
      await service.initialize();
    });

    it('should include enhancement parameters in the prompt', async () => {
      // Set some test parameters
      enhancementParams.setVerbosity(75);
      enhancementParams.setFormality(25);
      enhancementParams.setTone(60);
      enhancementParams.setCreativity(40);
      enhancementParams.setPersuasiveness(90);

      // Mock the API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Enhanced text' } }]
        })
      });

      await service.enhanceText('Test text');

      // Verify the prompt includes the parameters
      const call = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(call[1].body);
      expect(requestBody.messages[0].content).toContain('Verbosity: 75%');
      expect(requestBody.messages[0].content).toContain('Formality: 25%');
      expect(requestBody.messages[0].content).toContain('Tone: 60%');
      expect(requestBody.messages[0].content).toContain('Creativity: 40%');
      expect(requestBody.messages[0].content).toContain('Persuasiveness: 90%');
    });

    it('should handle missing enhancement parameters gracefully', async () => {
      // Mock the API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Enhanced text' } }]
        })
      });

      await service.enhanceText('Test text');

      // Verify the prompt still works without parameters
      const call = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(call[1].body);
      expect(requestBody.messages[0].content).toBeDefined();
    });

    it('should update prompt when parameters change', async () => {
      // Mock the API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Enhanced text' } }]
        })
      });

      // First call with default parameters
      await service.enhanceText('Test text');
      const firstCall = global.fetch.mock.calls[0];
      const firstRequestBody = JSON.parse(firstCall[1].body);

      // Change parameters
      enhancementParams.setVerbosity(80);
      enhancementParams.setFormality(20);

      // Second call with updated parameters
      await service.enhanceText('Test text');
      const secondCall = global.fetch.mock.calls[1];
      const secondRequestBody = JSON.parse(secondCall[1].body);

      // Verify the prompts are different
      expect(secondRequestBody.messages[0].content).not.toBe(firstRequestBody.messages[0].content);
      expect(secondRequestBody.messages[0].content).toContain('Verbosity: 80%');
      expect(secondRequestBody.messages[0].content).toContain('Formality: 20%');
    });
  });
}); 