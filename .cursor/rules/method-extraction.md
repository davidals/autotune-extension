# Method Extraction Guidelines

## When to Extract Methods

Extract methods when they:
- Encapsulate a meaningful, self-contained operation
- Group multiple related statements
- Improve readability by giving a name to a complex operation
- Are likely to be reused
- Make the code more testable

## When NOT to Extract Methods

Do NOT extract methods when:
- The method would only wrap a single line of code
- The operation is simple and self-explanatory
- The extraction would make the code harder to follow
- The method name would be redundant with the code it contains

## Naming Conventions

Method names should:
- Clearly describe what they do
- Use verbs or verb phrases (e.g., `loadMarkedLibrary`, `setupGlobalWindowAndDocument`)
- Avoid generic names like `doSomething` or `processData`
- Be more descriptive than a comment would be

## Examples

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

## Benefits

Following these guidelines leads to:
- Improved code readability
- Better maintainability
- Easier testing
- Reduced code duplication
- Self-documenting code 