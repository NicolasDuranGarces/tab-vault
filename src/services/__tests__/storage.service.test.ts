/**
 * Storage Service Tests
 */

import { storageService } from '../storage.service';
import { clearMockStorage, setMockStorage, getMockStorage } from '../../__mocks__/chrome';
import { StorageKey, DEFAULT_SETTINGS } from '@/types';
import type { Session, SessionMetadata, Folder, Statistics } from '@/types';

describe('StorageService', () => {
  beforeEach(() => {
    clearMockStorage();
    jest.clearAllMocks();
  });

  // ============================================================================
  // BASIC STORAGE OPERATIONS
  // ============================================================================

  describe('get', () => {
    it('should get data from storage', async () => {
      setMockStorage({ settings: { theme: 'dark' } });
      const result = await storageService.get(StorageKey.SETTINGS);
      expect(result).toHaveProperty(StorageKey.SETTINGS);
    });

    it('should return empty object for non-existent key', async () => {
      const result = await storageService.get(StorageKey.SESSIONS);
      expect(result[StorageKey.SESSIONS]).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set data in storage', async () => {
      await storageService.set({ [StorageKey.SETTINGS]: DEFAULT_SETTINGS });
      const storage = getMockStorage();
      expect(storage[StorageKey.SETTINGS]).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('remove', () => {
    it('should remove data from storage', async () => {
      setMockStorage({ [StorageKey.SETTINGS]: DEFAULT_SETTINGS });
      await storageService.remove(StorageKey.SETTINGS);
      const storage = getMockStorage();
      expect(storage[StorageKey.SETTINGS]).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      setMockStorage({
        [StorageKey.SETTINGS]: DEFAULT_SETTINGS,
        [StorageKey.SESSIONS]: {},
      });
      await storageService.clear();
      const storage = getMockStorage();
      expect(Object.keys(storage)).toHaveLength(0);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage info with bytes used and quota', async () => {
      setMockStorage({ test: 'data' });
      const info = await storageService.getStorageInfo();
      expect(info).toHaveProperty('bytesUsed');
      expect(info).toHaveProperty('quota');
      expect(info.quota).toBe(10 * 1024 * 1024);
    });
  });

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  describe('getSessionMetadata', () => {
    it('should return empty array when no sessions exist', async () => {
      const metadata = await storageService.getSessionMetadata();
      expect(metadata).toEqual([]);
    });

    it('should return session metadata when sessions exist', async () => {
      const mockMetadata: SessionMetadata[] = [
        createMockSessionMetadata('1', 'Session 1'),
        createMockSessionMetadata('2', 'Session 2'),
      ];
      setMockStorage({ [StorageKey.SESSION_METADATA]: mockMetadata });

      const metadata = await storageService.getSessionMetadata();
      expect(metadata).toHaveLength(2);
      expect(metadata[0]?.name).toBe('Session 1');
    });
  });

  describe('getSession', () => {
    it('should return null for non-existent session', async () => {
      const session = await storageService.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should return session by ID', async () => {
      const mockSession = createMockSession('test-id', 'Test Session');
      setMockStorage({
        [StorageKey.SESSIONS]: { 'test-id': mockSession },
      });

      const session = await storageService.getSession('test-id');
      expect(session).not.toBeNull();
      expect(session?.name).toBe('Test Session');
    });
  });

  describe('getAllSessions', () => {
    it('should return empty object when no sessions exist', async () => {
      const sessions = await storageService.getAllSessions();
      expect(sessions).toEqual({});
    });

    it('should return all sessions', async () => {
      const sessions = {
        s1: createMockSession('s1', 'Session 1'),
        s2: createMockSession('s2', 'Session 2'),
      };
      setMockStorage({ [StorageKey.SESSIONS]: sessions });

      const result = await storageService.getAllSessions();
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe('saveSession', () => {
    it('should save a new session and update metadata', async () => {
      const session = createMockSession('new-id', 'New Session');
      await storageService.saveSession(session);

      const storage = getMockStorage();
      expect(storage[StorageKey.SESSIONS]).toHaveProperty('new-id');
      expect(storage[StorageKey.SESSION_METADATA]).toBeDefined();
    });

    it('should update existing session', async () => {
      const session = createMockSession('existing-id', 'Original Name');
      setMockStorage({
        [StorageKey.SESSIONS]: { 'existing-id': session },
        [StorageKey.SESSION_METADATA]: [createMockSessionMetadata('existing-id', 'Original Name')],
      });

      const updatedSession = { ...session, name: 'Updated Name' };
      await storageService.saveSession(updatedSession);

      const storage = getMockStorage();
      const sessions = storage[StorageKey.SESSIONS] as Record<string, Session>;
      expect(sessions['existing-id']?.name).toBe('Updated Name');
    });
  });

  describe('deleteSession', () => {
    it('should delete session and update metadata', async () => {
      const session = createMockSession('delete-me', 'To Delete');
      setMockStorage({
        [StorageKey.SESSIONS]: { 'delete-me': session },
        [StorageKey.SESSION_METADATA]: [createMockSessionMetadata('delete-me', 'To Delete')],
      });

      await storageService.deleteSession('delete-me');

      const storage = getMockStorage();
      const sessions = storage[StorageKey.SESSIONS] as Record<string, Session>;
      const metadata = storage[StorageKey.SESSION_METADATA] as SessionMetadata[];

      expect(sessions['delete-me']).toBeUndefined();
      expect(metadata.find(m => m.id === 'delete-me')).toBeUndefined();
    });
  });

  // ============================================================================
  // FOLDER OPERATIONS
  // ============================================================================

  describe('getFolders', () => {
    it('should return empty array when no folders exist', async () => {
      const folders = await storageService.getFolders();
      expect(folders).toEqual([]);
    });

    it('should return folders', async () => {
      const mockFolders: Folder[] = [createMockFolder('f1', 'Folder 1')];
      setMockStorage({ [StorageKey.FOLDERS]: mockFolders });

      const folders = await storageService.getFolders();
      expect(folders).toHaveLength(1);
    });
  });

  describe('saveFolders', () => {
    it('should save folders', async () => {
      const folders: Folder[] = [createMockFolder('f1', 'Test Folder')];
      await storageService.saveFolders(folders);

      const storage = getMockStorage();
      expect(storage[StorageKey.FOLDERS]).toEqual(folders);
    });
  });

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await storageService.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge stored settings with defaults', async () => {
      setMockStorage({ [StorageKey.SETTINGS]: { theme: 'dark' } });

      const settings = await storageService.getSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.autoSaveInterval).toBe(DEFAULT_SETTINGS.autoSaveInterval);
    });
  });

  describe('saveSettings', () => {
    it('should save partial settings', async () => {
      await storageService.saveSettings({ theme: 'light' });

      const settings = await storageService.getSettings();
      expect(settings.theme).toBe('light');
    });
  });

  // ============================================================================
  // EMERGENCY SESSION OPERATIONS
  // ============================================================================

  describe('getEmergencySessions', () => {
    it('should return empty array when no emergency sessions exist', async () => {
      const sessions = await storageService.getEmergencySessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('saveEmergencySession', () => {
    it('should save emergency session', async () => {
      const session = createMockSession('emergency-1', 'Emergency');
      await storageService.saveEmergencySession(session, 5);

      const sessions = await storageService.getEmergencySessions();
      expect(sessions).toHaveLength(1);
    });

    it('should limit emergency sessions to maxSessions', async () => {
      for (let i = 0; i < 7; i++) {
        const session = createMockSession(`emergency-${i}`, `Emergency ${i}`);
        await storageService.saveEmergencySession(session, 5);
      }

      const sessions = await storageService.getEmergencySessions();
      expect(sessions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('clearEmergencySessions', () => {
    it('should clear all emergency sessions', async () => {
      setMockStorage({
        [StorageKey.EMERGENCY_SESSIONS]: [createMockSession('e1', 'Emergency')],
      });

      await storageService.clearEmergencySessions();
      const sessions = await storageService.getEmergencySessions();
      expect(sessions).toEqual([]);
    });
  });

  // ============================================================================
  // STATISTICS OPERATIONS
  // ============================================================================

  describe('getStatistics', () => {
    it('should return default statistics when none exist', async () => {
      const stats = await storageService.getStatistics();
      expect(stats.totalSessionsSaved).toBe(0);
      expect(stats.totalTabsSaved).toBe(0);
    });

    it('should return stored statistics', async () => {
      const mockStats: Statistics = {
        totalSessionsSaved: 10,
        totalSessionsRestored: 5,
        totalTabsSaved: 100,
        totalTabsRestored: 50,
        mostUsedSessions: [],
        mostFrequentDomains: [],
        firstUseDate: Date.now(),
        lastUseDate: Date.now(),
      };
      setMockStorage({ [StorageKey.STATISTICS]: mockStats });

      const stats = await storageService.getStatistics();
      expect(stats.totalSessionsSaved).toBe(10);
    });
  });

  describe('updateStatistics', () => {
    it('should update statistics', async () => {
      await storageService.updateStatistics({ totalSessionsSaved: 5 });

      const stats = await storageService.getStatistics();
      expect(stats.totalSessionsSaved).toBe(5);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockSession(id: string, name: string): Session {
  return {
    id,
    name,
    description: '',
    tags: [],
    folderId: undefined,
    tabCount: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isEmergency: false,
    version: 1,
    faviconPreview: [],
    domainPreview: [],
    tabs: [
      {
        id: 'tab-1',
        url: 'https://example.com',
        title: 'Example',
        favicon: '',
        pinned: false,
        groupId: -1,
        index: 0,
        active: false,
        muted: false,
      },
      {
        id: 'tab-2',
        url: 'https://test.com',
        title: 'Test',
        favicon: '',
        pinned: false,
        groupId: -1,
        index: 1,
        active: true,
        muted: false,
      },
    ],
    isCompressed: false,
  };
}

function createMockSessionMetadata(id: string, name: string): SessionMetadata {
  return {
    id,
    name,
    description: '',
    tags: [],
    folderId: undefined,
    tabCount: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isEmergency: false,
    version: 1,
    faviconPreview: [],
    domainPreview: [],
  };
}

function createMockFolder(id: string, name: string): Folder {
  return {
    id,
    name,
    color: '#000000',
    icon: undefined,
    parentId: undefined,
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
