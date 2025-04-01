# Logging Rules

## Format
All logs should follow this pattern:
```
autotune.<component>: <message>
```

Where:
- `autotune` is the application name
- `<component>` is the source file/module name (without extension)
- `<message>` is the descriptive message

## Examples
```javascript
// Good
console.log('autotune.popup: Extension popup loaded');
console.log('autotune.openai: API request sent');
console.error('autotune.content: Failed to capture text');

// Bad
console.log('Popup loaded');  // Missing prefix
console.log('Autotune: API request');  // Wrong format
console.log('autotune: popup loaded');  // Wrong separator
```

## Rules

1. **Prefix Required**
   - Every log must start with `autotune.`
   - This helps filter logs in the console

2. **Component Naming**
   - Use the file/module name as the component
   - Remove file extensions
   - Use lowercase with dots for subdirectories
   - Examples:
     - `popup.js` → `autotune.popup`
     - `src/services/openai.js` → `autotune.services.openai`

3. **Message Format**
   - Start with a capital letter
   - Use present tense
   - Be descriptive but concise
   - Include relevant data in a structured format
   - Examples:
     ```javascript
     // Good
     console.log('autotune.popup: Loading parameters:', { verbosity: 50, model: 'gpt-4' });
     
     // Bad
     console.log('autotune.popup: params loaded');  // Too vague
     console.log('autotune.popup: loading parameters');  // Wrong tense
     ```

4. **Error Logging**
   - Use `console.error` for errors
   - Include the error object as a second parameter
   - Example:
     ```javascript
     try {
       // code
     } catch (error) {
       console.error('autotune.popup: Failed to initialize:', error);
     }
     ```

5. **Debug vs Info**
   - Use `console.log` for normal operation info
   - Use `console.debug` for detailed debugging info
   - Example:
     ```javascript
     console.log('autotune.popup: Button clicked');
     console.debug('autotune.popup: Button state:', { disabled: false, text: 'Enhance' });
     ```

6. **Performance**
   - Don't log sensitive information (API keys, user data)
   - Don't log in tight loops or performance-critical code
   - Use appropriate log levels to control verbosity

7. **Consistency**
   - Use consistent terminology across logs
   - Keep message structure similar for similar events
   - Example:
     ```javascript
     // Good - Consistent structure
     console.log('autotune.popup: Loading parameters...');
     console.log('autotune.popup: Parameters loaded successfully');
     
     // Bad - Inconsistent
     console.log('autotune.popup: Loading parameters...');
     console.log('autotune.popup: Done loading params');  // Different style
     ```

## Usage Examples

### Initialization
```javascript
console.log('autotune.popup: Initializing PopupManager');
console.log('autotune.popup: API key found, loading parameters...');
```

### User Actions
```javascript
console.log('autotune.popup: Enhance button clicked');
console.log('autotune.popup: Model changed to: gpt-4');
```

### State Changes
```javascript
console.log('autotune.popup: Text captured successfully');
console.log('autotune.popup: Parameters updated:', { verbosity: 75, formality: 50 });
```

### Errors
```javascript
console.error('autotune.popup: Failed to initialize:', error);
console.error('autotune.popup: API request failed:', error);
```

### Debug Information
```javascript
console.debug('autotune.popup: Current state:', { 
  textLength: 150,
  parameters: { verbosity: 50 }
});
``` 