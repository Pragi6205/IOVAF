/**
 * Edge Server Main Entry Point
 * IoV (Internet of Vehicles) Edge Server with Blockchain Integration
 * 
 * Modular Architecture:
 * - services/blockchain.js: Blockchain interactions via ethers.js
 * - services/decisionEngine.js: Sensor data analysis and alert logic
 * - routes/vehicles.js: Vehicle registration and status endpoints
 * - routes/alerts.js: Alert creation and retrieval endpoints
 * - routes/health.js: Health checks and statistics
 * - middleware/validation.js: Input validation
 * - config/config.js: Configuration management
 * - constants.js: Enums for vehicle categories and alert types
 * - utils/logger.js: Logging utility
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const logger = require('./utils/logger');
const blockchain = require('./services/blockchain');

// Import routes
const vehicleRoutes = require('./routes/vehicles');
const alertRoutes = require('./routes/alerts');
const healthRoutes = require('./routes/health');

const app = express();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */

// Health and Statistics
app.use('/', healthRoutes);

// Vehicle Management
app.use('/', vehicleRoutes);

// Alert Management
app.use('/', alertRoutes);

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Start Server
 */
async function startServer() {
  try {
    // Initialize blockchain connection
    const blockchainReady = await blockchain.initializeBlockchain();
    
    if (!blockchainReady) {
      logger.error('Failed to initialize blockchain connection');
      process.exit(1);
    }

    // Start Express server
    const server = app.listen(config.PORT, () => {
      logger.info(`=== Edge Server Started ===`);
      logger.info(`Port: ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Ganache RPC: ${config.GANACHE_RPC_URL}`);
      logger.info(`Edge Server Address: ${blockchain.getEdgeServerAddress()}`);
      logger.info(`\nAPI Endpoints:`);
      logger.info(`  Health: GET /health`);
      logger.info(`  Initialize: POST /api/initialize`);
      logger.info(`  Register Vehicle: POST /api/vehicle/register`);
      logger.info(`  Check Vehicle: GET /api/vehicle/check/:address`);
      logger.info(`  Send Alert: POST /api/alert/send`);
      logger.info(`  Emergency Broadcast: POST /api/alert/emergency-broadcast`);
      logger.info(`  Get All Alerts: GET /api/alert/all`);
      logger.info(`  Get Alerts by Type: GET /api/alert/by-type/:type`);
      logger.info(`  Get Emergency Alerts: GET /api/alert/emergency`);
      logger.info(`  Process Sensor Data: POST /api/alert/process-sensor-data`);
      logger.info(`  Statistics: GET /api/stats`);
      logger.info(`=====================================\n`);
    });

    // Auto-initialize contracts from environment if provided
    try {
      const registryAddr = process.env.VEHICLE_REGISTRY_ADDRESS || process.env.REGISTRY_ADDRESS;
      const alertAddr = process.env.ALERT_SYSTEM_ADDRESS || process.env.ALERT_ADDRESS;
      const edgeServerRegistryAddr = process.env.EDGE_SERVER_REGISTRY_ADDRESS || process.env.EDGE_REGISTRY_ADDRESS;

      if (registryAddr && alertAddr && edgeServerRegistryAddr) {
        const ok = blockchain.setContractAddresses(registryAddr, alertAddr, edgeServerRegistryAddr);
        if (ok) {
          logger.info('Contracts auto-initialized from environment variables');
        } else {
          logger.warn('Contracts present in env but failed to initialize');
        }
      } else {
        logger.info('Contract addresses not provided in environment; /api/initialize still available');
      }
    } catch (e) {
      logger.error('Error during auto-initialization', { error: e.message });
    }
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();

module.exports = app;
