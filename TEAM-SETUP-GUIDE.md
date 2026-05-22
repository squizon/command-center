# Command Center ✨ — Setup Guide for EAs

Hey! Sofia built this tool and wants to share it with you. It's a personal dashboard for managing your leaders, tasks, follow-ups, and more. Takes about 5 minutes to set up.

---

## What You'll Get

- Task boards for each leader you support
- "Waiting On" tracker with auto-aging
- Follow-up nudge drafts (pre-written messages you can copy-paste)
- Coverage mode for when you're covering for another EA
- Weekly summary generator
- Morale event planner
- File storage for screenshots and docs
- Daily quote to start your morning right

---

## Setup Steps

### Step 1: Get the folder

Sofia will share a folder called `DailyCommandCenter` with you. Save it to your **Desktop**.

---

### Step 2: Install Node.js (one-time, takes 2 minutes)

1. Go to **https://nodejs.org**
2. Click the green **"Windows Installer (.msi)"** button at the bottom
3. Run the installer — click Next through everything
4. Restart your computer when done

---

### Step 3: Install the app

1. Click the **Windows search bar** and type **cmd**
2. Click **Command Prompt**
3. Type this and press Enter:

```
cd Desktop\DailyCommandCenter
```

4. Then type:

```
npm install
```

Wait for it to finish (about 30 seconds).

---

### Step 4: Start it up

In the same Command Prompt window, type:

```
npm start
```

You should see:
```
✨ Command Center running at http://localhost:3000
```

---

### Step 5: Open it

Open your browser (Chrome or Edge) and go to:

```
http://localhost:3000
```

A setup wizard will appear asking for your name, your leaders, and your recurring tasks. Fill it in and you're done!

---

### Step 6: Pin it to your taskbar (optional but recommended)

1. While the Command Center is open in Chrome, click the **three dots** (⋮) top-right
2. Click **"Cast, save, and share"** or **"More tools"**
3. Click **"Create shortcut..."**
4. Check **"Open as window"**
5. Click Create
6. Right-click the new taskbar icon → **Pin to taskbar**

Now you can click it anytime like a regular app!

---

## Daily Use

Every time you want to use it:

1. Open Command Prompt
2. Type: `cd Desktop\DailyCommandCenter`
3. Type: `npm start`
4. Open `http://localhost:3000` (or click your pinned taskbar icon)

Leave the Command Prompt window open while you're using it.

---

## Tips

- **Copy something in Slack/Outlook** → switch to Command Center → a banner appears with your copied text ready to save
- **Right-click any tab** to rename it or change the emoji
- **Quick capture bar** at the bottom — type anything and assign it to a leader
- **Weekly summary** auto-generates every Friday — copy it into an email for your leaders
- **Coverage mode** — when covering for another EA, create a lane and it auto-generates handoff notes

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "npm is not recognized" | Restart your computer after installing Node.js |
| Page won't load | Make sure Command Prompt is still running with `npm start` |
| Data disappeared | Make sure you're opening it in the same browser every time |
| Want to start fresh | In the browser, press F12 → Console → type `localStorage.clear()` → refresh |

---

## Questions?

Ask Sofia! She built this and knows it inside out. 💪
