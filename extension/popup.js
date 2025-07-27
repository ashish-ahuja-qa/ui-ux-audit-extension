document.addEventListener('DOMContentLoaded', function() {
  const auditBtn = document.getElementById('auditBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const downloadContainer = document.getElementById('downloadContainer');
  const downloadBtn = document.getElementById('downloadBtn');

  // Function to format audit results with better structure
  function formatAuditResults(text) {
    // Clean up the text first
    let formattedText = text
      // Remove excess asterisks
      .replace(/\*\*/g, '')
      // Remove extra blank lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Clean up bullet points with asterisks
      .replace(/^\s*\*\s+/gm, '• ');
    
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
      <h2>Specific UI/UX Issues & Actionable Recommendations</h2>
    `;
    
    if (issues.length > 0) {
      actionableReport += `<div class="issues-container">`;
      
      issues.forEach((issue, index) => {
        // Try to identify if this issue has a clear element, problem, and solution
        const parts = {
          element: null,
          problem: null,
          solution: null
        };
        
        // Look for phrases that indicate a solution
        const solutionPatterns = [
          /(?:recommend|suggest|should|could|consider|change|increase|decrease|adjust|modify|improve|update|replace|add|remove)\s+(.+?)(?=\.|\s*$)/i,
          /(?:to\s+)(?:ensure|improve|enhance|achieve|provide|create|make|get)(.+?)(?=\.|\s*$)/i
        ];
        
        for (const pattern of solutionPatterns) {
          const match = issue.match(pattern);
          if (match && match[1]) {
            parts.solution = match[0];
            break;
          }
        }
        
        // Format the issue as a card
        actionableReport += `
          <div class="issue-card">
            <div class="issue-number">${index + 1}</div>
            <div class="issue-content">
              <div class="issue-text">${highlightTechnicalTerms(issue)}</div>
            </div>
          </div>
        `;
      });
      
      actionableReport += `</div>`;
    } else {
      // Fallback if no issues were extracted
      actionableReport += `
        <p>No specific issues could be extracted from the analysis. Please try again with a different interface or adjust the prompt.</p>
      `;
    }
    
    // Function to highlight technical terms and measurements
    function highlightTechnicalTerms(text) {
      // Highlight hex colors
      text = text.replace(/(#[0-9a-fA-F]{3,6})/g, '<span class="tech-color">$1</span>');
      
      // Highlight pixel values
      text = text.replace(/(\d+)px/g, '<span class="tech-measurement">$1px</span>');
      
      // Highlight percentages
      text = text.replace(/(\d+)%/g, '<span class="tech-measurement">$1%</span>');
      
      // Highlight ratios
      text = text.replace(/(\d+(?:\.\d+)?:\d+(?:\.\d+)?)/g, '<span class="tech-measurement">$1</span>');
      
      // Highlight specific UI elements with quotes
      text = text.replace(/"([^"]+)"/g, '"<span class="ui-element">$1</span>"');
      
      return text;
    }
    
    // Add styling
    actionableReport = `
      <style>
        .issues-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .issue-card {
          display: flex;
          background-color: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .issue-number {
          background-color: var(--primary);
          color: white;
          font-weight: 600;
          padding: 16px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
        }
        
        .issue-content {
          padding: 16px;
          flex: 1;
        }
        
        .issue-text {
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

  auditBtn.addEventListener('click', async function() {
    // Show loading state
    loading.style.display = 'block';
    results.style.display = 'none';
    downloadContainer.style.display = 'none';
    auditBtn.disabled = true;
    
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Capture screenshot
      chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
        try {
          console.log("Screenshot captured, sending to backend");
          
          // Send to backend
          const res = await fetch("http://localhost:5000/audit", {
            method: "POST",
            body: JSON.stringify({ image: dataUrl }),
            headers: { "Content-Type": "application/json" }
          });
          
          if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`);
          }
          
          const data = await res.json();
          
          // Format and display results
          const formattedResult = formatAuditResults(data.result);
          results.innerHTML = formattedResult;
          results.style.display = 'block';
          downloadContainer.style.display = 'block';
          console.log("Audit completed successfully");
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
        } finally {
          loading.style.display = 'none';
          auditBtn.disabled = false;
        }
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
      auditBtn.disabled = false;
    }
  });
  
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