/**
 * Decision Engine Service
 * Analyzes sensor data and determines if an alert should be sent
 */

const { ALERT_TYPE, ALERT_PRIORITY } = require('../constants');
const logger = require('../utils/logger');

/**
 * Analyze sensor data and make alert decision
 * Returns: { shouldAlert: boolean, alertType: number, priority: number, message: string }
 */
function analyzeAndDecide(sensorData) {
  try {
    const {
      speed,
      collision,
      visibility,
      temperature,
      gpsCoords,
      weatherCondition,
      roadCondition
    } = sensorData;

    // Priority 1: Critical - Immediate Danger
    if (collision === true) {
      return {
        shouldAlert: true,
        alertType: ALERT_TYPE.ACCIDENT,
        priority: ALERT_PRIORITY.CRITICAL,
        message: `COLLISION DETECTED - Emergency alert at GPS: (${gpsCoords?.lat}, ${gpsCoords?.lng})`
      };
    }

    // Priority 2: High - Environmental Hazards
    
    // Low Visibility
    if (visibility !== undefined && visibility < 50) {
      return {
        shouldAlert: true,
        alertType: ALERT_TYPE.HAZARD,
        priority: ALERT_PRIORITY.HIGH,
        message: `LOW VISIBILITY WARNING - Visibility: ${visibility}%. Exercise extreme caution.`
      };
    }

    // Extreme Cold (potential ice on road)
    if (temperature !== undefined && temperature < -5) {
      return {
        shouldAlert: true,
        alertType: ALERT_TYPE.HAZARD,
        priority: ALERT_PRIORITY.HIGH,
        message: `EXTREME COLD WARNING - Temperature: ${temperature}°C. Road may be icy.`
      };
    }

    // Extreme Heat (potential road damage)
    if (temperature !== undefined && temperature > 50) {
      return {
        shouldAlert: true,
        alertType: ALERT_TYPE.HAZARD,
        priority: ALERT_PRIORITY.MEDIUM,
        message: `EXTREME HEAT WARNING - Temperature: ${temperature}°C. Asphalt may be damaged.`
      };
    }

    // Weather Hazards
    if (weatherCondition) {
      if (weatherCondition === 'HEAVY_RAIN') {
        return {
          shouldAlert: true,
          alertType: ALERT_TYPE.HAZARD,
          priority: ALERT_PRIORITY.HIGH,
          message: 'HEAVY RAIN WARNING - Reduced visibility and slippery roads. Reduce speed.'
        };
      }

      if (weatherCondition === 'SNOW' || weatherCondition === 'ICE') {
        return {
          shouldAlert: true,
          alertType: ALERT_TYPE.HAZARD,
          priority: ALERT_PRIORITY.HIGH,
          message: `${weatherCondition} DETECTED - Road conditions deteriorated. Use caution.`
        };
      }

      if (weatherCondition === 'FOG') {
        return {
          shouldAlert: true,
          alertType: ALERT_TYPE.HAZARD,
          priority: ALERT_PRIORITY.MEDIUM,
          message: 'FOG DETECTED - Visibility severely reduced. Use headlights and reduce speed.'
        };
      }
    }

    // Road Conditions
    if (roadCondition) {
      if (roadCondition === 'POTHOLE' || roadCondition === 'DEBRIS') {
        return {
          shouldAlert: true,
          alertType: ALERT_TYPE.HAZARD,
          priority: ALERT_PRIORITY.MEDIUM,
          message: `ROAD HAZARD DETECTED - ${roadCondition} on road. Avoid if possible.`
        };
      }

      if (roadCondition === 'CONSTRUCTION') {
        return {
          shouldAlert: true,
          alertType: ALERT_TYPE.CONGESTION,
          priority: ALERT_PRIORITY.MEDIUM,
          message: 'CONSTRUCTION ZONE - Reduced lanes and speed limits in effect. Prepare to slow down.'
        };
      }
    }

    // Priority 3: Medium - Speed & Traffic Issues

    // Speeding (only for normal vehicles, not police/emergency)
    if (speed !== undefined && speed > 120) {
      return {
        shouldAlert: true,
        alertType: ALERT_TYPE.CONGESTION,
        priority: ALERT_PRIORITY.LOW,
        message: `EXCESSIVE SPEED DETECTED - ${speed} km/h. Reduce speed for safety.`
      };
    }

    // Normal conditions - No alert needed
    return {
      shouldAlert: false,
      alertType: null,
      priority: null,
      message: 'System monitoring - normal conditions detected'
    };

  } catch (error) {
    logger.error('Error in decision engine analysis', { error: error.message });
    return {
      shouldAlert: false,
      alertType: null,
      priority: null,
      message: 'Error analyzing sensor data',
      error: error.message
    };
  }
}

/**
 * Validate sensor data format
 */
function validateSensorData(sensorData) {
  const errors = [];

  if (sensorData.speed !== undefined && typeof sensorData.speed !== 'number') {
    errors.push('speed must be a number');
  }

  if (sensorData.collision !== undefined && typeof sensorData.collision !== 'boolean') {
    errors.push('collision must be a boolean');
  }

  if (sensorData.visibility !== undefined && typeof sensorData.visibility !== 'number') {
    errors.push('visibility must be a number (0-100)');
  }

  if (sensorData.temperature !== undefined && typeof sensorData.temperature !== 'number') {
    errors.push('temperature must be a number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  analyzeAndDecide,
  validateSensorData
};
