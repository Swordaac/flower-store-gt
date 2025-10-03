const PrintNodeClient = require('printnode-client');

// Ensure environment variables are loaded
require('dotenv').config();

// PrintNode configuration
const printnodeConfig = {
  api_key: process.env.PRINTNODE_API_KEY,
  baseUrl: 'https://api.printnode.com',
  timeout: 30000, // 30 seconds timeout
  retries: 3
};

// Debug: Log the configuration (remove in production)
// console.log('PrintNode Config:', {
//   api_key: printnodeConfig.api_key ? `${printnodeConfig.api_key.substring(0, 8)}...` : 'undefined',
//   baseUrl: printnodeConfig.baseUrl,
//   timeout: printnodeConfig.timeout,
//   retries: printnodeConfig.retries
// });

// Validate API key
if (!printnodeConfig.api_key) {
  throw new Error('PRINTNODE_API_KEY environment variable is required');
}

// Create PrintNode client instance
const printnodeClient = new PrintNodeClient(printnodeConfig);

module.exports = {
  printnodeClient,
  printnodeConfig
};
