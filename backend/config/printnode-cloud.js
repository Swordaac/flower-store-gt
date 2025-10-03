const PrintNodeClient = require('printnode-client');

// Ensure environment variables are loaded
require('dotenv').config();

// PrintNode configuration for cloud deployment
const printnodeConfig = {
  api_key: process.env.PRINTNODE_API_KEY,
  baseUrl: 'https://api.printnode.com',
  timeout: 30000, // 30 seconds timeout
  retries: 3
};

// Validate API key
if (!printnodeConfig.api_key) {
  console.warn('⚠️  PRINTNODE_API_KEY not found. PrintNode functionality will be disabled.');
  // Create a mock client for development without API key
  const mockClient = {
    fetchPrinters: async () => {
      console.log('📝 Mock: No printers available (PrintNode API key not configured)');
      return [];
    },
    createPrintJob: async (job) => {
      console.log('📝 Mock: Print job would be sent:', job.title);
      return { id: 'mock-job-id' };
    },
    whoami: async () => {
      console.log('📝 Mock: PrintNode connection test');
      return { email: 'mock@example.com' };
    }
  };
  
  module.exports = {
    printnodeClient: mockClient,
    printnodeConfig: { ...printnodeConfig, api_key: 'mock-key' }
  };
} else {
  // Create PrintNode client instance
  const printnodeClient = new PrintNodeClient(printnodeConfig);
  
  module.exports = {
    printnodeClient,
    printnodeConfig
  };
}
