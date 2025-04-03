const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('API Key Validation Acceptance Tests', () => {
  let dom;
  let document;
  let window;
  let openAIService;
  const originalText = 'Original text';

  function createJSDOMInstance() {
    const html = fs.readFileSync(path.join(__dirname, '../../src/ui/popup.html'), 'utf8');
    return new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: `file://${path.resolve(__dirname, '../../src/ui')}/`,
      contentType: 'text/html',
      includeNodeLocations: true,
      pretendToBeVisual: true
    });
  }

  function setupGlobalWindowAndDocument() {
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  }

  function setInitialText() {
    const textContainer = document.getElementById('text-container');
    textContainer.textContent = originalText;
  }

  function mockChromeAPI(hasValidApiKey = true) {
    const storedParams = {
      enhancementParams: {
        verbosity: 50,
        formality: 50,
        tone: 50,
        complexity: 50,
        persuasiveness: 50
      },
      openaiModel: 'gpt-3.5-turbo'
    };

    window.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockImplementation(keys => {
            if (Array.isArray(keys)) {
              const result = {};
              keys.forEach(key => {
                result[key] = storedParams[key];
              });
              return Promise.resolve(result);
            }
            return Promise.resolve(storedParams);
          }),
          set: jest.fn().mockImplementation(params => Promise.resolve())
        }
      },
      tabs: {
        query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
        sendMessage: jest.fn().mockImplementation((tabId, message) => {
          if (message.type === 'GET_FOCUSED_TEXT') {
            return Promise.resolve({ text: originalText, url: 'https://example.com' });
          }
          return Promise.resolve({});
        })
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue([{ result: { text: originalText } }])
      },
      runtime: {
        lastError: null
      }
    };
  }

  function loadTextFormatter() {
    const textFormatterCode = fs.readFileSync(path.join(__dirname, '../../src/utils/textFormatter.js'), 'utf8')
      .replace('export class', 'class');
    return textFormatterCode;
  }

  function loadMarkedLibrary() {
    const markedScript = fs.readFileSync(path.join(__dirname, '../../src/lib/marked.min.js'), 'utf8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = markedScript;
    document.head.appendChild(scriptEl);
  }

  function loadCSS() {
    const cssContent = fs.readFileSync(path.join(__dirname, '../../src/ui/popup.css'), 'utf8');
    const styleEl = document.createElement('style');
    styleEl.textContent = cssContent;
    document.head.appendChild(styleEl);
  }

  function loadPopupScript(textFormatterCode, hasValidApiKey = true) {
    const popupScript = fs.readFileSync(path.join(__dirname, '../../src/ui/popup.js'), 'utf8')
      .replace(/import.*from.*\n/g, '')
      .replace('export class', 'class');

    const scriptElement = document.createElement('script');
    scriptElement.textContent = `
      window.OpenAIService = class {
        constructor() {
          this.initialize = async () => ${hasValidApiKey};
          this.hasValidApiKey = () => ${hasValidApiKey};
          this.enhanceText = async (text, params) => {
            return \`Enhanced with model: \${this.getModel()}\n\${text}\`;
          };
          this.setModel = async (model) => {
            this.model = model;
          };
          this.getModel = () => this.model || 'gpt-3.5-turbo';
          this.loadModel = async () => {};
        }
      }

      ${textFormatterCode}
      
      class EnhancementParams {
        constructor() {
          this.verbosity = 50;
          this.formality = 50;
          this.tone = 50;
          this.complexity = 50;
          this.persuasiveness = 50;
        }
      }
      
      ${popupScript}
      
      window.popupManager = new PopupManager();
    `;
    document.body.appendChild(scriptElement);
  }

  async function waitForInitialization() {
    await new Promise(resolve => setTimeout(resolve, 100));
    openAIService = window.popupManager.openaiService;
    await window.popupManager.initialize();
  }

  async function setupTest(hasValidApiKey = true) {
    dom = createJSDOMInstance();
    setupGlobalWindowAndDocument();
    setInitialText();
    mockChromeAPI();
    
    const textFormatterCode = loadTextFormatter();
    loadMarkedLibrary();
    loadCSS();
    loadPopupScript(textFormatterCode, hasValidApiKey);
    
    await waitForInitialization();
  }

  beforeEach(async () => {
    await setupTest(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should show error message when API key is invalid', async () => {
    await setupTest(false);

    const textContainer = document.getElementById('text-container');
    expect(textContainer.textContent).toBe('API key missing. Please set it in options.');
  });

  test('should disable enhance button when API key is invalid', async () => {
    await setupTest(false);

    const enhanceButton = document.getElementById('enhance-button');
    expect(enhanceButton.disabled).toBe(true);
  });

  test('should enable enhance button when API key is valid', async () => {
    const enhanceButton = document.getElementById('enhance-button');
    expect(enhanceButton.disabled).toBe(false);
  });

  test('should show success message when API key is valid', async () => {
    const textContainer = document.getElementById('text-container');
    expect(textContainer.textContent).toBe(originalText);
  });
}); 