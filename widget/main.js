const { app, BrowserWindow, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 320,
        height: 400,
        resizable: false,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('widget.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Hide instead of close (stays in taskbar/tray)
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'tray-icon.png');

    // Check if icon exists, if not use a default
    let trayIcon;
    try {
        require('fs').accessSync(iconPath);
        trayIcon = iconPath;
    } catch {
        // If no icon file, skip tray (will still work from taskbar)
        console.log('No tray-icon.png found — run create-tray-icon.html to generate one');
        return;
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Widget',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: 'Always on Top',
            type: 'checkbox',
            checked: true,
            click: (menuItem) => {
                mainWindow.setAlwaysOnTop(menuItem.checked);
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Command Center ✨');
    tray.setContextMenu(contextMenu);

    // Click tray icon to show/hide
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Global keyboard shortcut: Ctrl+Shift+C to toggle widget
    globalShortcut.register('Ctrl+Shift+C', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit — keep in tray
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
