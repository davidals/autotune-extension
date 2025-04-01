// Content script for text detection and manipulation
(function() {
  let lastFocusedElement = null;

  function isTextField(el) {
    return (
      (el.tagName === 'INPUT' && el.type === 'text') ||
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable ||
      el.getAttribute('role') === 'textbox'
    );
  }

  function getQuillEditor() {
    // Detect Quill.js editors
    const quillEditors = document.querySelectorAll('.ql-editor[contenteditable="true"]');

    // Find the focused Quill editor
    for (let editor of quillEditors) {
      if (document.activeElement === editor) {
        return editor;
      }
    }

    return null; // No active Quill editor found
  }

  function getGenericTextInput() {
    const activeElement = document.activeElement;
    if (
      (activeElement.tagName === 'INPUT' && activeElement.type === 'text') ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('role') === 'textbox'
    ) {
      return activeElement;
    }
    return null;
  }

  // Listen for focus events to track the last focused text element
  document.addEventListener('focusin', (event) => {
    if (isTextField(event.target)) {
      lastFocusedElement = event.target;
    }
  });

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_FOCUSED_TEXT') {
      let editor = getQuillEditor() || getGenericTextInput();
      sendResponse({ text: editor ? editor.innerText.trim() : "No text captured." });
      return true;
    }

    if (message.type === 'REPLACE_FOCUSED_TEXT') {
      let editor = getQuillEditor() || getGenericTextInput();
      if (editor) {
        editor.innerText = message.text.trim(); // Insert markdown text
      }
    }
  });
})(); 