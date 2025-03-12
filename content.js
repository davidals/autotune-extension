// content.js

// // We'll store references to our currently visible icon and the input it belongs to
// let currentIcon = null;
// let currentTarget = null;
// //////////// ICON HANDLING /////////////
// /**
//  * Create an icon/button DOM element. 
//  * Here, you could insert an <img>, <svg>, or just text. 
//  */
// function createIconElement() {
//   const icon = document.createElement('div');
//   icon.classList.add('autotune-icon'); // We'll style this in content.css
//     // Create an <img> element and set its source to the PNG icon
//     const img = document.createElement('img');
    
//     // chrome.runtime.getURL() gives you the absolute path to files in your extension
//     img.src = chrome.runtime.getURL('icons/32.png');
    
//     // Optional: Control sizing via JS or via CSS
//     img.style.width = '8px';
//     img.style.height = '8px';

//     // Append <img> to our container div
//     icon.appendChild(img);

//   // Some basic styling (if we decide to do it inline instead of content.css)
//   icon.style.position = 'absolute';
//   icon.style.cursor = 'pointer';
  
//   icon.addEventListener('click', () => {
//     if (!currentTarget) return;
  
//     // If it's a standard input or textarea:
//     if (currentTarget.tagName === 'INPUT' || currentTarget.tagName === 'TEXTAREA') {
//       currentTarget.value = 'autotune clicked';
//     } 
//     // Otherwise, assume contentEditable or a custom textbox:
//     else {
//       currentTarget.innerText = 'autotune clicked';
//     }
//   });
  
//   icon.addEventListener('click', () => {
//     if (!currentTarget) return;
//     console.log('Autotune clicked');
//     // If it's a regular <input> or <textarea>:
//     if (currentTarget.tagName === 'INPUT' || currentTarget.tagName === 'TEXTAREA') {
//       currentTarget.value = 'autotune clicked';
//       currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
//       return;
//     }
  
//     // Otherwise, assume it's a Slack-like contenteditable div
//     if (currentTarget.isContentEditable) {
//       // Make sure we have focus
//       currentTarget.focus();
  
//       // Select all existing text, then delete it
//       document.execCommand('selectAll', false, null);
//       document.execCommand('delete', false, null);
  
//       // Attempt to insert the replacement text
//       const success = document.execCommand('insertText', false, 'autotune clicked');
      
//       // If insertText fails (some browsers or Slack might block it), 
//       // fall back to direct textContent assignment
//       if (!success) {
//         currentTarget.textContent = 'autotune clicked';
//       }
  
//       // Let the app know we've changed the text
//       currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
//     }
//   });

//   return icon;
// }

// /**
//  * Position the icon near the target input box. 
//  * This is a naive approach that just places the icon to the right.
//  */
// function positionIcon(icon, target) {
//   const rect = target.getBoundingClientRect();
  
//   // If the page is scrolled, we need to account for that with window.scrollX and window.scrollY
//   icon.style.top = window.scrollY + rect.top + "px";
//   icon.style.left = window.scrollX + rect.right + 5 + "px"; // 5px offset to the right
// }

// /**
//  * Show the icon for a given target (input/textarea)
//  */
// function showIconFor(target) {
//   // If an icon is already present, remove it
//   if (currentIcon) {
//     currentIcon.remove();
//   }

//   // Create the new icon
//   currentIcon = createIconElement();
//   currentTarget = target;

//   // We must attach the icon to the DOM so it becomes visible
//   document.body.appendChild(currentIcon);

//   // Position it
//   positionIcon(currentIcon, currentTarget);
// }

// /**
//  * Hide the icon
//  */
// function hideIcon() {
//   if (currentIcon) {
//     currentIcon.remove();
//     currentIcon = null;
//     currentTarget = null;
//   }
// }

// setInterval(() => {
//   if (isTextField(document.activeElement)) {
//     showIconFor(document.activeElement);
//   }
// }, 2000);

// /**
//  * If the user scrolls or resizes, reposition the icon if it's visible.
//  */
// window.addEventListener('scroll', () => {
//   if (currentIcon && currentTarget) {
//     positionIcon(currentIcon, currentTarget);
//   }
// }, true);

// window.addEventListener('resize', () => {
//   if (currentIcon && currentTarget) {
//     positionIcon(currentIcon, currentTarget);
//   }
// });

// const active = document.activeElement;
// if (isTextField(document.activeElement)) {
//   showIconFor(document.activeElement);
// }
/////////////////// GET_FOCUSED_TEXT ///////////////////


// 1) We track the last focused text element here (only valid in content script context)
let lastFocusedElement = null;

function isTextField(el) {
  return (
    (el.tagName === 'INPUT' && el.type === 'text') ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox'
  );
}

// 2) On focus, store the element reference in our variable
document.addEventListener('focusin', (event) => {
  if (isTextField(event.target)) {
    lastFocusedElement = event.target;
  }
});

// 3) Listen for popup requests for current text
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'GET_FOCUSED_TEXT') {
//     let text = '';
//     if (lastFocusedElement) {
//       if (lastFocusedElement.tagName === 'INPUT' || lastFocusedElement.tagName === 'TEXTAREA') {
//         text = lastFocusedElement.value;
//       } else {
//         text = lastFocusedElement.innerText;
//       }
//     }
//     sendResponse({ text });
//     // Return true indicates asynchronous response (though not needed if we respond immediately)
//     return true;
//   }
// });


function getSlackFormattedText() {
  const slackEditor = document.querySelector('.ql-editor[contenteditable="true"]');
  if (!slackEditor) {
    console.log("Slack editor not found.");
    return null;
  }
  return slackEditor.innerHTML.trim(); // Extract HTML content
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_FOCUSED_TEXT') {
    const formattedText = getSlackFormattedText();
    sendResponse({ text: formattedText || "No text captured." });
    return true;
  }
});
