/**
 * Configuration Management
 * Centralizes all environment and configuration settings
 */

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Blockchain Configuration
  GANACHE_RPC_URL: process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545',
  GANACHE_PRIVATE_KEY: process.env.GANACHE_PRIVATE_KEY,

  // Contract ABIs
  VEHICLE_REGISTRY_ABI: [
    "enum VehicleCategory { NORMAL_VEHICLE, EMERGENCY_VEHICLE }",
    "function registerVehicle(string memory _vehicleId, uint8 _category) public",
    "function isRegistered(address _vehicle) public view returns (bool)",
    "function getVehicleCategory(address _vehicle) public view returns (uint8)",
    "function isEmergencyVehicle(address _vehicle) public view returns (bool)",
    "function getTrustScore(address _vehicle) public view returns (uint)",
    "event VehicleRegistered(address indexed vehicleAddress, string vehicleId, uint8 category)",
    "event TrustScoreUpdated(address indexed vehicleAddress, uint newScore)"
  ],

  EDGE_SERVER_REGISTRY_ABI: [
    "function registerEdgeServer(string memory _serverId, address _serverAddress, string memory _location) public",
    "function isActiveEdgeServer(address _address) public view returns (bool)",
    "function getEdgeServerInfo(address _serverAddress) public view returns (string memory, bool, uint, string memory, uint8)",
    "function getPerformanceScore(address _serverAddress) public view returns (uint8)",
    "function updatePerformanceScore(address _serverAddress, uint8 _newScore) public",
    "function deactivateEdgeServer(address _serverAddress) public",
    "function reactivateEdgeServer(address _serverAddress) public",
    "function getEdgeServerCount() public view returns (uint)",
    "function getEdgeServerByIndex(uint _index) public view returns (address)",
    "event EdgeServerRegistered(address indexed serverAddress, string serverId, string location)",
    "event EdgeServerDeactivated(address indexed serverAddress)",
    "event EdgeServerActivated(address indexed serverAddress)",
    "event PerformanceScoreUpdated(address indexed serverAddress, uint8 newScore)"
  ],

  ALERT_SYSTEM_ABI: [
    "enum AlertType { ACCIDENT, HAZARD, CONGESTION, EMERGENCY }",
    "enum AlertPriority { LOW, MEDIUM, HIGH, CRITICAL }",
    "function sendAlert(string memory _message, uint8 _alertType, uint8 _priority) public",
    "function emergencyBroadcast(string memory _message, uint8 _alertType) public",
    "function relayAlert(string memory _message, uint8 _alertType, uint8 _priority, address _originVehicle) public",
    "function getAlerts() public view returns (tuple(string message, address sender, uint timestamp, uint8 alertType, uint8 priority, bool isEmergencyBroadcast)[])",
    "function getAlertsByType(uint8 _type) public view returns (tuple(string message, address sender, uint timestamp, uint8 alertType, uint8 priority, bool isEmergencyBroadcast)[])",
    "function getEmergencyAlerts() public view returns (tuple(string message, address sender, uint timestamp, uint8 alertType, uint8 priority, bool isEmergencyBroadcast)[])",
    "function getTotalAlertCount() public view returns (uint)",
    "event AlertSent(string message, address indexed sender, uint8 indexed alertType, uint8 priority, bool isEmergencyBroadcast)",
    "event EmergencyAlertBroadcast(string message, address indexed emergencyVehicle, uint timestamp)"
  ],

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Log directory and file output control
  LOG_DIR: process.env.LOG_DIR || 'logs',
  LOG_TO_FILE: process.env.LOG_TO_FILE ? process.env.LOG_TO_FILE === 'true' : true,

  // Validation
  MAX_MESSAGE_LENGTH: 500,
  VEHICLES_LOW_TRUST_THRESHOLD: 50
};
