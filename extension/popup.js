// --- Popup Logic ---

let selectedType = 'task';

// Type pill selection
document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedType = pill.dataset.type;

        // Show/hide conditional fields
        document.getElementById('whoGroup').style.display = selectedType === 'waiting' ? 'block' : 'none';
        document.getElementById('sourceGroup').style.display = selectedType === 'waiting' ? 'block' : 'none';
        document.getElementById('dueGroup').style.display = selectedType === 'note' ? 'none' : 'block';
    });
});

// Check if content script sent detected data
chrome.storage.local.get(['capturedData'], (result) => {
    if (result.capturedData) {
        const data = result.capturedData;
        document.getElementById('itemText').value = data.text || '';
        document.getElementById('detected').style.display = 'block';
        document.getElementById('detectedSource').textContent = data.source || 'Detected';
        document.getElementById('detectedText').textContent = (data.text || '').substring(0, 60) + (data.text && data.text.length > 60 ? '...' : '');

        if (data.who) {
            document.getElementById('whoFrom').value = data.who;
        }

        // Auto-select source
        if (data.source === 'Slack') {
            document.getElementById('source').value = 'Slack';
        } else if (data.source === 'Outlook') {
            document.getElementById('source').value = 'Outlook';
        }

        // Clear the captured data
        chrome.storage.local.remove('capturedData');
    }
});

// Save button
document.getElementById('btnSave').addEventListener('click', () => {
    const text = document.getElementById('itemText').value.trim();
    if (!text) return;

    const leader = document.getElementById('assignTo').value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedType === 'task') {
        // Save as task
        const key = `cc-tasks-${leader}`;
        chrome.storage.local.get([key], (result) => {
            const tasks = result[key] ? JSON.parse(result[key]) : [];
            tasks.push({
                id: Date.now().toString(),
                title: text,
                type: 'task',
                dueDate: document.getElementById('dueDate').value || null,
                notes: '',
                createdAt: today,
                completed: false
            });
            // Save to chrome storage AND localStorage format
            chrome.storage.local.set({ [key]: JSON.stringify(tasks) });
            saveToCommandCenter(key, tasks);
            showToast();
        });
    } else if (selectedType === 'waiting') {
        // Save as waiting item
        const key = `cc-waiting-${leader}`;
        chrome.storage.local.get([key], (result) => {
            const items = result[key] ? JSON.parse(result[key]) : [];
            items.push({
                text,
                who: document.getElementById('whoFrom').value.trim(),
                source: document.getElementById('source').value,
                date: today
            });
            chrome.storage.local.set({ [key]: JSON.stringify(items) });
            saveToCommandCenter(key, items);
            showToast();
        });
    } else if (selectedType === 'note') {
        // Append to notes
        const key = `cc-notes-${leader}`;
        chrome.storage.local.get([key], (result) => {
            const existing = result[key] ? JSON.parse(result[key]) : '';
            const updated = existing ? existing + '\n' + `[${today}] ${text}` : `[${today}] ${text}`;
            chrome.storage.local.set({ [key]: JSON.stringify(updated) });
            saveToCommandCenter(key, updated);
            showToast();
        });
    }
});

// Save to Command Center's localStorage via content script
function saveToCommandCenter(key, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'saveToLocalStorage',
                key: key,
                value: JSON.stringify(value)
            }).catch(() => {
                // Content script not available on this page — that's fine
                // Data is saved in chrome.storage and will sync next time Command Center opens
            });
        }
    });
}

function showToast() {
    document.getElementById('toast').classList.add('show');
    setTimeout(() => window.close(), 1200);
}

// Cancel
document.getElementById('btnCancel').addEventListener('click', () => window.close());
