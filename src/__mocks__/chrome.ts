/**
 * Chrome Extension API Mocks for Jest
 * Mocks the chrome.* APIs used by the extension
 */

// Storage mock data
const mockStorage: Record<string, unknown> = {};

// Mock runtime.lastError

// Create mock chrome object with callback-based API (like real Chrome)
const chromeMock = {
  runtime: {
    lastError: undefined as { message: string } | undefined,
    sendMessage: jest.fn((_message, callback) => {
      if (callback) callback({});
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
    id: 'mock-extension-id',
  },

  // Storage API - callback-based
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        // Handle both promise and callback patterns
        let result: Record<string, unknown> = {};
        
        if (keys === null || keys === undefined) {
          result = { ...mockStorage };
        } else if (typeof keys === 'string') {
          result = { [keys]: mockStorage[keys] };
        } else if (Array.isArray(keys)) {
          keys.forEach((key) => {
            result[key] = mockStorage[key];
          });
        } else {
          Object.keys(keys).forEach((key) => {
            result[key] = mockStorage[key] ?? (keys as Record<string, unknown>)[key];
          });
        }
        
        if (callback) {
          chromeMock.runtime.lastError = undefined;
          callback(result);
        }
        return Promise.resolve(result);
      }),
      
      set: jest.fn((items, callback) => {
        Object.assign(mockStorage, items);
        if (callback) {
          chromeMock.runtime.lastError = undefined;
          callback();
        }
        return Promise.resolve();
      }),
      
      remove: jest.fn((keys, callback) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach((key) => {
          delete mockStorage[key];
        });
        if (callback) {
          chromeMock.runtime.lastError = undefined;
          callback();
        }
        return Promise.resolve();
      }),
      
      clear: jest.fn((callback) => {
        Object.keys(mockStorage).forEach((key) => {
          delete mockStorage[key];
        });
        if (callback) {
          chromeMock.runtime.lastError = undefined;
          callback();
        }
        return Promise.resolve();
      }),
      
      getBytesInUse: jest.fn((_keys, callback) => {
        const bytes = JSON.stringify(mockStorage).length;
        if (callback) {
          chromeMock.runtime.lastError = undefined;
          callback(bytes);
        }
        return Promise.resolve(bytes);
      }),
    },
    sync: {
      get: jest.fn((_keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((_items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((_keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },

  // Tabs API
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    create: jest.fn((options) => {
      return Promise.resolve({
        id: Math.floor(Math.random() * 10000),
        url: options.url || '',
        title: 'New Tab',
        active: options.active ?? false,
        pinned: options.pinned ?? false,
        index: options.index ?? 0,
        windowId: options.windowId ?? 1,
        highlighted: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      });
    }),
    update: jest.fn((tabId, props) => Promise.resolve({ ...props, id: tabId })),
    remove: jest.fn(() => Promise.resolve()),
    get: jest.fn((tabId) =>
      Promise.resolve({
        id: tabId,
        url: 'https://example.com',
        title: 'Example',
        active: false,
        pinned: false,
        index: 0,
        windowId: 1,
        highlighted: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      })
    ),
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Windows API
  windows: {
    getCurrent: jest.fn(() =>
      Promise.resolve({
        id: 1,
        focused: true,
        type: 'normal',
        state: 'normal',
        alwaysOnTop: false,
        incognito: false,
      })
    ),
    create: jest.fn((options) =>
      Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        focused: options?.focused ?? true,
        type: options?.type ?? 'normal',
        state: options?.state ?? 'normal',
        alwaysOnTop: false,
        incognito: options?.incognito ?? false,
        tabs: [],
      })
    ),
    getAll: jest.fn(() => Promise.resolve([])),
  },

  // Alarms API
  alarms: {
    create: jest.fn(),
    clear: jest.fn(() => Promise.resolve(true)),
    get: jest.fn(() => Promise.resolve(undefined)),
    getAll: jest.fn(() => Promise.resolve([])),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Notifications API
  notifications: {
    create: jest.fn(() => Promise.resolve('notification-id')),
    clear: jest.fn(() => Promise.resolve(true)),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Context Menus API
  contextMenus: {
    create: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Commands API
  commands: {
    onCommand: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Tab Groups API
  tabGroups: {
    query: jest.fn(() => Promise.resolve([])),
    update: jest.fn(() => Promise.resolve({})),
    get: jest.fn(() => Promise.resolve({})),
  },

  // Scripting API
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: null }])),
  },
};

// Assign to global
(global as unknown as { chrome: typeof chromeMock }).chrome = chromeMock;

// Export for use in tests
export const mockChrome = chromeMock;

// Helper to clear all storage between tests
export function clearMockStorage(): void {
  Object.keys(mockStorage).forEach((key) => {
    delete mockStorage[key];
  });
}

// Helper to set mock storage data
export function setMockStorage(data: Record<string, unknown>): void {
  Object.assign(mockStorage, data);
}

// Helper to get mock storage data
export function getMockStorage(): Record<string, unknown> {
  return { ...mockStorage };
}

// Helper to set last error for error testing
export function setMockError(message: string | undefined): void {
  if (message) {
    chromeMock.runtime.lastError = { message };
  } else {
    chromeMock.runtime.lastError = undefined;
  }
}
