document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveButton = document.getElementById('saveButton');
    const status = document.getElementById('status');
  
    // 1) Load saved settings when the Options page loads:
    chrome.storage.sync.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        apiKeyInput.value = result.openaiApiKey;
      }
    });
  
    // 2) Listen for save button clicks:
    saveButton.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        status.textContent = 'Please enter a valid API key.';
        return;
      }
  
      // Save it to chrome.storage
      chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
        // Show a message to let user know it was saved
        status.textContent = 'API key saved successfully!';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      });
    });
  });
  