let form, siteInput, blockedListEl, emptyMessage, statusMessage, suggestedGrid;
let currentBlockedSites = [];
const suggestedSites = ['netflix.com', 'primevideo.com', 'youtube.com', 'facebook.com', 'instagram.com', 'x.com', 'tiktok.com', 'hulu.com', 'hbomax.com'];
const haramSites = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 
  'youporn.com', 'tube8.com', 'spankwire.com', 'keezmovies.com', 'xtube.com',
  'beeg.com', 'tnaflix.com', '4tube.com', 'drtuber.com', 'sunporno.com',
  'porn.com', 'tubev.sex', 'nuvid.com', 'porntube.com',
  'perfectgirls.net', 'sex.com', 'thumbzilla.com', 'tubegalore.com', 'eporner.com',
  'xhamsterlive.com', 'cam4.com', 'chaturbate.com', 'livejasmin.com', 'stripchat.com',
  'bongacams.com', 'myfreecams.com', 'streamate.com', 'camsoda.com', 'flirt4free.com'
];

// --- Helper Functions ---

/**
 * Renders the list of blocked sites (excluding haram sites)
 */
function renderList() {
  // Clear current list, but keep the empty message template
  blockedListEl.innerHTML = '';
  
  // Filter out haram sites from display
  const visibleSites = currentBlockedSites.filter(site => !haramSites.includes(site));
  
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
  
  // Update suggested sites buttons
  renderSuggestedSites();
}

/**
 * Renders the suggested sites grid
 */
function renderSuggestedSites() {
  suggestedGrid.innerHTML = '';
  
  suggestedSites.forEach(site => {
    const button = document.createElement('button');
    button.textContent = site;
    button.className = 'suggested-button';
    button.dataset.site = site;
    
    // Check if site is already blocked
    if (currentBlockedSites.includes(site)) {
      button.classList.add('added');
      button.textContent = site + ' ✓';
      button.disabled = true;
    } else {
      button.addEventListener('click', () => handleSuggestedSiteClick(site));
    }
    
    suggestedGrid.appendChild(button);
  });
}

/**
 * Handles click on a suggested site button
 */
async function handleSuggestedSiteClick(site) {
  if (currentBlockedSites.includes(site)) {
    return;
  }

  const newBlockedSites = [...currentBlockedSites, site];
  
  try {
    await chrome.storage.sync.set({ blockedSites: newBlockedSites });
    currentBlockedSites = newBlockedSites;
    renderList();
    showStatusMessage(`Added "${site}" to blocklist!`);
  } catch (e) {
    showStatusMessage('Error saving. Is storage full?', true);
  }
}

/**
 * Shows a temporary status message
 * @param {string} text - The message to display.
 * @param {boolean} isError - If true, show error styling.
 */
function showStatusMessage(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.className = isError 
    ? 'status-error fade-in'
    : 'status-success fade-in';
  
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = '';
  }, 3000);
}

/**
 * Cleans and validates a domain name.
 * @param {string} input - The raw user input.
 * @returns {string|null} A cleaned domain name or null if invalid.
 */
function cleanDomain(input) {
  try {
    // Remove 'http://', 'https://', 'www.', and any paths
    let domain = input.trim().toLowerCase();
    
    // Handle full URLs
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(domain).hostname;
    }
    
    // Handle "www." prefix
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    // Remove path, e.g., "example.com/page" -> "example.com"
    domain = domain.split('/')[0];
    
    // Basic validation: must have at least one dot and no spaces
    if (domain.length < 3 || !domain.includes('.') || domain.includes(' ')) {
      return null;
    }
    
    return domain;
  } catch (e) {
    return null; // Invalid URL
  }
}

// --- Event Handlers ---

/**
 * Handles form submission to add a new site
 */
async function handleAddSite(event) {
  event.preventDefault();
  const domain = cleanDomain(siteInput.value);

  if (!domain) {
    showStatusMessage('Invalid domain. Use format "example.com"', true);
    return;
  }
  
  if (currentBlockedSites.includes(domain)) {
    showStatusMessage('Site is already on the list', true);
    siteInput.value = '';
    return;
  }

  const newBlockedSites = [...currentBlockedSites, domain];
  
  try {
    await chrome.storage.sync.set({ blockedSites: newBlockedSites });
    currentBlockedSites = newBlockedSites;
    renderList();
    siteInput.value = '';
    showStatusMessage(`Added "${domain}" to blocklist!`);
  } catch (e) {
    showStatusMessage('Error saving. Is storage full?', true);
  }
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
    showStatusMessage(`Removed "${siteToRemove}" from blocklist.`);
  } catch (e) {
    showStatusMessage('Error saving changes', true);
  }
}

/**
 * Handles click on "Block Haram Sites" button
 */
async function handleBlockHaramSites() {
  // Add all haram sites that aren't already blocked
  const sitesToAdd = haramSites.filter(site => !currentBlockedSites.includes(site));
  
  if (sitesToAdd.length === 0) {
    showStatusMessage('All haram sites are already blocked.');
    return;
  }

  const newBlockedSites = [...currentBlockedSites, ...sitesToAdd];
  
  try {
    await chrome.storage.sync.set({ blockedSites: newBlockedSites });
    currentBlockedSites = newBlockedSites;
    renderList();
    showStatusMessage(`Added ${sitesToAdd.length} haram site${sitesToAdd.length !== 1 ? 's' : ''} to blocklist.`);
  } catch (e) {
    showStatusMessage('Error saving. Is storage full?', true);
  }
}

// --- Initialization ---

/**
 * Loads the initial list from storage when the page opens
 */
async function loadInitialList() {
  try {
    const result = await chrome.storage.sync.get(['blockedSites']);
    currentBlockedSites = result.blockedSites || [];
    renderList();
  } catch (e) {
    blockedListEl.innerHTML = '<li style="color: #dc2626; text-align: center;">Could not load blocklist.</li>';
  }
}

// Wait for DOM to be ready before accessing elements
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  form = document.getElementById('add-form');
  siteInput = document.getElementById('site-url');
  blockedListEl = document.getElementById('blocked-list');
  emptyMessage = document.getElementById('empty-list-message');
  statusMessage = document.getElementById('status-message');
  suggestedGrid = document.getElementById('suggested-grid');
  
  // Add event listener
  form.addEventListener('submit', handleAddSite);
  
  // Add event listener for haram sites button
  const blockHaramButton = document.getElementById('block-haram-button');
  if (blockHaramButton) {
    blockHaramButton.addEventListener('click', handleBlockHaramSites);
  }
  
  // Load the list
  loadInitialList();
});

