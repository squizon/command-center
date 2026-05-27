// ===== Command Center ✨ =====

// --- Config ---
const DEFAULT_LEADERS = {
    leader1: { name: 'Leader 1', emoji: '🟣', color: 'purple' },
    leader2: { name: 'Leader 2', emoji: '🔵', color: 'blue' }
};

function getLeaders() {
    return getData('leader-config', DEFAULT_LEADERS);
}

function saveLeaders(leaders) {
    saveData('leader-config', leaders);
}

// Use a getter so LEADERS is always current
let LEADERS = DEFAULT_LEADERS;

const DEFAULT_RECURRING = {};

// --- Utility Functions ---
// Data is synced to a shared file via the server API
// Falls back to localStorage if server isn't running

let dataCache = {};
let serverAvailable = false;

async function initDataSync() {
    // Skip if not on localhost (GitHub Pages has no API)
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return;
    }
    try {
        const res = await fetch('/api/data', {
            headers: { 'X-CC-Sync': 'host' }
        });
        if (res.ok) {
            const serverData = await res.json();
            serverAvailable = true;

            // Merge: localStorage wins if it has data, otherwise use server data
            Object.entries(serverData).forEach(([key, value]) => {
                const localValue = localStorage.getItem('cc-' + key);
                if (!localValue && value !== null && value !== undefined) {
                    // Server has data that localStorage doesn't — use it
                    localStorage.setItem('cc-' + key, JSON.stringify(value));
                }
            });

            // Push all localStorage data to server to keep file in sync
            for (let i = 0; i < localStorage.length; i++) {
                const fullKey = localStorage.key(i);
                if (fullKey.startsWith('cc-')) {
                    const key = fullKey.replace('cc-', '');
                    const value = JSON.parse(localStorage.getItem(fullKey));
                    dataCache[key] = value;
                }
            }
            // Save all to server file
            fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CC-Sync': 'host' },
                body: JSON.stringify(dataCache)
            }).catch(() => {});
        }
    } catch {
        serverAvailable = false;
    }
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getData(key, fallback) {
    // Always read from localStorage first (source of truth)
    try {
        const data = localStorage.getItem('cc-' + key);
        return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
}

function saveData(key, value) {
    // Save to cache
    dataCache[key] = value;
    // Save to localStorage (immediate)
    localStorage.setItem('cc-' + key, JSON.stringify(value));
    // Save to server/file (async, non-blocking, host only)
    if (serverAvailable) {
        fetch(`/api/data/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CC-Sync': 'host' },
            body: JSON.stringify({ value })
        }).catch(() => {});
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function linkify(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:var(--purple);text-decoration:underline;">$1</a>');
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "let's get it ☀️";
    if (hour < 17) return 'keep it going 💪';
    return 'wrapping up 🌙';
}

function getDayAge(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const parts = dateStr.split('-');
    const then = new Date(parts[0], parts[1] - 1, parts[2]);
    then.setHours(0, 0, 0, 0);
    return Math.round((now - then) / (1000 * 60 * 60 * 24));
}

function getAgeBadgeClass(days) {
    if (days <= 2) return 'green';
    if (days <= 5) return 'yellow';
    return 'red';
}

function getDaysUntil(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const parts = dateStr.split('-');
    const then = new Date(parts[0], parts[1] - 1, parts[2]);
    then.setHours(0, 0, 0, 0);
    return Math.round((then - now) / (1000 * 60 * 60 * 24));
}

// Get the end of the current working week (Friday)
function getEndOfWorkWeek() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    let daysUntilFriday;
    if (day === 0) daysUntilFriday = 5; // Sunday → next Friday
    else if (day === 6) daysUntilFriday = 6; // Saturday → next Friday
    else daysUntilFriday = 5 - day; // Mon-Fri → this Friday
    const friday = new Date(now);
    friday.setDate(friday.getDate() + daysUntilFriday);
    return friday;
}

// Check if a date falls within the current working week (Mon-Fri)
function isThisWorkWeek(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get Monday of this week
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

    // Get Friday of this week
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return date >= monday && date <= friday;
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function laceyBark() {
    if (getData('mascot-muted', false)) return;
    const soundChoice = getData('mascot-sound', null);
    if (soundChoice === 'none') return;

    try {
        const customSound = getData('mascot-custom-sound', null);
        if (customSound) {
            const audio = new Audio(customSound);
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }

        // If a wizard sound was chosen, use synthesized sound
        if (soundChoice) {
            playSynthSound(soundChoice);
            return;
        }

        // No wizard sound, no custom sound — try default bark MP3 (host only)
        const audio = new Audio('bark.mp3.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch {}
}

function playSynthSound(soundChoice) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        if (soundChoice === 'bark') {
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                const env = Math.exp(-t * 25);
                data[i] = (Math.random() * 2 - 1) * 0.3 * env + Math.sin(2 * Math.PI * 200 * t) * 0.4 * env;
            }
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            const gain = ctx.createGain();
            src.connect(gain); gain.connect(ctx.destination);
            gain.gain.value = 0.5;
            src.start();
        } else if (soundChoice === 'meow') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 2;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(480, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(620, ctx.currentTime + 0.2);
            osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.55);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(); osc.stop(ctx.currentTime + 0.65);
        } else if (soundChoice === 'chirp') {
            [0, 0.12, 0.22].forEach(offset => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2200 + Math.random() * 400, ctx.currentTime + offset);
                osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + offset + 0.08);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.09);
                osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.1);
            });
        } else if (soundChoice === 'squeak') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.05);
            osc.frequency.linearRampToValueAtTime(1600, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(); osc.stop(ctx.currentTime + 0.16);
        } else if (soundChoice === 'pop') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(); osc.stop(ctx.currentTime + 0.13);
        } else if (soundChoice === 'chime') {
            [1, 2, 3].forEach((harmonic) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = 880 * harmonic;
                gain.gain.setValueAtTime(0.2 / harmonic, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.start(); osc.stop(ctx.currentTime + 0.9);
            });
        }
    } catch {}
}

function openSinglePreview(src) {
    document.getElementById('filePreviewImg').src = src;
    document.getElementById('filePreviewPrev').style.display = 'none';
    document.getElementById('filePreviewNext').style.display = 'none';
    document.getElementById('filePreviewCounter').style.display = 'none';
    document.getElementById('filePreview').classList.add('active');
}

function openSinglePreview(src) {
    // Open preview without gallery navigation
    document.getElementById('filePreviewImg').src = src;
    document.getElementById('filePreviewPrev').style.display = 'none';
    document.getElementById('filePreviewNext').style.display = 'none';
    document.getElementById('filePreviewCounter').style.display = 'none';
    document.getElementById('filePreview').classList.add('active');
}

function openSinglePreview(imgSrc) {
    document.getElementById('filePreviewImg').src = imgSrc;
    document.getElementById('filePreviewCounter').textContent = '';
    document.getElementById('filePreviewPrev').style.display = 'none';
    document.getElementById('filePreviewNext').style.display = 'none';
    document.getElementById('filePreview').classList.add('active');
}

// Open gallery from inline images (diary, promo, events)
function openInlineGallery(clickedImg) {
    // Find all sibling images in the same container
    const container = clickedImg.closest('div[style*="grid"]');
    if (!container) {
        // Fallback: just show this one image
        document.getElementById('filePreviewImg').src = clickedImg.src;
        document.getElementById('filePreviewCounter').textContent = '';
        document.getElementById('filePreview').classList.add('active');
        return;
    }

    const allImages = Array.from(container.querySelectorAll('img'));
    const srcs = allImages.map(img => img.src);
    const clickedIndex = allImages.indexOf(clickedImg);

    // Set up gallery with these images
    window._inlineGalleryImages = srcs;
    window._inlineGalleryIndex = clickedIndex >= 0 ? clickedIndex : 0;

    document.getElementById('filePreviewImg').src = srcs[window._inlineGalleryIndex];
    document.getElementById('filePreviewCounter').textContent = `${window._inlineGalleryIndex + 1} / ${srcs.length}`;
    document.getElementById('filePreview').classList.add('active');
}

function generateNudgeDraft(item) {
    const name = item.who || 'there';
    const subject = item.text || 'the item I sent over';
    const age = getDayAge(item.date);
    const timeRef = age === 1 ? 'yesterday' : age < 7 ? 'earlier this week' : `on ${new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return `Hi ${name}, just wanted to follow up on ${subject} from ${timeRef}. Let me know if you need anything from me to move this forward.`;
}

// --- Task Management ---
function getTasks(leader) {
    return getData(`tasks-${leader}`, []);
}

function saveTasks(leader, tasks) {
    saveData(`tasks-${leader}`, tasks);
}

function addTask(leader, task) {
    const tasks = getTasks(leader);
    task.id = Date.now().toString();
    task.createdAt = getToday();
    task.completed = false;
    tasks.push(task);
    saveTasks(leader, tasks);
    renderTasks(leader);
}

function deleteTask(leader, taskId) {
    const tasks = getTasks(leader).filter(t => t.id !== taskId);
    saveTasks(leader, tasks);
    renderTasks(leader);
    renderCompleted(leader);
}

function completeTask(leader, taskId) {
    const tasks = getTasks(leader);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? getToday() : null;
    }
    saveTasks(leader, tasks);
    renderTasks(leader);
    renderCompleted(leader);
    updateTaskCounts();
    updateProgressBar();
    if (task && task.completed) {
        const reactions = ['🎉', '💪', '✨', '🙌', '⚡', '🔥', '👏', '💜'];
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        showToast(`${reaction} Task done!`);
        const lacey = document.querySelector('.lacey-mascot');
        if (lacey) {
            lacey.classList.add('wiggle');
            setTimeout(() => lacey.classList.remove('wiggle'), 600);
        }
    }
}

function openTaskDetail(leader, taskId) {
    const tasks = getTasks(leader);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    openModal(`Task Detail`, `
        <label>Title</label>
        <textarea id="detailTitle" style="min-height:60px;">${escapeHtml(task.title)}</textarea>
        <label>Notes</label>
        <textarea id="detailNotes" style="min-height:80px;" placeholder="Add notes...">${escapeHtml(task.notes || '')}</textarea>
        <div id="detailDueGroup" style="${task.type === 'recurring' ? 'display:none;' : ''}">
            <label>Due date</label>
            <input type="date" id="detailDue" value="${task.dueDate || ''}">
        </div>
        <label>Type</label>
        <select id="detailType" onchange="document.getElementById('detailDueGroup').style.display = this.value === 'recurring' ? 'none' : 'block'; document.getElementById('detailDayGroup').style.display = this.value === 'recurring' ? 'block' : 'none';">
            <option value="task" ${task.type === 'task' ? 'selected' : ''}>One-time task</option>
            <option value="recurring" ${task.type === 'recurring' ? 'selected' : ''}>Recurring</option>
        </select>
        <div id="detailDayGroup" style="${task.type === 'recurring' ? '' : 'display:none;'}">
            <label>Which day?</label>
            <select id="detailDay">
                <option value="everyday" ${!task.recurringDay || task.recurringDay === 'everyday' ? 'selected' : ''}>Every day</option>
                <option value="1" ${task.recurringDay === '1' ? 'selected' : ''}>Monday</option>
                <option value="2" ${task.recurringDay === '2' ? 'selected' : ''}>Tuesday</option>
                <option value="3" ${task.recurringDay === '3' ? 'selected' : ''}>Wednesday</option>
                <option value="4" ${task.recurringDay === '4' ? 'selected' : ''}>Thursday</option>
                <option value="5" ${task.recurringDay === '5' ? 'selected' : ''}>Friday</option>
            </select>
        </div>
        <label style="font-size:10px;color:var(--text-light);margin-top:8px;">Created: ${task.createdAt || 'unknown'}</label>
        <button class="modal-submit">Save Changes</button>
    `, () => {
        task.title = document.getElementById('detailTitle').value.trim() || task.title;
        task.notes = document.getElementById('detailNotes').value.trim();
        task.type = document.getElementById('detailType').value;
        task.dueDate = task.type === 'recurring' ? null : (document.getElementById('detailDue').value || null);
        task.recurringDay = task.type === 'recurring' ? (document.getElementById('detailDay').value || null) : null;
        saveTasks(leader, tasks);
        renderTasks(leader);
        renderCompleted(leader);
        closeModal();
        showToast('Task updated ✨');
    });
}

function inlineEditTask(leader, taskId, el) {
    const tasks = getTasks(leader);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.title;
    input.style.cssText = 'width:100%;padding:4px 8px;border:1px solid var(--purple);border-radius:6px;font-size:13px;font-family:inherit;outline:none;';
    el.innerHTML = '';
    el.appendChild(input);
    input.focus();
    input.select();

    function save() {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== task.title) {
            task.title = newTitle;
            saveTasks(leader, tasks);
        }
        renderTasks(leader);
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') renderTasks(leader);
    });
}

function categorizeTask(task) {
    if (task.completed) return 'completed';
    if (task.type === 'recurring') return 'recurring';
    if (!task.dueDate) return 'upcoming';

    const daysUntil = getDaysUntil(task.dueDate);
    if (daysUntil < 0) return 'overdue';
    if (isThisWorkWeek(task.dueDate)) return 'thisweek';
    return 'upcoming';
}

function renderTasks(leader) {
    const tasks = getTasks(leader);
    const categories = { overdue: [], thisweek: [], upcoming: [], recurring: [] };

    tasks.filter(t => !t.completed).forEach(task => {
        const cat = categorizeTask(task);
        if (categories[cat]) categories[cat].push(task);
    });

    Object.keys(categories).forEach(cat => {
        const container = document.getElementById(`${leader}-${cat}`);
        if (!container) return;

        if (categories[cat].length === 0) {
            container.innerHTML = '<div class="empty-state">nothing here ✨</div>';
            return;
        }

        container.innerHTML = categories[cat].map(task => `
            <div class="task-item" data-id="${task.id}" onclick="openTaskDetail('${leader}', '${task.id}')">
                <div class="task-actions">
                    <button class="complete-btn" onclick="event.stopPropagation();completeTask('${leader}', '${task.id}')" title="Complete" data-tooltip="Complete">✓</button>
                    <button onclick="event.stopPropagation();deleteTask('${leader}', '${task.id}')" title="Delete" data-tooltip="Delete">×</button>
                </div>
                <div class="task-title" ondblclick="event.stopPropagation();inlineEditTask('${leader}','${task.id}',this)">${linkify(task.title.length > 60 ? task.title.substring(0, 60) + '...' : task.title)}</div>
                <div class="task-meta">
                    ${task.dueDate ? `<span class="task-due">${new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                    ${task.notes ? `<span>${escapeHtml(task.notes.substring(0, 30))}${task.notes.length > 30 ? '...' : ''}</span>` : ''}
                </div>
            </div>
        `).join('');
    });
}

// --- Completed Tasks ---
function renderCompleted(leader) {
    const tasks = getTasks(leader);
    const completed = tasks.filter(t => t.completed);
    const container = document.getElementById(`${leader}-completed`);
    if (!container) return;

    if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state">nothing completed yet</div>';
        return;
    }

    container.innerHTML = completed.map(task => `
        <div class="task-item completed" data-id="${task.id}" onclick="openTaskDetail('${leader}', '${task.id}')" style="opacity:0.8;">
            <div class="task-actions">
                <button class="complete-btn" onclick="event.stopPropagation();completeTask('${leader}', '${task.id}')" title="Undo">↩</button>
                <button onclick="event.stopPropagation();deleteTask('${leader}', '${task.id}')" title="Delete">×</button>
            </div>
            <div class="task-title" style="text-decoration:line-through;">${escapeHtml(task.title.length > 60 ? task.title.substring(0, 60) + '...' : task.title)}</div>
            <div class="task-meta">
                ${task.completedAt ? `<span style="font-size:10px;color:var(--green);">done ${task.completedAt}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// --- Waiting On ---
function getWaiting(leader) {
    return getData(`waiting-${leader}`, []);
}

function saveWaiting(leader, items) {
    saveData(`waiting-${leader}`, items);
}

function renderWaiting(leader) {
    const items = getWaiting(leader);
    const list = document.getElementById(`${leader}-waiting`);
    if (!list) return;

    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state">all clear 🎉</div>';
        return;
    }

    list.innerHTML = items.map((item, i) => {
        const age = getDayAge(item.date);
        const ageClass = getAgeBadgeClass(age);
        const ageText = age === 0 ? 'today' : age === 1 ? '1 day' : `${age} days`;
        return `
            <div class="waiting-item" onclick="editWaiting('${leader}', ${i})" style="cursor:pointer;">
                <span class="age-badge ${ageClass}">${ageText}</span>
                <span class="waiting-text">${linkify(item.text)}${item.who ? ` — <strong>${escapeHtml(item.who)}</strong>` : ''}</span>
                <span class="waiting-source">${escapeHtml(item.source || 'manual')}</span>
                <button class="delete-btn" onclick="event.stopPropagation();completeWaiting('${leader}', ${i})" style="color:var(--green);">✓</button>
                <button class="delete-btn" onclick="event.stopPropagation();deleteWaiting('${leader}', ${i})">×</button>
            </div>
        `;
    }).join('');
}

function editWaiting(leader, index) {
    const items = getWaiting(leader);
    const item = items[index];
    if (!item) return;

    openModal('Edit Waiting Item', `
        <label>What are you waiting on?</label>
        <input type="text" id="editWaitText" value="${escapeHtml(item.text)}">
        <label>Who from?</label>
        <input type="text" id="editWaitWho" value="${escapeHtml(item.who || '')}">
        <label>Source</label>
        <select id="editWaitSource">
            <option value="Slack" ${item.source === 'Slack' ? 'selected' : ''}>Slack</option>
            <option value="Outlook" ${item.source === 'Outlook' ? 'selected' : ''}>Outlook</option>
            <option value="In person" ${item.source === 'In person' ? 'selected' : ''}>In person</option>
            <option value="Clipboard" ${item.source === 'Clipboard' ? 'selected' : ''}>Clipboard</option>
            <option value="Other" ${item.source === 'Other' ? 'selected' : ''}>Other</option>
        </select>
        <label>Remind me on (optional)</label>
        <input type="date" id="editWaitReminder" value="${item.reminderDate || ''}">
        <button class="modal-submit">Save</button>
    `, () => {
        item.text = document.getElementById('editWaitText').value.trim() || item.text;
        item.who = document.getElementById('editWaitWho').value.trim();
        item.source = document.getElementById('editWaitSource').value;
        item.reminderDate = document.getElementById('editWaitReminder').value || null;
        saveWaiting(leader, items);
        renderWaiting(leader);
        renderNudges(leader);
        closeModal();
        showToast('Item updated ✨');
    });
}

function deleteWaiting(leader, index) {
    const items = getWaiting(leader);
    items.splice(index, 1);
    saveWaiting(leader, items);
    renderWaiting(leader);
    renderNudges(leader);
}

function completeWaiting(leader, index) {
    const items = getWaiting(leader);
    const item = items[index];
    
    // Save to resolved log for monthly stats
    const resolved = getData('resolved-waiting', []);
    resolved.push({
        text: item.text,
        who: item.who,
        source: item.source,
        leader: leader,
        createdDate: item.date,
        resolvedDate: getToday()
    });
    saveData('resolved-waiting', resolved);

    items.splice(index, 1);
    saveWaiting(leader, items);
    renderWaiting(leader);
    renderNudges(leader);
    showToast('✅ Resolved!');
}

// --- Nudge Queue ---
function renderNudges(leader) {
    const items = getWaiting(leader).filter(item => getDayAge(item.date) >= 2);
    const list = document.getElementById(`${leader}-nudges`);
    if (!list) return;

    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state">no nudges needed right now</div>';
        return;
    }

    list.innerHTML = items.map((item, i) => {
        const draft = generateNudgeDraft(item);
        return `
            <div class="nudge-item">
                <div class="nudge-context">${escapeHtml(item.text)} — ${getDayAge(item.date)} days waiting</div>
                <div class="nudge-draft">"${escapeHtml(draft)}"</div>
                <div class="nudge-actions">
                    <button onclick="copyNudge(\`${draft.replace(/`/g, "'")}\`)">📋 Copy</button>
                    <button onclick="deleteWaiting('${leader}', ${getWaiting(leader).indexOf(item)})">✓ Done</button>
                </div>
            </div>
        `;
    }).join('');
}

function copyNudge(text) {
    navigator.clipboard.writeText(text).then(() => {
        markAsInternalCopy(text);
        showToast('Copied to clipboard — paste into Slack or Outlook');
    });
}

// --- Morale Events ---
function getMoraleEvents() {
    return getData('morale-events', []);
}

function renderMoraleEvents() {
    const events = getMoraleEvents();
    const list = document.getElementById('morale-events');
    if (!list) return;

    if (events.length === 0) {
        list.innerHTML = '<div class="empty-state">no events planned yet — add one!</div>';
        return;
    }

    list.innerHTML = events.map((event, i) => `
        <div class="morale-item">
            <div class="morale-title">${escapeHtml(event.title)}</div>
            <div class="morale-date">${event.date ? new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Date TBD'}</div>
            <ul class="morale-checklist">
                ${(event.checklist || []).map((item, ci) => `
                    <li>
                        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleMoraleCheck(${i}, ${ci})">
                        <span>${escapeHtml(item.text)}</span>
                    </li>
                `).join('')}
            </ul>
            <button onclick="archiveMoraleEvent(${i})" style="margin-top:8px;padding:4px 10px;border:1px solid var(--border);border-radius:6px;font-size:11px;cursor:pointer;background:white;color:var(--text-secondary);font-family:inherit;">✓ Done — Archive</button>
        </div>
    `).join('');
}

function toggleMoraleCheck(eventIdx, checkIdx) {
    const events = getMoraleEvents();
    events[eventIdx].checklist[checkIdx].done = !events[eventIdx].checklist[checkIdx].done;
    saveData('morale-events', events);
}

function archiveMoraleEvent(eventIdx) {
    const events = getMoraleEvents();
    const event = events[eventIdx];
    if (!event) return;

    // Archive it
    const archives = getData('event-archives', []);
    archives.unshift({
        ...event,
        archivedAt: new Date().toISOString(),
        completedChecklist: (event.checklist || []).filter(c => c.done).length,
        totalChecklist: (event.checklist || []).length
    });
    saveData('event-archives', archives);

    // Remove from active events
    events.splice(eventIdx, 1);
    saveData('morale-events', events);
    renderMoraleEvents();
    showToast('Event archived to diary 🎉');
}

// --- Overview ---
function renderOverview() {
    // All overdue
    const allOverdue = [];
    Object.keys(getLeaders()).forEach(leader => {
        getTasks(leader).filter(t => !t.completed && categorizeTask(t) === 'overdue').forEach(t => {
            allOverdue.push({ ...t, leader });
        });
    });

    const overdueEl = document.getElementById('overview-overdue');
    if (overdueEl) {
        overdueEl.innerHTML = allOverdue.length === 0
            ? '<div class="empty-state">nothing overdue 🎉</div>'
            : allOverdue.map(t => `<div class="task-item"><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta"><span>${LEADERS[t.leader].name}</span></div></div>`).join('');
    }

    // All waiting
    const allWaiting = [];
    Object.keys(getLeaders()).forEach(leader => {
        getWaiting(leader).forEach(w => allWaiting.push({ ...w, leader }));
    });

    const waitingEl = document.getElementById('overview-waiting');
    if (waitingEl) {
        waitingEl.innerHTML = allWaiting.length === 0
            ? '<div class="empty-state">nothing pending</div>'
            : allWaiting.map(w => `<div class="waiting-item"><span class="age-badge ${getAgeBadgeClass(getDayAge(w.date))}">${getDayAge(w.date)}d</span><span class="waiting-text">${escapeHtml(w.text)}</span><span class="waiting-source">${LEADERS[w.leader].name}</span></div>`).join('');
    }

    // Nudges
    const allNudges = [];
    Object.keys(getLeaders()).forEach(leader => {
        getWaiting(leader).filter(w => getDayAge(w.date) >= 2).forEach(w => allNudges.push({ ...w, leader }));
    });

    const nudgesEl = document.getElementById('overview-nudges');
    if (nudgesEl) {
        nudgesEl.innerHTML = allNudges.length === 0
            ? '<div class="empty-state">no nudges needed</div>'
            : allNudges.map(w => `<div class="nudge-item"><div class="nudge-context">${escapeHtml(w.text)} — ${getDayAge(w.date)} days</div></div>`).join('');
    }

    // Stats
    const statsEl = document.getElementById('overview-stats');
    if (statsEl) {
        const totalTasks = Object.keys(getLeaders()).reduce((sum, l) => sum + getTasks(l).filter(t => !t.completed).length, 0);
        const completedThisWeek = Object.keys(getLeaders()).reduce((sum, l) => sum + getTasks(l).filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt)).length, 0);

        statsEl.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;">
                <div style="padding:12px;background:var(--purple-light);border-radius:10px;">
                    <div style="font-size:24px;font-weight:700;color:var(--purple);">${totalTasks}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">open tasks</div>
                </div>
                <div style="padding:12px;background:var(--green-light);border-radius:10px;">
                    <div style="font-size:24px;font-weight:700;color:var(--green);">${completedThisWeek}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">done this week</div>
                </div>
                <div style="padding:12px;background:var(--orange-light);border-radius:10px;">
                    <div style="font-size:24px;font-weight:700;color:var(--orange);">${allWaiting.length}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">waiting on</div>
                </div>
                <div style="padding:12px;background:var(--pink-light);border-radius:10px;">
                    <div style="font-size:24px;font-weight:700;color:var(--red);">${allOverdue.length}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">overdue</div>
                </div>
            </div>
        `;
    }

    // Weekly Summary
    renderWeeklySummary();

    // Monthly Stats
    renderMonthlyStats();
}

function renderWeeklySummary() {
    const el = document.getElementById('weeklySummary');
    if (!el) return;

    let summary = `📋 Weekly Summary — ${formatDate(new Date())}\n\n`;

    Object.keys(getLeaders()).forEach(leader => {
        const name = LEADERS[leader].name;
        const tasks = getTasks(leader);
        const completed = tasks.filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt));
        const overdue = tasks.filter(t => !t.completed && categorizeTask(t) === 'overdue');
        const waiting = getWaiting(leader);

        summary += `━━ ${name} ━━\n`;
        summary += `✅ Completed: ${completed.length > 0 ? completed.map(t => t.title).join(', ') : 'none'}\n`;
        summary += `🔴 Overdue: ${overdue.length > 0 ? overdue.map(t => t.title).join(', ') : 'none'}\n`;
        summary += `⏳ Waiting on: ${waiting.length > 0 ? waiting.map(w => w.text).join(', ') : 'none'}\n\n`;
    });

    summary += `━━ EA Team ━━\n`;
    const eaTasks = getTasks('eateam');
    const eaCompleted = eaTasks.filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt));
    summary += `✅ Completed: ${eaCompleted.length > 0 ? eaCompleted.map(t => t.title).join(', ') : 'none'}\n`;
    summary += `📌 In progress: ${eaTasks.filter(t => !t.completed).map(t => t.title).join(', ') || 'none'}\n`;

    el.value = summary;
}

function renderMonthlyStats() {
    const el = document.getElementById('monthlyStats');
    if (!el) return;

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let totalCompleted = 0;
    let totalCreated = 0;
    let leaderBreakdown = {};

    Object.keys(getLeaders()).forEach(leader => {
        const tasks = getTasks(leader);
        const completedThisMonth = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(thisMonth));
        const createdThisMonth = tasks.filter(t => t.createdAt && t.createdAt.startsWith(thisMonth));

        totalCompleted += completedThisMonth.length;
        totalCreated += createdThisMonth.length;

        leaderBreakdown[leader] = {
            completed: completedThisMonth.length,
            created: createdThisMonth.length
        };
    });

    // Calculate busiest leader
    const busiestLeader = Object.entries(leaderBreakdown).sort((a, b) => b[1].created - a[1].created)[0];
    const busiestName = LEADERS[busiestLeader[0]]?.name || busiestLeader[0];

    // Count resolved waiting items this month
    const resolved = getData('resolved-waiting', []);
    const resolvedThisMonth = resolved.filter(r => r.resolvedDate && r.resolvedDate.startsWith(thisMonth)).length;

    el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;margin-bottom:16px;">
            <div style="padding:14px;background:var(--purple-light);border-radius:10px;">
                <div style="font-size:24px;font-weight:700;color:var(--purple);">${totalCompleted}</div>
                <div style="font-size:11px;color:var(--text-secondary);">completed</div>
            </div>
            <div style="padding:14px;background:var(--orange-light);border-radius:10px;">
                <div style="font-size:24px;font-weight:700;color:var(--orange);">${totalCreated}</div>
                <div style="font-size:11px;color:var(--text-secondary);">tasks assigned</div>
            </div>
            <div style="padding:14px;background:var(--green-light);border-radius:10px;">
                <div style="font-size:24px;font-weight:700;color:var(--green);">${resolvedThisMonth}</div>
                <div style="font-size:11px;color:var(--text-secondary);">follow-ups resolved</div>
            </div>
            <div style="padding:14px;background:var(--blue-light);border-radius:10px;">
                <div style="font-size:14px;font-weight:700;color:var(--blue);">${busiestName}</div>
                <div style="font-size:11px;color:var(--text-secondary);">most tasks (${busiestLeader[1].created})</div>
            </div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);">
            <strong>Workload by leader:</strong>
            ${Object.entries(leaderBreakdown).map(([key, data]) => {
                const name = LEADERS[key]?.name || key;
                const bar = Math.round((data.created / Math.max(totalCreated, 1)) * 100);
                return `<div style="padding:6px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span>${name}</span>
                        <span>${data.created} assigned / ${data.completed} done</span>
                    </div>
                    <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${bar}%;background:linear-gradient(90deg,var(--purple),var(--pink));border-radius:3px;"></div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;

    // Auto-archive monthly stats on the 1st
    checkMonthlyArchive();
}

function checkMonthlyArchive() {
    const now = new Date();
    if (now.getDate() !== 1) return; // Only on the 1st

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthName = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const archives = getData('monthly-archives', []);
    if (archives.some(a => a.monthKey === lastMonthKey)) return; // Already archived

    let totalCompleted = 0;
    let totalCreated = 0;
    let leaderBreakdown = {};

    Object.keys(getLeaders()).forEach(leader => {
        const tasks = getTasks(leader);
        const completedLastMonth = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(lastMonthKey));
        const createdLastMonth = tasks.filter(t => t.createdAt && t.createdAt.startsWith(lastMonthKey));

        totalCompleted += completedLastMonth.length;
        totalCreated += createdLastMonth.length;

        leaderBreakdown[leader] = {
            completed: completedLastMonth.length,
            created: createdLastMonth.length
        };
    });

    archives.unshift({
        monthKey: lastMonthKey,
        monthName: lastMonthName,
        archivedAt: now.toISOString(),
        totalCompleted,
        totalCreated,
        leaderBreakdown
    });

    saveData('monthly-archives', archives);
}

function renderMonthlyArchive() {
    const archives = getData('monthly-archives', []);
    const container = document.getElementById('monthlyArchive');
    if (!container) return;

    if (archives.length === 0) {
        container.innerHTML = '<div class="empty-state">Monthly stats get archived on the 1st of each month.</div>';
        return;
    }

    container.innerHTML = archives.map((month, i) => `
        <div class="diary-entry" style="border-left:4px solid var(--purple);">
            <div class="diary-entry-header">
                <h4>📊 ${escapeHtml(month.monthName)}</h4>
                <button onclick="deleteMonthlyArchive(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-light);">🗑️</button>
            </div>
            <div class="diary-entry-stats" style="margin-top:0;padding-top:0;border-top:none;">
                <span class="diary-stat">✅ <span class="stat-num">${month.totalCompleted}</span> completed</span>
                <span class="diary-stat">📌 <span class="stat-num">${month.totalCreated}</span> assigned</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">
                ${Object.entries(month.leaderBreakdown).map(([key, data]) => {
                    const name = LEADERS[key]?.name || key;
                    return `<div style="padding:2px 0;">${name}: ${data.created} assigned / ${data.completed} done</div>`;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function deleteMonthlyArchive(index) {
    if (!confirm('Delete this monthly archive?')) return;
    const archives = getData('monthly-archives', []);
    archives.splice(index, 1);
    saveData('monthly-archives', archives);
    renderMonthlyArchive();
}

// --- Dynamic Leader Views ---
function ensureLeaderViews() {
    const leaders = getLeaders();
    const main = document.querySelector('main');
    if (!main) return;

    // Hide hardcoded views that don't match the config
    const allViews = main.querySelectorAll('.view[id^="view-"]');
    const leaderKeys = Object.keys(leaders);
    const systemViews = ['view-daily', 'view-overview', 'view-diary', 'view-files', 'view-settings'];

    allViews.forEach(view => {
        const viewId = view.id;
        if (systemViews.includes(viewId)) return; // Keep system views
        const viewKey = viewId.replace('view-', '');
        if (!leaderKeys.includes(viewKey)) {
            // This hardcoded view doesn't match any leader in config — hide it
            view.remove();
        }
    });

    // Generate views for leaders that don't have one yet
    Object.keys(leaders).forEach(key => {
        if (document.getElementById(`view-${key}`)) return; // Already exists

        const leader = leaders[key];
        const viewHtml = `
            <div class="view" id="view-${key}">
                <div class="view-header">
                    <h2>${escapeHtml(leader.name)}</h2>
                    <button class="add-task-btn" data-leader="${key}">+ Add Task</button>
                </div>
                <div class="task-columns">
                    <div class="task-column">
                        <div class="column-header overdue">🔴 Overdue</div>
                        <div class="task-list" id="${key}-overdue"></div>
                    </div>
                    <div class="task-column">
                        <div class="column-header urgent">🟡 This Week</div>
                        <div class="task-list" id="${key}-thisweek"></div>
                    </div>
                    <div class="task-column">
                        <div class="column-header upcoming">🟢 Upcoming</div>
                        <div class="task-list" id="${key}-upcoming"></div>
                    </div>
                    <div class="task-column">
                        <div class="column-header recurring">🔁 Recurring</div>
                        <div class="task-list" id="${key}-recurring"></div>
                    </div>
                </div>
                <div class="section-block">
                    <div class="section-header">
                        <h3>⏳ Waiting On</h3>
                        <button class="add-btn-small" data-leader="${key}" data-type="waiting">+ Add</button>
                    </div>
                    <div class="waiting-list" id="${key}-waiting"></div>
                </div>
                <div class="section-block">
                    <div class="section-header">
                        <h3>💌 Nudge Queue</h3>
                        <span class="section-subtitle">Items ready for a follow-up</span>
                    </div>
                    <div class="nudge-list" id="${key}-nudges"></div>
                </div>
                <div class="section-block">
                    <div class="section-header">
                        <h3>✅ Completed</h3>
                    </div>
                    <div class="completed-list" id="${key}-completed"></div>
                </div>
                <div class="section-block prefs-inline">
                    <div class="section-header">
                        <h3>👤 Preferences</h3>
                        <div style="display:flex;gap:6px;">
                            <button class="add-btn-small" onclick="uploadPrefsDoc('${key}')">📎 Upload Doc</button>
                            <button class="add-btn-small" onclick="editPrefs('${key}')">✏️ Fill Form</button>
                        </div>
                    </div>
                    <div class="prefs-content" id="prefs-${key}-content"></div>
                    <div id="prefs-${key}-doc"></div>
                </div>
                <div class="section-block notes-section">
                    <div class="section-header">
                        <h3>📝 Notes</h3>
                        <span class="section-subtitle">Freeform notes</span>
                    </div>
                    <div id="notes-${key}"></div>
                </div>
            </div>
        `;
        const overviewView = document.getElementById('view-overview');
        if (overviewView) {
            overviewView.insertAdjacentHTML('beforebegin', viewHtml);
        } else {
            main.insertAdjacentHTML('beforeend', viewHtml);
        }
    });
}

// --- Navigation ---
function renderNav() {
    const nav = document.querySelector('.main-nav');
    const leaders = getLeaders();
    LEADERS = leaders;

    // Preserve the currently active view
    const activeView = document.querySelector('.view.active');
    const currentView = activeView ? activeView.id.replace('view-', '') : 'daily';

    // Build leader tabs dynamically
    let leaderBtns = '';
    Object.keys(leaders).forEach(key => {
        if (key === 'daily') return;
        leaderBtns += `<button class="nav-btn${currentView === key ? ' active' : ''}" data-view="${key}">${leaders[key].emoji} ${leaders[key].name}</button>\n`;
    });

    nav.innerHTML = `
        <button class="nav-btn${currentView === 'daily' ? ' active' : ''}" data-view="daily">📆 Today</button>
        ${leaderBtns}
        <button class="nav-btn${currentView === 'overview' ? ' active' : ''}" data-view="overview">✦ Overview</button>
        <button class="nav-btn${currentView === 'diary' ? ' active' : ''}" data-view="diary">📖 Diary</button>
        <button class="nav-btn${currentView === 'files' ? ' active' : ''}" data-view="files">📁 Files</button>
        <button class="nav-btn${currentView === 'settings' ? ' active' : ''}" data-view="settings">⚙️ Settings</button>
    `;

    initNav();
}

function editTab(tabKey) {
    const leaders = getLeaders();
    const current = leaders[tabKey] || { name: tabKey, emoji: '📌' };

    openModal('Edit Tab', `
        <label>Emoji</label>
        <input type="text" id="tabEmoji" value="${current.emoji || ''}" placeholder="e.g., 🟣 🔵 🧡" style="font-size:20px;">
        <label>Name</label>
        <input type="text" id="tabName" value="${escapeHtml(current.name)}" placeholder="e.g., Anthony L.">
        <button class="modal-submit">Save</button>
    `, () => {
        const emoji = document.getElementById('tabEmoji').value.trim() || current.emoji;
        const name = document.getElementById('tabName').value.trim() || current.name;
        leaders[tabKey] = { ...current, emoji, name };
        saveLeaders(leaders);
        LEADERS = leaders;
        renderNav();
        closeModal();
        showToast('Tab updated ✨');
    });
}

function initNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Ensure all views and buttons are deactivated first
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
            });
            btn.classList.add('active');
            const targetView = document.getElementById(`view-${btn.dataset.view}`);
            if (targetView) {
                targetView.classList.add('active');
            }

            if (btn.dataset.view === 'overview') renderOverview();
            if (btn.dataset.view === 'diary') renderDiary();
            if (btn.dataset.view === 'daily') renderDaily();
        });

        // Right-click to edit tab
        const view = btn.dataset.view;
        const leaderKeys = Object.keys(getLeaders());
        if (leaderKeys.includes(view) || view === 'daily') {
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                editTab(view);
            });
        }
    });
}

// --- Modal ---
function openModal(title, bodyHtml, onSubmit) {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    overlay.classList.add('active');

    setTimeout(() => {
        const firstInput = document.querySelector('#modalBody input, #modalBody textarea');
        if (firstInput) firstInput.focus();
    }, 100);

    const submitBtn = document.querySelector('#modalBody .modal-submit');
    if (submitBtn && onSubmit) {
        submitBtn.addEventListener('click', onSubmit);
    }

    document.querySelectorAll('#modalBody input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && onSubmit) onSubmit();
        });
    });
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// --- Collapsible Sections ---
document.addEventListener('click', (e) => {
    const header = e.target.closest('.section-header');
    if (!header) return;
    // Don't collapse if clicking a button inside the header
    if (e.target.closest('button') || e.target.closest('a')) return;
    const section = header.closest('.section-block');
    if (!section) return;
    const content = section.querySelector('.waiting-list, .nudge-list, .completed-list, .notes-cards, .morale-list, .prefs-content, .coverage-notes-items, .daily-checklist, .folders-container');
    if (!content) return;
    content.classList.toggle('collapsed');
});

// --- Event Listeners ---
function initEventListeners() {
    // Close modal
    document.getElementById('modalClose').addEventListener('click', closeModal);

    // Add task buttons
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const leader = btn.dataset.leader;
            openModal(`Add Task — ${LEADERS[leader].name}`, `
                <label>What needs to be done?</label>
                <input type="text" id="taskTitle" placeholder="e.g., Book venue for offsite">
                <div id="dueDateGroup">
                    <label>Due date (optional)</label>
                    <input type="date" id="taskDue">
                </div>
                <label>Type</label>
                <select id="taskType" onchange="document.getElementById('dueDateGroup').style.display = this.value === 'recurring' ? 'none' : 'block'; document.getElementById('taskDayGroup').style.display = this.value === 'recurring' ? 'block' : 'none';">
                    <option value="task">One-time task</option>
                    <option value="recurring">Recurring</option>
                </select>
                <div id="taskDayGroup" style="display:none;">
                    <label>Which day?</label>
                    <select id="taskDay">
                        <option value="">No specific day</option>
                        <option value="everyday">Every day</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                    </select>
                </div>
                <label>Notes (optional)</label>
                <textarea id="taskNotes" placeholder="Any extra details..."></textarea>
                <button class="modal-submit">Add Task</button>
            `, () => {
                const title = document.getElementById('taskTitle').value.trim();
                if (!title) return;
                const type = document.getElementById('taskType').value;
                addTask(leader, {
                    title,
                    dueDate: type === 'recurring' ? null : (document.getElementById('taskDue').value || null),
                    type,
                    recurringDay: type === 'recurring' ? (document.getElementById('taskDay').value || null) : null,
                    notes: document.getElementById('taskNotes').value.trim()
                });
                closeModal();
                showToast('Task added ✨');
            });
        });
    });

    // Add waiting buttons
    document.querySelectorAll('[data-type="waiting"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const leader = btn.dataset.leader;
            openModal('Add Pending Item', `
                <label>What are you waiting on?</label>
                <input type="text" id="waitingText" placeholder="e.g., Budget approval">
                <label>Who from?</label>
                <input type="text" id="waitingWho" placeholder="e.g., James">
                <label>Source</label>
                <select id="waitingSource">
                    <option value="Slack">Slack</option>
                    <option value="Outlook">Outlook</option>
                    <option value="In person">In person</option>
                    <option value="Other">Other</option>
                </select>
                <label>Remind me on (optional)</label>
                <input type="date" id="waitingReminder">
                <button class="modal-submit">Add Item</button>
            `, () => {
                const text = document.getElementById('waitingText').value.trim();
                if (!text) return;
                const items = getWaiting(leader);
                items.push({
                    text,
                    who: document.getElementById('waitingWho').value.trim(),
                    source: document.getElementById('waitingSource').value,
                    date: getToday(),
                    reminderDate: document.getElementById('waitingReminder').value || null
                });
                saveWaiting(leader, items);
                renderWaiting(leader);
                renderNudges(leader);
                closeModal();
                showToast('Added to waiting list');
            });
        });
    });

    // Add morale event
    document.querySelector('[data-type="morale"]')?.addEventListener('click', () => {
        openModal('Add Morale Event', `
            <label>Event name</label>
            <input type="text" id="moraleName" placeholder="e.g., Team lunch, Game day">
            <label>Date (optional)</label>
            <input type="date" id="moraleDate">
            <label>Checklist items (one per line)</label>
            <textarea id="moraleChecklist" placeholder="Venue\nCatering\nHeadcount\nComms/invite\nBudget"></textarea>
            <button class="modal-submit">Add Event</button>
        `, () => {
            const title = document.getElementById('moraleName').value.trim();
            if (!title) return;
            const checklist = document.getElementById('moraleChecklist').value.trim().split('\n').filter(Boolean).map(text => ({ text: text.trim(), done: false }));
            const events = getMoraleEvents();
            events.push({
                title,
                date: document.getElementById('moraleDate').value || null,
                checklist
            });
            saveData('morale-events', events);
            renderMoraleEvents();
            closeModal();
            showToast('Event added 🎉');
        });
    });

    // Copy weekly summary
    document.getElementById('copyWeekly')?.addEventListener('click', () => {
        const summary = document.getElementById('weeklySummary')?.value;
        if (summary) {
            suppressBanner = true;
            navigator.clipboard.writeText(summary).then(() => {
                markAsInternalCopy(summary);
                showToast('Weekly summary copied');
            });
            setTimeout(() => { suppressBanner = false; }, 5000);
        }
    });

    // Archive this week manually
    document.getElementById('archiveNow')?.addEventListener('click', () => {
        archiveWeek();
    });

    // Add coverage lane
    document.getElementById('addCoverageLane')?.addEventListener('click', () => {
        openModal('Add Coverage Lane', `
            <label>Who are you covering for?</label>
            <input type="text" id="coverageName" placeholder="e.g., Maria, Jake">
            <label>Their leader (optional)</label>
            <input type="text" id="coverageLeader" placeholder="e.g., VP of Ops">
            <label>Expected return date (optional)</label>
            <input type="date" id="coverageReturn">
            <button class="modal-submit">Add Lane</button>
        `, () => {
            const name = document.getElementById('coverageName').value.trim();
            if (!name) return;
            const lanes = getCoverageLanes();
            lanes.push({
                id: 'cov-' + Date.now(),
                name,
                leader: document.getElementById('coverageLeader').value.trim(),
                returnDate: document.getElementById('coverageReturn').value || null,
                tasks: [],
                handoffNotes: '',
                active: true
            });
            saveCoverageLanes(lanes);
            renderCoverageLanes();
            closeModal();
            showToast(`Coverage lane added for ${name}`);
        });
    });
}

// --- Initialize Recurring Tasks ---
function initRecurring() {
    Object.keys(DEFAULT_RECURRING).forEach(leader => {
        const tasks = getTasks(leader);
        const hasRecurring = tasks.some(t => t.type === 'recurring');
        if (!hasRecurring) {
            DEFAULT_RECURRING[leader].forEach(r => {
                tasks.push({
                    id: `recurring-${leader}-${Date.now()}-${Math.random()}`,
                    title: r.title,
                    type: 'recurring',
                    frequency: r.frequency,
                    dueDate: null,
                    notes: '',
                    createdAt: getToday(),
                    completed: false
                });
            });
            saveTasks(leader, tasks);
        }
    });
}

// --- Daily View ---
function renderDaily() {
    const container = document.getElementById('dailyContent');
    const dateEl = document.getElementById('dailyDate');
    if (!container) return;

    dateEl.textContent = formatDate(new Date());
    const today = getToday();

    let html = '';

    Object.keys(getLeaders()).forEach(leader => {
        const name = LEADERS[leader] ? LEADERS[leader].name : leader;
        const colorClass = LEADERS[leader] ? LEADERS[leader].color || 'purple' : 'purple';
        const emoji = LEADERS[leader] ? LEADERS[leader].emoji || '📌' : '📌';

        const tasks = getTasks(leader);
        const dueToday = tasks.filter(t => !t.completed && t.type !== 'recurring' && t.dueDate === today);
        const completedToday = tasks.filter(t => t.completed && t.type !== 'recurring' && t.completedAt === today);
        
        // Recurring tasks for today's day of week (specific day OR "every day")
        const todayDay = String(new Date().getDay());
        const dismissed = getData(`recurring-dismissed-${today}`, []);
        const recurringToday = tasks.filter(t => !t.completed && t.type === 'recurring' && t.recurringDay && (t.recurringDay === todayDay || t.recurringDay === 'everyday') && !dismissed.includes(t.id));

        // Waiting items that need a nudge
        const waiting = getWaiting(leader);
        const needsNudge = waiting.filter(w => getDayAge(w.date) >= 2);

        // Items with a reminder set for today
        const remindersToday = waiting.filter(w => w.reminderDate === today);

        const hasItems = dueToday.length > 0 || recurringToday.length > 0 || needsNudge.length > 0 || remindersToday.length > 0 || completedToday.length > 0;

        html += `<div class="daily-leader-section ${colorClass}">`;
        html += `<div class="daily-leader-header">${emoji} ${name} <button onclick="addTaskFromToday('${leader}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer;color:var(--text-secondary);margin-left:8px;">+ Add</button></div>`;

        if (!hasItems) {
            html += `<div class="daily-empty-leader">Nothing pressing today ✨</div>`;
        } else {
            if (dueToday.length > 0) {
                html += `<div class="daily-subsection">`;
                html += `<div class="daily-subsection-title">📌 Due Today</div>`;
                html += dueToday.map(t => `
                    <div class="daily-item">
                        <button class="daily-complete-btn" onclick="event.stopPropagation();completeDailyTask('${leader}','${t.id}')">✓</button>
                        <span class="daily-item-badge due-today">today</span>
                        <span class="daily-item-text">${linkify(t.title)}${t.notes ? `<span style="display:block;font-size:11px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(t.notes.substring(0, 60))}${t.notes.length > 60 ? '...' : ''}</span>` : ''}</span>
                        <button onclick="event.stopPropagation();pushToTomorrow('${leader}','${t.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer;color:var(--text-secondary);white-space:nowrap;">→ ${new Date().getDay() === 5 ? 'Mon' : 'tmrw'}</button>
                    </div>
                `).join('');
                html += `</div>`;
            }

            if (recurringToday.length > 0) {
                html += `<div class="daily-subsection">`;
                html += `<div class="daily-subsection-title">🔁 Recurring</div>`;
                html += recurringToday.map(t => `
                    <div class="daily-item">
                        <button class="daily-complete-btn" onclick="event.stopPropagation();dismissRecurringToday('${leader}','${t.id}')">✓</button>
                        <span class="daily-item-badge" style="background:var(--purple-light);color:var(--purple);">weekly</span>
                        <span class="daily-item-text">${linkify(t.title)}${t.notes ? `<span style="display:block;font-size:11px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(t.notes.substring(0, 60))}${t.notes.length > 60 ? '...' : ''}</span>` : ''}</span>
                    </div>
                `).join('');
                html += `</div>`;
            }

            if (needsNudge.length > 0) {
                html += `<div class="daily-subsection">`;
                html += `<div class="daily-subsection-title">💌 Needs Follow-up</div>`;
                html += needsNudge.map(w => {
                    const idx = waiting.indexOf(w);
                    return `
                    <div class="daily-item">
                        <button class="daily-complete-btn" onclick="event.stopPropagation();completeWaiting('${leader}', ${idx});renderDaily();updateProgressBar();">✓</button>
                        <span class="daily-item-badge" style="background:#fff8e0;color:#9a7b00;">${getDayAge(w.date)}d</span>
                        <span class="daily-item-text">${linkify(w.text)}${w.who ? ` — ${escapeHtml(w.who)}` : ''}</span>
                    </div>
                `}).join('');
                html += `</div>`;
            }

            if (remindersToday.length > 0) {
                html += `<div class="daily-subsection">`;
                html += `<div class="daily-subsection-title">🔔 Reminders</div>`;
                html += remindersToday.map(w => {
                    const idx = waiting.indexOf(w);
                    return `
                    <div class="daily-item">
                        <button class="daily-complete-btn" onclick="event.stopPropagation();completeWaiting('${leader}', ${idx});renderDaily();updateProgressBar();">✓</button>
                        <span class="daily-item-badge" style="background:var(--orange-light);color:var(--orange);">reminder</span>
                        <span class="daily-item-text">${linkify(w.text)}${w.who ? ` — ${escapeHtml(w.who)}` : ''}</span>
                    </div>
                `}).join('');
                html += `</div>`;
            }

            if (completedToday.length > 0) {
                html += `<div class="daily-subsection">`;
                html += `<div class="daily-subsection-title">✅ Done Today</div>`;
                html += completedToday.map(t => `
                    <div class="daily-item" style="opacity:0.5;">
                        <span class="daily-item-badge" style="background:var(--green-light);color:var(--green);">done</span>
                        <span class="daily-item-text" style="text-decoration:line-through;">${escapeHtml(t.title)}</span>
                    </div>
                `).join('');
                html += `</div>`;
            }
        }

        html += `</div>`;
    });

    // Coverage section — only tasks due today
    const lanes = getCoverageLanes();
    if (lanes.length > 0) {
        let hasCoverageToday = false;
        let coverageHtml = '';
        lanes.forEach(lane => {
            const dueTodayTasks = lane.tasks.filter(t => !t.completed && t.dueDate === today);
            if (dueTodayTasks.length > 0) {
                hasCoverageToday = true;
                coverageHtml += `<div class="daily-subsection">`;
                coverageHtml += `<div class="daily-subsection-title">Covering for ${escapeHtml(lane.name)}</div>`;
                coverageHtml += dueTodayTasks.map(t => `
                    <div class="daily-item">
                        <button class="daily-complete-btn" onclick="event.stopPropagation();completeCoverageTask('${lane.id}','${t.id}');renderDaily();">✓</button>
                        <span class="daily-item-badge" style="background:var(--green-light);color:var(--green);">today</span>
                        <span class="daily-item-text">${linkify(t.title)}</span>
                    </div>
                `).join('');
                coverageHtml += `</div>`;
            }
        });
        if (hasCoverageToday) {
            html += `<div class="daily-leader-section" style="border-left:4px solid var(--green);">`;
            html += `<div class="daily-leader-header">🌿 Coverage</div>`;
            html += coverageHtml;
            html += `</div>`;
        }
    }

    // Daily personal checklist
    const dailyChecklist = getData('daily-checklist', []);
    html += `
        <div class="section-block" style="margin-top:16px;">
            <div class="section-header">
                <h3>☑️ Personal Checklist</h3>
                <span class="section-subtitle">Just for today — disappears when done</span>
            </div>
            <div class="daily-checklist" id="dailyChecklist">
                ${dailyChecklist.map((item, i) => `
                    <div class="daily-checklist-item ${item.done ? 'done' : ''}">
                        <button class="daily-complete-btn ${item.done ? 'checked' : ''}" onclick="toggleDailyCheck(${i})">✓</button>
                        <span class="${item.done ? 'line-through' : ''}" onclick="editDailyCheck(${i})" style="cursor:pointer;flex:1;">${escapeHtml(item.text)}</span>
                        ${item.dueDate ? `<span class="task-due">${new Date(item.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                        <button class="note-card-delete" onclick="deleteDailyCheck(${i})" style="opacity:0.3;font-size:14px;">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="daily-checklist-add">
                <input type="text" id="dailyCheckInput" placeholder="Add a personal to-do..." onkeydown="if(event.key==='Enter')addDailyCheck()">
                <input type="date" id="dailyCheckDue" style="width:130px;">
                <button onclick="addDailyCheck()">+</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function completeDailyTask(leader, taskId) {
    completeTask(leader, taskId);
    renderDaily();
}

function addTaskFromToday(leader) {
    openModal(`Add Task — ${LEADERS[leader].name}`, `
        <label>What needs to be done?</label>
        <input type="text" id="taskTitle" placeholder="e.g., Book venue for offsite">
        <label>Due date</label>
        <input type="date" id="taskDue" value="${getToday()}">
        <label>Notes (optional)</label>
        <textarea id="taskNotes" placeholder="Any extra details..."></textarea>
        <button class="modal-submit">Add Task</button>
    `, () => {
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) return;
        addTask(leader, {
            title,
            dueDate: document.getElementById('taskDue').value || getToday(),
            type: 'task',
            notes: document.getElementById('taskNotes').value.trim()
        });
        closeModal();
        renderDaily();
        updateProgressBar();
        updateTaskCounts();
        showToast('Task added ✨');
    });
}

function dismissRecurringToday(leader, taskId) {
    const today = getToday();
    const dismissed = getData(`recurring-dismissed-${today}`, []);
    dismissed.push(taskId);
    saveData(`recurring-dismissed-${today}`, dismissed);
    renderDaily();
    showToast('✓ Done for today');
}

function pushToTomorrow(leader, taskId) {
    const tasks = getTasks(leader);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    let daysToAdd = 1;
    if (dayOfWeek === 5) daysToAdd = 3; // Friday → Monday
    else if (dayOfWeek === 6) daysToAdd = 2; // Saturday → Monday
    const next = new Date();
    next.setDate(next.getDate() + daysToAdd);
    task.dueDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    saveTasks(leader, tasks);
    renderTasks(leader);
    renderDaily();
    updateProgressBar();
    updateTaskCounts();
    showToast(dayOfWeek === 5 ? 'Moved to Monday →' : 'Moved to tomorrow →');
}

function addDailyCheck() {
    const input = document.getElementById('dailyCheckInput');
    const dueInput = document.getElementById('dailyCheckDue');
    const text = input.value.trim();
    if (!text) return;
    const checklist = getData('daily-checklist', []);
    checklist.push({ text, done: false, dueDate: dueInput.value || null });
    saveData('daily-checklist', checklist);
    input.value = '';
    dueInput.value = '';
    renderDaily();
}

function toggleDailyCheck(index) {
    const checklist = getData('daily-checklist', []);
    if (!checklist[index]) return;
    checklist[index].done = !checklist[index].done;
    if (checklist[index].done) {
        checklist[index].completedDate = getToday();
    } else {
        checklist[index].completedDate = null;
    }
    saveData('daily-checklist', checklist);
    renderDaily();
    updateProgressBar();
}

function editDailyCheck(index) {
    const checklist = getData('daily-checklist', []);
    if (!checklist[index]) return;
    openModal('Edit Item', `
        <label>What needs to be done?</label>
        <input type="text" id="editCheckText" value="${escapeHtml(checklist[index].text)}">
        <label>Due date (optional)</label>
        <input type="date" id="editCheckDue" value="${checklist[index].dueDate || ''}">
        <button class="modal-submit">Save</button>
    `, () => {
        const text = document.getElementById('editCheckText').value.trim();
        if (!text) return;
        checklist[index].text = text;
        checklist[index].dueDate = document.getElementById('editCheckDue').value || null;
        saveData('daily-checklist', checklist);
        renderDaily();
        closeModal();
    });
}

function deleteDailyCheck(index) {
    const checklist = getData('daily-checklist', []);
    checklist.splice(index, 1);
    saveData('daily-checklist', checklist);
    renderDaily();
}

// --- Coverage Lanes ---
function getCoverageLanes() {
    return getData('coverage-lanes', []);
}

function saveCoverageLanes(lanes) {
    saveData('coverage-lanes', lanes);
}

function addCoverageTask(laneId, task) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;
    task.id = Date.now().toString();
    task.createdAt = getToday();
    task.completed = false;
    lane.tasks.push(task);
    saveCoverageLanes(lanes);
    autoGenerateHandoff(laneId);
    renderCoverageLanes();
}

function deleteCoverageTask(laneId, taskId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;
    lane.tasks = lane.tasks.filter(t => t.id !== taskId);
    saveCoverageLanes(lanes);
    autoGenerateHandoff(laneId);
    renderCoverageLanes();
}

function completeCoverageTask(laneId, taskId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;
    const task = lane.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? getToday() : null;
    }
    saveCoverageLanes(lanes);

    // Auto-generate detailed handoff notes
    autoGenerateHandoff(laneId);

    renderCoverageLanes();
    if (task && task.completed) showToast('Nice — task done ✓');
}

function autoGenerateHandoff(laneId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const completed = lane.tasks.filter(t => t.completed);
    const open = lane.tasks.filter(t => !t.completed);

    let notes = '';

    if (completed.length > 0) {
        notes += `DONE:\n`;
        notes += completed.map(t => {
            let line = `• ${t.title}`;
            if (t.completedAt) line += ` (completed ${t.completedAt})`;
            if (t.notes) line += `\n  → ${t.notes}`;
            return line;
        }).join('\n');
    }

    if (open.length > 0) {
        notes += `${completed.length > 0 ? '\n\n' : ''}STILL OPEN — needs your attention:\n`;
        notes += open.map(t => {
            let line = `• ${t.title}`;
            if (t.dueDate) line += ` (due ${t.dueDate})`;
            if (t.notes) line += `\n  → ${t.notes}`;
            return line;
        }).join('\n');
    }

    if (completed.length === 0 && open.length === 0) {
        notes = 'No tasks were logged during coverage.';
    }

    lane.handoffNotes = notes;
    saveCoverageLanes(lanes);
}

function deleteCoverageLane(laneId) {
    const lanes = getCoverageLanes().filter(l => l.id !== laneId);
    saveCoverageLanes(lanes);
    renderCoverageLanes();
    showToast('Coverage lane deleted');
}

function completeCoverageLane(laneId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    // Archive with completion info
    const archives = getData('coverage-archives', []);
    archives.unshift({
        ...lane,
        archivedAt: new Date().toISOString(),
        completedAt: getToday(),
        status: 'completed',
        totalTasks: lane.tasks.length,
        completedTasks: lane.tasks.filter(t => t.completed).length
    });
    saveData('coverage-archives', archives);

    // Remove from active lanes
    const remaining = lanes.filter(l => l.id !== laneId);
    saveCoverageLanes(remaining);
    renderCoverageLanes();
    showToast('Coverage complete — archived to Diary ✅');
}

function copyCoverageHandoff(laneId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const completed = lane.tasks.filter(t => t.completed);
    const open = lane.tasks.filter(t => !t.completed);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    let handoff = `Coverage Handoff — ${lane.name}\n`;
    if (lane.leader) handoff += `(${lane.leader}'s EA)\n`;
    handoff += `Generated: ${today}\n`;
    handoff += `\n━━ Completed ━━\n`;
    handoff += completed.length > 0 ? completed.map(t => `✅ ${t.title}`).join('\n') : 'None';
    handoff += `\n\n━━ Still Open ━━\n`;
    handoff += open.length > 0 ? open.map(t => `⬜ ${t.title}${t.notes ? ` — ${t.notes}` : ''}`).join('\n') : 'None — all clear!';
    handoff += `\n\n━━ Notes ━━\n`;
    handoff += lane.handoffNotes || 'None';

    // Auto-fill the handoff notes textarea
    const textarea = document.querySelector(`.coverage-handoff-notes[data-lane-id="${laneId}"]`);
    if (textarea && !lane.handoffNotes) {
        const autoNotes = `Covered ${completed.length + open.length} items. ${completed.length} done, ${open.length} still open.`;
        textarea.value = autoNotes;
        saveCoverageHandoff(laneId, autoNotes);
    }

    navigator.clipboard.writeText(handoff).then(() => {
        markAsInternalCopy(handoff);
        showToast('Handoff summary copied');
    });
}

function emailCoverageHandoff(laneId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const completed = lane.tasks.filter(t => t.completed);
    const open = lane.tasks.filter(t => !t.completed);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const subject = encodeURIComponent(`Coverage Handoff — ${lane.name} (${today})`);

    let body = `Hi!\n\nHere's your coverage handoff for while you were out:\n\n`;
    body += `COMPLETED:\n`;
    body += completed.length > 0 ? completed.map(t => `• ${t.title}${t.notes ? ' — ' + t.notes : ''}`).join('\n') : 'None';
    body += `\n\nSTILL OPEN (needs your attention):\n`;
    body += open.length > 0 ? open.map(t => `• ${t.title}${t.notes ? ' — ' + t.notes : ''}${t.dueDate ? ' (due ' + t.dueDate + ')' : ''}`).join('\n') : 'None — all clear!';
    body += `\n\nNOTES:\n${lane.handoffNotes || 'None'}`;
    body += `\n\nLet me know if you have any questions!`;

    const encodedBody = encodeURIComponent(body);

    // Suppress the banner after opening email
    suppressBanner = true;
    navigator.clipboard.readText().then(text => { setLastClipboard(text.trim()); }).catch(() => {});
    setTimeout(() => { suppressBanner = false; }, 5000);

    window.open(`https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${encodedBody}`, '_blank');
}

function saveCoverageHandoff(laneId, notes) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;
    lane.handoffNotes = notes;
    saveCoverageLanes(lanes);
}

function renderCoverageLanes() {
    const lanes = getCoverageLanes();
    const container = document.getElementById('coverageLanes');
    if (!container) return;

    if (lanes.length === 0) {
        container.innerHTML = `
            <div class="coverage-empty">
                <h3>No active coverage</h3>
                <p>When you're covering for another EA, click "+ Add Coverage Lane" to create a space for their tasks.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lanes.map(lane => {
        const activeTasks = lane.tasks.filter(t => !t.completed);
        const completedTasks = lane.tasks.filter(t => t.completed);
        const returnInfo = lane.returnDate ? `Back ${new Date(lane.returnDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';

        return `
            <div class="coverage-lane" data-lane-id="${lane.id}">
                <div class="coverage-lane-header">
                    <h3>
                        🌿 Covering for ${escapeHtml(lane.name)}
                        ${lane.leader ? `<span class="lane-subtitle">(${escapeHtml(lane.leader)})</span>` : ''}
                    </h3>
                    <div class="coverage-lane-actions">
                        ${returnInfo ? `<span style="font-size:11px;color:var(--green);padding:4px 8px;background:var(--green-light);border-radius:6px;">${returnInfo}</span>` : ''}
                        <button class="add-btn-small" onclick="openCoverageTaskModal('${lane.id}')">+ Task</button>
                        <button class="copy-btn" onclick="emailCoverageHandoff('${lane.id}')">📧 Handoff</button>
                        <button class="add-btn-small" style="color:var(--green);border-color:var(--green);" onclick="if(confirm('Mark this coverage as complete and archive it?')) completeCoverageLane('${lane.id}')">✓ Complete</button>
                        <button class="add-btn-small" style="color:var(--red);border-color:var(--red);" onclick="if(confirm('Remove this coverage lane?')) deleteCoverageLane('${lane.id}')">× Remove</button>
                    </div>
                </div>

                <div class="task-columns" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="task-column">
                        <div class="column-header urgent">⬜ To Do (${activeTasks.length})</div>
                        <div class="task-list">
                            ${activeTasks.length === 0 ? '<div class="empty-state">nothing here ✨</div>' :
                            activeTasks.map(task => `
                                <div class="task-item" data-id="${task.id}">
                                    <div class="task-actions">
                                        <button class="complete-btn" onclick="completeCoverageTask('${lane.id}', '${task.id}')" title="Complete">✓</button>
                                        <button onclick="deleteCoverageTask('${lane.id}', '${task.id}')" title="Delete">×</button>
                                    </div>
                                    <div class="task-title">${escapeHtml(task.title)}</div>
                                    <div class="task-meta">
                                        ${task.dueDate ? `<span class="task-due">${new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                                        ${task.notes ? `<span>${escapeHtml(task.notes.substring(0, 30))}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="task-column">
                        <div class="column-header upcoming">✅ Done (${completedTasks.length})</div>
                        <div class="task-list">
                            ${completedTasks.length === 0 ? '<div class="empty-state">nothing yet</div>' :
                            completedTasks.map(task => `
                                <div class="task-item completed" data-id="${task.id}">
                                    <div class="task-actions">
                                        <button onclick="deleteCoverageTask('${lane.id}', '${task.id}')" title="Delete">×</button>
                                    </div>
                                    <div class="task-title">${escapeHtml(task.title)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="task-column">
                        <div class="column-header recurring">📋 Handoff Notes</div>
                        <textarea class="coverage-handoff-notes" data-lane-id="${lane.id}" placeholder="Notes for when they're back..." oninput="saveCoverageHandoff('${lane.id}', this.value)">${escapeHtml(lane.handoffNotes || '')}</textarea>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openCoverageTaskModal(laneId) {
    const lanes = getCoverageLanes();
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    openModal(`Add Task — covering for ${lane.name}`, `
        <label>What needs to be done?</label>
        <input type="text" id="taskTitle" placeholder="e.g., Reschedule their 1:1s">
        <label>Due date (optional)</label>
        <input type="date" id="taskDue">
        <label>Notes (optional)</label>
        <textarea id="taskNotes" placeholder="Any extra details..."></textarea>
        <button class="modal-submit">Add Task</button>
    `, () => {
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) return;
        addCoverageTask(laneId, {
            title,
            dueDate: document.getElementById('taskDue').value || null,
            type: 'task',
            notes: document.getElementById('taskNotes').value.trim()
        });
        closeModal();
        showToast('Task added ✨');
    });
}

// --- Weekly Archive & Diary ---
function getWeekId(date) {
    // Get the Monday of the week for a given date
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function generateWeeklySummaryText() {
    let summary = '';

    Object.keys(getLeaders()).forEach(leader => {
        const name = LEADERS[leader].name;
        const tasks = getTasks(leader);
        const completed = tasks.filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt));
        const overdue = tasks.filter(t => !t.completed && categorizeTask(t) === 'overdue');
        const waiting = getWaiting(leader);

        summary += `━━ ${name} ━━\n`;
        summary += `✅ Completed: ${completed.length > 0 ? completed.map(t => t.title).join(', ') : 'none'}\n`;
        summary += `🔴 Overdue: ${overdue.length > 0 ? overdue.map(t => t.title).join(', ') : 'none'}\n`;
        summary += `⏳ Waiting on: ${waiting.length > 0 ? waiting.map(w => w.text).join(', ') : 'none'}\n\n`;
    });

    summary += `━━ EA Team ━━\n`;
    const eaTasks = getTasks('eateam');
    const eaCompleted = eaTasks.filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt));
    summary += `✅ Completed: ${eaCompleted.length > 0 ? eaCompleted.map(t => t.title).join(', ') : 'none'}\n`;
    summary += `📌 In progress: ${eaTasks.filter(t => !t.completed).map(t => t.title).join(', ') || 'none'}\n`;

    return summary;
}

function getWeeklyStats() {
    const totalTasks = Object.keys(getLeaders()).reduce((sum, l) => sum + getTasks(l).filter(t => !t.completed).length, 0);
    const completedThisWeek = Object.keys(getLeaders()).reduce((sum, l) => sum + getTasks(l).filter(t => t.completed && t.completedAt && isThisWorkWeek(t.completedAt)).length, 0);
    const allWaiting = Object.keys(getLeaders()).reduce((sum, l) => sum + getWaiting(l).length, 0);
    const allOverdue = Object.keys(getLeaders()).reduce((sum, l) => sum + getTasks(l).filter(t => !t.completed && categorizeTask(t) === 'overdue').length, 0);

    return { totalTasks, completedThisWeek, allWaiting, allOverdue };
}

function archiveWeek() {
    const weekId = getWeekId(new Date());
    const archives = getData('weekly-archives', []);

    // Don't archive the same week twice
    if (archives.some(a => a.weekId === weekId)) {
        showToast('This week is already archived');
        return;
    }

    const now = new Date();
    const weekStart = new Date(weekId + 'T12:00:00');
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Friday

    const archive = {
        weekId,
        archivedAt: now.toISOString(),
        weekLabel: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        summary: generateWeeklySummaryText(),
        stats: getWeeklyStats()
    };

    archives.unshift(archive); // newest first
    saveData('weekly-archives', archives);
    showToast('Week archived to your diary 📖');
}

function checkAutoArchive() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri

    if (dayOfWeek === 5) { // Friday
        const weekId = getWeekId(today);
        const lastAutoArchive = getData('last-auto-archive', '');

        if (lastAutoArchive !== weekId) {
            archiveWeek();
            saveData('last-auto-archive', weekId);
        }
    }
}

function renderDiary() {
    const archives = getData('weekly-archives', []);
    const container = document.getElementById('diaryEntries');
    if (!container) return;

    if (archives.length === 0) {
        container.innerHTML = `
            <div class="diary-empty">
                <h3>No entries yet</h3>
                <p>Your weekly summaries will appear here every Friday automatically.<br>
                You can also click "Archive This Week" on the Overview tab anytime.</p>
            </div>
        `;
    } else {
        container.innerHTML = archives.map(entry => `
            <div class="diary-entry">
                <div class="diary-entry-header">
                    <h4>${escapeHtml(entry.weekLabel)}</h4>
                    <span class="diary-date">archived ${new Date(entry.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="diary-entry-content">${escapeHtml(entry.summary)}</div>
                <div class="diary-entry-stats">
                    <span class="diary-stat">✅ <span class="stat-num">${entry.stats.completedThisWeek}</span> completed</span>
                    <span class="diary-stat">📌 <span class="stat-num">${entry.stats.totalTasks}</span> open</span>
                    <span class="diary-stat">⏳ <span class="stat-num">${entry.stats.allWaiting}</span> waiting</span>
                    <span class="diary-stat">🔴 <span class="stat-num">${entry.stats.allOverdue}</span> overdue</span>
                </div>
            </div>
        `).join('');
    }

    // Render coverage archive
    renderCoverageArchive();

    // Render event archive
    renderEventArchive();

    // Render promo entries
    renderPromoEntries();

    // Render monthly archives
    renderMonthlyArchive();

    // Add promo entry button
    document.getElementById('addPromoEntry')?.addEventListener('click', () => {
        openModal('Add Entry', `
            <label>Title</label>
            <input type="text" id="promoTitle" placeholder="e.g., Shoutout from VP, Led offsite planning">
            <label>Date (optional)</label>
            <input type="date" id="promoDate">
            <button class="modal-submit">Add</button>
        `, () => {
            const title = document.getElementById('promoTitle').value.trim();
            if (!title) return;
            const entries = getPromoEntries();
            entries.unshift({
                title,
                date: document.getElementById('promoDate').value || getToday(),
                notes: '',
                files: []
            });
            saveData('promo-entries', entries);
            renderPromoEntries();
            closeModal();
            showToast('Entry added ⭐');
        });
    });
}

function renderCoverageArchive() {
    const archives = getData('coverage-archives', []);
    const container = document.getElementById('coverageArchive');
    if (!container) return;

    if (archives.length === 0) {
        container.innerHTML = '<div class="empty-state">No past coverage yet — when you remove a coverage lane, it\'ll be saved here.</div>';
        return;
    }

    container.innerHTML = archives.map((lane, i) => {
        const archivedDate = new Date(lane.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
            <div class="diary-entry" style="border-left:4px solid var(--green);">
                <div class="diary-entry-header">
                    <h4>🌿 Covered for ${escapeHtml(lane.name)}${lane.leader ? ` <span style="font-weight:400;color:var(--text-light);">(${escapeHtml(lane.leader)})</span>` : ''}</h4>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="diary-date">archived ${archivedDate}</span>
                        <button onclick="deleteCoverageArchive(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-light);">🗑️</button>
                    </div>
                </div>
                <div class="diary-entry-stats" style="margin-top:0;margin-bottom:12px;padding-top:0;border-top:none;">
                    <span class="diary-stat">✅ <span class="stat-num">${lane.completedTasks}</span> completed</span>
                    <span class="diary-stat">📋 <span class="stat-num">${lane.totalTasks}</span> total tasks</span>
                    ${lane.returnDate ? `<span class="diary-stat">📅 Return: ${new Date(lane.returnDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                </div>
                <div class="diary-entry-content" style="font-size:12px;">
${lane.tasks.map(t => `${t.completed ? '✅' : '⬜'} ${t.title}`).join('\n')}
${lane.handoffNotes ? '\n📋 Handoff Notes:\n' + lane.handoffNotes : ''}</div>
            </div>
        `;
    }).join('');
}

function deleteCoverageArchive(index) {
    if (!confirm('Delete this coverage history entry?')) return;
    const archives = getData('coverage-archives', []);
    archives.splice(index, 1);
    saveData('coverage-archives', archives);
    renderCoverageArchive();
    showToast('Coverage entry deleted');
}

function renderEventArchive() {
    const archives = getData('event-archives', []);
    const container = document.getElementById('eventArchive');
    if (!container) return;

    if (archives.length === 0) {
        container.innerHTML = '<div class="empty-state">No past events yet — archive an event when it\'s done.</div>';
        return;
    }

    container.innerHTML = archives.map((event, i) => {
        const archivedDate = new Date(event.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const eventDate = event.date ? new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date';
        const files = event.files || [];

        return `
            <div class="diary-entry" style="border-left:4px solid var(--orange);">
                <div class="diary-entry-header">
                    <h4>🎉 ${escapeHtml(event.title)}</h4>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="diary-date">${eventDate} • archived ${archivedDate}</span>
                        <button onclick="addEventFiles(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-secondary);">📎 Add Files</button>
                        <button onclick="deleteEventArchive(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-light);">🗑️</button>
                    </div>
                </div>
                <div class="diary-entry-stats" style="margin-top:0;margin-bottom:8px;padding-top:0;border-top:none;">
                    ${files.length > 0 ? `<span class="diary-stat">📎 <span class="stat-num">${files.length}</span> file${files.length !== 1 ? 's' : ''}</span>` : ''}
                </div>
                ${event.checklist && event.checklist.length > 0 ? `
                    <div class="diary-entry-content" style="font-size:12px;">
${event.checklist.map(c => `${c.done ? '✅' : '⬜'} ${c.text}`).join('\n')}</div>
                ` : ''}
                ${files.length > 0 ? `
                    <div class="event-files-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                        ${files.map((file, fi) => {
                            const isImage = file.type && file.type.startsWith('image/');
                            return `
                                <div class="file-item" style="position:relative;">
                                    ${isImage ? `<img src="${file.data}" alt="${escapeHtml(file.name)}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="openInlineGallery(this)">` : `<div class="file-icon" style="height:70px;display:flex;align-items:center;justify-content:center;font-size:28px;">📄</div>`}
                                    <div class="file-name" style="font-size:10px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px;">${escapeHtml(file.name)}</div>
                                    <button onclick="event.stopPropagation();deleteEventFile(${i},${fi})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:white;border:1px solid var(--border);font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0.7;">×</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                    <textarea class="tab-notes" id="event-notes-${i}" placeholder="Add notes — highlights, feedback, what went well..." style="min-height:60px;" oninput="saveEventNote(${i}, this.value)">${escapeHtml(event.notes || '')}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

function addEventFiles(eventIdx) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.addEventListener('change', (e) => {
        const archives = getData('event-archives', []);
        const event = archives[eventIdx];
        if (!event) return;
        if (!event.files) event.files = [];

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                event.files.push({
                    id: 'ef-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    name: file.name || `File ${new Date().toLocaleString()}`,
                    type: file.type,
                    data: ev.target.result,
                    date: getToday()
                });
                saveData('event-archives', archives);
                renderEventArchive();
                showToast('File added to event 📎');
            };
            reader.readAsDataURL(file);
        });
    });
    input.click();
}

function deleteEventFile(eventIdx, fileIdx) {
    const archives = getData('event-archives', []);
    const event = archives[eventIdx];
    if (!event || !event.files) return;
    event.files.splice(fileIdx, 1);
    saveData('event-archives', archives);
    renderEventArchive();
}

function saveEventNote(eventIdx, text) {
    const archives = getData('event-archives', []);
    if (!archives[eventIdx]) return;
    archives[eventIdx].notes = text;
    saveData('event-archives', archives);
}

function deleteEventArchive(index) {
    if (!confirm('Delete this event from history?')) return;
    const archives = getData('event-archives', []);
    archives.splice(index, 1);
    saveData('event-archives', archives);
    renderEventArchive();
    showToast('Event entry deleted');
}

// --- Promo / Other Entries ---
function getPromoEntries() {
    return getData('promo-entries', []);
}

function renderPromoEntries() {
    const entries = getPromoEntries();
    const container = document.getElementById('promoEntries');
    if (!container) return;

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state">Nothing yet — add wins, shoutouts, and highlights here.</div>';
        return;
    }

    container.innerHTML = entries.map((entry, i) => {
        const files = entry.files || [];
        return `
            <div class="diary-entry" style="border-left:4px solid var(--yellow);">
                <div class="diary-entry-header">
                    <h4 onclick="editPromoTitle(${i})" style="cursor:pointer;" title="Click to edit">⭐ ${escapeHtml(entry.title)}</h4>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="diary-date">${entry.date || ''}</span>
                        <button onclick="addPromoFiles(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-secondary);">📎 Add Files</button>
                        <button onclick="deletePromoEntry(${i})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--text-light);">🗑️</button>
                    </div>
                </div>
                <textarea class="tab-notes" style="min-height:60px;" placeholder="Add details..." oninput="savePromoNote(${i}, this.value)">${escapeHtml(entry.notes || '')}</textarea>
                ${files.length > 0 ? `
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:10px;">
                        ${files.map((file, fi) => {
                            const isImage = file.type && file.type.startsWith('image/');
                            return `
                                <div class="file-item" style="position:relative;">
                                    ${isImage ? `<img src="${file.data}" alt="${escapeHtml(file.name)}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="openInlineGallery(this)">` : `<div class="file-icon" style="height:70px;display:flex;align-items:center;justify-content:center;font-size:28px;">📄</div>`}
                                    <div style="font-size:10px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px;">${escapeHtml(file.name)}</div>
                                    <button onclick="event.stopPropagation();deletePromoFile(${i},${fi})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:white;border:1px solid var(--border);font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function addPromoFiles(entryIdx) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.addEventListener('change', (e) => {
        const entries = getPromoEntries();
        const entry = entries[entryIdx];
        if (!entry) return;
        if (!entry.files) entry.files = [];

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                entry.files.push({
                    id: 'pf-' + Date.now(),
                    name: file.name,
                    type: file.type,
                    data: ev.target.result,
                    date: getToday()
                });
                saveData('promo-entries', entries);
                renderPromoEntries();
                showToast('File added 📎');
            };
            reader.readAsDataURL(file);
        });
    });
    input.click();
}

function deletePromoFile(entryIdx, fileIdx) {
    const entries = getPromoEntries();
    if (!entries[entryIdx] || !entries[entryIdx].files) return;
    entries[entryIdx].files.splice(fileIdx, 1);
    saveData('promo-entries', entries);
    renderPromoEntries();
}

function savePromoNote(entryIdx, text) {
    const entries = getPromoEntries();
    if (!entries[entryIdx]) return;
    entries[entryIdx].notes = text;
    saveData('promo-entries', entries);
}

function deletePromoEntry(index) {
    if (!confirm('Delete this entry?')) return;
    const entries = getPromoEntries();
    entries.splice(index, 1);
    saveData('promo-entries', entries);
    renderPromoEntries();
    showToast('Entry deleted');
}

function editPromoTitle(index) {
    const entries = getPromoEntries();
    if (!entries[index]) return;
    openModal('Edit Title', `
        <label>Title</label>
        <input type="text" id="promoTitleEdit" value="${escapeHtml(entries[index].title)}">
        <label>Date</label>
        <input type="date" id="promoDateEdit" value="${entries[index].date || ''}">
        <button class="modal-submit">Save</button>
    `, () => {
        const title = document.getElementById('promoTitleEdit').value.trim();
        if (!title) return;
        entries[index].title = title;
        entries[index].date = document.getElementById('promoDateEdit').value || entries[index].date;
        saveData('promo-entries', entries);
        renderPromoEntries();
        closeModal();
        showToast('Title updated ✨');
    });
}

// --- Daily Quote ---
const DAILY_QUOTES = [
    "Another day of making chaos look intentional.",
    "You don't have to do it all today.",
    "They don't know how much you hold together.",
    "Organized chaos is still organized.",
    "You're the reason someone's day runs smoothly.",
    "Not everything is urgent. Breathe.",
    "Main character energy, support role title.",
    "If they only knew.",
    "You've survived worse Mondays.",
    "Doing the most while looking unbothered.",
    "The inbox can wait 5 minutes.",
    "You're not behind — you're prioritizing.",
    "Quietly running the show since day one.",
    "Some days you're the glue. Today might be one of those.",
    "You didn't come this far to only come this far.",
    "Plot twist: you actually have it together.",
    "The calendar fears you.",
    "Unbothered. Moisturized. Scheduling conflicts resolved.",
    "You're doing a lot. Give yourself credit.",
    "Not all heroes wear capes. Some manage calendars.",
    "Today's vibe: get it done, log off, rest.",
    "You're allowed to close Slack for 20 minutes.",
    "Efficiency looks good on you.",
    "They said 'quick question' but you already know it's not.",
    "One fire at a time.",
    "You're not a mind reader but you're close.",
    "The meeting could've been an email. But here we are.",
    "You make the impossible look like a Tuesday.",
    "Protect your peace and your calendar.",
    "Remember: their lack of planning is not your emergency."
];

function getDailyQuote() {
    // Use the date as a seed so it changes daily but stays consistent throughout the day
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
}

// --- Smart Search ---
function initSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) {
            results.classList.remove('active');
            return;
        }

        const matches = searchEverything(query);
        if (matches.length === 0) {
            results.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            results.innerHTML = matches.slice(0, 15).map(m => `
                <div class="search-result-item" onclick="navigateToResult('${m.view}')">
                    <div class="result-title">${escapeHtml(m.title)}</div>
                    <div class="result-meta">${escapeHtml(m.context)}</div>
                </div>
            `).join('');
        }
        results.classList.add('active');
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            results.classList.remove('active');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            results.classList.remove('active');
            input.blur();
        }
    });
}

function searchEverything(query) {
    const results = [];

    // Search tasks
    Object.keys(getLeaders()).forEach(leader => {
        getTasks(leader).forEach(task => {
            if (task.title.toLowerCase().includes(query) || (task.notes && task.notes.toLowerCase().includes(query))) {
                results.push({
                    title: task.title,
                    context: `${LEADERS[leader].name} • ${task.completed ? 'Completed' : categorizeTask(task)}`,
                    view: leader
                });
            }
        });
    });

    // Search waiting items
    Object.keys(getLeaders()).forEach(leader => {
        getWaiting(leader).forEach(item => {
            if (item.text.toLowerCase().includes(query) || (item.who && item.who.toLowerCase().includes(query))) {
                results.push({
                    title: item.text,
                    context: `${LEADERS[leader].name} • Waiting on ${item.who || 'someone'} • ${item.source}`,
                    view: leader
                });
            }
        });
    });

    // Search coverage lanes
    getCoverageLanes().forEach(lane => {
        if (lane.name.toLowerCase().includes(query)) {
            results.push({ title: `Coverage: ${lane.name}`, context: 'Coverage lane', view: 'coverage' });
        }
        lane.tasks.forEach(task => {
            if (task.title.toLowerCase().includes(query)) {
                results.push({ title: task.title, context: `Coverage for ${lane.name}`, view: 'coverage' });
            }
        });
        if (lane.handoffNotes && lane.handoffNotes.toLowerCase().includes(query)) {
            results.push({ title: `Handoff notes for ${lane.name}`, context: lane.handoffNotes.substring(0, 50), view: 'coverage' });
        }
    });

    // Search morale events
    getMoraleEvents().forEach(event => {
        if (event.title.toLowerCase().includes(query)) {
            results.push({ title: event.title, context: 'Morale event • EA Team', view: 'eateam' });
        }
    });

    // Search diary/archives
    getData('weekly-archives', []).forEach(entry => {
        if (entry.summary.toLowerCase().includes(query)) {
            results.push({ title: entry.weekLabel, context: 'Weekly diary entry', view: 'diary' });
        }
    });

    // Search coverage archives
    getData('coverage-archives', []).forEach(lane => {
        if (lane.name.toLowerCase().includes(query) || (lane.handoffNotes && lane.handoffNotes.toLowerCase().includes(query))) {
            results.push({ title: `Past coverage: ${lane.name}`, context: 'Coverage history', view: 'diary' });
        }
    });

    // Search exec preferences
    Object.keys(getLeaders()).forEach(leader => {
        const prefs = getData(`prefs-${leader}`, {});
        Object.values(prefs).forEach(val => {
            if (val && val.toLowerCase().includes(query)) {
                results.push({ title: `${LEADERS[leader].name} preference`, context: val.substring(0, 50), view: 'prefs' });
            }
        });
    });

    // Search notes
    const noteViews = {};
    Object.keys(getLeaders()).forEach(k => { noteViews['notes-' + k] = k; });
    noteViews['notes-overview'] = 'overview';
    Object.entries(noteViews).forEach(([key, view]) => {
        const note = getData(key, '');
        if (note && note.toLowerCase().includes(query)) {
            const viewName = LEADERS[view] ? LEADERS[view].name : view.charAt(0).toUpperCase() + view.slice(1);
            results.push({ title: `Notes — ${viewName}`, context: note.substring(0, 60), view });
        }
    });

    return results;
}

function navigateToResult(view) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const navBtn = document.querySelector(`[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add('active');
    const targetView = document.getElementById(`view-${view}`);
    if (targetView) targetView.classList.add('active');
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('searchInput').value = '';

    if (view === 'overview') renderOverview();
    if (view === 'diary') renderDiary();
}

// --- Quick Links ---
function getQuickLinks() {
    return getData('quick-links', [
        { label: '📧 Outlook', url: 'https://outlook.office.com' },
        { label: '💬 Slack', url: 'https://app.slack.com' }
    ]);
}

function renderQuickLinks() {
    const links = getQuickLinks();
    const container = document.getElementById('quickLinks');
    if (!container) return;

    container.innerHTML = links.map((link, i) => `
        <a href="${escapeHtml(link.url)}" target="_blank" class="quick-link">
            ${escapeHtml(link.label)}
            <span class="remove-link" onclick="event.preventDefault();event.stopPropagation();editQuickLink(${i})" style="right:20px;">✏️</span>
            <span class="remove-link" onclick="event.preventDefault();event.stopPropagation();removeQuickLink(${i})">×</span>
        </a>
    `).join('') + '<button class="quick-link" id="addQuickLink">+ Add Link</button>';

    document.getElementById('addQuickLink').addEventListener('click', () => {
        openModal('Add Quick Link', `
            <label>Label</label>
            <input type="text" id="linkLabel" placeholder="e.g., 📊 Concur, 🗂️ SharePoint">
            <label>URL</label>
            <input type="text" id="linkUrl" placeholder="https://...">
            <button class="modal-submit">Add Link</button>
        `, () => {
            const label = document.getElementById('linkLabel').value.trim();
            const url = document.getElementById('linkUrl').value.trim();
            if (!label || !url) return;
            const links = getQuickLinks();
            links.push({ label, url: url.startsWith('http') ? url : 'https://' + url });
            saveData('quick-links', links);
            renderQuickLinks();
            closeModal();
            showToast('Link added');
        });
    });
}

function removeQuickLink(index) {
    const links = getQuickLinks();
    links.splice(index, 1);
    saveData('quick-links', links);
    renderQuickLinks();
}

function editQuickLink(index) {
    const links = getQuickLinks();
    const link = links[index];
    if (!link) return;

    openModal('Edit Quick Link', `
        <label>Label</label>
        <input type="text" id="linkLabel" value="${escapeHtml(link.label)}">
        <label>URL</label>
        <input type="text" id="linkUrl" value="${escapeHtml(link.url)}">
        <button class="modal-submit">Save</button>
    `, () => {
        const label = document.getElementById('linkLabel').value.trim();
        const url = document.getElementById('linkUrl').value.trim();
        if (!label || !url) return;
        links[index] = { label, url: url.startsWith('http') ? url : 'https://' + url };
        saveData('quick-links', links);
        renderQuickLinks();
        closeModal();
        showToast('Link updated');
    });
}

// --- Exec Preferences ---
const PREF_FIELDS = [
    { key: 'calendarStyle', label: 'Calendar style', placeholder: 'e.g., No meetings before 9am, buffer between calls' },
    { key: 'meetingPrefs', label: 'Meeting prefs', placeholder: 'e.g., Prefers 30min, no back-to-back' },
    { key: 'commStyle', label: 'Communication', placeholder: 'e.g., Slack for quick things, email for formal' },
    { key: 'travel', label: 'Travel prefs', placeholder: 'e.g., Window seat, Delta preferred, Marriott' },
    { key: 'dietary', label: 'Dietary', placeholder: 'e.g., No shellfish, prefers coffee over tea' },
    { key: 'timezone', label: 'Timezone', placeholder: 'e.g., PST, usually online 8am-6pm' },
    { key: 'petPeeves', label: 'Pet peeves', placeholder: 'e.g., Late meetings, unclear agendas' },
    { key: 'notes', label: 'Other notes', placeholder: 'Anything else to remember...' }
];

function renderExecPrefs() {
    Object.keys(getLeaders()).forEach(leader => {
        const prefs = getData(`prefs-${leader}`, {});
        const container = document.getElementById(`prefs-${leader}-content`);
        if (!container) return;

        const hasPrefs = Object.values(prefs).some(v => v && v.trim());

        if (!hasPrefs) {
            container.innerHTML = '<div class="prefs-empty">No preferences saved yet — upload a doc or fill the form</div>';
            return;
        }

        container.innerHTML = PREF_FIELDS
            .filter(f => prefs[f.key] && prefs[f.key].trim())
            .map(f => `
                <div class="pref-row">
                    <span class="pref-label">${f.label}</span>
                    <span class="pref-value">${escapeHtml(prefs[f.key])}</span>
                </div>
            `).join('');

        // Render attached doc
        renderPrefsDoc(leader);
    });
}

function editPrefs(leader) {
    const prefs = getData(`prefs-${leader}`, {});
    const fieldsHtml = PREF_FIELDS.map(f => `
        <label>${f.label}</label>
        <input type="text" id="pref-${f.key}" value="${escapeHtml(prefs[f.key] || '')}" placeholder="${f.placeholder}">
    `).join('');

    openModal(`Edit Preferences — ${LEADERS[leader].name}`, `
        ${fieldsHtml}
        <button class="modal-submit">Save</button>
    `, () => {
        const updated = {};
        PREF_FIELDS.forEach(f => {
            updated[f.key] = document.getElementById(`pref-${f.key}`).value.trim();
        });
        saveData(`prefs-${leader}`, updated);
        renderExecPrefs();
        closeModal();
        showToast('Preferences saved ✨');
    });
}

function uploadPrefsDoc(leader) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,image/*';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const doc = {
                name: file.name,
                type: file.type,
                data: ev.target.result,
                uploadedAt: getToday()
            };
            saveData(`prefs-doc-${leader}`, doc);
            renderPrefsDoc(leader);
            showToast('Doc uploaded 📎');
        };
        reader.readAsDataURL(file);
    });
    input.click();
}

function renderPrefsDoc(leader) {
    const container = document.getElementById(`prefs-${leader}-doc`);
    if (!container) return;

    const doc = getData(`prefs-doc-${leader}`, null);
    if (!doc) {
        container.innerHTML = '';
        return;
    }

    const isImage = doc.type && doc.type.startsWith('image/');
    container.innerHTML = `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:12px;color:var(--text-secondary);">📎 ${escapeHtml(doc.name)}</span>
                <div style="display:flex;gap:6px;">
                    ${isImage ? `<button class="add-btn-small" onclick="document.getElementById('prefsDocPreview-${leader}').style.display='block'">👁️ View</button>` : ''}
                    ${!isImage ? `<a href="${doc.data}" download="${escapeHtml(doc.name)}" class="add-btn-small" style="text-decoration:none;">⬇️ Download</a>` : ''}
                    <button class="add-btn-small" style="color:var(--red);border-color:var(--red);" onclick="removePrefsDoc('${leader}')">×</button>
                </div>
            </div>
            ${isImage ? `<img id="prefsDocPreview-${leader}" src="${doc.data}" style="display:none;width:100%;border-radius:8px;cursor:pointer;margin-top:8px;" onclick="document.getElementById('filePreviewImg').src=this.src;document.getElementById('filePreview').classList.add('active');">` : ''}
        </div>
    `;
}

function removePrefsDoc(leader) {
    saveData(`prefs-doc-${leader}`, null);
    renderPrefsDoc(leader);
    showToast('Doc removed');
}

// --- Clipboard Capture ---
let lastClipboard = localStorage.getItem('cc-lastClipboard') || '';
let internalCopy = '';
let suppressBanner = false;

function setLastClipboard(text) {
    lastClipboard = text.substring(0, 100);
    localStorage.setItem('cc-lastClipboard', lastClipboard);
}

function markAsInternalCopy(text) {
    internalCopy = text.substring(0, 50);
    setLastClipboard(text);
}

function initClipboardCapture() {
    const banner = document.getElementById('clipboardBanner');
    const clipText = document.getElementById('clipboardText');
    const clipContext = document.getElementById('clipboardContext');
    const clipSave = document.getElementById('clipSave');
    const clipDismiss = document.getElementById('clipDismiss');

    // On page load, mark current clipboard as "already seen" so it doesn't show as banner
    // Skip the first focus event (page load) — only show banner after user leaves and comes back
    let hasLeftPage = false;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            hasLeftPage = true;
            suppressBanner = false;
        }
    });

    // Check clipboard on focus, visibility change, and click
    let lastCheckTime = 0;

    function tryReadClipboard() {
        if (!hasLeftPage) return;
        if (suppressBanner) return;
        if (banner.style.display === 'block') return;
        const now = Date.now();
        if (now - lastCheckTime < 2000) return;
        lastCheckTime = now;

        navigator.clipboard.readText()
            .then(text => {
                if (!text || text.trim().length <= 2) return;
                const trimmed = text.trim();
                if (trimmed.substring(0, 100) === lastClipboard) return;

                clipText.value = trimmed;
                clipContext.value = '';
                document.getElementById('clipboardDue').value = '';
                banner.style.display = 'block';
            })
            .catch(() => {});
    }

    window.addEventListener('focus', () => { if (hasLeftPage) setTimeout(tryReadClipboard, 200); });
    document.addEventListener('click', tryReadClipboard);

    // Mark anything copied within the Command Center as internal
    document.addEventListener('copy', () => {
        const selection = window.getSelection().toString().trim();
        if (selection) {
            setLastClipboard(selection);
        }
    });

    // Dismiss banner when user pastes (they used the clipboard for something else)
    document.addEventListener('paste', (e) => {
        banner.style.display = 'none';
        // Mark this clipboard content as seen
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (pasted) setLastClipboard(pasted);
    });

    // Also mark clipboard writes from buttons as internal
    const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = function(text) {
        setLastClipboard(text.trim());
        suppressBanner = true;
        setTimeout(() => { suppressBanner = false; }, 10000);
        return originalWriteText(text);
    };

    // Save button
    clipSave.addEventListener('click', () => {
        const text = clipText.value.trim();
        if (!text) return;

        const context = clipContext.value.trim();
        const dueDate = document.getElementById('clipboardDue').value || null;
        const leader = document.getElementById('clipAssign').value;
        const type = document.getElementById('clipType').value;
        const today = getToday();

        if (leader === 'personal') {
            const checklist = getData('daily-checklist', []);
            checklist.push({ text, done: false, dueDate: dueDate });
            saveData('daily-checklist', checklist);
            renderDaily();
        } else if (leader === 'coverage') {
            addCoverageNoteItem(text, context);
        } else if (type === 'task') {
            addTask(leader, { title: text, type: 'task', dueDate: dueDate, notes: context || '' });
        } else if (type === 'waiting') {
            const items = getWaiting(leader);
            items.push({ text, who: context || '', source: 'Clipboard', date: today });
            saveWaiting(leader, items);
            renderWaiting(leader);
            renderNudges(leader);
        } else if (type === 'note') {
            const notes = getNotesForTab(leader);
            notes.push({ title: text.substring(0, 40), body: context ? `${text}\n\n${context}` : text, createdAt: today });
            saveNotesForTab(leader, notes);
            renderNotesSection(leader);
        }

        setLastClipboard(text);
        banner.style.display = 'none';
        showToast(`Saved to ${leader === 'personal' ? 'Personal Checklist' : LEADERS[leader].name} ✨`);
    });

    // Enter key in context field saves
    clipContext.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') clipSave.click();
    });

    // Dismiss
    clipDismiss.addEventListener('click', () => {
        setLastClipboard(clipText.value.trim());
        banner.style.display = 'none';
        suppressBanner = true;
    });

    // --- Coverage-specific clipboard ---
    const covBanner = document.getElementById('coverageClipBanner');
    const covClipText = document.getElementById('coverageClipText');
    const covClipContext = document.getElementById('coverageClipContext');
    const covClipSave = document.getElementById('coverageClipSave');
    const covClipDismiss = document.getElementById('coverageClipDismiss');
    const covLaneSelect = document.getElementById('coverageLaneSelect');

    covClipContext.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') covClipSave.click();
    });

    covClipDismiss.addEventListener('click', () => {
        setLastClipboard(covClipText.value.trim());
        covBanner.style.display = 'none';
    });

    covClipSave.addEventListener('click', () => {
        const text = covClipText.value.trim();
        if (!text) return;
        const context = covClipContext.value.trim();
        const laneId = covLaneSelect.value;
        const fullTitle = context ? `${text} — ${context}` : text;
        const today = getToday();

        if (laneId === 'notes') {
            // Save as a structured note item (moveable)
            addCoverageNoteItem(text, context);
            showToast('Saved to coverage notes ✨');
        } else {
            addCoverageTask(laneId, { title: text, type: 'task', dueDate: null, notes: context || '' });
            showToast('Saved to coverage ✨');
        }

        setLastClipboard(text);
        covBanner.style.display = 'none';
    });
}

// --- Files Management ---
function getFileFolders() {
    return getData('file-folders', [{ id: 'default', name: 'General', files: [] }]);
}

function saveFileFolders(folders) {
    saveData('file-folders', folders);
}

function initFiles() {
    renderFolders();

    // Upload button
    document.getElementById('uploadFile').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // File input change
    document.getElementById('fileInput').addEventListener('change', (e) => {
        handleFiles(e.target.files, 'default');
        e.target.value = '';
    });

    // Add folder
    document.getElementById('addFolder').addEventListener('click', () => {
        openModal('New Folder', `
            <label>Folder name</label>
            <input type="text" id="folderName" placeholder="e.g., Symposium, Offsite Planning">
            <button class="modal-submit">Create Folder</button>
        `, () => {
            const name = document.getElementById('folderName').value.trim();
            if (!name) return;
            const folders = getFileFolders();
            folders.push({ id: 'folder-' + Date.now(), name, files: [] });
            saveFileFolders(folders);
            renderFolders();
            closeModal();
            showToast('Folder created 📁');
        });
    });

    // Drag and drop
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files, 'default');
        }
    });

    // Paste screenshot (Ctrl+V)
    document.addEventListener('paste', (e) => {
        // Only handle if on files tab
        const filesView = document.getElementById('view-files');
        if (!filesView.classList.contains('active')) return;

        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                handleFiles([file], 'default');
                break;
            }
        }
    });

    // File preview & gallery
    let galleryImages = [];
    let galleryIndex = 0;

    document.getElementById('filePreviewClose').addEventListener('click', () => {
        document.getElementById('filePreview').classList.remove('active');
    });
    document.getElementById('filePreview').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('filePreview').classList.remove('active');
        }
    });

    document.getElementById('filePreviewPrev').addEventListener('click', (e) => {
        e.stopPropagation();
        // Check if we're in inline gallery mode (diary/promo)
        if (window._inlineGalleryImages && window._inlineGalleryImages.length > 0) {
            if (window._inlineGalleryIndex <= 0) return;
            window._inlineGalleryIndex--;
            document.getElementById('filePreviewImg').src = window._inlineGalleryImages[window._inlineGalleryIndex];
            document.getElementById('filePreviewCounter').textContent = `${window._inlineGalleryIndex + 1} / ${window._inlineGalleryImages.length}`;
            return;
        }
        if (galleryImages.length === 0 || galleryIndex <= 0) return;
        galleryIndex--;
        showGalleryImage();
    });

    document.getElementById('filePreviewNext').addEventListener('click', (e) => {
        e.stopPropagation();
        // Check if we're in inline gallery mode (diary/promo)
        if (window._inlineGalleryImages && window._inlineGalleryImages.length > 0) {
            if (window._inlineGalleryIndex >= window._inlineGalleryImages.length - 1) return;
            window._inlineGalleryIndex++;
            document.getElementById('filePreviewImg').src = window._inlineGalleryImages[window._inlineGalleryIndex];
            document.getElementById('filePreviewCounter').textContent = `${window._inlineGalleryIndex + 1} / ${window._inlineGalleryImages.length}`;
            return;
        }
        if (galleryImages.length === 0 || galleryIndex >= galleryImages.length - 1) return;
        galleryIndex++;
        showGalleryImage();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const preview = document.getElementById('filePreview');
        if (!preview.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') document.getElementById('filePreviewPrev').click();
        if (e.key === 'ArrowRight') document.getElementById('filePreviewNext').click();
        if (e.key === 'Escape') preview.classList.remove('active');
    });

    window.openGallery = function(fileId, folderId) {
        const folders = getFileFolders();
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        galleryImages = folder.files.filter(f => f.type && f.type.startsWith('image/'));
        galleryIndex = galleryImages.findIndex(f => f.id === fileId);
        if (galleryIndex === -1) galleryIndex = 0;
        showGalleryImage();
        document.getElementById('filePreview').classList.add('active');
        document.getElementById('filePreviewPrev').style.display = galleryImages.length > 1 ? '' : 'none';
        document.getElementById('filePreviewNext').style.display = galleryImages.length > 1 ? '' : 'none';
        document.getElementById('filePreviewCounter').style.display = galleryImages.length > 1 ? '' : 'none';
    };

    // Standalone preview (for event/promo images — no gallery navigation)
    window.openStandalonePreview = function(imgSrc) {
        galleryImages = [];
        galleryIndex = 0;
        document.getElementById('filePreviewImg').src = imgSrc;
        document.getElementById('filePreview').classList.add('active');
        document.getElementById('filePreviewPrev').style.display = 'none';
        document.getElementById('filePreviewNext').style.display = 'none';
        document.getElementById('filePreviewCounter').style.display = 'none';
    };

    async function showGalleryImage() {
        const file = galleryImages[galleryIndex];
        if (!file) return;
        let src = file.data || '';
        if (file.inDB || !src) {
            src = await getFileFromDB(file.id) || '';
        }
        document.getElementById('filePreviewImg').src = src;
        document.getElementById('filePreviewCounter').textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
    }
}

// --- IndexedDB for file storage ---
function openFileDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CommandCenterFiles', 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('files', { keyPath: 'id' });
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveFileToDB(id, data) {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put({ id, data });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function getFileFromDB(id) {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const request = tx.objectStore('files').get(id);
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function deleteFileFromDB(id) {
    const db = await openFileDB();
    return new Promise((resolve) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        tx.oncomplete = () => resolve();
    });
}

function compressImage(file, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            URL.revokeObjectURL(url);
            resolve(compressed);
        };
        img.src = url;
    });
}

function handleFiles(fileList, folderId) {
    const folders = getFileFolders();
    const folder = folders.find(f => f.id === folderId) || folders[0];

    Array.from(fileList).forEach(async (file) => {
        const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        let fileData;

        if (file.type.startsWith('image/')) {
            // Compress image to 1200px max, 0.8 quality
            fileData = await compressImage(file, 1200, 0.8);
        } else {
            // Non-image: read as data URL
            fileData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        // Store file data in IndexedDB
        await saveFileToDB(fileId, fileData);

        // Store metadata in localStorage (no data blob)
        folder.files.push({
            id: fileId,
            name: file.name || `Screenshot ${new Date().toLocaleString()}`,
            type: file.type,
            date: getToday(),
            size: file.size,
            inDB: true
        });
        saveFileFolders(folders);
        renderFolders();
        showToast('File saved 📎');
    });
}

function deleteFile(folderId, fileId) {
    const folders = getFileFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    folder.files = folder.files.filter(f => f.id !== fileId);
    saveFileFolders(folders);
    deleteFileFromDB(fileId);
    renderFolders();
}

function renameFile(folderId, fileId) {
    const folders = getFileFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const file = folder.files.find(f => f.id === fileId);
    if (!file) return;

    openModal('Rename File', `
        <label>File name</label>
        <input type="text" id="fileName" value="${escapeHtml(file.name)}">
        <button class="modal-submit">Save</button>
    `, () => {
        const name = document.getElementById('fileName').value.trim();
        if (!name) return;
        file.name = name;
        saveFileFolders(folders);
        renderFolders();
        closeModal();
        showToast('File renamed ✨');
    });
}

function deleteFolder(folderId) {
    if (folderId === 'default') {
        showToast("Can't delete the General folder");
        return;
    }
    const folders = getFileFolders().filter(f => f.id !== folderId);
    saveFileFolders(folders);
    renderFolders();
    showToast('Folder deleted');
}

function renameFolder(folderId) {
    const folders = getFileFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    openModal('Rename Folder', `
        <label>Folder name</label>
        <input type="text" id="folderName" value="${escapeHtml(folder.name)}">
        <button class="modal-submit">Save</button>
    `, () => {
        const name = document.getElementById('folderName').value.trim();
        if (!name) return;
        folder.name = name;
        saveFileFolders(folders);
        renderFolders();
        closeModal();
    });
}

function previewFile(fileData) {
    const preview = document.getElementById('filePreview');
    const img = document.getElementById('filePreviewImg');
    img.src = fileData;
    preview.classList.add('active');
}

function uploadToFolder(folderId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';
    input.addEventListener('change', (e) => {
        handleFiles(e.target.files, folderId);
    });
    input.click();
}

function renderFolders() {
    const folders = getFileFolders();
    const container = document.getElementById('foldersContainer');
    if (!container) return;

    container.innerHTML = folders.map(folder => `
        <div class="file-folder" data-folder-id="${folder.id}">
            <div class="folder-header">
                <h3>📂 ${escapeHtml(folder.name)} <span style="font-weight:400;font-size:12px;color:var(--text-light);">(${folder.files.length})</span></h3>
                <div class="folder-header-actions">
                    <button onclick="uploadToFolder('${folder.id}')">+ Add Files</button>
                    <button onclick="renameFolder('${folder.id}')">✏️ Rename</button>
                    ${folder.id !== 'default' ? `<button class="delete-folder" onclick="if(confirm('Delete this folder and all its files?')) deleteFolder('${folder.id}')">🗑️</button>` : ''}
                </div>
            </div>
            <div class="folder-files">
                ${folder.files.length === 0 ? '<div class="folder-empty">No files yet — drop, paste, or upload</div>' :
                folder.files.map(file => {
                    const isImage = file.type && file.type.startsWith('image/');
                    return `
                        <div class="file-item" data-file-data="${isImage ? file.id : ''}">
                            ${isImage ? `<img src="${file.data || ''}" alt="${escapeHtml(file.name)}" data-file-id="${file.id}" data-folder-id="${folder.id}" class="file-thumb">` : `<div class="file-icon">📄</div>`}
                            <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                            <div class="file-date">${file.date}</div>
                            <button class="file-delete" onclick="event.stopPropagation();renameFile('${folder.id}','${file.id}')" style="right:28px;">✏️</button>
                            <button class="file-delete" onclick="event.stopPropagation();deleteFile('${folder.id}','${file.id}')">×</button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');

    // Load images from IndexedDB for files stored there
    container.querySelectorAll('.file-thumb').forEach(async (img) => {
        const fileId = img.dataset.fileId;
        if (fileId && !img.src) {
            const data = await getFileFromDB(fileId);
            if (data) img.src = data;
        } else if (fileId && img.src === window.location.href) {
            // src is empty (shows page URL), load from DB
            const data = await getFileFromDB(fileId);
            if (data) img.src = data;
        }
    });

    // Add click-to-preview for images (opens gallery)
    container.querySelectorAll('.file-item img').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            const fileId = img.dataset.fileId;
            const folderId = img.dataset.folderId;
            if (window.openGallery && fileId && folderId) {
                window.openGallery(fileId, folderId);
            }
        });
    });
}

// --- Coverage Notes Items (moveable) ---
function getCoverageNoteItems() {
    return getData('coverage-note-items', []);
}

function saveCoverageNoteItems(items) {
    saveData('coverage-note-items', items);
}

function addCoverageNoteItem(text, context) {
    const items = getCoverageNoteItems();
    items.push({
        id: 'cn-' + Date.now(),
        text: context ? `${text} — ${context}` : text,
        date: getToday()
    });
    saveCoverageNoteItems(items);
    renderCoverageNoteItems();
}

function deleteCoverageNoteItem(itemId) {
    const items = getCoverageNoteItems().filter(i => i.id !== itemId);
    saveCoverageNoteItems(items);
    renderCoverageNoteItems();
}

function moveCoverageNoteToLane(itemId) {
    const items = getCoverageNoteItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const lanes = getCoverageLanes();
    if (lanes.length === 0) {
        showToast('Create a coverage lane first');
        return;
    }

    const lanesHtml = lanes.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');

    openModal('Move to Lane', `
        <label>Item</label>
        <input type="text" value="${escapeHtml(item.text)}" disabled style="opacity:0.7;">
        <label>Move to</label>
        <select id="moveLaneSelect">${lanesHtml}</select>
        <button class="modal-submit">Move →</button>
    `, () => {
        const laneId = document.getElementById('moveLaneSelect').value;
        addCoverageTask(laneId, { title: item.text, type: 'task', dueDate: null, notes: '' });
        deleteCoverageNoteItem(itemId);
        closeModal();
        showToast('Moved to lane ✨');
    });
}

function renderCoverageNoteItems() {
    const items = getCoverageNoteItems();
    const container = document.getElementById('coverageNotesItems');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cov-note-item">
            <span class="cov-note-text">${escapeHtml(item.text)}</span>
            <span class="cov-note-date">${item.date}</span>
            <button class="move-btn" onclick="moveCoverageNoteToLane('${item.id}')">→ Move</button>
            <button class="delete-note-btn" onclick="deleteCoverageNoteItem('${item.id}')">×</button>
        </div>
    `).join('');
}

// --- Collapsible Sections (6) ---
function initCollapsible() {
    document.querySelectorAll('.section-header').forEach(header => {
        // Skip headers that have buttons (they need clicking)
        if (header.querySelector('button') || header.querySelector('.add-btn-small')) return;
        
        header.classList.add('collapsible');
        const content = header.nextElementSibling;
        if (!content) return;
        content.classList.add('section-content');
        
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });
}

// --- Tooltips (4) ---
function initTooltips() {
    // Add tooltips to common buttons
    document.querySelectorAll('.complete-btn').forEach(btn => btn.setAttribute('data-tooltip', 'Complete'));
    document.querySelectorAll('.daily-complete-btn').forEach(btn => btn.setAttribute('data-tooltip', 'Done'));
    document.querySelectorAll('.add-task-btn').forEach(btn => btn.setAttribute('data-tooltip', 'Add task'));
}

// --- Dark Mode ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    saveData('dark-mode', isDark);
    document.getElementById('darkModeBtn').textContent = isDark ? '☀️' : '🌙';
    // Set default background for the mode
    if (isDark) {
        document.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #fdf6f9 0%, #f3eeff 40%, #edf5ff 70%, #fdf6f9 100%)';
    }
    document.body.style.backgroundAttachment = 'fixed';
    saveData('theme-bg', document.body.style.background);
    // Re-apply accent
    const headingStyle = getData('heading-style', 'gradient');
    applyAccentColor(headingStyle);
}

function initDarkMode() {
    // Check wizard theme setting — only apply on FIRST load (if dark-mode key doesn't exist yet)
    const wizardTheme = getData('theme', null);
    if (wizardTheme === 'dark' && localStorage.getItem('cc-dark-mode') === null) {
        saveData('dark-mode', true);
    }
    if (getData('dark-mode', false)) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeBtn').textContent = '☀️';
    }
}

// --- Theme Picker ---
function setThemeBg(bg) {
    document.body.style.background = bg;
    document.body.style.backgroundAttachment = 'fixed';
    saveData('theme-bg', bg);

    // Auto-toggle dark mode based on whether this is a dark background
    const darkBgs = ['#1a1a1a', '#1e1e1e', '#121212'];
    const isDarkBg = darkBgs.includes(bg) || bg.includes('#1a1a2e') || bg.includes('#1a1025') || bg.includes('#1e1e2e') || bg.includes('#2b2d42') || bg.includes('#1a1410') || bg.includes('#0d1117');

    if (isDarkBg && !document.body.classList.contains('dark-mode')) {
        document.body.classList.add('dark-mode');
        saveData('dark-mode', true);
        document.getElementById('darkModeBtn').textContent = '☀️';
    } else if (!isDarkBg && document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        saveData('dark-mode', false);
        document.getElementById('darkModeBtn').textContent = '🌙';
    }
    // Re-apply accent so headers stay visible
    const headingStyle = getData('heading-style', 'gradient');
    applyAccentColor(headingStyle);
}

function setThemeFont(font) {
    document.body.style.fontFamily = font;
    saveData('theme-font', font);
}

function setHeadingStyle(style) {
    saveData('heading-style', style);
    const isDark = getData('dark-mode', false) || document.body.classList.contains('dark-mode');
    const headerText = document.querySelector('.header-text');
    if (headerText) {
        if (style === 'gradient') {
            headerText.style.background = 'linear-gradient(135deg, #9b7ed8, #e88aaf)';
            headerText.style.webkitBackgroundClip = 'text';
            headerText.style.webkitTextFillColor = 'transparent';
            headerText.style.backgroundClip = 'text';
        } else {
            const colors = { purple: '#9b7ed8', pink: '#e88aaf', neutral: isDark ? '#c8c8d4' : '#4a4a5a' };
            const color = colors[style] || '#9b7ed8';
            headerText.style.background = 'none';
            headerText.style.webkitBackgroundClip = 'unset';
            headerText.style.webkitTextFillColor = color;
            headerText.style.backgroundClip = 'unset';
            headerText.style.color = color;
        }
    }
    applyAccentColor(style);
    showToast('Accent updated ✨');
}

function previewFont(font) {
    const preview = document.getElementById('fontPreview');
    if (preview) preview.style.fontFamily = font;
}

function applyCustomBg() {
    const custom = document.getElementById('customBg').value.trim();
    if (custom) {
        setThemeBg(custom);
        showToast('Background applied ✨');
    }
}

function initTheme() {
    const bg = getData('theme-bg', null);
    const font = getData('theme-font', null);
    const headingStyle = getData('heading-style', null);
    const isDark = getData('dark-mode', false);

    if (bg) {
        document.body.style.background = bg;
        document.body.style.backgroundAttachment = 'fixed';
    }
    if (font) {
        document.body.style.fontFamily = font;
        const fontSelect = document.getElementById('themeFont');
        if (fontSelect) fontSelect.value = font;
    }
    if (headingStyle && headingStyle !== 'gradient') {
        const colors = { purple: '#9b7ed8', pink: '#e88aaf', neutral: isDark ? '#c8c8d4' : '#4a4a5a', dark: isDark ? '#c8c8d4' : '#4a4a5a' };
        const color = colors[headingStyle] || '#9b7ed8';
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.style.background = 'none';
            headerText.style.webkitBackgroundClip = 'unset';
            headerText.style.webkitTextFillColor = color;
            headerText.style.backgroundClip = 'unset';
            headerText.style.color = color;
        }
    }

    // Apply accent color to all buttons based on heading style
    applyAccentColor(headingStyle || 'gradient');
}

function applyAccentColor(style) {
    const isDark = getData('dark-mode', false) || document.body.classList.contains('dark-mode');
    const accentColors = { gradient: '#9b7ed8', purple: '#9b7ed8', pink: '#e88aaf', neutral: isDark ? '#c8c8d4' : '#4a4a5a', dark: isDark ? '#c8c8d4' : '#4a4a5a' };
    const accent = accentColors[style] || '#9b7ed8';

    // Set CSS custom property for accent
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--purple', accent);

    // Style primary action buttons
    const btnBg = style === 'gradient' ? 'linear-gradient(135deg, #9b7ed8, #e88aaf)' : accent;
    document.querySelectorAll('.add-task-btn, .clip-save-btn').forEach(btn => {
        btn.style.background = btnBg;
        btn.style.color = 'white';
    });

    // Style view headers
    document.querySelectorAll('.view-header h2').forEach(h => {
        if (style === 'gradient') {
            h.style.color = '';
        } else {
            h.style.color = accent;
        }
    });

    // Style section headers
    document.querySelectorAll('.section-header h3').forEach(h => {
        h.style.color = isDark ? '#e0e0e0' : '';
    });

    // Style progress bar
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.background = btnBg;
    }
}

// --- Progress Bar ---
function updateProgressBar() {
    const container = document.getElementById('progressContainer');
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (!container) return;

    const today = getToday();
    const checklist = getData('daily-checklist', []);
    const checklistDone = checklist.filter(c => c.done).length;
    const checklistTotal = checklist.length;

    let tasksDueToday = 0;
    let tasksDoneToday = 0;

    // Count tasks due today across leaders (not recurring)
    Object.keys(getLeaders()).forEach(leader => {
        const tasks = getTasks(leader);
        const dueToday = tasks.filter(t => t.dueDate === today && t.type !== 'recurring');
        tasksDueToday += dueToday.length;
        tasksDoneToday += dueToday.filter(t => t.completed).length;
    });

    const total = checklistTotal + tasksDueToday;
    const done = checklistDone + tasksDoneToday;

    if (total === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    const percent = Math.round((done / total) * 100);
    fill.style.width = `${Math.min(percent, 100)}%`;
    text.textContent = `${done}/${total} done`;

    // Confetti when 100%
    if (percent >= 100 && total > 0 && !getData(`confetti-shown-${today}`, false)) {
        saveData(`confetti-shown-${today}`, true);
        launchConfetti();
    }
}

// --- Confetti ---
function launchConfetti() {
    const colors = ['#9b7ed8', '#e88aaf', '#6ba3d6', '#e8945a', '#6bbf8a', '#e8c95a', '#ff6b6b'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = '-10px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.animationDuration = (1.5 + Math.random()) + 's';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 3000);
    }
    showToast('🎉 All tasks done for today!');
}

// --- Task Count Badges ---
function updateTaskCounts() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    const buttons = nav.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        const view = btn.dataset.view;
        // Skip coverage — it uses lanes, not regular tasks
        if (view === 'coverage') return;
        if (Object.keys(getLeaders()).includes(view)) {
            const tasks = getTasks(view);
            const openCount = tasks.filter(t => !t.completed && t.type !== 'recurring').length;
            // Remove existing badge
            const existing = btn.querySelector('.tab-count');
            if (existing) existing.remove();
            // Add badge
            if (openCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'tab-count';
                badge.textContent = openCount;
                btn.appendChild(badge);
            }
        }
    });
}

// --- Auto-archive completed tasks (older than 7 days) ---
function autoArchiveCompleted() {
    const today = getToday();
    Object.keys(getLeaders()).forEach(leader => {
        const tasks = getTasks(leader);
        const kept = tasks.filter(t => {
            if (!t.completed || !t.completedAt) return true;
            return getDayAge(t.completedAt) <= 7;
        });
        if (kept.length !== tasks.length) {
            saveTasks(leader, kept);
        }
    });
}

// --- Leader Management ---
function renderLeadersList() {
    const container = document.getElementById('leadersList');
    if (!container) return;
    const leaders = getLeaders();
    container.innerHTML = Object.entries(leaders).map(([key, leader]) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:8px;">
            <span style="font-size:20px;">${leader.emoji || '📌'}</span>
            <span style="flex:1;font-size:14px;font-weight:500;">${escapeHtml(leader.name)}</span>
            <button class="add-btn-small" onclick="editLeaderSettings('${key}')">✏️ Edit</button>
            <button class="add-btn-small" style="color:var(--red);border-color:var(--red);" onclick="removeLeader('${key}')">×</button>
        </div>
    `).join('');
}

function addNewLeader() {
    openModal('Add Leader', `
        <label>Emoji</label>
        <input type="text" id="newLeaderEmoji" value="⭐" placeholder="e.g., 🟣" style="font-size:20px;width:60px;">
        <label>Name</label>
        <input type="text" id="newLeaderName" placeholder="e.g., Sarah K.">
        <button class="modal-submit">Add Leader</button>
    `, () => {
        const emoji = document.getElementById('newLeaderEmoji').value.trim() || '⭐';
        const name = document.getElementById('newLeaderName').value.trim();
        if (!name) return;
        const leaders = getLeaders();
        const key = 'leader-' + Date.now();
        leaders[key] = { name, emoji, color: 'purple' };
        saveLeaders(leaders);
        LEADERS = leaders;
        ensureLeaderViews();
        renderNav();
        initNav();
        renderLeadersList();
        updateTaskCounts();
        closeModal();
        showToast('Leader added ✨');
    });
}

function editLeaderSettings(key) {
    const leaders = getLeaders();
    const leader = leaders[key];
    if (!leader) return;
    openModal('Edit Leader', `
        <label>Emoji</label>
        <input type="text" id="editLeaderEmoji" value="${leader.emoji || ''}" style="font-size:20px;width:60px;">
        <label>Name</label>
        <input type="text" id="editLeaderName" value="${escapeHtml(leader.name)}">
        <button class="modal-submit">Save</button>
    `, () => {
        const emoji = document.getElementById('editLeaderEmoji').value.trim() || leader.emoji;
        const name = document.getElementById('editLeaderName').value.trim() || leader.name;
        leaders[key] = { ...leader, emoji, name };
        saveLeaders(leaders);
        LEADERS = leaders;
        renderNav();
        initNav();
        renderLeadersList();
        closeModal();
        showToast('Leader updated ✨');
    });
}

function removeLeader(key) {
    if (!confirm('Remove this leader? Their tasks and data will remain but the tab will be hidden.')) return;
    const leaders = getLeaders();
    delete leaders[key];
    saveLeaders(leaders);
    LEADERS = leaders;
    // Remove the view if it exists
    const view = document.getElementById('view-' + key);
    if (view) view.remove();
    renderNav();
    initNav();
    renderLeadersList();
    updateTaskCounts();
    showToast('Leader removed');
}

// --- Settings (Mascot, Export/Import) ---
function initSettings() {
    // Render leaders list
    renderLeadersList();

    // Mascot speech
    const speechInput = document.getElementById('mascotSpeech');
    const currentSpeech = getData('mascot-speech', 'woof! 🐾');
    speechInput.value = currentSpeech;

    // Mascot tooltip
    const tooltipInput = document.getElementById('mascotTooltip');
    const currentTooltip = getData('mascot-tooltip', 'hello!');
    tooltipInput.value = currentTooltip;

    // Save button
    document.getElementById('saveMascotSettings').addEventListener('click', () => {
        saveData('mascot-speech', speechInput.value.trim() || 'woof! 🐾');
        saveData('mascot-tooltip', tooltipInput.value.trim() || 'hello!');
        updateMascotDisplay();
        showToast('Mascot settings saved ✨');
    });

    // Mascot preview
    updateMascotPreview();

    // Upload mascot
    document.getElementById('uploadMascot').addEventListener('click', () => {
        document.getElementById('mascotFileInput').click();
    });

    document.getElementById('mascotFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const maxSize = 100;
                    let w = img.width, h = img.height;
                    if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                    else { w = (w / h) * maxSize; h = maxSize; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const compressed = canvas.toDataURL('image/jpeg', 0.5);
                    localStorage.setItem('cc-mascot-image', JSON.stringify(compressed));
                    updateMascotPreview();
                    updateMascotDisplay();
                    showToast('Mascot updated 🐾');
                } catch(err) {
                    showToast('Image too large — try a smaller file');
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Remove mascot
    document.getElementById('removeMascot').addEventListener('click', () => {
        saveData('mascot-image', '');
        updateMascotPreview();
        updateMascotDisplay();
        showToast('Mascot removed');
    });

    // Mute/unmute mascot
    const muteBtn = document.getElementById('muteMascot');
    const isMuted = getData('mascot-muted', false);
    muteBtn.textContent = isMuted ? '🔊 Unmute Sound' : '🔇 Mute Sound';
    muteBtn.addEventListener('click', () => {
        const muted = !getData('mascot-muted', false);
        saveData('mascot-muted', muted);
        muteBtn.textContent = muted ? '🔊 Unmute Sound' : '🔇 Mute Sound';
        showToast(muted ? 'Sound muted 🤫' : 'Sound unmuted 🔊');
    });

    // Upload custom sound
    document.getElementById('uploadSound').addEventListener('click', () => {
        document.getElementById('soundFileInput').click();
    });

    document.getElementById('soundFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            saveData('mascot-custom-sound', ev.target.result);
            showToast('Custom sound uploaded 🔊');
        };
        reader.readAsDataURL(file);
    });

    // Export data
    document.getElementById('exportData').addEventListener('click', () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cc-')) {
                data[key] = localStorage.getItem(key);
            }
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `command-center-backup-${getToday()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported 💾');
    });

    // Import data
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                Object.entries(data).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                });
                showToast('Data imported — refreshing...');
                setTimeout(() => location.reload(), 1500);
            } catch {
                showToast('Invalid backup file');
            }
        };
        reader.readAsText(file);
    });

    // Reset
    document.getElementById('resetAll').addEventListener('click', () => {
        if (!confirm('This will delete ALL your data and start fresh. Are you sure?')) return;
        if (!confirm('Really sure? This cannot be undone.')) return;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('cc-')) {
                localStorage.removeItem(key);
            }
        }
        localStorage.removeItem('cc-setup-complete');
        location.reload();
    });
}

function updateMascotPreview() {
    const preview = document.getElementById('mascotPreview');
    const image = getData('mascot-image', '');
    const mascotPreset = getData('mascot', null);
    if (image) {
        preview.innerHTML = `<img src="${image}" alt="Mascot">`;
    } else if (mascotPreset) {
        const emojis = { dog: '🐕', cat: '🐱', bunny: '🐰', fox: '🦊', panda: '🐼', owl: '🦉' };
        preview.innerHTML = `<span style="font-size:40px;">${emojis[mascotPreset] || '🐕'}</span>`;
    } else {
        preview.innerHTML = `<img src="/lacey.png.png" alt="Lacey">`;
    }
}

function updateMascotDisplay() {
    const mascotEl = document.querySelector('.lacey-mascot');
    if (!mascotEl) return;

    const image = getData('mascot-image', '');
    const mascotPreset = getData('mascot', null); // From wizard: 'dog', 'cat', etc.
    const speech = getData('mascot-speech', 'woof! 🐾');

    const img = mascotEl.querySelector('.lacey-img, img');
    const speechEl = mascotEl.querySelector('.lacey-speech');

    if (img) {
        if (image) {
            // Custom uploaded image takes priority
            img.src = image;
            img.style.display = '';
            const emojiEl = mascotEl.querySelector('.mascot-emoji-display');
            if (emojiEl) emojiEl.style.display = 'none';
        } else if (mascotPreset) {
            // Wizard preset — show emoji for all (including dog)
            const emojis = { dog: '🐕', cat: '🐱', bunny: '🐰', fox: '🦊', panda: '🐼', owl: '🦉' };
            const emoji = emojis[mascotPreset] || '🐕';
            img.style.display = 'none';
            let emojiEl = mascotEl.querySelector('.mascot-emoji-display');
            if (!emojiEl) {
                emojiEl = document.createElement('div');
                emojiEl.className = 'mascot-emoji-display';
                emojiEl.style.cssText = 'width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:var(--bg);border:2px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;';
                emojiEl.onclick = laceyBark;
                emojiEl.onmouseenter = laceyBark;
                img.parentNode.insertBefore(emojiEl, img);
            }
            emojiEl.style.display = 'flex';
            emojiEl.textContent = emoji;
        } else {
            // No wizard preset, no custom image — host's default (Lacey)
            img.src = 'lacey.png.png';
            img.style.display = '';
            const emojiEl = mascotEl.querySelector('.mascot-emoji-display');
            if (emojiEl) emojiEl.style.display = 'none';
        }
    }
    if (speechEl) {
        speechEl.textContent = speech;
    }
    mascotEl.title = getData('mascot-tooltip', 'hello!');
    mascotEl.style.display = '';
}

// --- Tab Notes (Multi-note system) ---
function getNotesForTab(tabId) {
    return getData(`notes-list-${tabId}`, []);
}

function saveNotesForTab(tabId, notes) {
    saveData(`notes-list-${tabId}`, notes);
}

function renderNotesSection(tabId) {
    const container = document.getElementById(`notes-${tabId}`);
    if (!container) return;

    const notes = getNotesForTab(tabId);

    container.innerHTML = `
        <div class="notes-cards">
            ${notes.map((note, i) => `
                <div class="note-card">
                    <div class="note-card-header">
                        <input type="text" class="note-card-title" value="${escapeHtml(note.title)}" placeholder="Untitled note" onchange="renameNote('${tabId}', ${i}, this.value)">
                        <button class="note-card-delete" onclick="deleteNote('${tabId}', ${i})">×</button>
                    </div>
                    <textarea class="note-card-body" placeholder="Write here..." oninput="updateNoteBody('${tabId}', ${i}, this.value)">${escapeHtml(note.body || '')}</textarea>
                </div>
            `).join('')}
        </div>
        <button class="add-btn-small" onclick="addNote('${tabId}')" style="margin-top:10px;width:100%;">+ New Note</button>
    `;
}

function addNote(tabId) {
    const notes = getNotesForTab(tabId);
    notes.push({ title: '', body: '', createdAt: getToday() });
    saveNotesForTab(tabId, notes);
    renderNotesSection(tabId);
}

function renameNote(tabId, index, newTitle) {
    const notes = getNotesForTab(tabId);
    if (!notes[index]) return;
    notes[index].title = newTitle;
    saveNotesForTab(tabId, notes);
}

function updateNoteBody(tabId, index, newBody) {
    const notes = getNotesForTab(tabId);
    if (!notes[index]) return;
    notes[index].body = newBody;
    saveNotesForTab(tabId, notes);
}

function deleteNote(tabId, index) {
    if (!confirm('Delete this note?')) return;
    const notes = getNotesForTab(tabId);
    notes.splice(index, 1);
    saveNotesForTab(tabId, notes);
    renderNotesSection(tabId);
    showToast('Note deleted');
}

function initNotes() {
    const tabIds = [...Object.keys(getLeaders()), 'overview'];
    tabIds.forEach(id => renderNotesSection(id));
}

// --- Initialize ---
function init() {
    // Set LEADERS first so all render functions have access
    LEADERS = getLeaders();

    // Header
    document.getElementById('dateDisplay').textContent = formatDate(new Date());
    document.getElementById('greeting').textContent = getGreeting();
    document.getElementById('dailyQuote').textContent = `"${getDailyQuote()}"`;

    // Apply user name to header
    const userName = getData('user-name', null);
    if (userName) {
        const headerText = document.querySelector('.header-text');
        if (headerText) headerText.textContent = 'hey, ' + userName;
    }

    // Populate clipboard assign dropdown dynamically
    const clipAssign = document.getElementById('clipAssign');
    if (clipAssign) {
        const leaders = getLeaders();
        let options = '';
        Object.keys(leaders).forEach(key => {
            options += `<option value="${key}">${leaders[key].emoji} ${escapeHtml(leaders[key].name)}</option>`;
        });
        options += '<option value="personal">☑️ Personal</option>';
        clipAssign.innerHTML = options;
    }
    // Load mascot speech from saved data
    const savedSpeech = getData('mascot-speech', 'woof! 🐾');
    const speechEl = document.querySelector('.lacey-speech');
    if (speechEl) speechEl.textContent = savedSpeech;
    // Load saved coverage data
    // (coverage lanes handle their own persistence now)

    // Init recurring tasks on first load
    initRecurring();

    // Render all views
    const leaderKeys = Object.keys(getLeaders()).filter(k => k !== 'daily');
    leaderKeys.forEach(leader => {
        renderTasks(leader);
        renderCompleted(leader);
        renderWaiting(leader);
        renderNudges(leader);
    });
    renderCoverageLanes();
    renderCoverageNoteItems();
    renderMoraleEvents();
    renderQuickLinks();
    renderExecPrefs();
    renderDaily();

    // Init search
    initSearch();

    // Init notes
    initNotes();

    // Clipboard capture — run first so it always works
    initClipboardCapture();

    // Dark mode
    initDarkMode();

    // Theme
    initTheme();

    // Init files
    initFiles();

    // Init settings
    initSettings();

    // Update mascot from saved settings
    updateMascotDisplay();

    // Nav & events
    ensureLeaderViews();
    renderNav();
    initEventListeners();

    // Auto-archive on Fridays
    checkAutoArchive();

    // Auto-archive old completed tasks
    autoArchiveCompleted();

    // Task count badges
    updateTaskCounts();

    // Progress bar
    updateProgressBar();

    // Unlock AudioContext on first user interaction so mascot sound works on hover
    document.addEventListener('click', function unlockAudio() {
        try { new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        document.removeEventListener('click', unlockAudio);
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect to setup wizard if first time (skip if already has data)
    const hasData = localStorage.getItem('cc-setup-complete') || localStorage.getItem('cc-leader-config');
    if (!hasData) {
        window.location.href = 'setup.html';
        return;
    }
    // Mark as complete if they have data but no flag
    if (!localStorage.getItem('cc-setup-complete')) {
        localStorage.setItem('cc-setup-complete', 'true');
    }
    // Only sync with server if this is the original host (has old task data from before the wizard existed)
    // New users from the wizard will have cc-leader-config but NOT cc-tasks-anthony
    const freshFromWizard = sessionStorage.getItem('cc-fresh-wizard');
    const hasOldData = localStorage.getItem('cc-tasks-anthony') || localStorage.getItem('cc-tasks-chris');
    if (!freshFromWizard && hasOldData) {
        await initDataSync();
    }
    init();
});
