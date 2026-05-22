// Content script for Slack Web (app.slack.com)

// Add a "Track" button when hovering over messages
function initSlackCapture() {
    // Add floating capture button
    if (!document.getElementById('cc-track-btn')) {
        const btn = document.createElement('button');
        btn.id = 'cc-track-btn';
        btn.innerHTML = '📌 Track This';
        btn.className = 'cc-capture-btn';
        btn.addEventListener('click', captureFromSlack);
        document.body.appendChild(btn);
    }

    // Also detect right-click or selection
    document.addEventListener('mouseup', (e) => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText && selectedText.length > 3) {
            // Store the selected text for quick capture
            chrome.storage.local.set({
                capturedData: {
                    text: selectedText.substring(0, 150),
                    who: getSlackSender(e.target),
                    source: 'Slack'
                }
            });
        }
    });
}

function captureFromSlack() {
    // Try to get the currently focused/hovered message
    let messageText = '';
    let sender = '';

    // Check for selected text first
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        messageText = selectedText.substring(0, 150);
    }

    // Try to find the message container that's being hovered
    const hoveredMessage = document.querySelector('.c-message_kit__hover');
    if (hoveredMessage && !messageText) {
        const textEl = hoveredMessage.querySelector('.p-rich_text_section');
        if (textEl) {
            messageText = textEl.textContent.trim().substring(0, 150);
        }
    }

    // Try to get sender
    const senderEl = document.querySelector('.c-message_kit__hover .c-message__sender_button');
    if (senderEl) {
        sender = senderEl.textContent.trim();
    }

    // Store captured data
    chrome.storage.local.set({
        capturedData: {
            text: messageText || 'Slack message',
            who: sender,
            source: 'Slack'
        }
    });

    showCaptureConfirm('Captured from Slack — click extension to save');
}

function getSlackSender(target) {
    // Walk up the DOM to find the message container and sender
    let el = target;
    for (let i = 0; i < 10; i++) {
        if (!el || !el.parentElement) break;
        el = el.parentElement;
        const senderBtn = el.querySelector('.c-message__sender_button');
        if (senderBtn) return senderBtn.textContent.trim();
    }
    return '';
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
initSlackCapture();
