/**
 * Vehicle Routes
 * Endpoints for vehicle management
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const validation = require('../middleware/validation');
const logger = require('../utils/logger');
const { VEHICLE_CATEGORY_NAMES } = require('../constants');

/**
 * POST /api/initialize
 * Initialize edge server with contract addresses
 */
router.post('/api/initialize', validation.validateInitializeRequest, (req, res) => {
  try {
    const { registryAddress, alertSystemAddress, edgeServerRegistryAddress } = req.body;

    const success = blockchain.setContractAddresses(registryAddress, alertSystemAddress, edgeServerRegistryAddress);

    if (success) {
      res.json({
        message: 'Edge server initialized successfully',
        edgeServerAddress: blockchain.getEdgeServerAddress(),
        vehicleRegistryAddress: registryAddress,
        alertSystemAddress: alertSystemAddress,
        edgeServerRegistryAddress: edgeServerRegistryAddress,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ error: 'Failed to initialize contracts' });
    }
  } catch (error) {
    logger.error('Error initializing edge server', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vehicle/register
 * Register a vehicle on blockchain
 * Body: { vehiclePrivateKey, vehicleId, vehicleCategory }
 * vehicleCategory: 0=NORMAL_VEHICLE, 1=EMERGENCY_VEHICLE, 2=RSU
 */
router.post('/api/vehicle/register', validation.validateVehicleRegistration, async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { vehiclePrivateKey, vehicleId, vehicleCategory } = req.body;

    const result = await blockchain.registerVehicle(vehiclePrivateKey, vehicleId, vehicleCategory);

    if (result.success) {
      res.json({
        message: 'Vehicle registered successfully',
        vehicleId,
        vehicleCategory: VEHICLE_CATEGORY_NAMES[vehicleCategory],
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error registering vehicle', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vehicle/check/:address
 * Check if vehicle is registered
 */
router.get('/api/vehicle/check/:address', async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { address } = req.params;

    if (!validation.isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    const isRegistered = await blockchain.isVehicleRegistered(address);
    let category = null;
    let isEmergency = false;

    if (isRegistered) {
      const catNum = await blockchain.getVehicleCategory(address);
      category = VEHICLE_CATEGORY_NAMES[catNum];
      isEmergency = await blockchain.isEmergencyVehicle(address);
    }

    res.json({
      vehicleAddress: address,
      isRegistered,
      category: isRegistered ? category : null,
      isEmergencyVehicle: isEmergency
    });
  } catch (error) {
    logger.error('Error checking vehicle', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
