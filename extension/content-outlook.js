// Content script for Outlook Web (outlook.office.com)

// Add a "Track This" button when viewing an email
function addTrackButton() {
    // Don't add if already exists
    if (document.getElementById('cc-track-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'cc-track-btn';
    btn.innerHTML = '📌 Track This';
    btn.className = 'cc-capture-btn';
    btn.addEventListener('click', captureFromOutlook);
    document.body.appendChild(btn);
}

function captureFromOutlook() {
    // Try to grab email subject and sender from the reading pane
    let subject = '';
    let sender = '';

    // Subject line
    const subjectEl = document.querySelector('[role="heading"][aria-level="2"]') ||
                      document.querySelector('.allowTextSelection[tabindex="-1"]') ||
                      document.querySelector('span[title]');
    if (subjectEl) {
        subject = subjectEl.textContent.trim();
    }

    // Sender name
    const senderEl = document.querySelector('.lpc-hoverTarget span') ||
                     document.querySelector('[data-testid="SenderPersona"] span') ||
                     document.querySelector('.XbIp4.jGG6V.yPPgr');
    if (senderEl) {
        sender = senderEl.textContent.trim();
    }

    // If we couldn't detect, use selected text
    const selectedText = window.getSelection().toString().trim();
    if (!subject && selectedText) {
        subject = selectedText.substring(0, 100);
    }

    // Store captured data for the popup
    chrome.storage.local.set({
        capturedData: {
            text: subject || 'Email item',
            who: sender,
            source: 'Outlook'
        }
    });

    // Show a brief confirmation
    showCaptureConfirm('Captured from Outlook — click extension to save');
}

function showCaptureConfirm(message) {
    let confirm = document.getElementById('cc-confirm');
    if (!confirm) {
        confirm = document.createElement('div');
        confirm.id = 'cc-confirm';
        confirm.className = 'cc-confirm-toast';
        document.body.appendChild(confirm);
    }
    confirm.textContent = message;
    confirm.classList.add('show');
    setTimeout(() => confirm.classList.remove('show'), 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'saveToLocalStorage') {
        localStorage.setItem(msg.key, msg.value);
        sendResponse({ success: true });
    }
});

// Initialize
addTrackButton();

// Re-add button when navigating within Outlook (SPA)
const observer = new MutationObserver(() => {
    if (!document.getElementById('cc-track-btn')) {
        addTrackButton();
    }
});
observer.observe(document.body, { childList: true, subtree: true });
