/**
 * Configuration Management
 * Centralizes all environment and configuration settings
 */

const path = require('path');
const fs = require('fs');

// Load JSON ABIs from compiled artifacts
function loadABI(contractPath) {
  try {
    const artifactPath = path.join(__dirname, '../../blockchain/artifacts', contractPath);
    const data = fs.readFileSync(artifactPath, 'utf8');
    return JSON.parse(data).abi;
  } catch (e) {
    console.error(`Failed to load ABI from ${contractPath}:`, e.message);
    return [];
  }
}

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Blockchain Configuration
  GANACHE_RPC_URL: process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545',
  GANACHE_PRIVATE_KEY: process.env.GANACHE_PRIVATE_KEY,

  // Contract ABIs - Load from compiled artifacts
  VEHICLE_REGISTRY_ABI: loadABI('contracts/VehicleRegistry.sol/VehicleRegistry.json'),
  EDGE_SERVER_REGISTRY_ABI: loadABI('contracts/EdgeServerRegistry.sol/EdgeServerRegistry.json'),
  ALERT_SYSTEM_ABI: loadABI('contracts/AlertSystem.sol/AlertSystem.json'),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Log directory and file output control
  LOG_DIR: process.env.LOG_DIR || 'logs',
  LOG_TO_FILE: process.env.LOG_TO_FILE ? process.env.LOG_TO_FILE === 'true' : true,

  // Validation
  MAX_MESSAGE_LENGTH: 500,
  VEHICLES_LOW_TRUST_THRESHOLD: 50
};
