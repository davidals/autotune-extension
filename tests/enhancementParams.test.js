import { EnhancementParams } from '../src/services/enhancementParams.js';

describe('EnhancementParams', () => {
  let params;
  let mockStorage;

  beforeEach(() => {
    // Mock chrome.storage.sync
    mockStorage = {
      get: jest.fn(),
      set: jest.fn()
    };
    global.chrome = {
      storage: {
        sync: mockStorage
      }
    };

    params = new EnhancementParams();
  });

  describe('initialization', () => {
    it('should initialize with default values', async () => {
      mockStorage.get.mockResolvedValue({});
      await params.initialize();

      expect(params.verbosity).toBe(50);
      expect(params.formality).toBe(50);
      expect(params.tone).toBe(50);
      expect(params.creativity).toBe(50);
      expect(params.persuasiveness).toBe(50);
    });

    it('should load saved values from storage', async () => {
      mockStorage.get.mockResolvedValue({
        enhancementParams: {
          verbosity: 75,
          formality: 25,
          tone: 60,
          creativity: 40,
          persuasiveness: 90
        }
      });

      await params.initialize();

      expect(params.verbosity).toBe(75);
      expect(params.formality).toBe(25);
      expect(params.tone).toBe(60);
      expect(params.creativity).toBe(40);
      expect(params.persuasiveness).toBe(90);
    });

    it('should handle storage load errors', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));
      await params.initialize();

      // Should use defaults on error
      expect(params.verbosity).toBe(50);
      expect(params.formality).toBe(50);
      expect(params.tone).toBe(50);
      expect(params.creativity).toBe(50);
      expect(params.persuasiveness).toBe(50);
    });
  });

  describe('parameter validation', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({});
      await params.initialize();
    });

    it('should clamp values to valid range', () => {
      params.setVerbosity(-10);
      expect(params.verbosity).toBe(0);

      params.setFormality(150);
      expect(params.formality).toBe(100);

      params.setTone(NaN);
      expect(params.tone).toBe(50);

      params.setCreativity(undefined);
      expect(params.creativity).toBe(50);

      params.setPersuasiveness(null);
      expect(params.persuasiveness).toBe(50);
    });

    it('should save valid values', () => {
      params.setVerbosity(75);
      expect(params.verbosity).toBe(75);

      params.setFormality(25);
      expect(params.formality).toBe(25);
    });

    it('should auto-save changes to storage', () => {
      params.setVerbosity(75);
      expect(mockStorage.set).toHaveBeenCalledWith({
        enhancementParams: expect.objectContaining({
          verbosity: 75
        })
      });
    });
  });

  describe('API integration', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({});
      await params.initialize();
    });

    it('should generate prompt parameters', () => {
      params.setVerbosity(75);
      params.setFormality(25);
      params.setTone(60);
      params.setCreativity(40);
      params.setPersuasiveness(90);

      const promptParams = params.getPromptParameters();

      expect(promptParams).toEqual({
        verbosity: 75,
        formality: 25,
        tone: 60,
        creativity: 40,
        persuasiveness: 90
      });
    });

    it('should provide normalized values', () => {
      params.setVerbosity(75);
      const normalized = params.getNormalizedParameters();

      expect(normalized.verbosity).toBe(0.75);
    });
  });

  describe('event handling', () => {
    let changeHandler;

    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({});
      await params.initialize();
      changeHandler = jest.fn();
      params.onChange(changeHandler);
    });

    it('should notify listeners of changes', () => {
      params.setVerbosity(75);
      expect(changeHandler).toHaveBeenCalledWith({
        parameter: 'verbosity',
        value: 75,
        normalized: 0.75
      });
    });

    it('should handle multiple listeners', () => {
      const secondHandler = jest.fn();
      params.onChange(secondHandler);

      params.setFormality(25);
      expect(changeHandler).toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalled();
    });

    it('should allow removing listeners', () => {
      params.offChange(changeHandler);
      params.setVerbosity(75);
      expect(changeHandler).not.toHaveBeenCalled();
    });
  });
}); 