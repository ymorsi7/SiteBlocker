// welcome.js

// Open Extensions Page button
document.getElementById('open-extensions').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error opening extensions page:', chrome.runtime.lastError);
            alert('Please open Chrome Extensions manually:\n1. Click the puzzle piece icon\n2. Click "Manage extensions"\n\nOr go to chrome://extensions/');
        }
    });
});

// Got It button - closes the current tab
document.getElementById('got-it').addEventListener('click', () => {
    chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        }
    });
});

