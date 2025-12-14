/**
 * Content Script - Scroll and Form Data Capture
 * Captures scroll position and form data from web pages
 */

// ============================================================================
// TYPES
// ============================================================================

interface ScrollPosition {
  x: number;
  y: number;
}

interface ContentData {
  scrollPosition?: ScrollPosition;
  formData?: Record<string, string>;
}

// ============================================================================
// SENSITIVE FIELD DETECTION
// ============================================================================

/**
 * Input types that should never be captured for security
 */
const SENSITIVE_INPUT_TYPES = [
  'password',
  'credit-card',
  'cc-number',
  'cc-exp',
  'cc-csc',
  'cvv',
];

/**
 * Input name patterns that indicate sensitive data
 */
const SENSITIVE_NAME_PATTERNS = [
  /password/i,
  /passwd/i,
  /pwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /credit/i,
  /card/i,
  /cvv/i,
  /cvc/i,
  /ssn/i,
  /social[_-]?security/i,
  /pin/i,
];

/**
 * Checks if an input is sensitive and should not be captured
 */
function isSensitiveInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  // Check input type
  if (input instanceof HTMLInputElement) {
    if (SENSITIVE_INPUT_TYPES.includes(input.type)) {
      return true;
    }
  }

  // Check name/id patterns
  const identifier = (input.name || input.id || '').toLowerCase();
  if (SENSITIVE_NAME_PATTERNS.some(pattern => pattern.test(identifier))) {
    return true;
  }

  // Check autocomplete attribute
  const autocomplete = input.getAttribute('autocomplete') || '';
  if (
    autocomplete.includes('password') ||
    autocomplete.includes('cc-') ||
    autocomplete.includes('current-password') ||
    autocomplete.includes('new-password')
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// DATA CAPTURE FUNCTIONS
// ============================================================================

/**
 * Gets current scroll position
 */
function getScrollPosition(): ScrollPosition {
  return {
    x: window.scrollX || document.documentElement.scrollLeft,
    y: window.scrollY || document.documentElement.scrollTop,
  };
}

/**
 * Captures form data from the page (excluding sensitive fields)
 */
function getFormData(): Record<string, string> {
  const formData: Record<string, string> = {};
  
  // Get all form inputs
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select'
  );

  inputs.forEach((input, index) => {
    // Skip sensitive fields
    if (isSensitiveInput(input)) {
      return;
    }

    // Skip certain input types
    if (input instanceof HTMLInputElement) {
      if (['hidden', 'submit', 'button', 'image', 'file', 'reset'].includes(input.type)) {
        return;
      }
    }

    // Generate a stable identifier
    const id = input.id || input.name || `anon_${index}`;

    // Get value based on type
    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          formData[id] = input.value || 'on';
        }
      } else {
        if (input.value) {
          formData[id] = input.value;
        }
      }
    } else if (input instanceof HTMLSelectElement) {
      if (input.value) {
        formData[id] = input.value;
      }
    } else if (input instanceof HTMLTextAreaElement) {
      if (input.value) {
        formData[id] = input.value;
      }
    }
  });

  return formData;
}

// ============================================================================
// DATA RESTORATION FUNCTIONS
// ============================================================================

/**
 * Restores scroll position
 */
function restoreScrollPosition(position: ScrollPosition): void {
  window.scrollTo({
    left: position.x,
    top: position.y,
    behavior: 'smooth',
  });
}

/**
 * Restores form data
 */
function restoreFormData(data: Record<string, string>): void {
  for (const [id, value] of Object.entries(data)) {
    const input = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
    
    if (!input) continue;

    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = value === input.value || value === 'on';
      } else {
        input.value = value;
      }
    } else if (input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
      input.value = value;
    }

    // Trigger change event
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'GET_CONTENT_DATA': {
        const data: ContentData = {};
        
        if (message.payload?.getScroll) {
          data.scrollPosition = getScrollPosition();
        }
        
        if (message.payload?.getFormData) {
          data.formData = getFormData();
        }
        
        sendResponse(data);
        break;
      }

      case 'RESTORE_SCROLL': {
        if (message.payload) {
          restoreScrollPosition(message.payload as ScrollPosition);
        }
        sendResponse({ success: true });
        break;
      }

      case 'RESTORE_FORM_DATA': {
        if (message.payload) {
          restoreFormData(message.payload as Record<string, string>);
        }
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }

  return true; // Async response
});

// Log that content script is loaded (only in development)
if (process.env.NODE_ENV === 'development') {
  console.info('Tab Vault content script loaded');
}
