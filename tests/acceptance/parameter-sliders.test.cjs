const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Parameter Sliders Acceptance Tests', () => {
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
    const storedParams = {
      enhancementParams: {
        verbosity: 30,
        formality: 70,
        tone: 40,
        complexity: 60,
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
          this.enhanceText = async (text, params) => {
            return \`Enhanced with params: \${JSON.stringify(params)}\n\${text}\`;
          };
          this.setModel = async () => {};
          this.getModel = () => 'gpt-3.5-turbo';
          this.loadModel = async () => {};
        }
      }

      ${textFormatterCode}
      
      class EnhancementParams {
        constructor() {
          this.verbosity = 30;
          this.formality = 70;
          this.tone = 40;
          this.complexity = 60;
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

  test('should load saved parameter values from storage', async () => {
    const verbositySlider = document.getElementById('verbosity-slider');
    const formalitySlider = document.getElementById('formality-slider');
    const toneSlider = document.getElementById('tone-slider');
    const complexitySlider = document.getElementById('complexity-slider');
    const persuasivenessSlider = document.getElementById('persuasiveness-slider');

    expect(verbositySlider.value).toBe('30');
    expect(formalitySlider.value).toBe('70');
    expect(toneSlider.value).toBe('40');
    expect(complexitySlider.value).toBe('60');
    expect(persuasivenessSlider.value).toBe('50');
  });

  test('should update parameters when sliders change', async () => {
    const verbositySlider = document.getElementById('verbosity-slider');
    verbositySlider.value = '80';
    verbositySlider.dispatchEvent(new window.Event('input'));

    const enhanceButton = document.getElementById('enhance-button');
    enhanceButton.click();

    await new Promise(resolve => setTimeout(resolve, 500));

    const enhancedText = document.getElementById('text-container').textContent;
    expect(enhancedText).toContain('"verbosity":80');
    expect(enhancedText).toContain('"formality":70');
    expect(enhancedText).toContain('"tone":40');
    expect(enhancedText).toContain('"complexity":60');
    expect(enhancedText).toContain('"persuasiveness":50');
  });

  test('should save parameters to storage when sliders change', async () => {
    const complexitySlider = document.getElementById('complexity-slider');
    complexitySlider.value = '25';
    complexitySlider.dispatchEvent(new window.Event('change'));

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancementParams: expect.objectContaining({
          complexity: 25
        })
      })
    );
  });
}); 