// Setup específico para tests de API (Node environment)
// No incluye mocks de window/document

// Mock de console para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock básico de Request/Response para Next.js
if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() {
      this.map = new Map();
    }
    get(key) {
      return this.map.get(key);
    }
    set(key, value) {
      this.map.set(key, value);
    }
  };
}

