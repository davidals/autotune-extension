import { OpenAIService } from '../src/services/openaiService.js';

describe('OpenAIService', () => {
  let service;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new OpenAIService(mockApiKey);
    global.fetch.mockClear();
  });

  describe('enhanceText', () => {
    it('should enhance text successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Enhanced text'
          }
        }]
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.enhanceText('Original text');
      expect(result).toBe('Enhanced text');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          }
        })
      );
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });
      
      await expect(service.enhanceText('Original text')).rejects.toThrow('Failed to fetch from OpenAI API');
    });

    it('should handle invalid response format', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await expect(service.enhanceText('Original text')).rejects.toThrow('Invalid response from OpenAI API');
    });
  });
}); 