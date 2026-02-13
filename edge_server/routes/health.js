/**
 * Health Routes
 * Endpoints for health checks and statistics
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const logger = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  try {
    res.json({
      status: 'running',
      edgeServerAddress: blockchain.getEdgeServerAddress(),
      contractsInitialized: blockchain.isInitialized(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in health endpoint', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats
 * Get server statistics
 */
router.get('/api/stats', async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const totalAlerts = await blockchain.getTotalAlertCount();
    const emergencyAlerts = await blockchain.getEmergencyAlerts();

    res.json({
      edgeServerAddress: blockchain.getEdgeServerAddress(),
      contractsInitialized: blockchain.isInitialized(),
      totalAlertsOnChain: totalAlerts,
      emergencyAlertsCount: emergencyAlerts.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
