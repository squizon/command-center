#Requires AutoHotkey v2.0
#SingleInstance Force

; --- Command Center Capture Button ---
; Opens your Quick Capture widget when you press Ctrl+Shift+C
; Also shows a simple tray menu when you click the H icon

; Tray menu
A_TrayMenu.Delete()
A_TrayMenu.Add("Open Quick Capture", OpenCapture)
A_TrayMenu.Add("Open Command Center", OpenDashboard)
A_TrayMenu.Add()
A_TrayMenu.Add("Exit", ExitScript)
A_TrayMenu.Default := "Open Quick Capture"

; Double-click tray icon opens capture
A_IconTip := "Command Center ✨ - Double-click to capture"

; Hotkey: Ctrl+Shift+C opens the widget
^+c::OpenCapture()

; Functions
OpenCapture(*) {
    Run("http://localhost:3000/widget.html")
}

OpenDashboard(*) {
    Run("http://localhost:3000")
}

ExitScript(*) {
    ExitApp()
}

; Keep running
Persistent
