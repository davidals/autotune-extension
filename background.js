// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed!");
  });
  
  // Example: Listens for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      console.log(`Tab updated: ${tab.url}`);
      // You could do something here, like:
      // chrome.tabs.sendMessage(tabId, { message: "Tab just updated!" });
    }
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FOCUSED_TEXT_CHANGED') {
      chrome.storage.local.set({ lastFocusedText: message.text });
    }
  });
  