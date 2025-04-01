/**
 * Detects and handles text input elements on the page
 */

export class TextDetector {
  constructor() {
    this.lastFocusedElement = null;
  }

  /**
   * Checks if an element is a text input field
   * @param {HTMLElement} element - The element to check
   * @returns {boolean} True if the element is a text input
   */
  isTextField(element) {
    return (
      (element.tagName === 'INPUT' && element.type === 'text') ||
      element.tagName === 'TEXTAREA' ||
      element.isContentEditable ||
      element.getAttribute('role') === 'textbox'
    );
  }

  /**
   * Gets the currently focused text editor
   * @returns {HTMLElement|null} The focused editor element
   */
  getFocusedEditor() {
    const activeElement = document.activeElement;
    if (!activeElement) return null;

    // Check for Quill.js editor first
    const quillEditor = this.getQuillEditor();
    if (quillEditor) return quillEditor;

    // Check for generic text input
    if (this.isTextField(activeElement)) {
      return activeElement;
    }

    return null;
  }

  /**
   * Gets the Quill.js editor if it's focused
   * @returns {HTMLElement|null} The focused Quill editor
   */
  getQuillEditor() {
    const quillEditors = document.querySelectorAll('.ql-editor[contenteditable="true"]');
    for (let editor of quillEditors) {
      if (document.activeElement === editor) {
        return editor;
      }
    }
    return null;
  }

  /**
   * Gets the text content from an editor
   * @param {HTMLElement} editor - The editor element
   * @returns {string} The text content
   */
  getTextContent(editor) {
    if (!editor) return '';
    return editor.innerText.trim();
  }

  /**
   * Sets the text content in an editor
   * @param {HTMLElement} editor - The editor element
   * @param {string} text - The text to set
   */
  setTextContent(editor, text) {
    if (!editor) return;
    editor.innerText = text.trim();
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
} 