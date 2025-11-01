// background.js

/**
 * Creates icons in multiple sizes (16, 48, 128) and sets them as the extension icon.
 */
function createDynamicIcon() {
    const sizes = [16, 48, 128];
    const imageData = {};
    
    sizes.forEach(size => {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw a red background
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, size, size);
      
      // Draw "B" in white, scale font size based on icon size
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.round(size * 0.625)}px "Arial"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', size / 2, size / 2);
    
      // Store ImageData for this size
      imageData[size] = ctx.getImageData(0, 0, size, size);
    });
    
    // Set the icon with all sizes
    chrome.action.setIcon({ imageData: imageData }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting icon:', chrome.runtime.lastError.message);
      }
    });
  }
  
  chrome.runtime.onInstalled.addListener((details) => {
    // Create the icon when the extension is installed
    createDynamicIcon();
  
    // Initialize the blocklist on install
    chrome.storage.sync.get(['blockedSites'], (result) => {
      if (!result.blockedSites) {
        chrome.storage.sync.set({ blockedSites: [] });
      }
      updateBlockingRules(result.blockedSites || []);
    });
  });
  
  // Create icon on browser startup as well
  chrome.runtime.onStartup.addListener(() => {
    createDynamicIcon();
  });
  
  
  // Redirect to our custom blocked page
  const blockedPageUrl = chrome.runtime.getURL('blocked.html');
  
  /**
   * Updates the declarativeNetRequest rules to block sites.
   * @param {string[]} sites - An array of domain names to block.
   */
  async function updateBlockingRules(sites) {
    try {
      // Get existing rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map(rule => rule.id);
  
      // Create new rules
      const newRules = sites.map((site, index) => {
        return {
          id: index + 1, // Rule IDs must be 1 or greater
          priority: 1,
          action: {
            type: 'redirect',
            redirect: { url: blockedPageUrl }
          },
          condition: {
            // Use '||' prefix to match domain and all subdomains
            urlFilter: `||${site}`,
            // Block only main web page requests
            resourceTypes: ['main_frame']
          }
        };
      });
  
      // Add new rules and remove old ones
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds, // Remove all existing rules
        addRules: newRules // Add the new set of rules
      });
  
      console.log('SiteBlocker rules updated. Blocked sites:', sites);
  
    } catch (error) {
      console.error('Failed to update blocking rules:', error);
    }
  }
  
  // Listen for changes in storage
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.blockedSites) {
      const newBlockedSites = changes.blockedSites.newValue || [];
      updateBlockingRules(newBlockedSites);
    }
  });
  
  