const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// Configuration
// ============================================

const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY || '0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f';

// Contract ABIs
const VEHICLE_REGISTRY_ABI = [
  "function registerVehicle(string memory _vehicleId) public",
  "function isRegistered(address _vehicle) public view returns (bool)",
  "event VehicleRegistered(address indexed vehicleAddress, string vehicleId)"
];

const ALERT_SYSTEM_ABI = [
  "function sendAlert(string memory _message) public",
  "function getAlerts() public view returns (tuple(string message, address sender, uint timestamp)[])",
  "event AlertSent(string message, address indexed sender)"
];

// Will be set during initialization
let provider;
let edgeServerWallet;
let vehicleRegistryContract;
let alertSystemContract;
let vehicleRegistryAddress;
let alertSystemAddress;

// ============================================
// Initialize Blockchain Connection
// ============================================

async function initializeBlockchain() {
  try {
    // Connect to Ganache
    provider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);
    
    // Create signer for edge server (admin account)
    edgeServerWallet = new ethers.Wallet(GANACHE_PRIVATE_KEY, provider);
    
    console.log(`[EDGE SERVER] Connected to Ganache at ${GANACHE_RPC_URL}`);
    console.log(`[EDGE SERVER] Edge Server Address: ${edgeServerWallet.address}`);
    
    return true;
  } catch (error) {
    console.error('[EDGE SERVER] Error connecting to blockchain:', error.message);
    return false;
  }
}

// ============================================
// Set Contract Addresses
// ============================================

function setContractAddresses(registryAddr, alertAddr) {
  try {
    vehicleRegistryAddress = registryAddr;
    alertSystemAddress = alertAddr;
    
    // Initialize contracts
    vehicleRegistryContract = new ethers.Contract(
      vehicleRegistryAddress,
      VEHICLE_REGISTRY_ABI,
      edgeServerWallet
    );
    
    alertSystemContract = new ethers.Contract(
      alertSystemAddress,
      ALERT_SYSTEM_ABI,
      edgeServerWallet
    );
    
    console.log(`[EDGE SERVER] VehicleRegistry set to: ${vehicleRegistryAddress}`);
    console.log(`[EDGE SERVER] AlertSystem set to: ${alertSystemAddress}`);
    
    return true;
  } catch (error) {
    console.error('[EDGE SERVER] Error setting contract addresses:', error.message);
    return false;
  }
}

// ============================================
// API Endpoints
// ============================================

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    edgeServerAddress: edgeServerWallet?.address,
    ganacheRPC: GANACHE_RPC_URL,
    contractsInitialized: !!(vehicleRegistryContract && alertSystemContract)
  });
});

/**
 * Initialize Edge Server with Contract Addresses
 * POST /api/initialize
 * Body: { registryAddress, alertSystemAddress }
 */
app.post('/api/initialize', (req, res) => {
  try {
    const { registryAddress, alertSystemAddress } = req.body;
    
    if (!registryAddress || !alertSystemAddress) {
      return res.status(400).json({
        error: 'Missing registryAddress or alertSystemAddress'
      });
    }
    
    const success = setContractAddresses(registryAddress, alertSystemAddress);
    
    if (success) {
      res.json({
        message: 'Edge server initialized with contracts',
        edgeServerAddress: edgeServerWallet.address,
        vehicleRegistryAddress,
        alertSystemAddress
      });
    } else {
      res.status(500).json({ error: 'Failed to initialize contracts' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register a Vehicle (OBU Registration)
 * POST /api/vehicle/register
 * Body: { vehicleAddress, vehicleId }
 */
app.post('/api/vehicle/register', async (req, res) => {
  try {
    if (!vehicleRegistryContract) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }
    
    const { vehicleAddress, vehicleId } = req.body;
    
    if (!vehicleAddress || !vehicleId) {
      return res.status(400).json({
        error: 'Missing vehicleAddress or vehicleId'
      });
    }
    
    // Create a signer for the vehicle
    const vehicleWallet = new ethers.Wallet(
      ethers.Wallet.createRandom().privateKey,
      provider
    );
    
    // Transaction: Register vehicle
    const tx = await vehicleRegistryContract.registerVehicle(vehicleId);
    const receipt = await tx.wait();
    
    res.json({
      message: 'Vehicle registered successfully',
      vehicleId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Check if Vehicle is Registered
 * GET /api/vehicle/check/:address
 */
app.get('/api/vehicle/check/:address', async (req, res) => {
  try {
    if (!vehicleRegistryContract) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }
    
    const { address } = req.params;
    const isRegistered = await vehicleRegistryContract.isRegistered(address);
    
    res.json({
      vehicleAddress: address,
      isRegistered
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Alert to Blockchain
 * This is the core function: OBU → Edge Server → Blockchain AlertSystem
 * 
 * POST /api/alert/send
 * Body: {
 *   vehiclePrivateKey: "0x...",
 *   alertMessage: "Accident detected at coordinates...",
 *   alertType: "accident|congestion|hazard|emergency"
 * }
 */
app.post('/api/alert/send', async (req, res) => {
  try {
    if (!alertSystemContract) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }
    
    const { vehiclePrivateKey, alertMessage, alertType } = req.body;
    
    if (!vehiclePrivateKey || !alertMessage) {
      return res.status(400).json({
        error: 'Missing vehiclePrivateKey or alertMessage'
      });
    }
    
    // Create signer for the OBU/Vehicle sending the alert
    const vehicleWallet = new ethers.Wallet(vehiclePrivateKey, provider);
    const vehicleAlertSystemContract = alertSystemContract.connect(vehicleWallet);
    
    // Send alert through blockchain
    const tx = await vehicleAlertSystemContract.sendAlert(alertMessage);
    const receipt = await tx.wait();
    
    res.json({
      message: 'Alert sent to blockchain successfully',
      vehicleAddress: vehicleWallet.address,
      alertMessage,
      alertType: alertType || 'generic',
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.reason || 'Transaction failed'
    });
  }
});

/**
 * Get All Alerts from Blockchain
 * GET /api/alert/all
 */
app.get('/api/alert/all', async (req, res) => {
  try {
    if (!alertSystemContract) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }
    
    const alerts = await alertSystemContract.getAlerts();
    
    // Format alerts with timestamps converted to readable format
    const formattedAlerts = alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: new Date(Number(alert.timestamp) * 1000).toISOString(),
      blockTimestamp: Number(alert.timestamp)
    }));
    
    res.json({
      totalAlerts: formattedAlerts.length,
      alerts: formattedAlerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Listen to Alert Events (Real-time)
 * GET /api/alert/events (SSE - Server-Sent Events)
 */
app.get('/api/alert/events', (req, res) => {
  if (!alertSystemContract) {
    return res.status(500).json({ error: 'Contracts not initialized' });
  }
  
  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Listen for AlertSent events
  const onAlertSent = (message, sender, event) => {
    const alertData = {
      message,
      sender,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: new Date().toISOString()
    };
    
    res.write(`data: ${JSON.stringify(alertData)}\n\n`);
  };
  
  // Subscribe to events
  alertSystemContract.on('AlertSent', onAlertSent);
  
  // Cleanup on client disconnect
  req.on('close', () => {
    alertSystemContract.removeListener('AlertSent', onAlertSent);
    res.end();
  });
});

/**
 * Process Sensor Data and Trigger Alerts (Decision Engine)
 * This simulates edge processing logic
 * 
 * POST /api/process/sensor-data
 * Body: {
 *   vehiclePrivateKey: "0x...",
 *   sensorData: {
 *     speed: 120,
 *     collision: true,
 *     gpsCoords: { lat: 40.7128, lng: -74.0060 },
 *     visibility: 100
 *   }
 * }
 */
app.post('/api/process/sensor-data', async (req, res) => {
  try {
    const { vehiclePrivateKey, sensorData } = req.body;
    
    if (!vehiclePrivateKey || !sensorData) {
      return res.status(400).json({ error: 'Missing vehiclePrivateKey or sensorData' });
    }
    
    // Decision Engine Logic (can be extended with ML)
    const decisions = analyzeAndDecide(sensorData);
    
    if (decisions.shouldAlert) {
      // Send alert to blockchain
      const vehicleWallet = new ethers.Wallet(vehiclePrivateKey, provider);
      const vehicleAlertSystemContract = alertSystemContract.connect(vehicleWallet);
      
      const alertMsg = `[${decisions.alertType.toUpperCase()}] ${decisions.message}`;
      const tx = await vehicleAlertSystemContract.sendAlert(alertMsg);
      const receipt = await tx.wait();
      
      res.json({
        processed: true,
        alert_triggered: true,
        alertType: decisions.alertType,
        message: decisions.message,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
    } else {
      res.json({
        processed: true,
        alert_triggered: false,
        message: 'No alert needed'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Edge Decision Engine
 * Simple rule-based system for now (can be upgraded to ML later)
 */
function analyzeAndDecide(sensorData) {
  const { speed, collision, visibility, temperature } = sensorData;
  
  // Accident Detection
  if (collision === true) {
    return {
      shouldAlert: true,
      alertType: 'accident',
      message: 'ACCIDENT DETECTED - Emergency Alert'
    };
  }
  
  // Poor Visibility
  if (visibility !== undefined && visibility < 50) {
    return {
      shouldAlert: true,
      alertType: 'hazard',
      message: `Low visibility detected: ${visibility}% - Use caution`
    };
  }
  
  // Extreme Temperature (potential ice on road)
  if (temperature !== undefined && temperature < -5) {
    return {
      shouldAlert: true,
      alertType: 'hazard',
      message: `Extreme cold detected: ${temperature}°C - Road may be icy`
    };
  }
  
  // Speeding
  if (speed !== undefined && speed > 120) {
    return {
      shouldAlert: true,
      alertType: 'speeding',
      message: `Excessive speed detected: ${speed} km/h`
    };
  }
  
  // No alert needed
  return {
    shouldAlert: false,
    alertType: 'none',
    message: 'Normal conditions'
  };
}

/**
 * Get Edge Server Statistics
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    if (!alertSystemContract) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }
    
    const alerts = await alertSystemContract.getAlerts();
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      edgeServerAddress: edgeServerWallet.address,
      blockchainNetwork: 'Ganache',
      currentBlockNumber: blockNumber,
      vehicleRegistryAddress,
      alertSystemAddress,
      totalAlertsOnChain: alerts.length,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('[EDGE SERVER] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Start Server
 */
async function startServer(port) {
  // Initialize blockchain connection first
  const blockchainReady = await initializeBlockchain();
  
  if (!blockchainReady) {
    console.error('[EDGE SERVER] Failed to initialize blockchain connection');
    process.exit(1);
  }
  
  app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`[EDGE SERVER] Running on port ${port}`);
    console.log(`[EDGE SERVER] Ganache RPC: ${GANACHE_RPC_URL}`);
    console.log(`[EDGE SERVER] Edge Server Wallet: ${edgeServerWallet.address}`);
    console.log(`========================================\n`);
    
    console.log('Available endpoints:');
    console.log(`  GET  /health`);
    console.log(`  POST /api/initialize`);
    console.log(`  POST /api/vehicle/register`);
    console.log(`  GET  /api/vehicle/check/:address`);
    console.log(`  POST /api/alert/send`);
    console.log(`  GET  /api/alert/all`);
    console.log(`  GET  /api/alert/events (SSE)`);
    console.log(`  POST /api/process/sensor-data`);
    console.log(`  GET  /api/stats`);
  });
}

// Get port from environment or command line
const port = process.env.PORT || process.argv[2] || 3000;
startServer(port);

module.exports = app;
