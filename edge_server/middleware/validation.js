/**
 * Input Validation Middleware
 */

const logger = require('../utils/logger');

// Validate Ethereum address format
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Validate private key format
function isValidPrivateKey(privateKey) {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

// Validate message length
function isValidMessage(message, maxLength = 500) {
  return message && typeof message === 'string' && message.length > 0 && message.length <= maxLength;
}

// Middleware: Validate initialization
function validateInitialization(req, res, next) {
  // You can add this check if contracts must be initialized
  // For now, just pass through
  next();
}

// Middleware: Validate vehicle registration request
function validateVehicleRegistration(req, res, next) {
  const { vehiclePrivateKey, vehicleId, vehicleCategory } = req.body;

  if (!vehiclePrivateKey || !isValidPrivateKey(vehiclePrivateKey)) {
    logger.warn('Invalid vehicle private key format');
    return res.status(400).json({
      error: 'Invalid vehiclePrivateKey format (must be 0x + 64 hex chars)'
    });
  }

  if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.length === 0) {
    logger.warn('Invalid vehicle ID');
    return res.status(400).json({
      error: 'Invalid vehicleId (must be non-empty string)'
    });
  }

  if (vehicleCategory === undefined || vehicleCategory < 0 || vehicleCategory > 1) {
    logger.warn('Invalid vehicle category');
    return res.status(400).json({
      error: 'Invalid vehicleCategory (must be 0=NORMAL_VEHICLE, 1=EMERGENCY_VEHICLE)'
    });
  }

  next();
}

// Middleware: Validate alert sending request
function validateAlertSend(req, res, next) {
  const { vehiclePrivateKey, alertMessage, alertType, priority } = req.body;

  if (!vehiclePrivateKey || !isValidPrivateKey(vehiclePrivateKey)) {
    logger.warn('Invalid vehicle private key format in alert');
    return res.status(400).json({
      error: 'Invalid vehiclePrivateKey format'
    });
  }

  if (!isValidMessage(alertMessage)) {
    logger.warn('Invalid alert message');
    return res.status(400).json({
      error: 'Invalid alertMessage (must be 1-500 characters)'
    });
  }

  if (alertType === undefined || alertType < 0 || alertType > 3) {
    logger.warn('Invalid alert type');
    return res.status(400).json({
      error: 'Invalid alertType (0=ACCIDENT, 1=HAZARD, 2=CONGESTION, 3=EMERGENCY)'
    });
  }

  if (priority === undefined || priority < 0 || priority > 3) {
    logger.warn('Invalid priority');
    return res.status(400).json({
      error: 'Invalid priority (0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL)'
    });
  }

  next();
}

// Middleware: Validate emergency broadcast request
function validateEmergencyBroadcast(req, res, next) {
  const { vehiclePrivateKey, alertMessage, alertType } = req.body;

  if (!vehiclePrivateKey || !isValidPrivateKey(vehiclePrivateKey)) {
    logger.warn('Invalid vehicle private key in emergency broadcast');
    return res.status(400).json({
      error: 'Invalid vehiclePrivateKey format'
    });
  }

  if (!isValidMessage(alertMessage)) {
    logger.warn('Invalid emergency message');
    return res.status(400).json({
      error: 'Invalid alertMessage (must be 1-500 characters)'
    });
  }

  if (alertType === undefined || alertType < 0 || alertType > 3) {
    logger.warn('Invalid alert type in emergency broadcast');
    return res.status(400).json({
      error: 'Invalid alertType'
    });
  }

  next();
}

// Middleware: Validate sensor data request
function validateSensorData(req, res, next) {
  const { vehiclePrivateKey, sensorData } = req.body;

  if (!vehiclePrivateKey || !isValidPrivateKey(vehiclePrivateKey)) {
    logger.warn('Invalid private key in sensor data');
    return res.status(400).json({
      error: 'Invalid vehiclePrivateKey format'
    });
  }

  if (!sensorData || typeof sensorData !== 'object') {
    logger.warn('Invalid sensor data');
    return res.status(400).json({
      error: 'sensorData must be an object'
    });
  }

  next();
}

// Middleware: Validate initialize request
function validateInitializeRequest(req, res, next) {
  const { registryAddress, alertSystemAddress, edgeServerRegistryAddress } = req.body;

  if (!registryAddress || !isValidAddress(registryAddress)) {
    logger.warn('Invalid registry address');
    return res.status(400).json({
      error: 'Invalid registryAddress format (must be 0x + 40 hex chars)'
    });
  }

  if (!alertSystemAddress || !isValidAddress(alertSystemAddress)) {
    logger.warn('Invalid alert system address');
    return res.status(400).json({
      error: 'Invalid alertSystemAddress format (must be 0x + 40 hex chars)'
    });
  }

  if (!edgeServerRegistryAddress || !isValidAddress(edgeServerRegistryAddress)) {
    logger.warn('Invalid edge server registry address');
    return res.status(400).json({
      error: 'Invalid edgeServerRegistryAddress format (must be 0x + 40 hex chars)'
    });
  }

  next();
}

module.exports = {
  isValidAddress,
  isValidPrivateKey,
  isValidMessage,
  validateInitialization,
  validateVehicleRegistration,
  validateAlertSend,
  validateEmergencyBroadcast,
  validateSensorData,
  validateInitializeRequest
};
