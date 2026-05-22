# Chrome Extension & Widget Setup

## Part 1: Chrome Extension

The extension adds a "📌 Track This" button when you're on Outlook or Slack in your browser. You can also click the extension icon anytime to quick-capture from any page.

### How to Install

1. Open Chrome (or Edge)
2. Type `chrome://extensions` in the address bar and press Enter
3. In the top-right corner, turn on **"Developer mode"** (it's a toggle switch)
4. Click **"Load unpacked"** button (top-left area)
5. Navigate to: `Desktop > JWO Nominations > DailyCommandCenter > extension`
6. Select that folder and click "Select Folder"
7. Done! You'll see the extension appear with a purple/pink icon

### Before You Use It — Generate Icons

1. Open the file `extension/create-icons.html` in your browser (double-click it)
2. It will automatically download 3 icon files (icon16.png, icon48.png, icon128.png)
3. Move those 3 files into the `extension` folder
4. Go back to `chrome://extensions` and click the refresh icon on your extension

### How to Use

**On any page:**
- Click the extension icon (puzzle piece in toolbar, then pin it)
- A popup appears — type what you want to capture
- Pick the leader, type (task/waiting/note), and save

**On Outlook web (outlook.office.com):**
- A purple "📌 Track This" button appears in the bottom-right
- Click it while viewing an email — it grabs the subject and sender
- Then click the extension icon to review and save

**On Slack web (app.slack.com):**
- Same purple button appears
- Select text in a message, then click "📌 Track This"
- It captures the text and sender
- Click extension icon to save

---

## Part 2: Floating Widget

The widget is a tiny always-visible capture form you can keep open alongside your desktop apps (Outlook, Slack desktop). It's just a small browser window.

### How to Use

1. Open `widget/widget.html` in your browser (double-click it)
2. Resize the browser window to be small (just the widget size)
3. Position it in a corner of your screen
4. Keep it open while you work in desktop Outlook/Slack
5. When you see something to track, click the widget and type it in

### Pro Tips

- **Pin it on top:** In Windows, you can use a tool like "PowerToys" (free from Microsoft) to pin the window always-on-top
- **Keyboard shortcut:** Click the widget, type your item, press Enter — done in 2 seconds
- **Collapse it:** Click the "−" button to minimize it to just the header bar

### How Data Syncs

Both the extension and widget save data in the same format as your Command Center. When you open your Command Center in the same browser, all captured items will appear automatically.

**Important:** Use the same browser for everything (Command Center + widget + extension) so they share the same local storage.
