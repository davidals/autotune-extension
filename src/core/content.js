import { TextDetector } from './textDetector.js';

const textDetector = new TextDetector();

// Listen for focus events to track the last focused text element
document.addEventListener('focusin', (event) => {
  if (textDetector.isTextField(event.target)) {
    textDetector.lastFocusedElement = event.target;
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_FOCUSED_TEXT') {
    const editor = textDetector.getFocusedEditor();
    sendResponse({ text: editor ? textDetector.getTextContent(editor) : "No text captured." });
    return true;
  }

  if (message.type === 'REPLACE_FOCUSED_TEXT') {
    const editor = textDetector.getFocusedEditor();
    if (editor) {
      textDetector.setTextContent(editor, message.text);
    }
  }
}); 