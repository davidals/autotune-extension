document.addEventListener('DOMContentLoaded', async () => {
    const markdownContainer = document.getElementById('markdown-container');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0].id;
        chrome.tabs.sendMessage(activeTabId, { type: 'GET_FOCUSED_TEXT' }, async (response) => {
            if (chrome.runtime.lastError) {
                markdownContainer.textContent = 'No text or no permission.';
                return;
            }

            const rawText = response?.text?.trim();
            if (!rawText) {
                markdownContainer.textContent = 'No text captured.';
                return;
            }

            // Show a loading message while we process
            markdownContainer.textContent = 'Autotuning...';

            // Retrieve OpenAI API Key from storage
            chrome.storage.sync.get('openaiApiKey', async (data) => {
                if (!data.openaiApiKey) {
                    markdownContainer.textContent = 'API key missing. Please set it in options.';
                    return;
                }

                const apiKey = data.openaiApiKey;

                // OpenAI API call
                try {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo', // Cheapest model
                            messages: [
                                {
                                    role: 'system',
                                    content: `Help me refine my communication.
                  
                  I want to improve the clarity and tone of my messages while keeping the original intent and opinions intact.
                  
                  - Make the language less aggressive, more positive, and inviting.
                  - Keep the message concise, clear, and easy to read (avoid excessive verbosity or complex words).
                  - Maintain a professional yet friendly tone.
                  - Do not change quotes (lines that start with '>').
                  
                  I will provide a message I wrote, and you will return a refined version of it in Markdown format—without any additional commentary.`
                                },
                                { role: 'user', content: rawText },
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
