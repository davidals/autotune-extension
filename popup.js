document.addEventListener('DOMContentLoaded', async () => {
  const textContainer = document.getElementById('text-container');
  const actionButton = document.getElementById('action-button');
  let originalText = '';
  let enhancedText = '';
  let currentState = 'original'; // 'original', 'enhanced', 'reverting'

  // Get the active tab and request the focused text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0].id;
    chrome.tabs.sendMessage(activeTabId, { type: 'GET_FOCUSED_TEXT' }, async (response) => {
      if (chrome.runtime.lastError) {
        textContainer.textContent = 'No text or no permission.';
        actionButton.disabled = true;
        return;
      }

      originalText = response?.text?.trim();
      if (!originalText) {
        textContainer.textContent = 'No text captured.';
        actionButton.disabled = true;
        return;
      }

      // Display the original message
      textContainer.textContent = originalText;
      updateButtonState('original');

      // Handle button click
      actionButton.addEventListener('click', async () => {
        if (currentState === 'original') {
          await enhanceMessage();
        } else if (currentState === 'enhanced') {
          await acceptMessage();
        } else if (currentState === 'reverting') {
          revertMessage();
        }
      });
    });
  });

  async function enhanceMessage() {
    actionButton.disabled = true;
    actionButton.textContent = 'Enhancing...';
    currentState = 'enhancing';

    chrome.storage.sync.get('openaiApiKey', async (data) => {
      if (!data.openaiApiKey) {
        textContainer.textContent = 'API key missing. Please set it in options.';
        updateButtonState('original');
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
              { role: 'user', content: originalText },
            ],
            max_tokens: 500,
          }),
        });

        const result = await response.json();

        if (result.choices && result.choices[0].message) {
          enhancedText = result.choices[0].message.content;
          textContainer.innerHTML = marked.parse(enhancedText);
          updateButtonState('enhanced');
        } else {
          textContainer.textContent = 'Error processing the request.';
          updateButtonState('original');
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        textContainer.textContent = 'Failed to fetch improved text.';
        updateButtonState('original');
      }
    });
  }

  async function acceptMessage() {
    const cleanedMarkdown = cleanMarkdownForSlack(enhancedText);
    chrome.tabs.sendMessage(activeTabId, {
      type: 'REPLACE_FOCUSED_TEXT',
      text: cleanedMarkdown
    });
    updateButtonState('reverting');
  }

  function revertMessage() {
    textContainer.textContent = originalText;
    updateButtonState('original');
  }

  function updateButtonState(state) {
    currentState = state;
    actionButton.disabled = false;
    
    switch (state) {
      case 'original':
        actionButton.textContent = 'Enhance Message';
        actionButton.className = 'enhance';
        break;
      case 'enhanced':
        actionButton.textContent = 'Accept Changes';
        actionButton.className = 'accept';
        break;
      case 'reverting':
        actionButton.textContent = 'Revert to Original';
        actionButton.className = 'revert';
        break;
      case 'enhancing':
        actionButton.textContent = 'Enhancing...';
        actionButton.className = 'enhance';
        break;
    }
  }
});

function cleanMarkdownForSlack(markdown) {
  return markdown
    .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines (3+ → 2)
    .replace(/- \n+/g, '- ')  // Fix lists breaking unexpectedly
    .replace(/\n\s*>\s*\n/g, '\n> ')  // Ensure blockquotes don't create extra spaces
    .replace(/\n\s*```\n/g, '\n```\n'); // Ensure code blocks stay formatted correctly
}

function convertSlackHtmlToMarkdown(html) {
  return html
    .replace(/<b>(.*?)<\/b>/g, '**$1**')  // Bold
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')  // Strong text
    .replace(/<i>(.*?)<\/i>/g, '*$1*')  // Italics
    .replace(/<em>(.*?)<\/em>/g, '*$1*')  // Emphasis
    .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')  // Blockquotes
    .replace(/<br\s*\/?>/g, '\n')  // Line breaks
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')  // Paragraphs
    .replace(/<ul>(.*?)<\/ul>/gs, (match, items) => '\n' + items.replace(/<li>(.*?)<\/li>/g, '- $1')) // Preserve bullet lists
    .replace(/<ol>(.*?)<\/ol>/gs, (match, items) => '\n' + items.replace(/<li>(.*?)<\/li>/g, (m, item, i) => `${i + 1}. ${item}`)) // Preserve numbered lists
    .replace(/<code>(.*?)<\/code>/g, '`$1`') // Inline code
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, codeBlock) => `\n\`\`\`\n${codeBlock.trim()}\n\`\`\`\n`) // Multiline code blocks
    .replace(/<\/?[^>]+(>|$)/g, ""); // Strip remaining HTML tags
}
