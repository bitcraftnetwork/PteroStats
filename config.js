const yaml = require('js-yaml');
const fs = require('fs');

// Load config from environment variables or config.yml
function loadConfig() {
  const config = {
    bot: {
      token: process.env.DISCORD_TOKEN || '',
      channel_id: process.env.CHANNEL_ID || '',
      interval: parseInt(process.env.INTERVAL) || 300000
    },
    panel: {
      url: process.env.PANEL_URL || '',
      api_key: process.env.PANEL_API_KEY || ''
    },
    settings: {
      log_error: process.env.LOG_ERROR === 'true' || false,
      blacklist_nodes: process.env.BLACKLIST_NODES ? process.env.BLACKLIST_NODES.split(',') : []
    }
  };

  // If config.yml exists, use it as fallback
  if (fs.existsSync('./config.yml')) {
    try {
      const yamlConfig = yaml.load(fs.readFileSync('./config.yml', 'utf8'));
      // Merge with environment variables (env vars take precedence)
      if (!config.bot.token) config.bot.token = yamlConfig.bot?.token;
      if (!config.bot.channel_id) config.bot.channel_id = yamlConfig.bot?.channel_id;
      if (!config.panel.url) config.panel.url = yamlConfig.panel?.url;
      if (!config.panel.api_key) config.panel.api_key = yamlConfig.panel?.api_key;
    } catch (error) {
      console.warn('Could not load config.yml, using environment variables only');
    }
  }

  return config;
}

module.exports = { loadConfig };
