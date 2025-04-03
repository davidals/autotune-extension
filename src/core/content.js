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
    console.log('autotune.content: Looking for Quill editor...');
    console.log('autotune.content: Active element:', document.activeElement);
    
    // Detect Quill.js editors
    const quillEditors = document.querySelectorAll('.ql-editor[contenteditable="true"]');
    console.log('autotune.content: Found Quill editors:', quillEditors.length);

    // Find the focused Quill editor
    for (let editor of quillEditors) {
      console.log('autotune.content: Checking editor:', editor);
      if (document.activeElement === editor) {
        console.log('autotune.content: Found focused editor');
        // Try different ways to find the Quill instance
        const container = editor.closest('.ql-container');
        const dataQuill = editor.closest('[data-quill]');
        console.log('autotune.content: Container:', container);
        console.log('autotune.content: Data Quill:', dataQuill);
        
        // Try to find Quill instance through various paths
        const quillInstance = container?.__quill || 
                            dataQuill?.__quill ||
                            editor.__quill ||
                            editor.parentElement?.__quill ||
                            container?.querySelector('.ql-editor')?.__quill ||
                            // Try to find Quill through container properties
                            Object.values(container || {}).find(val => val?.getText) ||
                            Object.values(editor || {}).find(val => val?.getText);
        
        console.log('autotune.content: Quill instance:', quillInstance);
        
        if (quillInstance) {
          console.log('autotune.content: Found Quill instance:', quillInstance);
          return quillInstance;
        }
      }
    }

    // If no focused editor, try to find any Quill instance
    const container = document.querySelector('.ql-container');
    const dataQuill = document.querySelector('[data-quill]');
    console.log('autotune.content: Any container:', container);
    console.log('autotune.content: Any data quill:', dataQuill);
    
    // Try to find Quill instance through various paths
    const anyQuill = container?.__quill || 
                    dataQuill?.__quill ||
                    container?.querySelector('.ql-editor')?.__quill ||
                    document.querySelector('.ql-editor')?.__quill ||
                    // Try to find Quill through container properties
                    Object.values(container || {}).find(val => val?.getText);
                    
    if (anyQuill) {
      console.log('autotune.content: Found any Quill instance:', anyQuill);
      return anyQuill;
    }

    console.log('autotune.content: No Quill instance found');
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
      console.log('autotune.content: Getting focused text...');
      
      // Try to get text from the last focused element first
      if (lastFocusedElement && lastFocusedElement.classList.contains('ql-editor')) {
        console.log('autotune.content: Found last focused editor:', lastFocusedElement);
        const text = lastFocusedElement.innerText.trim();
        console.log('autotune.content: Got text from last focused element:', text);
        sendResponse({ text: text });
        return true;
      }

      // If no last focused element, try to find the active editor
      const activeEditor = document.querySelector('.ql-editor[contenteditable="true"]:focus');
      if (activeEditor) {
        console.log('autotune.content: Found active editor:', activeEditor);
        const text = activeEditor.innerText.trim();
        console.log('autotune.content: Got text from active editor:', text);
        sendResponse({ text: text });
        return true;
      }

      // If no active editor, try to find any editor with content
      const editors = document.querySelectorAll('.ql-editor[contenteditable="true"]');
      for (let editor of editors) {
        const text = editor.innerText.trim();
        if (text) {
          console.log('autotune.content: Found editor with content:', editor);
          console.log('autotune.content: Got text from editor with content:', text);
          sendResponse({ text: text });
          return true;
        }
      }

      console.log('autotune.content: No text found in any editor');
      sendResponse({ text: "No text captured." });
      return true;
    }

    if (message.type === 'REPLACE_FOCUSED_TEXT') {
      console.log('autotune.content: Replacing text...');
      
      // Try to find the editor to replace text in
      let targetEditor = null;
      
      // First try last focused element
      if (lastFocusedElement && lastFocusedElement.classList.contains('ql-editor')) {
        console.log('autotune.content: Using last focused editor');
        targetEditor = lastFocusedElement;
      }
      // Then try active editor
      else if (document.activeElement.classList.contains('ql-editor')) {
        console.log('autotune.content: Using active editor');
        targetEditor = document.activeElement;
      }
      // Finally try any editor
      else {
        const editors = document.querySelectorAll('.ql-editor[contenteditable="true"]');
        for (let editor of editors) {
          if (editor.innerText.trim()) {
            console.log('autotune.content: Using editor with content');
            targetEditor = editor;
            break;
          }
        }
      }

      if (targetEditor) {
        console.log('autotune.content: Found editor to update:', targetEditor);
        // Set the text content
        targetEditor.innerHTML = message.text.trim();
        console.log('autotune.content: Updated editor content');
      } else {
        console.log('autotune.content: No editor found to update');
      }
    }
  });
})(); 