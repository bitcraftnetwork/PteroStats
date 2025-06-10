const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Initialize Express for health check
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});

// Configuration from environment variables
const config = {
    token: process.env.DISCORD_TOKEN,
    panelUrl: process.env.PANEL_URL,
    apiKey: process.env.PANEL_API_KEY,
    channelId: process.env.CHANNEL_ID,
    panelName: process.env.PANEL_NAME || 'My Panel',
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 300000, // 5 minutes default
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'PANEL_URL', 'PANEL_API_KEY', 'CHANNEL_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Function to fetch panel statistics
async function fetchPanelStats() {
    try {
        const headers = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Fetch servers
        const serversResponse = await axios.get(`${config.panelUrl}/api/application/servers`, { headers });
        const servers = serversResponse.data.data;

        // Fetch users
        const usersResponse = await axios.get(`${config.panelUrl}/api/application/users`, { headers });
        const users = usersResponse.data.data;

        // Fetch nodes
        const nodesResponse = await axios.get(`${config.panelUrl}/api/application/nodes`, { headers });
        const nodes = nodesResponse.data.data;

        // Calculate statistics
        const totalServers = servers.length;
        const totalUsers = users.length;
        const totalNodes = nodes.length;

        // Count running servers (this requires additional API calls to get server status)
        let runningServers = 0;
        for (const server of servers.slice(0, 10)) { // Limit to first 10 to avoid rate limits
            try {
                const statusResponse = await axios.get(
                    `${config.panelUrl}/api/client/servers/${server.attributes.identifier}/resources`,
                    {
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                if (statusResponse.data.attributes.current_state === 'running') {
                    runningServers++;
                }
            } catch (error) {
                console.log(`Could not fetch status for server ${server.attributes.name}`);
            }
        }

        return {
            totalServers,
            totalUsers,
            totalNodes,
            runningServers,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('Error fetching panel stats:', error.message);
        throw error;
    }
}

// Function to create stats embed
function createStatsEmbed(stats) {
    const embed = new EmbedBuilder()
        .setTitle(`📊 ${config.panelName} Statistics`)
        .setColor('#0099ff')
        .addFields(
            { name: '🖥️ Total Servers', value: stats.totalServers.toString(), inline: true },
            { name: '▶️ Running Servers', value: stats.runningServers.toString(), inline: true },
            { name: '👥 Total Users', value: stats.totalUsers.toString(), inline: true },
            { name: '🌐 Total Nodes', value: stats.totalNodes.toString(), inline: true }
        )
        .setTimestamp(stats.timestamp)
        .setFooter({ text: 'PteroStats - Auto Updated' });

    return embed;
}

// Function to update statistics
async function updateStats() {
    try {
        console.log('Fetching panel statistics...');
        const stats = await fetchPanelStats();
        const embed = createStatsEmbed(stats);

        const channel = client.channels.cache.get(config.channelId);
        if (!channel) {
            console.error('Channel not found!');
            return;
        }

        // Try to edit the last message if it exists, otherwise send a new one
        const messages = await channel.messages.fetch({ limit: 1 });
        const lastMessage = messages.first();

        if (lastMessage && lastMessage.author.id === client.user.id) {
            await lastMessage.edit({ embeds: [embed] });
            console.log('Statistics updated successfully!');
        } else {
            await channel.send({ embeds: [embed] });
            console.log('New statistics message sent!');
        }

    } catch (error) {
        console.error('Error updating stats:', error.message);
    }
}

// Bot events
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is now online!`);
    console.log(`📊 Monitoring panel: ${config.panelName}`);
    console.log(`🔄 Update interval: ${config.updateInterval / 1000} seconds`);
    
    // Send initial stats
    updateStats();
    
    // Set up periodic updates
    setInterval(updateStats, config.updateInterval);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Manual update command
    if (message.content.toLowerCase() === '!stats' && message.channel.id === config.channelId) {
        await updateStats();
    }
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Login to Discord
client.login(config.token);
