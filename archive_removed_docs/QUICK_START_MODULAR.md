# Edge Server - Quick Start Guide (Modular Version)

## ✅ Prerequisites

- Node.js 16+ installed
- Ganache CLI running on port 7545
- Hardhat-deployed smart contracts with addresses

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd /mnt/drive/cap_proj/proj/edge_server
npm install
```

### 2. Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required in .env**:
```
PORT=3000
NODE_ENV=development
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_PRIVATE_KEY=0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f
```

### 3. Start Ganache
```bash
# In another terminal
ganache --accounts 10 --host 127.0.0.1
```

### 4. Deploy Smart Contracts
```bash
cd /mnt/drive/cap_proj/proj/blockchain
npx hardhat run scripts/deploy.js --network ganache
# Note the deployed contract addresses
```

### 5. Start Edge Server
```bash
cd /mnt/drive/cap_proj/proj/edge_server
npm start
# Server runs on http://localhost:3000
```

Check output for confirmation:
```
=== Edge Server Started ===
Port: 3000
Environment: development
Ganache RPC: http://127.0.0.1:7545
Edge Server Address: 0x...
```

## 📋 Initialize with Contract Addresses

```bash
curl -X POST http://localhost:3000/api/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "registryAddress": "0xDEPLOYED_REGISTRY_ADDRESS",
    "alertSystemAddress": "0xDEPLOYED_ALERTSYSTEM_ADDRESS",
    "edgeServerRegistryAddress": "0xDEPLOYED_EDGESERVERREGISTRY_ADDRESS"
  }'
```

Response:
```json
{
  "message": "Edge server initialized successfully",
  "edgeServerAddress": "0x...",
  "vehicleRegistryAddress": "0xDEPLOYED_REGISTRY_ADDRESS",
  "alertSystemAddress": "0xDEPLOYED_ALERTSYSTEM_ADDRESS",
  "edgeServerRegistryAddress": "0xDEPLOYED_EDGESERVERREGISTRY_ADDRESS"
}
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Vehicle Management

**Register a Normal Vehicle**:
```bash
curl -X POST http://localhost:3000/api/vehicle/register \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePrivateKey": "0x...",
    "vehicleId": "VEHICLE_001",
    "vehicleCategory": 0
  }'
```

**Register an Emergency Vehicle**:
```bash
curl -X POST http://localhost:3000/api/vehicle/register \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePrivateKey": "0x...",
    "vehicleId": "AMBULANCE_001",
    "vehicleCategory": 1
  }'
```

**Check Vehicle Status**:
```bash
GET /api/vehicle/check/0xVEHICLE_ADDRESS
```

### Alert Management

**Send Regular Alert**:
```bash
curl -X POST http://localhost:3000/api/alert/send \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePrivateKey": "0x...",
    "alertMessage": "Accident detected at intersection",
    "alertType": 0,
    "priority": 3
  }'
```

Alert Types:
- 0 = ACCIDENT
- 1 = HAZARD
- 2 = CONGESTION
- 3 = EMERGENCY

Priority Levels:
- 0 = LOW
- 1 = MEDIUM
- 2 = HIGH
- 3 = CRITICAL

**Emergency Broadcast** (Emergency Vehicles Only):
```bash
curl -X POST http://localhost:3000/api/alert/emergency-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePrivateKey": "0x...",
    "alertMessage": "Emergency vehicle en route",
    "alertType": 3
  }'
```

**Process Sensor Data** (Automatic Alert):
```bash
curl -X POST http://localhost:3000/api/alert/process-sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePrivateKey": "0x...",
    "isEmergencyVehicle": false,
    "sensorData": {
      "speed": 65,
      "collision": false,
      "visibility": 85,
      "temperature": 22,
      "weatherCondition": null,
      "roadCondition": null,
      "gpsCoords": { "lat": 40.7128, "lng": -74.0060 }
    }
  }'
```

Decision Engine will trigger alerts for:
- **collision = true** → ACCIDENT (CRITICAL)
- **visibility < 50** → HAZARD (HIGH)
- **temperature < -5°C** → HAZARD (HIGH)
- **temperature > 50°C** → HAZARD (MEDIUM)
- **speed > 120 km/h** → CONGESTION (LOW)
- **weatherCondition = HEAVY_RAIN** → HAZARD (HIGH)
- **weatherCondition = SNOW/ICE** → HAZARD (HIGH)
- **weatherCondition = FOG** → HAZARD (MEDIUM)

**Get All Alerts**:
```bash
GET /api/alert/all
```

**Get Alerts by Type**:
```bash
GET /api/alert/by-type/0  # 0=ACCIDENT, 1=HAZARD, 2=CONGESTION, 3=EMERGENCY
```

**Get Emergency Broadcasts**:
```bash
GET /api/alert/emergency
```

### Statistics
```bash
GET /api/stats
```

## 🏗️ Modular Architecture

The refactored server is organized into:

```
edge_server/
├── index.js                    # Main app entry
├── constants.js               # Enums (VEHICLE_CATEGORY, ALERT_TYPE, etc.)
├── config/config.js           # Configuration
├── services/
│   ├── blockchain.js          # Blockchain operations
│   └── decisionEngine.js       # Sensor analysis
├── routes/
│   ├── health.js             # Health checks
│   ├── vehicles.js           # Vehicle endpoints
│   └── alerts.js             # Alert endpoints
├── middleware/
│   └── validation.js         # Input validation
└── utils/
    └── logger.js             # Logging
```

See [MODULAR_ARCHITECTURE.md](./MODULAR_ARCHITECTURE.md) for detailed documentation.

## 🧪 Testing

```bash
# Run demo test script
bash test_demo.sh

# Or test with curl
curl http://localhost:3000/health
```

## 🔧 Configuration

Edit `config/config.js` to customize:
- Port
- RPC URL
- Private key
- Contract ABIs
- Trust thresholds
- Message length limits

## 📝 Logging

Logs are controlled by `LOG_LEVEL` env var:
- `debug` - Detailed output
- `info` - Standard output
- `warn` - Warnings only
- `error` - Errors only

Example:
```bash
LOG_LEVEL=debug npm start
```

## 🚨 Troubleshooting

**Error: "Contracts not initialized"**
- Ensure `/api/initialize` was called with correct addresses
- Check contract addresses are deployed and correct

**Error: "Only emergency vehicles"**
- Vehicle must be registered with category 1 (EMERGENCY_VEHICLE)

**Error: "Connection refused"**
- Ensure Ganache is running on port 7545
- Check GANACHE_RPC_URL in .env

**Error: "Invalid Ethereum address"**
- Check address format (must be 0x + 40 hex chars)

## 📚 Additional Resources

- [MODULAR_ARCHITECTURE.md](./MODULAR_ARCHITECTURE.md) - Detailed module documentation
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Advanced configuration
- [../blockchain/README.md](../blockchain/README.md) - Smart contract documentation

## 🎯 Next Steps

1. Register test vehicles with different categories
2. Send alerts from normal vehicles
3. Test emergency broadcast from emergency vehicles
4. Process sensor data to trigger automatic alerts
5. Monitor blockchain with AlertSystem contract
