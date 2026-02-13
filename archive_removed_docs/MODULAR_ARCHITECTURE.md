# Modular Edge Server Architecture

## Overview

The Edge Server has been refactored from a monolithic 500+ line file into a clean, modular architecture following the **Single Responsibility Principle**. Each module has a specific purpose and can be independently tested and maintained.

## Directory Structure

```
edge_server/
├── index.js                    # Main Express application (entry point)
├── constants.js               # Enums and constants (VEHICLE_CATEGORY, ALERT_TYPE, etc.)
├── package.json               # Dependencies
├── .env                        # Environment configuration
├── .env.example               # Example environment variables
│
├── config/
│   └── config.js              # Centralized configuration management
│
├── services/
│   ├── blockchain.js          # Blockchain interactions (ethers.js wrapper)
│   └── decisionEngine.js       # Sensor data analysis and alert logic
│
├── routes/
│   ├── health.js              # Health checks and statistics
│   ├── vehicles.js            # Vehicle registration and status endpoints
│   └── alerts.js              # Alert management endpoints
│
├── middleware/
│   └── validation.js           # Input validation for all endpoints
│
└── utils/
    └── logger.js              # Logging utility with log levels
```

## Module Descriptions

### Core Modules

#### `index.js` - Main Application (73 lines)
**Purpose**: Express server bootstrapping and route registration

**Responsibilities**:
- Initialize blockchain connection
- Register route handlers
- Setup error handling middleware
- Start HTTP server with graceful shutdown
- Log startup configuration

**Dependencies**: All route modules, blockchain service, config

---

#### `constants.js` - Enums and Constants (47 lines)
**Purpose**: Centralized definition of enums used throughout the application

**Exports**:
- `VEHICLE_CATEGORY` - Maps vehicle types: NORMAL_VEHICLE(0), EMERGENCY_VEHICLE(1), RSU(2)
- `VEHICLE_CATEGORY_NAMES` - Human-readable category names
- `ALERT_TYPE` - Maps alert types: ACCIDENT(0), HAZARD(1), CONGESTION(2), EMERGENCY(3)
- `ALERT_TYPE_NAMES` - Human-readable alert type names
- `ALERT_PRIORITY` - Maps priority levels: LOW(0), MEDIUM(1), HIGH(2), CRITICAL(3)
- `ALERT_PRIORITY_NAMES` - Human-readable priority names

**Usage**: All services and routes import these constants for type-safe operations

---

### Configuration Modules

#### `config/config.js` - Configuration Management (65 lines)
**Purpose**: Centralized environment and application configuration

**Exports**:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `GANACHE_RPC_URL` - Blockchain RPC endpoint
- `GANACHE_PRIVATE_KEY` - Edge server's private key
- `VEHICLE_REGISTRY_ABI` - Contract ABI for VehicleRegistry
- `ALERT_SYSTEM_ABI` - Contract ABI for AlertSystem
- `LOG_LEVEL` - Logging verbosity
- `MAX_MESSAGE_LENGTH` - Maximum alert message size
- `VEHICLES_LOW_TRUST_THRESHOLD` - Trust score threshold for vehicle access

**Benefits**:
- All environment variables in one place
- Easy to switch between development and production
- ABIs centralized for maintainability

---

#### `utils/logger.js` - Logging Utility (60 lines)
**Purpose**: Consistent logging across all modules

**Methods**:
- `logger.error(message, data)` - Error level logs
- `logger.warn(message, data)` - Warning level logs
- `logger.info(message, data)` - Info level logs
- `logger.debug(message, data)` - Debug level logs

**Features**:
- Log level filtering (controlled by `LOG_LEVEL` env var)
- ISO timestamp formatting
- Automatic JSON serialization for complex objects

**Usage**: `const logger = require('../utils/logger'); logger.info('Message');`

---

### Service Modules

#### `services/blockchain.js` - Blockchain Integration (280 lines)
**Purpose**: All interactions with Ethereum blockchain via ethers.js

**Key Functions**:
- `initializeBlockchain()` - Connect to Ganache, create wallet
- `setContractAddresses(registryAddr, alertAddr)` - Initialize contract instances
- `registerVehicle(vehiclePrivateKey, vehicleId, vehicleCategory)` - Register vehicle on chain
- `isVehicleRegistered(address)` - Check registration status
- `getVehicleCategory(address)` - Retrieve vehicle category
- `isEmergencyVehicle(address)` - Check if emergency vehicle
- `sendAlert(vehiclePrivateKey, message, alertType, priority)` - Send alert
- `emergencyBroadcast(vehiclePrivateKey, message, alertType)` - Emergency broadcast (CRITICAL priority auto-set)
- `getAlerts()` - Retrieve all alerts
- `getAlertsByType(alertType)` - Filter alerts by type
- `getEmergencyAlerts()` - Get only emergency broadcasts
- `getTotalAlertCount()` - Get total alert count
- `setupEventListeners(callbacks)` - Listen to blockchain events

**Features**:
- Wallet-based signing for different vehicles
- Error handling and logging
- Event listener setup for real-time updates
- Returns formatted timestamps and human-readable data

**Dependencies**: ethers.js, config, logger, constants

---

#### `services/decisionEngine.js` - Alert Decision Logic (170 lines)
**Purpose**: Analyze sensor data and decide if alerts should be triggered

**Key Functions**:
- `analyzeAndDecide(sensorData)` - Core decision engine
  - Returns: `{ shouldAlert: bool, alertType: number, priority: number, message: string }`
  
- `validateSensorData(sensorData)` - Input validation
  - Returns: `{ valid: bool, errors: [] }`

**Alert Triggers**:
1. **CRITICAL (Collision)**: `collision === true` → ACCIDENT alert
2. **HIGH (Environmental Hazards)**:
   - `visibility < 50%` → HAZARD alert
   - `temperature < -5°C` → HAZARD alert (ice warning)
   - `temperature > 50°C` → HAZARD alert (asphalt damage)
   - `weatherCondition === 'HEAVY_RAIN'` → HAZARD alert
   - `weatherCondition === 'SNOW' || 'ICE'` → HAZARD alert
   - `weatherCondition === 'FOG'` → HAZARD alert (medium priority)

3. **MEDIUM (Road Conditions)**:
   - `roadCondition === 'POTHOLE' || 'DEBRIS'` → HAZARD alert
   - `roadCondition === 'CONSTRUCTION'` → CONGESTION alert

4. **LOW (Speed)**:
   - `speed > 120 km/h` → CONGESTION alert

**Dependencies**: logger, constants

---

### Route Modules

#### `routes/health.js` - Health & Statistics (50 lines)
**Endpoints**:
- `GET /health` - Basic health check
  - Returns: `{ status, edgeServerAddress, contractsInitialized, timestamp }`
  
- `GET /api/stats` - Server statistics
  - Returns: Total alerts, emergency alerts count, uptime

**Dependencies**: blockchain, logger

---

#### `routes/vehicles.js` - Vehicle Management (150 lines)
**Endpoints**:
1. **Initialize**: `POST /api/initialize`
   - Body: `{ registryAddress, alertSystemAddress }`
   - Sets up contract instances

2. **Register Vehicle**: `POST /api/vehicle/register`
   - Body: `{ vehiclePrivateKey, vehicleId, vehicleCategory }`
   - vehicleCategory: 0=NORMAL_VEHICLE, 1=EMERGENCY_VEHICLE, 2=RSU
   - Returns: Transaction hash and block number

3. **Check Vehicle**: `GET /api/vehicle/check/:address`
   - Verifies registration status
   - Returns: Category and emergency status

**Dependencies**: blockchain, validation, logger, constants

---

#### `routes/alerts.js` - Alert Management (300+ lines)
**Endpoints**:
1. **Send Alert**: `POST /api/alert/send`
   - Body: `{ vehiclePrivateKey, alertMessage, alertType, priority }`
   - Standard alert with validation of trust score

2. **Emergency Broadcast**: `POST /api/alert/emergency-broadcast`
   - Body: `{ vehiclePrivateKey, alertMessage, alertType }`
   - Exclusive to emergency vehicles, auto-CRITICAL priority

3. **Get All Alerts**: `GET /api/alert/all`
   - Returns all alerts from blockchain

4. **Get by Type**: `GET /api/alert/by-type/:type`
   - Filter by alert type (0-3)

5. **Get Emergency**: `GET /api/alert/emergency`
   - Only emergency broadcasts

6. **Process Sensor Data**: `POST /api/alert/process-sensor-data`
   - Body: `{ vehiclePrivateKey, sensorData, isEmergencyVehicle: bool }`
   - Runs decision engine, validates sensor data, sends alert if needed

**Features**:
- Real-name enum conversion (0 → "ACCIDENT")
- Automatic alert triggering based on sensor analysis
- Emergency vehicle fast-track with CRITICAL priority auto-set

**Dependencies**: blockchain, decisionEngine, validation, logger, constants

---

### Middleware Modules

#### `middleware/validation.js` - Input Validation (200 lines)
**Utility Functions**:
- `isValidAddress(address)` - Validates Ethereum addresses
- `isValidPrivateKey(key)` - Validates private key format
- `isValidMessage(message, maxLength)` - Validates message content

**Middleware Functions**:
- `validateVehicleRegistration` - Validates vehicle registration requests
- `validateAlertSend` - Validates alert sending requests
- `validateEmergencyBroadcast` - Validates emergency broadcast requests
- `validateSensorData` - Validates sensor data format
- `validateInitializeRequest` - Validates initialization requests

**Benefits**:
- Centralized validation logic
- Consistent error messages
- Early request rejection before blockchain operations

**Dependencies**: logger

---

## Data Flow Examples

### Example 1: Vehicle Registration
```
Client Request
    ↓
POST /api/vehicle/register
    ↓
routes/vehicles.js → validateVehicleRegistration middleware
    ↓
services/blockchain.js → registerVehicle()
    ↓
ethers.js → Ganache RPC
    ↓
VehicleRegistry Smart Contract
    ↓
Response with tx hash
```

### Example 2: Sensor Data Processing & Auto-Alert
```
Client Request with sensor data
    ↓
POST /api/alert/process-sensor-data
    ↓
validateSensorData middleware
    ↓
services/decisionEngine.js → analyzeAndDecide()
    ↓
    ├─ No alert needed? → Return 200 with alert_triggered: false
    │
    └─ Alert needed! → Determine alertType and priority
        ↓
        services/blockchain.js → sendAlert() or emergencyBroadcast()
        ↓
        ethers.js → Ganache RPC
        ↓
        AlertSystem Smart Contract
        ↓
        Response with tx hash
```

### Example 3: Emergency Vehicle Broadcasting
```
Emergency Vehicle Request
    ↓
POST /api/alert/emergency-broadcast
    ↓
validateEmergencyBroadcast middleware
    ↓
services/blockchain.js → emergencyBroadcast()
    ↓
ethers.js → Ganache RPC
    ↓
AlertSystem.emergencyBroadcast() (smart contract)
    ├─ Only EMERGENCY_VEHICLE vehicles allowed
    └─ Auto-sets priority to CRITICAL
    ↓
EmergencyAlertBroadcast event
    ↓
Response with isEmergencyBroadcast: true
```

## Design Patterns Used

### 1. **Module Pattern**
Each file is a self-contained module with clear exports. Example:
```javascript
module.exports = {
  analyzeAndDecide,
  validateSensorData
};
```

### 2. **Service Layer Pattern**
Business logic (blockchain, decision engine) separated from HTTP layer (routes).

### 3. **Middleware Pipeline**
Validation happens before route handlers via Express middleware.

### 4. **Configuration Management**
All config in one place for easy environment switching.

### 5. **Error Handling**
Try-catch blocks in all async operations with consistent logging and error responses.

## Testing Individual Modules

Each module can be tested independently:

```bash
# Test blockchain service
node -e "const bc = require('./services/blockchain'); console.log(bc);"

# Test decision engine
node -e "const de = require('./services/decisionEngine'); const result = de.analyzeAndDecide({collision: true}); console.log(result);"

# Test constants
node -e "const c = require('./constants'); console.log(c.ALERT_TYPE_NAMES);"
```

## Extensibility

### Adding a New Route Module
1. Create `routes/newfeature.js`
2. Import needed services
3. Define routes
4. Export router
5. Import in `index.js` and register with `app.use()`

### Adding New Decision Engine Rules
Edit `services/decisionEngine.js` → `analyzeAndDecide()` function

### Adding Validation
Add function to `middleware/validation.js` and use in routes

### Adding Configuration
Add to `config/config.js`

## Performance Considerations

1. **Circular Buffer**: AlertSystem uses recent alerts buffer for O(1) access
2. **Lazy Initialization**: Contracts only initialized when `/api/initialize` called
3. **Event Listeners**: Optional setup for real-time updates without polling
4. **Validation Early**: Invalid requests rejected before blockchain operations

## Security Notes

- Private keys managed through environment variables
- Address validation on all endpoints
- Trust-based access control (low trust vehicles restricted)
- Category-based permissions (only emergency vehicles can broadcast)

## Logs

All modules use the centralized logger which outputs:
```
[2024-01-15T10:30:45.123Z] [INFO] Server started
[2024-01-15T10:30:46.234Z] [ERROR] Failed to connect: Connection refused
```

## Migration from Monolithic to Modular

The refactoring preserved all functionality:
- ✅ 9 API endpoints → Now in 3 route modules
- ✅ Decision engine logic → Separated into decisionEngine.js
- ✅ Blockchain operations → Encapsulated in blockchain.js
- ✅ Configuration → Centralized in config/config.js
- ✅ Validation → Middleware layer
- ✅ All features working identically

## Next Steps

1. **Testing**: Write unit tests for each service
2. **Documentation**: API documentation with examples
3. **Monitoring**: Add metrics collection
4. **Logging**: Enhance with structured logging to file
