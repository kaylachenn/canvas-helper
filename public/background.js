console.log("Background service worker running");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAssignments') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      const activeTab = tabs[0];
      
      if (!activeTab.url || !activeTab.url.includes('instructure.com')) {
        sendResponse({ 
          success: false, 
          error: 'Please navigate to a Canvas page (*.instructure.com) first',
          needsCanvas: true 
        });
        return;
      }

      // Try to inject content script if it's not already there
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
      } catch (injectionError) {
        console.log('Content script already injected or injection failed:', injectionError);
      }

      // Wait a moment for content script to initialize
      setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, { action: 'fetchAssignments' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            sendResponse({ 
              success: false, 
              error: 'Canvas page not ready. Please refresh the page and try again.',
              needsRefresh: true
            });
          } else if (response) {
            sendResponse(response);
          } else {
            sendResponse({ 
              success: false, 
              error: 'Content script not responding. Please refresh the Canvas page.',
              needsRefresh: true
            });
          }
        });
      }, 500);
    });
    return true; // Will respond asynchronously
  }
});
