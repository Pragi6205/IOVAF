# Edge Server - IoV Blockchain Interface

A Node.js server that acts as an interface between On-Board Units (OBUs) and the blockchain network. This edge server processes sensor data, applies decision logic, and triggers blockchain alerts.

## Architecture

```
Vehicles/OBUs
    ↓
    (Sensor Data)
    ↓
Edge Server (This) ← Interface Layer
    ↓
    (Blockchain Calls)
    ↓
Smart Contracts (VehicleRegistry, AlertSystem)
    ↓
Blockchain Network (Ganache/Ethereum)
```

## Features

- ✅ **Vehicle Registration**: Register OBUs on the blockchain
- ✅ **Alert Broadcasting**: Send real-time alerts to blockchain
- ✅ **Sensor Data Processing**: Edge decision engine for alert generation
- ✅ **Event Listening**: Real-time alert event streaming (Server-Sent Events)
- ✅ **Multi-Instance Deployment**: Deploy multiple servers on consecutive ports
- ✅ **Health Monitoring**: Built-in health check endpoints

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Ganache running on `http://127.0.0.1:7545` (or configured in `.env`)
- Deployed smart contracts (VehicleRegistry, AlertSystem)

### Setup

```bash
cd edge_server
npm install
```

### Configuration

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

**`.env` file:**
```
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_PRIVATE_KEY=0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f
PORT=3000
```

## Running the Server

### Single Instance

```bash
# Default port 3000
npm start

# Custom port
PORT=8000 npm start

# Or pass port as argument
node index.js 3000
```

### Multiple Instances (Recommended)

Use the Python deployment script:

```bash
# Deploy 3 instances on ports 3000, 3001, 3002
python deploy_edge_servers.py 3

# Deploy 5 instances starting at port 8000
python deploy_edge_servers.py 5 --start-port 8000

# Default start port is 3000
```

## API Endpoints

### 1. Health Check
```bash
GET /health
```
**Response:**
```json
{
  "status": "running",
  "edgeServerAddress": "0x...",
  "ganacheRPC": "http://127.0.0.1:7545",
  "contractsInitialized": true
}
```

### 2. Initialize Edge Server (REQUIRED FIRST)
```bash
POST /api/initialize
Content-Type: application/json

{
  "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
  "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
}
```

**Response:**
```json
{
  "message": "Edge server initialized with contracts",
  "edgeServerAddress": "0x...",
  "vehicleRegistryAddress": "0x...",
  "alertSystemAddress": "0x..."
}
```

> **Note**: Get these addresses from contract deployment output

### 3. Register Vehicle on Blockchain
```bash
POST /api/vehicle/register
Content-Type: application/json

{
  "vehicleAddress": "0x1234567890123456789012345678901234567890",
  "vehicleId": "VEHICLE_001"
}
```

**Response:**
```json
{
  "message": "Vehicle registered successfully",
  "vehicleId": "VEHICLE_001",
  "transactionHash": "0x...",
  "blockNumber": 5
}
```

### 4. Check if Vehicle is Registered
```bash
GET /api/vehicle/check/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "vehicleAddress": "0x...",
  "isRegistered": true
}
```

### 5. Send Alert to Blockchain ⭐ (Core Function)
```bash
POST /api/alert/send
Content-Type: application/json

{
  "vehiclePrivateKey": "0x...",
  "alertMessage": "Accident detected at coordinates (40.7128, -74.0060)",
  "alertType": "accident"
}
```

**Response:**
```json
{
  "message": "Alert sent to blockchain successfully",
  "vehicleAddress": "0x...",
  "alertMessage": "Accident detected at coordinates (40.7128, -74.0060)",
  "alertType": "accident",
  "transactionHash": "0x...",
  "blockNumber": 8,
  "timestamp": "2026-02-13T10:30:45.123Z"
}
```

**Supported Alert Types:**
- `accident` - Collision/crash detected
- `congestion` - Traffic congestion
- `hazard` - Road hazard
- `emergency` - Emergency vehicle
- `speeding` - Speed violation

### 6. Process Sensor Data (Decision Engine)
```bash
POST /api/process/sensor-data
Content-Type: application/json

{
  "vehiclePrivateKey": "0x...",
  "sensorData": {
    "speed": 150,
    "collision": false,
    "visibility": 10,
    "temperature": -10,
    "gpsCoords": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

**Response:**
```json
{
  "processed": true,
  "alert_triggered": true,
  "alertType": "hazard",
  "message": "Extreme cold detected: -10°C - Road may be icy",
  "transactionHash": "0x...",
  "blockNumber": 9
}
```

**Decision Rules (Decision Engine Logic):**
- **Collision**: `collision === true` → Alert type: `accident`
- **Low Visibility**: `visibility < 50%` → Alert type: `hazard`
- **Extreme Cold**: `temperature < -5°C` → Alert type: `hazard`
- **Speeding**: `speed > 120 km/h` → Alert type: `speeding`
- **No Alert**: Otherwise → No blockchain call

### 7. Get All Alerts from Blockchain
```bash
GET /api/alert/all
```

**Response:**
```json
{
  "totalAlerts": 3,
  "alerts": [
    {
      "message": "[ACCIDENT] Accident detected",
      "sender": "0x...",
      "timestamp": "2026-02-13T10:30:45.000Z",
      "blockTimestamp": 1739376645
    }
  ]
}
```

### 8. Listen to Real-Time Alerts (Server-Sent Events)
```bash
GET /api/alert/events
```

**Usage (JavaScript):**
```javascript
const eventSource = new EventSource('http://localhost:3000/api/alert/events');
eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log('New alert:', alert);
};
```

### 9. Get Edge Server Statistics
```bash
GET /api/stats
```

**Response:**
```json
{
  "edgeServerAddress": "0x...",
  "blockchainNetwork": "Ganache",
  "currentBlockNumber": 15,
  "vehicleRegistryAddress": "0x...",
  "alertSystemAddress": "0x...",
  "totalAlertsOnChain": 5,
  "uptime": 3600.5
}
```

## Workflow Examples

### Example 1: Basic Setup and Alert Flow

```bash
# 1. Deploy contracts
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
# Result: VehicleRegistry: 0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6
#         AlertSystem: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# 2. Start edge server
cd ../edge_server
npm start
# Server running on port 3000

# 3. Initialize with contract addresses
curl -X POST http://localhost:3000/api/initialize \
  -H 'Content-Type: application/json' \
  -d '{
    "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
    "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }'

# 4. Register a vehicle
curl -X POST http://localhost:3000/api/vehicle/register \
  -H 'Content-Type: application/json' \
  -d '{
    "vehicleAddress": "0x70997970C51812e339D9B73B0245601B4ec4ba8e",
    "vehicleId": "VEHICLE_001"
  }'

# 5. Send an alert
curl -X POST http://localhost:3000/api/alert/send \
  -H 'Content-Type: application/json' \
  -d '{
    "vehiclePrivateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "alertMessage": "Accident detected on Highway 101",
    "alertType": "accident"
  }'

# 6. Check all alerts
curl http://localhost:3000/api/alert/all
```

### Example 2: Multi-Instance Deployment

```bash
# Deploy 5 instances
python deploy_edge_servers.py 5

# Tests each instance
for port in 3000 3001 3002 3003 3004; do
  curl http://localhost:$port/health
  echo "Instance on port $port is $(curl -s http://localhost:$port/health | jq -r .status)"
done
```

### Example 3: Automated Sensor Data Processing

```bash
# Send sensor data with collision detection
curl -X POST http://localhost:3000/api/process/sensor-data \
  -H 'Content-Type: application/json' \
  -d '{
    "vehiclePrivateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "sensorData": {
      "speed": 80,
      "collision": true,
      "visibility": 100,
      "temperature": 25
    }
  }'
# This automatically sends an "ACCIDENT" alert to blockchain
```

## Decision Engine Logic

The edge server includes a **rule-based decision engine** that automatically decides whether to send alerts:

```javascript
function analyzeAndDecide(sensorData) {
  // 1. Collision → ACCIDENT alert
  if (collision === true) return { shouldAlert: true, type: 'accident' };
  
  // 2. Poor visibility → HAZARD alert
  if (visibility < 50) return { shouldAlert: true, type: 'hazard' };
  
  // 3. Extreme cold → HAZARD alert (icy roads)
  if (temperature < -5°C) return { shouldAlert: true, type: 'hazard' };
  
  // 4. Speeding → SPEEDING alert
  if (speed > 120 km/h) return { shouldAlert: true, type: 'speeding' };
  
  // 5. Normal conditions → No alert
  return { shouldAlert: false };
}
```

**Future Enhancements:**
- ML-based anomaly detection
- Sensor fusion from multiple sources
- Weighted decision scoring
- Historical pattern analysis
- Dynamic threshold configuration

## Deployment Scenarios

### Scenario 1: Single RSU (One Instance)
```bash
npm start  # Single server on port 3000
```

### Scenario 2: Highway Corridor (Multiple RSUs)
```bash
python deploy_edge_servers.py 5 --start-port 3000
# 5 edge servers at: 3000, 3001, 3002, 3003, 3004
# Each covers a different section of the highway
```

### Scenario 3: Multiple Cities (Different Port Ranges)
```bash
# City 1: Ports 3000-3004
python deploy_edge_servers.py 5 --start-port 3000

# City 2: Ports 5000-5009
python deploy_edge_servers.py 10 --start-port 5000
```

## Logging

- Single instance logs to console
- Multiple instances: Logs saved to `edge_server_instance_X.log`

```bash
# View logs for instance 1
tail -f edge_server_instance_1.log

# Monitor all logs
for i in {1..5}; do echo "=== Instance $i ===" && tail -5 edge_server_instance_$i.log; done
```

## Error Handling

The server includes comprehensive error handling:

- **Port already in use**: Check with `lsof -i :PORT`
- **Contracts not initialized**: Call `/api/initialize` first
- **Invalid vehicle address**: Verify blockchain address format
- **Transaction failed**: Check if vehicle is registered

## Architecture Notes

### Why Edge Server?

1. **Latency**: Real-time response to sensor events
2. **Bandwidth**: Process data locally, only send alerts to blockchain
3. **Scalability**: Distribute load across multiple edge servers
4. **Reliability**: Self-contained decision engine

### Blockchain Integration

```
Sensor Events → Edge Decision Engine → Smart Contract Call → Blockchain
                         ↓
                   Rule Validation
                   Data Processing
                   Alert Generation
```

### Data Flow

1. **OBU sends sensor data** to edge server via HTTP POST
2. **Edge server processes** data using decision engine
3. **If alert needed**: Call blockchain contract
4. **Smart contract validates** vehicle is registered
5. **Alert stored** on blockchain immutably
6. **Other vehicles listen** for events and react in real-time

## Future Enhancements

- [ ] Database for sensor data storage
- [ ] Cloud backend integration
- [ ] ML-based anomaly detection
- [ ] Trust score calculation
- [ ] Role-based access control
- [ ] Rate limiting and DDoS protection
- [ ] Load balancing across instances
- [ ] Metrics and monitoring (Prometheus)
- [ ] Kubernetes deployment
- [ ] HTTPS/TLS support

## Troubleshooting

### Port already in use
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
```

### Ganache connection refused
```bash
# Make sure Ganache is running
ganache-cli -h 0.0.0.0 -p 7545
```

### Contract not initialized error
```bash
# Call initialize endpoint with correct contract addresses
curl -X POST http://localhost:3000/api/initialize \
  -H 'Content-Type: application/json' \
  -d '{"registryAddress": "0x...", "alertSystemAddress": "0x..."}'
```

### Vehicle not registered error
```bash
# Register vehicle first
curl -X POST http://localhost:3000/api/vehicle/register \
  -H 'Content-Type: application/json' \
  -d '{"vehicleAddress": "0x...", "vehicleId": "VEH_001"}'
```

## License

ISC

## Contributing

For contributions, please create a feature branch and submit a pull request.
