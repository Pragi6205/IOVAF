/**
 * Logger Utility
 * Writes logs to configured log directory and optionally to console
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = LOG_LEVELS[config.LOG_LEVEL] || LOG_LEVELS.info;
const LOG_DIR = config.LOG_DIR || 'logs';
const LOG_TO_FILE = typeof config.LOG_TO_FILE !== 'undefined' ? config.LOG_TO_FILE : true;

// Ensure log directory exists
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
  // ignore
}

const logFilePath = path.join(LOG_DIR, 'edge_server.log');

function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logString = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) logString += ` ${JSON.stringify(data)}`;
  return logString;
}

function writeToFile(line) {
  if (!LOG_TO_FILE) return;
  try {
    fs.appendFileSync(logFilePath, line + '\n');
  } catch (err) {
    // If cannot write to file, fallback to console
    console.error('[LOGGER] Failed to write to log file', err.message);
  }
}

module.exports = {
  error: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.error) {
      const line = formatLog('error', message, data);
      console.error(line);
      writeToFile(line);
    }
  },

  warn: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      const line = formatLog('warn', message, data);
      console.warn(line);
      writeToFile(line);
    }
  },

  info: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.info) {
      const line = formatLog('info', message, data);
      console.log(line);
      writeToFile(line);
    }
  },

  debug: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.debug) {
      const line = formatLog('debug', message, data);
      console.log(line);
      writeToFile(line);
    }
  }
};
