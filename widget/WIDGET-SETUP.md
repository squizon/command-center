# Widget Setup — Taskbar App

This turns the Quick Capture widget into a real app that lives in your taskbar with its own icon.

## Step-by-Step Setup

### Step 1: Install the widget dependencies

1. Open Command Prompt (search "cmd" in Windows)
2. Type this and press Enter:

```
cd Desktop\"JWO Nominations"\DailyCommandCenter\widget
```

3. Then type:

```
npm install
```

Wait for it to finish (might take a minute or two — Electron is a big download).

### Step 2: Generate the tray icon

1. Double-click `create-tray-icon.html` in the widget folder
2. It will auto-download a file called `tray-icon.png`
3. Move that file into the `widget` folder (same folder as main.js)

### Step 3: Run the widget

In Command Prompt (still in the widget folder), type:

```
npm start
```

You should see:
- A small floating widget appear on your screen
- A purple/pink icon in your system tray (bottom-right of taskbar, near the clock)

### How to Use

- **Show/hide:** Press `Ctrl+Shift+C` from anywhere, or click the tray icon
- **Drag it:** Grab the purple header bar to move it around your screen
- **Minimize:** Click the "−" button to hide it (click tray icon to bring it back)
- **Always on top:** It stays above other windows by default
- **Quit:** Right-click the tray icon → Quit

### How to Pin to Taskbar

1. While the widget is running, you'll see it in your taskbar
2. Right-click its taskbar icon
3. Click "Pin to taskbar"
4. Now you can always click it to open the widget

### Making It Start Automatically (Optional)

If you want the widget to start every time you turn on your computer:

1. Press `Win + R` to open Run
2. Type `shell:startup` and press Enter
3. A folder opens — create a shortcut here:
   - Right-click in the folder → New → Shortcut
   - For the location, type: `cmd /c cd /d "C:\Users\squizon\Desktop\JWO Nominations\DailyCommandCenter\widget" && npm start`
   - Name it "Command Center Widget"
   - Click Finish

### Important Note About Data

The widget saves data to its own local storage (separate from your browser). To sync with your Command Center, you'll need to open the Command Center in the same browser where you view it.

For now, the widget is best used as a quick capture tool — items you add here will show up in your Command Center next time you open it, as long as both use the same storage location.
