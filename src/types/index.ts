/**
 * Tab Vault - Core Type Definitions
 * All types are strictly defined to ensure type safety throughout the extension
 */

// ============================================================================
// TAB TYPES
// ============================================================================

/**
 * Represents scroll position data for a tab
 */
export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Represents form data captured from a tab
 * Only captures non-sensitive fields (excludes password, credit card, etc.)
 */
export interface FormData {
  [inputId: string]: string;
}

/**
 * Represents a single tab's data
 */
export interface TabData {
  /** Unique identifier for the tab within a session */
  id: string;
  /** Tab URL */
  url: string;
  /** Tab title */
  title: string;
  /** Favicon URL (may be data URL or remote URL) */
  favicon: string;
  /** Whether the tab is pinned */
  pinned: boolean;
  /** Tab group ID (-1 if not grouped) */
  groupId: number;
  /** Tab group color (if grouped) */
  groupColor?: string;
  /** Tab group name (if grouped) */
  groupName?: string;
  /** Scroll position when session was saved */
  scrollPosition?: ScrollPosition;
  /** Form data when session was saved */
  formData?: FormData;
  /** Tab index in the window */
  index: number;
  /** Whether the tab was active when saved */
  active: boolean;
  /** Whether the tab was muted */
  muted: boolean;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Session metadata for quick access without loading full session
 */
export interface SessionMetadata {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  folderId?: string;
  tabCount: number;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
  isEmergency: boolean;
  version: number;
  /** Preview of first few tab favicons */
  faviconPreview: string[];
  /** Preview of first few tab domains */
  domainPreview: string[];
}

/**
 * Complete session data
 */
export interface Session extends SessionMetadata {
  tabs: TabData[];
  /** Compressed tab data (used for large sessions) */
  compressedTabs?: string;
  /** Whether tabs are compressed */
  isCompressed: boolean;
}

/**
 * Session version for history tracking
 */
export interface SessionVersion {
  id: string;
  sessionId: string;
  timestamp: number;
  tabCount: number;
  /** Compressed snapshot of the session at this version */
  snapshot: string;
}

// ============================================================================
// FOLDER TYPES
// ============================================================================

/**
 * Folder for organizing sessions
 */
export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * Auto-save interval options (in minutes)
 */
export type AutoSaveInterval = 1 | 5 | 10 | 15 | 30 | 60 | 0;

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Extension settings
 */
export interface Settings {
  /** Auto-save interval in minutes (0 = disabled) */
  autoSaveInterval: AutoSaveInterval;
  /** Whether to save scroll position */
  saveScrollPosition: boolean;
  /** Whether to save form data */
  saveFormData: boolean;
  /** Whether to save tab groups */
  saveTabGroups: boolean;
  /** Maximum number of sessions to keep */
  maxSessions: number;
  /** Maximum number of emergency sessions */
  maxEmergencySessions: number;
  /** Days after which to auto-delete old sessions (0 = never) */
  autoDeleteAfterDays: number;
  /** Domains to exclude from saving */
  excludedDomains: string[];
  /** Whether to use compression for large sessions */
  useCompression: boolean;
  /** Tab count threshold for compression */
  compressionThreshold: number;
  /** Theme preference */
  theme: Theme;
  /** Whether to show notifications */
  showNotifications: boolean;
  /** Whether to use lazy loading when restoring */
  lazyRestore: boolean;
  /** Whether to detect duplicate tabs when restoring */
  detectDuplicates: boolean;
  /** Whether crash recovery is enabled */
  crashRecoveryEnabled: boolean;
  /** Whether onboarding has been completed */
  onboardingComplete: boolean;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  autoSaveInterval: 5,
  saveScrollPosition: true,
  saveFormData: true,
  saveTabGroups: true,
  maxSessions: 100,
  maxEmergencySessions: 5,
  autoDeleteAfterDays: 0,
  excludedDomains: [],
  useCompression: true,
  compressionThreshold: 50,
  theme: 'system',
  showNotifications: true,
  lazyRestore: true,
  detectDuplicates: true,
  crashRecoveryEnabled: true,
  onboardingComplete: false,
};

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Storage keys enum for type safety
 */
export enum StorageKey {
  SESSIONS = 'sessions',
  SESSION_METADATA = 'session_metadata',
  FOLDERS = 'folders',
  SETTINGS = 'settings',
  EMERGENCY_SESSIONS = 'emergency_sessions',
  SESSION_VERSIONS = 'session_versions',
  LAST_ACTIVE_SESSION = 'last_active_session',
  STATISTICS = 'statistics',
}

/**
 * Storage data structure
 */
export interface StorageData {
  [StorageKey.SESSIONS]: Record<string, Session>;
  [StorageKey.SESSION_METADATA]: SessionMetadata[];
  [StorageKey.FOLDERS]: Folder[];
  [StorageKey.SETTINGS]: Settings;
  [StorageKey.EMERGENCY_SESSIONS]: Session[];
  [StorageKey.SESSION_VERSIONS]: Record<string, SessionVersion[]>;
  [StorageKey.LAST_ACTIVE_SESSION]: string | null;
  [StorageKey.STATISTICS]: Statistics;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Usage statistics
 */
export interface Statistics {
  totalSessionsSaved: number;
  totalSessionsRestored: number;
  totalTabsSaved: number;
  totalTabsRestored: number;
  mostUsedSessions: Array<{ id: string; count: number }>;
  mostFrequentDomains: Array<{ domain: string; count: number }>;
  firstUseDate: number;
  lastUseDate: number;
}

// ============================================================================
// MESSAGE TYPES (for communication between parts of extension)
// ============================================================================

/**
 * Message types for internal communication
 */
export enum MessageType {
  // Session actions
  SAVE_SESSION = 'SAVE_SESSION',
  RESTORE_SESSION = 'RESTORE_SESSION',
  DELETE_SESSION = 'DELETE_SESSION',
  GET_SESSIONS = 'GET_SESSIONS',
  GET_SESSION = 'GET_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  DUPLICATE_SESSION = 'DUPLICATE_SESSION',
  MERGE_SESSIONS = 'MERGE_SESSIONS',
  SPLIT_SESSION = 'SPLIT_SESSION',

  // Folder actions
  CREATE_FOLDER = 'CREATE_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
  GET_FOLDERS = 'GET_FOLDERS',

  // Settings
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Content script actions
  GET_SCROLL_POSITION = 'GET_SCROLL_POSITION',
  GET_FORM_DATA = 'GET_FORM_DATA',
  RESTORE_SCROLL_POSITION = 'RESTORE_SCROLL_POSITION',
  RESTORE_FORM_DATA = 'RESTORE_FORM_DATA',

  // Backup actions
  EXPORT_SESSIONS = 'EXPORT_SESSIONS',
  IMPORT_SESSIONS = 'IMPORT_SESSIONS',

  // Statistics
  GET_STATISTICS = 'GET_STATISTICS',
  RESTORE_EMERGENCY_SESSION = 'RESTORE_EMERGENCY_SESSION',
  CLEAR_EMERGENCY_SESSIONS = 'CLEAR_EMERGENCY_SESSIONS',

  // Crash recovery
  CHECK_CRASH = 'CHECK_CRASH',
  GET_EMERGENCY_SESSIONS = 'GET_EMERGENCY_SESSIONS',
}

/**
 * Base message interface
 */
export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

/**
 * Response wrapper
 */
export interface Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// RESTORE OPTIONS
// ============================================================================

/**
 * Options for restoring a session
 */
export interface RestoreOptions {
  /** Whether to use lazy loading */
  lazy: boolean;
  /** Whether to restore in a new window */
  newWindow: boolean;
  /** Whether to restore pinned tabs */
  restorePinned: boolean;
  /** Whether to restore tab groups */
  restoreGroups: boolean;
  /** Whether to restore scroll positions */
  restoreScroll: boolean;
  /** Whether to restore form data */
  restoreFormData: boolean;
  /** Specific tab IDs to restore (if undefined, restore all) */
  tabIds?: string[];
}

/**
 * Default restore options
 */
export const DEFAULT_RESTORE_OPTIONS: RestoreOptions = {
  lazy: true,
  newWindow: false,
  restorePinned: true,
  restoreGroups: true,
  restoreScroll: true,
  restoreFormData: true,
};

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

/**
 * Search query options
 */
export interface SearchQuery {
  text?: string;
  tags?: string[];
  domains?: string[];
  folderId?: string;
  dateFrom?: number;
  dateTo?: number;
  minTabs?: number;
  maxTabs?: number;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  session: SessionMetadata;
  score: number;
  matchedTabs?: Array<{ id: string; title: string; url: string }>;
}
