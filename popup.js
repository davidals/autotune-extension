document.addEventListener('DOMContentLoaded', async () => {
    const markdownContainer = document.getElementById('markdown-container');
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      chrome.tabs.sendMessage(activeTabId, { type: 'GET_FOCUSED_TEXT' }, async (response) => {
        if (chrome.runtime.lastError) {
          markdownContainer.textContent = 'No text or no permission.';
          return;
        }
  
        let rawHtml = response?.text?.trim();
        if (!rawHtml) {
          markdownContainer.textContent = 'No text captured.';
          return;
        }
  
        // Convert Slack's rich HTML to Markdown
        const rawMarkdown = convertSlackHtmlToMarkdown(rawHtml);
  
        // Show loading message
        markdownContainer.textContent = 'Enhancing message...';
  
        chrome.storage.sync.get('openaiApiKey', async (data) => {
          if (!data.openaiApiKey) {
            markdownContainer.textContent = 'API key missing. Please set it in options.';
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
                  { role: 'user', content: rawMarkdown },
                ],
                max_tokens: 500,
              }),
            });
  
            const result = await response.json();
  
            if (result.choices && result.choices[0].message) {
              const improvedText = result.choices[0].message.content;
              markdownContainer.innerHTML = marked.parse(improvedText);
            } else {
              markdownContainer.textContent = 'Error processing the request.';
            }
          } catch (error) {
            console.error('OpenAI API error:', error);
            markdownContainer.textContent = 'Failed to fetch improved text.';
          }
        });
      });
    });
  });
  
  // Converts Slack's HTML to Markdown
  function convertSlackHtmlToMarkdown(html) {
    return html
      .replace(/<b>(.*?)<\/b>/g, '**$1**')  // Bold to Markdown
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')  // Strong to Markdown
      .replace(/<i>(.*?)<\/i>/g, '*$1*')  // Italics to Markdown
      .replace(/<em>(.*?)<\/em>/g, '*$1*')  // Emphasis to Markdown
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')  // Blockquote to Markdown
      .replace(/<ul>(.*?)<\/ul>/gs, (match, items) => items.replace(/<li>(.*?)<\/li>/g, '- $1')) // Lists to Markdown
      .replace(/<br\s*\/?>/g, '\n')  // Line breaks
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')  // Paragraphs
      .replace(/<\/?[^>]+(>|$)/g, ""); // Strip all remaining HTML
  }