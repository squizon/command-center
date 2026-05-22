const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Redirect to setup wizard
app.get('/welcome', (req, res) => {
    res.redirect('/setup.html');
});

// --- Data helpers ---
function readData() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API: Get all data (only for host — requires sync header) ---
app.get('/api/data', (req, res) => {
    if (req.headers['x-cc-sync'] !== 'host') {
        return res.json({});
    }
    res.json(readData());
});

// --- API: Get a specific key ---
app.get('/api/data/:key', (req, res) => {
    const data = readData();
    const value = data[req.params.key];
    res.json(value !== undefined ? value : null);
});

// --- API: Save a specific key (host only) ---
app.post('/api/data/:key', (req, res) => {
    if (req.headers['x-cc-sync'] !== 'host') {
        return res.json({ success: false });
    }
    const data = readData();
    data[req.params.key] = req.body.value;
    writeData(data);
    res.json({ success: true });
});

// --- API: Save all data at once (host only) ---
app.post('/api/data', (req, res) => {
    if (req.headers['x-cc-sync'] !== 'host') {
        return res.json({ success: false });
    }
    writeData(req.body);
    res.json({ success: true });
});

// --- Start ---
app.listen(PORT, () => {
    console.log(`\n✨ Command Center running at http://localhost:${PORT}`);
    console.log(`   Data file: ${DATA_FILE}\n`);
});
