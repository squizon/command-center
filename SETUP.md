# Daily Command Center - Setup Guide

## Quick Start (No Integrations)

The app works immediately without any integrations — just open `index.html` in a browser.
All features work with local storage. Integrations are optional and add auto-sync.

---

## Running with Integrations

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher)
- A terminal/command prompt

### Install & Run

```bash
cd DailyCommandCenter
npm install
npm start
```

Then open http://localhost:3000 in your browser.

---

## Setting Up Outlook (Microsoft Graph)

### Step 1: Register an App in Azure

1. Go to https://portal.azure.com
2. Search for "App registrations" → Click "New registration"
3. Name: "Daily Command Center"
4. Supported account types: "Accounts in this organizational directory only"
5. Redirect URI: Select "Web" → Enter `http://localhost:3000/auth/outlook/callback`
6. Click "Register"

### Step 2: Get Your Credentials

1. On the app overview page, copy:
   - **Application (client) ID** → paste into `.env` as `OUTLOOK_CLIENT_ID`
   - **Directory (tenant) ID** → paste into `.env` as `OUTLOOK_TENANT_ID`
2. Go to "Certificates & secrets" → "New client secret"
   - Description: "Command Center"
   - Copy the **Value** → paste into `.env` as `OUTLOOK_CLIENT_SECRET`

### Step 3: Set API Permissions

1. Go to "API permissions" → "Add a permission"
2. Choose "Microsoft Graph" → "Delegated permissions"
3. Add these permissions:
   - `Mail.Read`
   - `Mail.Send`
   - `Calendars.Read`
   - `User.Read`
4. Click "Grant admin consent" (or ask your IT admin)

### Step 4: Connect

1. Start the server: `npm start`
2. Visit http://localhost:3000/auth/outlook
3. Sign in with your work account
4. You'll be redirected back to the dashboard — Outlook badge should show ✅

---

## Setting Up Slack

### Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Daily Command Center"
4. Pick your workspace

### Step 2: Set Permissions (Bot Token Scopes)

1. Go to "OAuth & Permissions"
2. Under "Bot Token Scopes", add:
   - `channels:history`
   - `groups:history`
   - `im:history`
   - `mpim:history`
   - `users:read`
   - `chat:write`
3. Under "User Token Scopes", add:
   - `channels:history`
   - `groups:history`
   - `im:history`
   - `mpim:history`
   - `search:read`
   - `users:read`
   - `chat:write`

### Step 3: Install to Workspace

1. Go to "Install App" → "Install to Workspace"
2. Authorize the app
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`) → paste into `.env` as `SLACK_BOT_TOKEN`
4. Copy the **User OAuth Token** (starts with `xoxp-`) → paste into `.env` as `SLACK_USER_TOKEN`

### Step 4: Verify

1. Restart the server: `npm start`
2. The console should show "Slack: ✅ Connected"
3. The dashboard badge should show ✅

---

## What Each Integration Does

### Outlook
| Feature | What it pulls |
|---------|--------------|
| Calendar sync | Today's meetings auto-populate your schedule |
| Pending emails | Sent emails with no reply show in "Waiting On" |
| Draft composer | Create drafts or send emails directly |

### Slack
| Feature | What it pulls |
|---------|--------------|
| Pending messages | Messages you sent with no reply show in "Waiting On" |
| Send messages | Send Slack messages from the draft composer |

---

## Troubleshooting

**"Not authenticated with Outlook"**
→ Visit http://localhost:3000/auth/outlook to reconnect

**"Slack user token not configured"**
→ Make sure `SLACK_USER_TOKEN` is set in `.env` and restart the server

**Calendar not syncing**
→ Check that `Calendars.Read` permission is granted in Azure

**Can't send emails**
→ Check that `Mail.Send` permission is granted and admin-consented

---

## Security Notes

- Tokens are stored in memory only (lost on server restart)
- For production use, add a proper token store (database or encrypted file)
- Never commit your `.env` file to git
- The app runs locally — no data leaves your machine except API calls to Microsoft/Slack
