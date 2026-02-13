/**
 * Alert Routes
 * Endpoints for alert management and decision engine
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const decisionEngine = require('../services/decisionEngine');
const validation = require('../middleware/validation');
const logger = require('../utils/logger');
const { ALERT_TYPE_NAMES, ALERT_PRIORITY_NAMES, VEHICLE_CATEGORY_NAMES } = require('../constants');

/**
 * POST /api/alert/send
 * Send alert to blockchain
 * Body: { vehiclePrivateKey, alertMessage, alertType, priority }
 */
router.post('/api/alert/send', validation.validateAlertSend, async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { vehiclePrivateKey, alertMessage, alertType, priority } = req.body;

    const result = await blockchain.sendAlert(vehiclePrivateKey, alertMessage, alertType, priority);

    if (result.success) {
      res.json({
        message: 'Alert sent to blockchain successfully',
        alertMessage,
        alertType: ALERT_TYPE_NAMES[alertType],
        priority: ALERT_PRIORITY_NAMES[priority],
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error sending alert', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alert/emergency-broadcast
 * Send emergency broadcast (only emergency vehicles)
 * Body: { vehiclePrivateKey, alertMessage, alertType }
 */
router.post('/api/alert/emergency-broadcast', validation.validateEmergencyBroadcast, async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { vehiclePrivateKey, alertMessage, alertType } = req.body;

    // Verify it's an emergency vehicle
    // Note: In a real system, you'd derive the address from private key and check
    const result = await blockchain.emergencyBroadcast(vehiclePrivateKey, alertMessage, alertType);

    if (result.success) {
      res.json({
        message: 'Emergency broadcast sent successfully',
        alertMessage,
        alertType: ALERT_TYPE_NAMES[alertType],
        priority: 'CRITICAL',
        isEmergencyBroadcast: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error sending emergency broadcast', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alert/all
 * Get all alerts from blockchain
 */
router.get('/api/alert/all', async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const alerts = await blockchain.getAlerts();

    const formattedAlerts = alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: alert.timestamp,
      alertType: ALERT_TYPE_NAMES[alert.alertType],
      priority: ALERT_PRIORITY_NAMES[alert.priority],
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));

    res.json({
      totalAlerts: formattedAlerts.length,
      alerts: formattedAlerts
    });
  } catch (error) {
    logger.error('Error getting all alerts', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alert/by-type/:type
 * Get alerts by type
 * type: 0=ACCIDENT, 1=HAZARD, 2=CONGESTION, 3=EMERGENCY
 */
router.get('/api/alert/by-type/:type', async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const type = parseInt(req.params.type);

    if (isNaN(type) || type < 0 || type > 3) {
      return res.status(400).json({ error: 'Invalid alert type' });
    }

    const alerts = await blockchain.getAlertsByType(type);

    const formattedAlerts = alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: alert.timestamp,
      alertType: ALERT_TYPE_NAMES[alert.alertType],
      priority: ALERT_PRIORITY_NAMES[alert.priority],
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));

    res.json({
      alertType: ALERT_TYPE_NAMES[type],
      totalAlerts: formattedAlerts.length,
      alerts: formattedAlerts
    });
  } catch (error) {
    logger.error('Error getting alerts by type', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alert/emergency
 * Get all emergency broadcasts
 */
router.get('/api/alert/emergency', async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const alerts = await blockchain.getEmergencyAlerts();

    const formattedAlerts = alerts.map(alert => ({
      message: alert.message,
      sender: alert.sender,
      timestamp: alert.timestamp,
      alertType: ALERT_TYPE_NAMES[alert.alertType],
      priority: ALERT_PRIORITY_NAMES[alert.priority],
      isEmergencyBroadcast: alert.isEmergencyBroadcast
    }));

    res.json({
      emergencyAlertsOnly: true,
      totalAlerts: formattedAlerts.length,
      alerts: formattedAlerts
    });
  } catch (error) {
    logger.error('Error getting emergency alerts', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alert/process-sensor-data
 * Analyze sensor data and trigger alerts if needed
 * Body: { vehiclePrivateKey, sensorData, isEmergencyVehicle:false }
 */
router.post('/api/alert/process-sensor-data', validation.validateSensorData, async (req, res) => {
  try {
    if (!blockchain.isInitialized()) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { vehiclePrivateKey, sensorData, isEmergencyVehicle } = req.body;

    // Validate sensor data
    const validation_result = decisionEngine.validateSensorData(sensorData);
    if (!validation_result.valid) {
      return res.status(400).json({
        error: 'Invalid sensor data',
        details: validation_result.errors
      });
    }

    // Run decision engine
    const decision = decisionEngine.analyzeAndDecide(sensorData);

    if (decision.shouldAlert) {
      let result;

      // Use emergency broadcast if emergency vehicle
      if (isEmergencyVehicle) {
        result = await blockchain.emergencyBroadcast(
          vehiclePrivateKey,
          decision.message,
          decision.alertType
        );
      } else {
        result = await blockchain.sendAlert(
          vehiclePrivateKey,
          decision.message,
          decision.alertType,
          decision.priority
        );
      }

      res.json({
        processed: true,
        alert_triggered: true,
        alertType: ALERT_TYPE_NAMES[decision.alertType],
        priority: ALERT_PRIORITY_NAMES[decision.priority],
        message: decision.message,
        isEmergencyBroadcast: isEmergencyVehicle,
        blockchainResult: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        processed: true,
        alert_triggered: false,
        message: decision.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error processing sensor data', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
