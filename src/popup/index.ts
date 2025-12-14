/**
 * Tab Vault Popup Script
 * Handles all popup UI interactions
 */

import { MessageType } from '@/types';
import type { SessionMetadata, Statistics, Response } from '@/types';
import './styles.css';

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Buttons
  saveSessionBtn: document.getElementById('saveSessionBtn') as HTMLButtonElement,
  openManagerBtn: document.getElementById('openManagerBtn') as HTMLButtonElement,
  settingsBtn: document.getElementById('settingsBtn') as HTMLButtonElement,
  
  // Search
  searchInput: document.getElementById('searchInput') as HTMLInputElement,
  
  // Sessions
  sessionsList: document.getElementById('sessionsList') as HTMLDivElement,
  sessionCount: document.getElementById('sessionCount') as HTMLSpanElement,
  emptyState: document.getElementById('emptyState') as HTMLDivElement,
  
  // Stats
  totalSessions: document.getElementById('totalSessions') as HTMLSpanElement,
  totalTabs: document.getElementById('totalTabs') as HTMLSpanElement,
  
  // Recovery
  recoveryNotice: document.getElementById('recoveryNotice') as HTMLDivElement,
  recoverBtn: document.getElementById('recoverBtn') as HTMLButtonElement,
  
  // Modal
  saveModal: document.getElementById('saveModal') as HTMLDivElement,
  saveForm: document.getElementById('saveForm') as HTMLFormElement,
  sessionName: document.getElementById('sessionName') as HTMLInputElement,
  sessionTags: document.getElementById('sessionTags') as HTMLInputElement,
  cancelSaveBtn: document.getElementById('cancelSaveBtn') as HTMLButtonElement,
};

// ============================================================================
// STATE
// ============================================================================

let currentSessions: SessionMetadata[] = [];
let searchTimeout: ReturnType<typeof setTimeout>;

// ============================================================================
// API HELPERS
// ============================================================================

async function sendMessage<T>(type: MessageType, payload?: unknown): Promise<T> {
  const response = await chrome.runtime.sendMessage({ type, payload }) as Response<T>;
  if (!response.success) {
    throw new Error(response.error || 'Unknown error');
  }
  return response.data as T;
}

// ============================================================================
// UI RENDERING
// ============================================================================

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function createSessionCard(session: SessionMetadata): HTMLElement {
  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.id = session.id;

  // Favicons
  const faviconsHtml = session.faviconPreview.slice(0, 4).map((favicon, i) => {
    if (favicon) {
      return `<img src="${escapeHtml(favicon)}" class="favicon" alt="" style="z-index: ${4 - i}" onerror="this.style.display='none'">`;
    }
    return `<div class="favicon-placeholder" style="z-index: ${4 - i}">${session.domainPreview[i]?.charAt(0).toUpperCase() || '?'}</div>`;
  }).join('');

  const moreCount = session.tabCount - 4;
  const moreHtml = moreCount > 0 ? `<div class="favicon-placeholder" style="z-index: 0">+${moreCount}</div>` : '';

  card.innerHTML = `
    <div class="session-favicons">
      ${faviconsHtml}
      ${moreHtml}
    </div>
    <div class="session-info">
      <div class="session-name">${escapeHtml(session.name)}</div>
      <div class="session-meta">
        <span class="session-tabs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          ${session.tabCount} tabs
        </span>
        <span class="session-date">${formatDate(session.updatedAt)}</span>
      </div>
    </div>
    <div class="session-actions">
      <button class="action-btn restore" title="Restore">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
      </button>
      <button class="action-btn delete" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Event listeners
  const restoreBtn = card.querySelector('.restore') as HTMLButtonElement;
  const deleteBtn = card.querySelector('.delete') as HTMLButtonElement;

  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    restoreSession(session.id);
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteSession(session.id);
  });

  card.addEventListener('click', () => {
    restoreSession(session.id);
  });

  return card;
}

function renderSessions(sessions: SessionMetadata[]): void {
  elements.sessionsList.innerHTML = '';
  
  if (sessions.length === 0) {
    elements.emptyState.classList.remove('hidden');
    elements.sessionCount.textContent = '0';
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.sessionCount.textContent = sessions.length.toString();

  sessions.forEach(session => {
    const card = createSessionCard(session);
    elements.sessionsList.appendChild(card);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadSessions(): Promise<void> {
  try {
    currentSessions = await sendMessage<SessionMetadata[]>(MessageType.GET_SESSIONS);
    renderSessions(currentSessions);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    elements.sessionsList.innerHTML = `
      <div class="empty-state">
        <p>Failed to load sessions</p>
        <span>Please try again</span>
      </div>
    `;
  }
}

async function loadStatistics(): Promise<void> {
  try {
    const stats = await sendMessage<Statistics>(MessageType.GET_STATISTICS);
    elements.totalSessions.textContent = stats.totalSessionsSaved.toString();
    elements.totalTabs.textContent = stats.totalTabsSaved.toString();
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

async function checkCrashRecovery(): Promise<void> {
  try {
    const wasCrash = await sendMessage<boolean>(MessageType.CHECK_CRASH);
    if (wasCrash) {
      elements.recoveryNotice.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Failed to check crash recovery:', error);
  }
}

// ============================================================================
// SESSION ACTIONS
// ============================================================================

async function saveSession(name: string, tags: string[]): Promise<void> {
  try {
    await sendMessage(MessageType.SAVE_SESSION, { name, tags });
    await loadSessions();
    await loadStatistics();
    hideModal();
    showNotification('Session saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save session:', error);
    showNotification('Failed to save session', 'error');
  }
}

async function restoreSession(id: string): Promise<void> {
  try {
    await sendMessage(MessageType.RESTORE_SESSION, { id });
    showNotification('Session restored!', 'success');
    window.close();
  } catch (error) {
    console.error('Failed to restore session:', error);
    showNotification('Failed to restore session', 'error');
  }
}

async function deleteSession(id: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this session?')) {
    return;
  }

  try {
    await sendMessage(MessageType.DELETE_SESSION, { id });
    currentSessions = currentSessions.filter(s => s.id !== id);
    renderSessions(currentSessions);
    showNotification('Session deleted', 'success');
  } catch (error) {
    console.error('Failed to delete session:', error);
    showNotification('Failed to delete session', 'error');
  }
}

async function recoverSessions(): Promise<void> {
  try {
    chrome.tabs.create({
      url: chrome.runtime.getURL('manager.html?recovery=true'),
    });
    window.close();
  } catch (error) {
    console.error('Failed to open recovery:', error);
  }
}

// ============================================================================
// SEARCH
// ============================================================================

function handleSearch(query: string): void {
  clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    if (!query.trim()) {
      renderSessions(currentSessions);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = currentSessions.filter(session => {
      return (
        session.name.toLowerCase().includes(lowerQuery) ||
        session.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        session.domainPreview.some(domain => domain.toLowerCase().includes(lowerQuery))
      );
    });

    renderSessions(filtered);
  }, 200);
}

// ============================================================================
// MODAL
// ============================================================================

function showModal(): void {
  const date = new Date();
  const defaultName = `Session - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  elements.sessionName.value = defaultName;
  elements.sessionTags.value = '';
  elements.saveModal.classList.remove('hidden');
  elements.sessionName.focus();
  elements.sessionName.select();
}

function hideModal(): void {
  elements.saveModal.classList.add('hidden');
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(message: string, type: 'success' | 'error'): void {
  // Simple notification - could be enhanced with toast component
  console.log(`[${type}] ${message}`);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners(): void {
  // Save session button
  elements.saveSessionBtn.addEventListener('click', showModal);

  // Open manager button
  elements.openManagerBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('manager.html'),
    });
    window.close();
  });

  // Settings button
  elements.settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('manager.html?tab=settings'),
    });
    window.close();
  });

  // Search input
  elements.searchInput.addEventListener('input', (e) => {
    handleSearch((e.target as HTMLInputElement).value);
  });

  // Modal cancel button
  elements.cancelSaveBtn.addEventListener('click', hideModal);

  // Modal backdrop click
  elements.saveModal.querySelector('.modal-backdrop')?.addEventListener('click', hideModal);

  // Save form submit
  elements.saveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.sessionName.value.trim();
    const tags = elements.sessionTags.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (name) {
      await saveSession(name, tags);
    }
  });

  // Recovery button
  elements.recoverBtn.addEventListener('click', recoverSessions);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      showModal();
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init(): Promise<void> {
  setupEventListeners();
  
  // Load data in parallel
  await Promise.all([
    loadSessions(),
    loadStatistics(),
    checkCrashRecovery(),
  ]);
}

// Start the app
init().catch(console.error);
