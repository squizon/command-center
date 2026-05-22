const { WebClient } = require('@slack/web-api');

let slackClient = null;
let userClient = null;

// Initialize Slack clients
function initSlack() {
    if (process.env.SLACK_BOT_TOKEN) {
        slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
    if (process.env.SLACK_USER_TOKEN) {
        userClient = new WebClient(process.env.SLACK_USER_TOKEN);
    }
}

// Check if Slack is configured
function isAuthenticated() {
    return !!(process.env.SLACK_BOT_TOKEN || process.env.SLACK_USER_TOKEN);
}

// Get messages you sent that haven't been replied to
async function getPendingMessages() {
    if (!userClient) {
        throw new Error('Slack user token not configured. Add SLACK_USER_TOKEN to .env');
    }

    const pending = [];

    // Get list of conversations (DMs and channels you're in)
    const conversations = await userClient.conversations.list({
        types: 'im,mpim,public_channel,private_channel',
        limit: 50
    });

    // Get your user ID
    const authInfo = await userClient.auth.test();
    const myUserId = authInfo.user_id;

    // Check recent messages in each conversation
    for (const channel of conversations.channels.slice(0, 20)) {
        try {
            const history = await userClient.conversations.history({
                channel: channel.id,
                limit: 10
            });

            for (const msg of history.messages) {
                // Skip if not my message
                if (msg.user !== myUserId) continue;
                // Skip if it's older than 7 days
                const msgDate = new Date(parseFloat(msg.ts) * 1000);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                if (msgDate < sevenDaysAgo) continue;

                // Check if there's a reply (thread or subsequent message)
                let hasReply = false;

                if (msg.thread_ts) {
                    // Check thread replies
                    const replies = await userClient.conversations.replies({
                        channel: channel.id,
                        ts: msg.thread_ts,
                        limit: 5
                    });
                    hasReply = replies.messages.some(r => r.user !== myUserId && parseFloat(r.ts) > parseFloat(msg.ts));
                } else {
                    // Check if next message in channel is from someone else (simple heuristic)
                    const idx = history.messages.indexOf(msg);
                    if (idx > 0) {
                        hasReply = history.messages[idx - 1].user !== myUserId;
                    }
                }

                if (!hasReply && msg.text && msg.text.length > 5) {
                    // Get channel/user name for context
                    let contextName = channel.name || 'DM';
                    if (channel.is_im) {
                        try {
                            const userInfo = await userClient.users.info({ user: channel.user });
                            contextName = userInfo.user.real_name || userInfo.user.name;
                        } catch {
                            contextName = 'DM';
                        }
                    }

                    pending.push({
                        text: msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : ''),
                        channel: contextName,
                        date: msgDate.toISOString().split('T')[0],
                        source: 'Slack',
                        channelId: channel.id,
                        ts: msg.ts
                    });
                }
            }
        } catch (err) {
            // Skip channels we can't access
            continue;
        }
    }

    return pending;
}

// Get your unread messages / mentions
async function getUnreadMentions() {
    if (!userClient) {
        throw new Error('Slack user token not configured');
    }

    // Get recent mentions
    const result = await userClient.search.messages({
        query: 'to:me',
        sort: 'timestamp',
        sort_dir: 'desc',
        count: 20
    });

    if (!result.messages || !result.messages.matches) return [];

    return result.messages.matches.map(msg => ({
        text: msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : ''),
        from: msg.username || 'Unknown',
        channel: msg.channel?.name || 'DM',
        date: new Date(parseFloat(msg.ts) * 1000).toISOString().split('T')[0],
        permalink: msg.permalink
    }));
}

// Send a Slack message
async function sendMessage(channelOrUserId, text) {
    const client = slackClient || userClient;
    if (!client) {
        throw new Error('No Slack token configured');
    }

    const result = await client.chat.postMessage({
        channel: channelOrUserId,
        text: text
    });

    return { success: true, ts: result.ts };
}

// Look up a user by name or email
async function findUser(query) {
    const client = slackClient || userClient;
    if (!client) {
        throw new Error('No Slack token configured');
    }

    const result = await client.users.list({ limit: 200 });
    const matches = result.members.filter(u =>
        !u.deleted &&
        !u.is_bot &&
        (u.real_name?.toLowerCase().includes(query.toLowerCase()) ||
         u.name?.toLowerCase().includes(query.toLowerCase()) ||
         u.profile?.email?.toLowerCase().includes(query.toLowerCase()))
    );

    return matches.map(u => ({
        id: u.id,
        name: u.real_name || u.name,
        email: u.profile?.email || ''
    }));
}

module.exports = {
    initSlack,
    isAuthenticated,
    getPendingMessages,
    getUnreadMentions,
    sendMessage,
    findUser
};
