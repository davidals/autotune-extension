const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Text Enhancement Acceptance Tests', () => {
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

  function mockChromeAPI() {
    window.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      tabs: {
        query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
        sendMessage: jest.fn().mockImplementation((tabId, message) => {
          if (message.type === 'GET_FOCUSED_TEXT') {
            return Promise.resolve({ text: originalText });
          }
          return Promise.resolve({});
        }),
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue()
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

  function loadPopupScript(textFormatterCode) {
    const popupScript = fs.readFileSync(path.join(__dirname, '../../src/ui/popup.js'), 'utf8')
      .replace(/import.*from.*\n/g, '')
      .replace('export class', 'class');

    const scriptElement = document.createElement('script');
    scriptElement.textContent = `
      class OpenAIService {
        constructor() {
          this.initialize = async () => true;
          this.hasValidApiKey = () => true;
          this.enhanceText = async (text) => \`Enhanced: \${text}\`;
          this.setModel = async () => {};
          this.getModel = () => 'gpt-3.5-turbo';
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

  beforeEach(async () => {
    dom = createJSDOMInstance();
    setupGlobalWindowAndDocument();
    setInitialText();
    mockChromeAPI();
    
    const textFormatterCode = loadTextFormatter();
    loadMarkedLibrary();
    loadCSS();
    loadPopupScript(textFormatterCode);
    
    await waitForInitialization();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should enhance text when enhance button is clicked', async () => {
    const enhanceButton = document.getElementById('enhance-button');
    const clickEvent = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    enhanceButton.dispatchEvent(clickEvent);

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(document.getElementById('text-container').textContent).toContain('Enhanced: Original text');
    expect(document.getElementById('status-message').textContent).toBe('Enhancement complete!');
  });
}); 