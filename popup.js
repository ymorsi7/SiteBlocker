let blockedListEl, emptyMessage, statsEl, statusMessage;
let currentBlockedSites = [];
const haramSites = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 
  'youporn.com', 'tube8.com', 'spankwire.com', 'keezmovies.com', 'xtube.com',
  'beeg.com', 'tnaflix.com', '4tube.com', 'drtuber.com', 'sunporno.com',
  'porn.com', 'tubev.sex', 'nuvid.com', 'porntube.com',
  'perfectgirls.net', 'sex.com', 'thumbzilla.com', 'tubegalore.com', 'eporner.com',
  'xhamsterlive.com', 'cam4.com', 'chaturbate.com', 'livejasmin.com', 'stripchat.com',
  'bongacams.com', 'myfreecams.com', 'streamate.com', 'camsoda.com', 'flirt4free.com'
];

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
 * Renders the list of blocked sites (excluding haram sites)
 */
function renderList() {
  // Clear current list, but keep the empty message template
  blockedListEl.innerHTML = '';
  
  // Filter out haram sites from display
  const visibleSites = currentBlockedSites.filter(site => !haramSites.includes(site));
  
  // Update stats (only count visible sites)
  const count = visibleSites.length;
  statsEl.textContent = `${count} site${count !== 1 ? 's' : ''} blocked`;
  
  if (visibleSites.length === 0) {
    blockedListEl.appendChild(emptyMessage);
  } else {
    // Sort the list alphabetically
    const sortedSites = [...visibleSites].sort();
    
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

