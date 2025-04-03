# Development Rules

## Code Organization

### Method Extraction Rule
When writing code, follow these guidelines for method extraction:

1. **Extract methods when they:**
   - Encapsulate a meaningful, self-contained operation
   - Group multiple related statements
   - Improve readability by giving a name to a complex operation
   - Are likely to be reused
   - Make the code more testable

2. **Do NOT extract methods when:**
   - The method would only wrap a single line of code
   - The operation is simple and self-explanatory
   - The extraction would make the code harder to follow
   - The method name would be redundant with the code it contains

3. **Naming conventions:**
   - Method names should clearly describe what they do
   - Use verbs or verb phrases (e.g., `loadMarkedLibrary`, `setupGlobalWindowAndDocument`)
   - Avoid generic names like `doSomething` or `processData`
   - The method name should be more descriptive than a comment would be

4. **Examples:**
   ```javascript
   // Good: Multiple related operations grouped together
   function setupTestEnvironment() {
     createJSDOMInstance();
     setupGlobalWindowAndDocument();
     setInitialText();
     mockChromeAPI();
   }

   // Good: Complex operation with a clear name
   function loadPopupScript(textFormatterCode) {
     const popupScript = fs.readFileSync(path.join(__dirname, '../../src/ui/popup.js'), 'utf8')
       .replace(/import.*from.*\n/g, '')
       .replace('export class', 'class');
     // ... more complex setup
   }

   // Bad: Single line wrapped in a method
   function getText() {
     return document.getElementById('text-container').textContent;
   }

   // Better: Use the line directly
   const text = document.getElementById('text-container').textContent;
   ```

5. **Benefits:**
   - Improved code readability
   - Better maintainability
   - Easier testing
   - Reduced code duplication
   - Self-documenting code

// ... existing code ... 