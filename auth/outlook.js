const msal = require('@azure/msal-node');
require('isomorphic-fetch');
const { Client } = require('@microsoft/microsoft-graph-client');

// MSAL configuration
const msalConfig = {
    auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`
    }
};

const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// Store tokens in memory (in production, use a database)
let tokenCache = {};

// Get the auth URL to redirect user to Microsoft login
function getAuthUrl() {
    return msalClient.getAuthCodeUrl({
        scopes: ['Mail.Read', 'Mail.Send', 'Calendars.Read', 'User.Read'],
        redirectUri: `http://localhost:${process.env.PORT || 3000}/auth/outlook/callback`
    });
}

// Exchange auth code for tokens
async function handleCallback(code) {
    const result = await msalClient.acquireTokenByCode({
        code,
        scopes: ['Mail.Read', 'Mail.Send', 'Calendars.Read', 'User.Read'],
        redirectUri: `http://localhost:${process.env.PORT || 3000}/auth/outlook/callback`
    });
    tokenCache = result;
    return result;
}

// Get an authenticated Graph client
function getGraphClient() {
    if (!tokenCache.accessToken) {
        throw new Error('Not authenticated with Outlook. Visit /auth/outlook to connect.');
    }

    return Client.init({
        authProvider: (done) => {
            done(null, tokenCache.accessToken);
        }
    });
}

// --- API Methods ---

// Get today's calendar events
async function getTodayEvents() {
    const client = getGraphClient();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const events = await client
        .api('/me/calendarview')
        .query({
            startDateTime: startOfDay,
            endDateTime: endOfDay
        })
        .select('subject,start,end,organizer,location,bodyPreview')
        .orderby('start/dateTime')
        .get();

    return events.value.map(event => ({
        title: event.subject,
        start: event.start.dateTime,
        end: event.end.dateTime,
        organizer: event.organizer?.emailAddress?.name || '',
        location: event.location?.displayName || '',
        preview: event.bodyPreview || ''
    }));
}

// Get emails awaiting reply (sent by me with no response)
async function getPendingEmails() {
    const client = getGraphClient();

    // Get sent emails from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sentMessages = await client
        .api('/me/mailFolders/SentItems/messages')
        .filter(`sentDateTime ge ${sevenDaysAgo.toISOString()}`)
        .select('subject,toRecipients,sentDateTime,conversationId,isRead')
        .top(50)
        .orderby('sentDateTime desc')
        .get();

    // Check which conversations have replies
    const pending = [];
    for (const msg of sentMessages.value) {
        // Look for replies in the conversation
        const replies = await client
            .api('/me/messages')
            .filter(`conversationId eq '${msg.conversationId}'`)
            .select('from,receivedDateTime')
            .top(5)
            .get();

        // If only my messages exist in the conversation, it's pending
        const hasReply = replies.value.some(r =>
            r.from?.emailAddress?.address !== tokenCache.account?.username
        );

        if (!hasReply) {
            pending.push({
                subject: msg.subject,
                to: msg.toRecipients.map(r => r.emailAddress.name || r.emailAddress.address).join(', '),
                sentDate: msg.sentDateTime,
                source: 'Outlook'
            });
        }
    }

    return pending;
}

// Get flagged emails
async function getFlaggedEmails() {
    const client = getGraphClient();

    const flagged = await client
        .api('/me/messages')
        .filter("flag/flagStatus eq 'flagged'")
        .select('subject,from,receivedDateTime,flag,bodyPreview')
        .top(20)
        .orderby('receivedDateTime desc')
        .get();

    return flagged.value.map(msg => ({
        subject: msg.subject,
        from: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || '',
        date: msg.receivedDateTime,
        preview: msg.bodyPreview || '',
        source: 'Outlook'
    }));
}

// Send an email (for drafts)
async function sendEmail(to, subject, body) {
    const client = getGraphClient();

    await client
        .api('/me/sendMail')
        .post({
            message: {
                subject,
                body: { contentType: 'Text', content: body },
                toRecipients: [{ emailAddress: { address: to } }]
            }
        });

    return { success: true };
}

// Create a draft email
async function createDraft(to, subject, body) {
    const client = getGraphClient();

    const draft = await client
        .api('/me/messages')
        .post({
            subject,
            body: { contentType: 'Text', content: body },
            toRecipients: [{ emailAddress: { address: to } }]
        });

    return { success: true, id: draft.id };
}

function isAuthenticated() {
    return !!tokenCache.accessToken;
}

module.exports = {
    getAuthUrl,
    handleCallback,
    getTodayEvents,
    getPendingEmails,
    getFlaggedEmails,
    sendEmail,
    createDraft,
    isAuthenticated
};
