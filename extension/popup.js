document.addEventListener('DOMContentLoaded', function() {
  const auditBtn = document.getElementById('auditBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const downloadContainer = document.getElementById('downloadContainer');
  const downloadBtn = document.getElementById('downloadBtn');

  // Function to format audit results with better structure
  function formatAuditResults(text) {
    // Clean up the text first and handle character encoding issues
    let formattedText = text
      // Fix common character encoding issues first
      .replace(/â€/g, '"')  // Fix mangled smart quotes
      .replace(/â€™/g, "'") // Fix mangled apostrophes  
      .replace(/â€œ/g, '"') // Fix opening smart quotes
      .replace(/â€/g, '"')  // Fix closing smart quotes
      .replace(/â€"/g, '-') // Fix em dashes
      .replace(/Ã¡/g, 'á')  // Fix accented characters
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      // Remove excess asterisks
      .replace(/\*\*/g, '')
      // Remove extra blank lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Clean up bullet points with asterisks
      .replace(/^\s*\*\s+/gm, '• ')
      // Remove markdown headers (###, ##, #) - we'll handle our own formatting
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown formatting that we don't want to display
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
    
    // Extract all issues
    const issues = [];
    
    // First try to find numbered points (1. Issue description)
    const numberedPattern = /\d+\.\s+(.+?)(?=\n\d+\.|\n\s*$|$)/gs;
    let numberedMatch;
    while ((numberedMatch = numberedPattern.exec(formattedText)) !== null) {
      if (numberedMatch[1].trim().length > 15) {  // Ensure it's substantial content
        issues.push(numberedMatch[1].trim());
      }
    }
    
    // If no numbered points, look for bullet points
    if (issues.length === 0) {
      const bulletPattern = /(?:^|\n)[•-]\s+(.+?)(?=\n[•-]|\n\s*$|$)/gs;
      let bulletMatch;
      while ((bulletMatch = bulletPattern.exec(formattedText)) !== null) {
        if (bulletMatch[1].trim().length > 15) {  // Ensure it's substantial content
          issues.push(bulletMatch[1].trim());
        }
      }
    }
    
    // If still no issues found, split by paragraphs and try to find substantial content
    if (issues.length === 0) {
      const paragraphs = formattedText.split('\n\n');
      paragraphs.forEach(para => {
        if (para.trim().length > 100) {  // Longer paragraphs likely contain useful information
          // Try to break down the paragraph into sentences
          const sentences = para.split(/\.\s+/);
          sentences.forEach(sentence => {
            if (sentence.trim().length > 30 && !sentence.toLowerCase().includes('overall')) {
              issues.push(sentence.trim() + '.');
            }
          });
        }
      });
    }
    
    // Create the report
    let actionableReport = `
      <h2>UI/UX Issues & Recommendations</h2>
    `;
    
    if (issues.length > 0) {
      actionableReport += `<div class="issues-container">`;
      
      issues.forEach((issue, index) => {
        // Parse the issue to extract WHAT, WHY, HOW if structured
        const structuredIssue = parseStructuredIssue(issue);
        
        // Determine priority based on content
        let priorityLevel = 'MEDIUM';
        let cardClass = 'medium-issue-card';
        
        if (issue.includes('[CRITICAL]')) {
          priorityLevel = 'CRITICAL';
          cardClass = 'critical-issue-card';
        } else if (issue.includes('[HIGH]')) {
          priorityLevel = 'HIGH';
          cardClass = 'high-issue-card';
        } else if (issue.includes('[ACCESSIBILITY]')) {
          priorityLevel = 'ACCESSIBILITY';
          cardClass = 'accessibility-issue-card';
        } else if (issue.includes('[MEDIUM]')) {
          priorityLevel = 'MEDIUM';
          cardClass = 'medium-issue-card';
        } else if (issue.includes('[LOW]')) {
          priorityLevel = 'LOW';
          cardClass = 'low-issue-card';
        }
        
        actionableReport += `
          <div class="${cardClass}">
            <div class="priority-badge">${priorityLevel}</div>
            <div class="issue-content">
              ${structuredIssue.formatted}
            </div>
          </div>
        `;
      });
      
      actionableReport += `</div>`;
    } else {
      // Fallback if no issues were extracted
      actionableReport += `
        <div class="no-critical-issues">
          <div class="success-icon">✓</div>
          <h3>No Major Issues Found</h3>
          <p>This interface appears to follow good usability practices. Any existing issues are likely minor and don't significantly impact user experience.</p>
        </div>
      `;
    }

    // Helper function to parse structured issues
    function parseStructuredIssue(issue) {
      const lines = issue.split('\n').filter(line => line.trim());
      let formatted = '';
      
      lines.forEach(line => {
        line = line.trim();
        if (line.toLowerCase().includes('what:') || line.toLowerCase().includes('1.')) {
          formatted += `<div class="issue-what"><strong>ISSUE:</strong> ${line.replace(/^(what:|1\.)\s*/i, '')}</div>`;
        } else if (line.toLowerCase().includes('why:') || line.toLowerCase().includes('2.')) {
          formatted += `<div class="issue-why"><strong>IMPACT:</strong> ${line.replace(/^(why:|2\.)\s*/i, '')}</div>`;
        } else if (line.toLowerCase().includes('how:') || line.toLowerCase().includes('3.')) {
          formatted += `<div class="issue-how"><strong>FIX:</strong> ${line.replace(/^(how:|3\.)\s*/i, '')}</div>`;
        } else if (line.length > 10) {
          formatted += `<div class="issue-description">${highlightTechnicalTerms(line)}</div>`;
        }
      });
      
      // If not structured, just format as a single block
      if (!formatted) {
        formatted = `<div class="issue-description">${highlightTechnicalTerms(issue)}</div>`;
      }
      
      return { formatted };
    }
    
    // Function to highlight technical terms and measurements
    function highlightTechnicalTerms(text) {
      // Escape HTML first to prevent XSS
      text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Highlight hex colors
      text = text.replace(/(#[0-9a-fA-F]{3,6})/g, '<span class="tech-color">$1</span>');
      
      // Highlight pixel values
      text = text.replace(/(\d+)px/g, '<span class="tech-measurement">$1px</span>');
      
      // Highlight percentages
      text = text.replace(/(\d+)%/g, '<span class="tech-measurement">$1%</span>');
      
      // Highlight ratios
      text = text.replace(/(\d+(?:\.\d+)?:\d+(?:\.\d+)?)/g, '<span class="tech-measurement">$1</span>');
      
      // Highlight specific UI elements with quotes (handle both regular and smart quotes)
      text = text.replace(/[""]([^"""]+)["\"]/g, '"<span class="ui-element">$1</span>"');
      
      return text;
    }
    
    // Add styling
    actionableReport = `
      <style>
        .issues-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .critical-issue-card {
          background-color: #fed7d7;
          border: 2px solid #e53e3e;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .high-issue-card {
          background-color: #fef5e7;
          border: 2px solid #ed8936;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .accessibility-issue-card {
          background-color: #e6fffa;
          border: 2px solid #38b2ac;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .medium-issue-card {
          background-color: #ebf4ff;
          border: 2px solid #4299e1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .low-issue-card {
          background-color: #f7fafc;
          border: 2px solid #a0aec0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .priority-badge {
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 8px 12px;
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .critical-issue-card .priority-badge {
          background-color: #e53e3e;
        }
        
        .high-issue-card .priority-badge {
          background-color: #ed8936;
        }
        
        .accessibility-issue-card .priority-badge {
          background-color: #38b2ac;
        }
        
        .medium-issue-card .priority-badge {
          background-color: #4299e1;
        }
        
        .low-issue-card .priority-badge {
          background-color: #a0aec0;
        }
        
        .issue-content {
          padding: 20px;
        }
        
        .issue-what {
          margin-bottom: 12px;
          padding: 8px;
          background-color: #ebf4ff;
          border-left: 4px solid #4299e1;
          border-radius: 4px;
        }
        
        .issue-why {
          margin-bottom: 12px;
          padding: 8px;
          background-color: #fef5e7;
          border-left: 4px solid #ed8936;
          border-radius: 4px;
        }
        
        .issue-how {
          margin-bottom: 12px;
          padding: 8px;
          background-color: #f0fff4;
          border-left: 4px solid #48bb78;
          border-radius: 4px;
        }
        
        .issue-description {
          line-height: 1.6;
          margin-bottom: 8px;
        }
        
        .no-critical-issues {
          text-align: center;
          padding: 40px 20px;
          background-color: #f0fff4;
          border-radius: 12px;
          border: 2px solid #c6f6d5;
        }
        
        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .no-critical-issues h3 {
          color: #2d3748;
          margin-bottom: 8px;
          font-size: 18px;
        }
        
        .no-critical-issues p {
          color: #4a5568;
          line-height: 1.5;
        }
        
        .tech-color {
          color: #e83e8c;
          font-family: monospace;
          background-color: rgba(232, 62, 140, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .tech-measurement {
          color: #0056b3;
          font-weight: 500;
        }
        
        .ui-element {
          color: #28a745;
          font-weight: 500;
        }
        
        h2 {
          margin-top: 24px;
          margin-bottom: 20px;
          color: var(--primary);
          font-size: 18px;
          font-weight: 600;
        }
        
        p {
          margin-bottom: 16px;
          line-height: 1.5;
        }
        
        .audit-report {
          padding: 4px;
        }
      </style>
      <div class="audit-report">
        ${actionableReport}
      </div>
    `;
    
    return actionableReport;
  }

  // Function to generate PDF
  function generatePDF(content) {
    // Create a styled container for the PDF content
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #4361ee; text-align: center; margin-bottom: 20px;">UI/UX Audit Report</h1>
        <p style="text-align: center; color: #6c757d; margin-bottom: 30px;">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
        <div>${content}</div>
        <div style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px;">
          Generated by UI/UX Audit Tool powered by GPT-4o
        </div>
      </div>
    `;
    
    const opt = {
      margin: [15, 15],
      filename: `UI-UX-Audit-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and download the PDF
    html2pdf().from(container).set(opt).save();
  }

  // Check for existing audit results on popup open (but only for current page)
  checkForExistingResults();
  
  // Poll for new results while popup is open
  let pollInterval = null;

  auditBtn.addEventListener('click', async function() {
    try {
      // Get the active tab and capture screenshot
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        // Send to background script for processing
        chrome.runtime.sendMessage({
          action: 'startAudit',
          imageData: dataUrl,
          pageUrl: tab.url,
          pageTitle: tab.title
        }, function(response) {
          if (response && response.success) {
            // Show success message
            results.innerHTML = `
              <div class="background-processing">
                <div class="processing-spinner"></div>
                <h3>Priority Audit Started!</h3>
                <p>Your comprehensive UI/UX audit is now processing in the background with priority categorization.</p>
                <p><strong>Results will appear here automatically when complete.</strong></p>
                <p class="polling-status">Checking for results...</p>
                <button id="closePopup" class="secondary-btn">Continue Working</button>
              </div>
            `;
            results.style.display = 'block';
            loading.style.display = 'none';
            downloadContainer.style.display = 'none';
            
            // Add close popup functionality
            document.getElementById('closePopup').addEventListener('click', function() {
              window.close();
            });
            
            // Start polling for results
            startPollingForResults();
            
            // Update button text temporarily
            const originalText = auditBtn.innerHTML;
            auditBtn.innerHTML = 'Audit Started!';
            auditBtn.disabled = true;
            
            // Reset button after a few seconds
            setTimeout(() => {
              auditBtn.disabled = false;
              auditBtn.innerHTML = originalText;
            }, 3000);
          } else {
            throw new Error('Failed to start background audit');
          }
        });
      });
    } catch (error) {
      console.error("Error:", error);
      results.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#dc3545">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style="margin-top: 16px;">Error</h3>
          <p>${error.message}</p>
        </div>
      `;
      results.style.display = 'block';
      loading.style.display = 'none';
    }
  });
  
  function checkForExistingResults() {
    // Get current page URL first
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      
      // Check if there are any recent audit results for this specific page
      chrome.runtime.sendMessage({ action: 'getLatestAuditResult' }, function(response) {
        if (response && response.result && response.result.timestamp && response.result.pageUrl) {
          // Only show results if they're for the current page and less than 2 hours old
          const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
          if (response.result.timestamp > twoHoursAgo && response.result.pageUrl === currentUrl) {
            displayAuditResults(response.result);
          }
        }
      });
    });
  }
  
  function displayAuditResults(auditData) {
    const formattedResult = formatAuditResults(auditData.result);
    results.innerHTML = formattedResult;
    results.style.display = 'block';
    downloadContainer.style.display = 'block';
    
    // Add timestamp
    const timestamp = new Date(auditData.timestamp).toLocaleString();
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'audit-timestamp';
    timestampDiv.innerHTML = `<p style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">Priority audit completed: ${timestamp}</p>`;
    results.appendChild(timestampDiv);
    
    // Stop polling once results are displayed
    stopPollingForResults();
  }
  
  function startPollingForResults() {
    // Clear any existing polling
    stopPollingForResults();
    
    // Poll every 2 seconds for new results
    pollInterval = setInterval(() => {
      // Get current page URL for comparison
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        
        chrome.runtime.sendMessage({ action: 'getLatestAuditResult' }, function(response) {
          if (response && response.result && response.result.timestamp && response.result.pageUrl) {
            // Check if this is a new result for the current page
            const resultTime = response.result.timestamp;
            const currentTime = Date.now();
            
            // If result is very recent (within last 5 minutes) and for current page, show it
            if (currentTime - resultTime < 5 * 60 * 1000 && response.result.pageUrl === currentUrl) {
              displayAuditResults(response.result);
            }
          }
        });
      });
    }, 2000); // Poll every 2 seconds
  }
  
  function stopPollingForResults() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }
  
  // Stop polling when popup is closed/unloaded
  window.addEventListener('beforeunload', stopPollingForResults);
  
  // Add event listener for the download button
  downloadBtn.addEventListener('click', function() {
    console.log("Download button clicked");
    try {
      generatePDF(results.innerHTML);
      console.log("PDF generation initiated");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF: " + error.message);
    }
  });
}); 