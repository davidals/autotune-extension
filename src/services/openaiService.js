/**
 * Service for interacting with OpenAI's API
 */

export class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Enhances text using OpenAI's GPT model
   * @param {string} text - The text to enhance
   * @returns {Promise<string>} The enhanced text
   */
  async enhanceText(text) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
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
- Do not change quotes (lines that start with '>').`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenAI API');
    }

    const result = await response.json();
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }

    return result.choices[0].message.content;
  }
} 