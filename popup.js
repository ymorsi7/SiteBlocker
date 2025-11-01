let blockedListEl, emptyMessage, statsEl, statusMessage;
let currentBlockedSites = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  blockedListEl = document.getElementById('blocked-list');
  emptyMessage = document.getElementById('empty-list-message');
  statsEl = document.getElementById('stats');
  statusMessage = document.getElementById('status-message');
  
  const openOptionsButton = document.getElementById('open-options');
  
  // Load and render the list
  loadInitialList();
  
  // Open options page when button is clicked
  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
});

/**
 * Renders the list of blocked sites
 */
function renderList() {
  // Clear current list, but keep the empty message template
  blockedListEl.innerHTML = '';
  
  // Update stats
  const count = currentBlockedSites.length;
  statsEl.textContent = `${count} site${count !== 1 ? 's' : ''} blocked`;
  
  if (currentBlockedSites.length === 0) {
    blockedListEl.appendChild(emptyMessage);
  } else {
    // Sort the list alphabetically
    const sortedSites = [...currentBlockedSites].sort();
    
    sortedSites.forEach(site => {
      const li = document.createElement('li');
      
      const span = document.createElement('span');
      span.textContent = site;
      
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.className = 'remove-button';
      removeButton.dataset.site = site; // Store site name for removal
      
      removeButton.addEventListener('click', handleRemoveSite);
      
      li.appendChild(span);
      li.appendChild(removeButton);
      blockedListEl.appendChild(li);
    });
  }
}

/**
 * Shows a temporary status message
 * @param {string} text - The message to display.
 * @param {boolean} isError - If true, show error styling.
 */
function showStatusMessage(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.display = 'block';
  statusMessage.style.color = isError ? '#dc2626' : '#22c55e';
  statusMessage.style.textShadow = isError 
    ? '0 0 8px rgba(220, 38, 38, 0.3)'
    : '0 0 8px rgba(34, 197, 94, 0.3)';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
    statusMessage.textContent = '';
  }, 2000);
}

/**
 * Handles click on a "Remove" button
 */
async function handleRemoveSite(event) {
  const siteToRemove = event.target.dataset.site;
  const newBlockedSites = currentBlockedSites.filter(site => site !== siteToRemove);

  try {
    await chrome.storage.sync.set({ blockedSites: newBlockedSites });
    currentBlockedSites = newBlockedSites;
    renderList();
    showStatusMessage(`Removed "${siteToRemove}"`);
  } catch (e) {
    showStatusMessage('Error saving changes', true);
  }
}

/**
 * Loads the initial list from storage when the popup opens
 */
async function loadInitialList() {
  try {
    const result = await chrome.storage.sync.get(['blockedSites']);
    currentBlockedSites = result.blockedSites || [];
    renderList();
    
    // Listen for changes in storage (when options page updates)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.blockedSites) {
        currentBlockedSites = changes.blockedSites.newValue || [];
        renderList();
      }
    });
  } catch (e) {
    blockedListEl.innerHTML = '<li style="color: #dc2626; text-align: center; padding: 2rem;">Could not load blocklist.</li>';
  }
}

