/**
 * Blockchain Service
 * Handles all blockchain interactions via ethers.js
 */

const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');

let provider;
let edgeServerWallet;
let vehicleRegistryContract;
let alertSystemContract;
let edgeServerRegistryContract;
let vehicleRegistryAddress;
let alertSystemAddress;
let edgeServerRegistryAddress;

/**
 * Initialize blockchain connection
 */
async function initializeBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(config.GANACHE_RPC_URL);
    edgeServerWallet = new ethers.Wallet(config.GANACHE_PRIVATE_KEY, provider);
    
    logger.info(`Connected to Ganache at ${config.GANACHE_RPC_URL}`);
    logger.info(`Edge Server Address: ${edgeServerWallet.address}`);
    
    return true;
  } catch (error) {
    logger.error('Error connecting to blockchain', { error: error.message });
    return false;
  }
}

/**
 * Set contract addresses and initialize contracts
 */
function setContractAddresses(registryAddr, alertAddr, edgeServerRegAddr) {
  try {
    vehicleRegistryAddress = registryAddr;
    alertSystemAddress = alertAddr;
    edgeServerRegistryAddress = edgeServerRegAddr;
    
    vehicleRegistryContract = new ethers.Contract(
      vehicleRegistryAddress,
      config.VEHICLE_REGISTRY_ABI,
      edgeServerWallet
    );
    
    alertSystemContract = new ethers.Contract(
      alertSystemAddress,
      config.ALERT_SYSTEM_ABI,
      edgeServerWallet
    );

    edgeServerRegistryContract = new ethers.Contract(
      edgeServerRegistryAddress,
      config.EDGE_SERVER_REGISTRY_ABI,
      edgeServerWallet
    );
    
    logger.info(`VehicleRegistry set to: ${vehicleRegistryAddress}`);
    logger.info(`AlertSystem set to: ${alertSystemAddress}`);
    logger.info(`EdgeServerRegistry set to: ${edgeServerRegistryAddress}`);
    
    return true;
  } catch (error) {
    logger.error('Error setting contract addresses', { error: error.message });
    return false;
  }
}

/**
 * Register a vehicle on blockchain
 */
async function registerVehicle(vehiclePrivateKey, vehicleId, vehicleCategory) {
  try {
    if (!vehicleRegistryContract) {
      throw new Error('Contracts not initialized');
    }

    const vehicleWallet = new ethers.Wallet(vehiclePrivateKey, provider);
    const registryWithSigner = vehicleRegistryContract.connect(vehicleWallet);
    
    const tx = await registryWithSigner.registerVehicle(vehicleId, vehicleCategory);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    logger.error('Error registering vehicle', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if vehicle is registered
 */
async function isVehicleRegistered(vehicleAddress) {
  try {
    if (!vehicleRegistryContract) {
      throw new Error('Contracts not initialized');
    }

    return await vehicleRegistryContract.isRegistered(vehicleAddress);
  } catch (error) {
    logger.error('Error checking vehicle registration', { error: error.message });
    return false;
  }
}

/**
 * Get vehicle category
 */
async function getVehicleCategory(vehicleAddress) {
  try {
    if (!vehicleRegistryContract) {
      throw new Error('Contracts not initialized');
    }

    return await vehicleRegistryContract.getVehicleCategory(vehicleAddress);
  } catch (error) {
    logger.error('Error getting vehicle category', { error: error.message });
    return null;
  }
}

/**
 * Check if emergency vehicle
 */
async function isEmergencyVehicle(vehicleAddress) {
  try {
    if (!vehicleRegistryContract) {
      throw new Error('Contracts not initialized');
    }

    return await vehicleRegistryContract.isEmergencyVehicle(vehicleAddress);
  } catch (error) {
    logger.error('Error checking emergency vehicle', { error: error.message });
    return false;
  }
}

/**
 * Send alert to blockchain
 */
async function sendAlert(vehiclePrivateKey, message, alertType, priority) {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const vehicleWallet = new ethers.Wallet(vehiclePrivateKey, provider);
    const alertWithSigner = alertSystemContract.connect(vehicleWallet);
    
    const tx = await alertWithSigner.sendAlert(message, alertType, priority);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    logger.error('Error sending alert', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send emergency broadcast
 */
async function emergencyBroadcast(vehiclePrivateKey, message, alertType) {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const vehicleWallet = new ethers.Wallet(vehiclePrivateKey, provider);
    const alertWithSigner = alertSystemContract.connect(vehicleWallet);
    
    const tx = await alertWithSigner.emergencyBroadcast(message, alertType);
    const receipt = await tx.wait();
    
    logger.info('Emergency broadcast sent to blockchain');
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      isEmergencyBroadcast: true
    };
  } catch (error) {
    logger.error('Error sending emergency broadcast', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all alerts from blockchain
 */
async function getAlerts() {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const alerts = await alertSystemContract.getAlerts();
    return alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: new Date(Number(alert.timestamp) * 1000).toISOString(),
      alertType: alert.alertType,
      priority: alert.priority,
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));
  } catch (error) {
    logger.error('Error getting alerts', { error: error.message });
    return [];
  }
}

/**
 * Get alerts by type
 */
async function getAlertsByType(alertType) {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const alerts = await alertSystemContract.getAlertsByType(alertType);
    return alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: new Date(Number(alert.timestamp) * 1000).toISOString(),
      alertType: alert.alertType,
      priority: alert.priority,
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));
  } catch (error) {
    logger.error('Error getting alerts by type', { error: error.message });
    return [];
  }
}

/**
 * Get emergency alerts
 */
async function getEmergencyAlerts() {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const alerts = await alertSystemContract.getEmergencyAlerts();
    return alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: new Date(Number(alert.timestamp) * 1000).toISOString(),
      alertType: alert.alertType,
      priority: alert.priority,
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));
  } catch (error) {
    logger.error('Error getting emergency alerts', { error: error.message });
    return [];
  }
}

/**
 * Get total alert count
 */
async function getTotalAlertCount() {
  try {
    if (!alertSystemContract) {
      throw new Error('Contracts not initialized');
    }

    const count = await alertSystemContract.getTotalAlertCount();
    return Number(count);
  } catch (error) {
    logger.error('Error getting alert count', { error: error.message });
    return 0;
  }
}

/**
 * Edge Server Registry Functions
 */

/**
 * Check if an address is an active edge server
 */
async function isActiveEdgeServer(serverAddress) {
  try {
    if (!edgeServerRegistryContract) {
      throw new Error('EdgeServerRegistry not initialized');
    }

    return await edgeServerRegistryContract.isActiveEdgeServer(serverAddress);
  } catch (error) {
    logger.error('Error checking edge server status', { error: error.message });
    return false;
  }
}

/**
 * Get edge server information
 */
async function getEdgeServerInfo(serverAddress) {
  try {
    if (!edgeServerRegistryContract) {
      throw new Error('EdgeServerRegistry not initialized');
    }

    const info = await edgeServerRegistryContract.getEdgeServerInfo(serverAddress);
    return {
      serverId: info.serverId,
      active: info.active,
      registeredTime: new Date(Number(info.registeredTime) * 1000).toISOString(),
      location: info.location,
      performanceScore: Number(info.performanceScore)
    };
  } catch (error) {
    logger.error('Error getting edge server info', { error: error.message });
    return null;
  }
}

/**
 * Get edge server performance score
 */
async function getEdgeServerPerformanceScore(serverAddress) {
  try {
    if (!edgeServerRegistryContract) {
      throw new Error('EdgeServerRegistry not initialized');
    }

    const score = await edgeServerRegistryContract.getPerformanceScore(serverAddress);
    return Number(score);
  } catch (error) {
    logger.error('Error getting edge server performance', { error: error.message });
    return null;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners(callbacks) {
  if (!alertSystemContract) {
    logger.warn('Contracts not initialized for event listeners');
    return;
  }

  if (callbacks.onAlertSent) {
    alertSystemContract.on('AlertSent', (message, sender, alertType, priority, isEmergency) => {
      callbacks.onAlertSent({
        message,
        sender,
        alertType,
        priority,
        isEmergencyBroadcast: isEmergency,
        timestamp: new Date().toISOString()
      });
    });
  }

  if (callbacks.onEmergencyBroadcast) {
    alertSystemContract.on('EmergencyAlertBroadcast', (message, emergencyVehicle, timestamp) => {
      callbacks.onEmergencyBroadcast({
        message,
        emergencyVehicle,
        timestamp: new Date(Number(timestamp) * 1000).toISOString()
      });
    });
  }
}

module.exports = {
  initializeBlockchain,
  setContractAddresses,
  registerVehicle,
  isVehicleRegistered,
  getVehicleCategory,
  isEmergencyVehicle,
  sendAlert,
  emergencyBroadcast,
  getAlerts,
  getAlertsByType,
  getEmergencyAlerts,
  getTotalAlertCount,
  setupEventListeners,
  isActiveEdgeServer,
  getEdgeServerInfo,
  getEdgeServerPerformanceScore,
  getEdgeServerAddress: () => edgeServerWallet?.address,
  isInitialized: () => !!(vehicleRegistryContract && alertSystemContract && edgeServerRegistryContract)
};
