// --- Widget Logic ---
// Syncs with Command Center via shared data.json file

const DATA_URL = 'http://localhost:3000/api/data';
let selectedType = 'task';

// Type pills
document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedType = pill.dataset.type;
        document.getElementById('whoGroup').style.display = selectedType === 'waiting' ? 'block' : 'none';
    });
});

// Toggle collapse
document.getElementById('toggleBtn').addEventListener('click', () => {
    const widget = document.getElementById('widget');
    const body = widget.querySelector('.widget-body');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        document.getElementById('toggleBtn').textContent = '−';
    } else {
        body.style.display = 'none';
        document.getElementById('toggleBtn').textContent = '+';
    }
});

// Save
document.getElementById('btnSave').addEventListener('click', saveItem);

// Enter key saves
document.getElementById('itemText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveItem();
});

async function saveItem() {
    const text = document.getElementById('itemText').value.trim();
    if (!text) return;

    const leader = document.getElementById('assignTo').value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedType === 'task') {
        const key = `tasks-${leader}`;
        const tasks = await getServerData(key, []);
        tasks.push({
            id: Date.now().toString(),
            title: text,
            type: 'task',
            dueDate: null,
            notes: '',
            createdAt: today,
            completed: false
        });
        await saveServerData(key, tasks);
    } else if (selectedType === 'waiting') {
        const key = `waiting-${leader}`;
        const items = await getServerData(key, []);
        items.push({
            text,
            who: document.getElementById('whoFrom').value.trim(),
            source: 'Widget',
            date: today
        });
        await saveServerData(key, items);
    } else if (selectedType === 'note') {
        const key = `notes-${leader}`;
        const existing = await getServerData(key, '');
        const updated = existing ? existing + '\n' + `[${today}] ${text}` : `[${today}] ${text}`;
        await saveServerData(key, updated);
    }

    // Show toast and clear
    document.getElementById('toast').classList.add('show');
    document.getElementById('itemText').value = '';
    document.getElementById('whoFrom').value = '';

    setTimeout(() => {
        document.getElementById('toast').classList.remove('show');
    }, 1500);

    // Refocus for next capture
    document.getElementById('itemText').focus();
}

// --- Server communication ---
async function getServerData(key, fallback) {
    try {
        const res = await fetch(`${DATA_URL}/${encodeURIComponent(key)}`);
        if (res.ok) {
            const value = await res.json();
            return value !== null ? value : fallback;
        }
    } catch (err) {
        console.log('Server not available, using fallback');
    }
    return fallback;
}

async function saveServerData(key, value) {
    try {
        await fetch(`${DATA_URL}/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        });
    } catch (err) {
        console.log('Could not save to server:', err.message);
    }
}
