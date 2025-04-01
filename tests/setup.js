// Mock Chrome APIs
global.chrome = {
  runtime: {
    lastError: null,
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock marked library
global.marked = {
  parse: jest.fn(text => text)
};

// Mock DOM APIs
global.document = {
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window APIs
global.window = {
  setTimeout: jest.fn(callback => callback()),
  clearTimeout: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({})
})); 