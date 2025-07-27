// Background service worker for UI/UX Audit Extension
let auditResults = new Map(); // Store audit results temporarily

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAudit') {
    startBackgroundAudit(request.imageData, request.pageUrl, request.pageTitle);
    sendResponse({ success: true, message: 'Priority-based audit started in background' });
  } else if (request.action === 'getLatestAuditResult') {
    // Get the most recent audit result
    chrome.storage.local.get(['latestAuditResult'], function(data) {
      sendResponse({ result: data.latestAuditResult || null });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'clearAuditResult') {
    chrome.storage.local.remove(['latestAuditResult'], function() {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
});

async function startBackgroundAudit(imageData, pageUrl, pageTitle) {
  const auditId = Date.now().toString();
  
  try {
    // Show initial notification
    const shortTitle = pageTitle.length > 50 ? pageTitle.substring(0, 47) + '...' : pageTitle;
    chrome.notifications.create(`audit-start-${auditId}`, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'UI/UX Priority Audit Started',
      message: `Auditing: ${shortTitle}`
    });

    // Send request to backend
    const response = await fetch('http://localhost:5000/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store the result in memory and Chrome storage
    const auditData = {
      result: data.result,
      timestamp: Date.now(),
      id: auditId,
      pageUrl: pageUrl,
      pageTitle: pageTitle
    };
    
    auditResults.set(auditId, auditData);
    
    // Also store in Chrome storage for persistence
    chrome.storage.local.set({
      latestAuditResult: auditData
    });

    // Count critical and high priority issues for notification
    const criticalCount = (data.result.match(/\[CRITICAL\]/g) || []).length;
    const highCount = (data.result.match(/\[HIGH\]/g) || []).length;
    const totalIssues = (data.result.match(/\[(CRITICAL|HIGH|ACCESSIBILITY|MEDIUM|LOW)\]/g) || []).length;
    
    let notificationMessage = `Found ${totalIssues} prioritized issues`;
    if (criticalCount > 0) {
      notificationMessage = `🚨 ${criticalCount} critical issues found! Click to view all ${totalIssues} issues`;
    } else if (highCount > 0) {
      notificationMessage = `⚠️ ${highCount} high priority issues found! Click to view all ${totalIssues} issues`;
    } else {
      notificationMessage = `✅ No critical issues! Found ${totalIssues} improvements to review`;
    }

    // Show completion notification
    chrome.notifications.create(`audit-complete-${auditId}`, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Priority Audit Complete!',
      message: notificationMessage,
      buttons: [
        { title: 'View Results' },
        { title: 'Dismiss' }
      ]
    });

    // Clean up start notification
    chrome.notifications.clear(`audit-start-${auditId}`);

  } catch (error) {
    console.error('Background audit failed:', error);
    
    // Show error notification
    chrome.notifications.create(`audit-error-${auditId}`, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Audit Failed',
      message: 'Failed to complete UI/UX audit. Please check your connection and try again.'
    });
    
    // Clean up start notification
    chrome.notifications.clear(`audit-start-${auditId}`);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('audit-complete-')) {
    // Open popup when user clicks completion notification
    chrome.action.openPopup();
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('audit-complete-')) {
    if (buttonIndex === 0) { // View Results
      chrome.action.openPopup();
    }
    chrome.notifications.clear(notificationId);
  }
});

// Clean up old results (older than 2 hours)
setInterval(() => {
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  for (const [auditId, result] of auditResults.entries()) {
    if (result.timestamp < twoHoursAgo) {
      auditResults.delete(auditId);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes 