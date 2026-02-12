# Edge Server Implementation Guide & Architecture

## Overview

This document provides a comprehensive guide to understanding, deploying, and using the Edge Server system you just created.

---

## 📊 System Architecture

```
┌─────────────────┐
│   Vehicles      │
│   (OBUs)        │
└────────┬────────┘
         │
         │ Sensor Data
         │ (HTTP POST)
         ↓
┌──────────────────────────────────────────┐
│   Edge Server (Node.js)                  │
├──────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │  Decision Engine (Rule-based)       │ │
│  │  - Collision detection              │ │
│  │  - Visibility analysis              │ │
│  │  - Temperature monitoring           │ │
│  │  - Speed validation                 │ │
│  └─────────────────────────────────────┘ │
│                   ↓                       │
│  ┌─────────────────────────────────────┐ │
│  │  Blockchain Interface Layer         │ │
│  │  - Vehicle registration             │ │
│  │  - Alert submission                 │ │
│  │  - Smart contract calls             │ │
│  └─────────────────────────────────────┘ │
└──────────────────┬───────────────────────┘
                   │
                   │ Contract Calls
                   │
         ┌─────────▼─────────┐
         │    Ganache        │
         │  (Local Blockchain)
         │                   │
         │ VehicleRegistry   │
         │ AlertSystem       │
         └─────────┬─────────┘
                   │
                   │ Immutable Records
                   │
         ┌─────────▼──────────────┐
         │  Blockchain State      │
         ├───────────────────────┤
         │ - Vehicle Identities  │
         │ - Alert History       │
         │ - Transaction Logs    │
         └───────────────────────┘
```

---

## 🔧 Component Breakdown

### 1. **Decision Engine**

Located in `index.js` → `analyzeAndDecide()` function

```javascript
// Current Rules (can be extended with ML)
- Collision === true              → Send "ACCIDENT" alert
- Visibility < 50%               → Send "HAZARD" alert
- Temperature < -5°C             → Send "HAZARD" alert
- Speed > 120 km/h               → Send "SPEEDING" alert
- Otherwise                      → No alert
```

**Future Enhancement**: Replace with ML model for anomaly detection

### 2. **Blockchain Interface**

Handles all smart contract interactions:
- Vehicle registration
- Alert broadcasting
- Event listening
- State queries

### 3. **API Layer**

RESTful endpoints for:
- OBU communication
- Sensor data submission
- Alert tracking
- Server management

---

## 🚀 Quick Start Guide

### Step 1: Deploy Smart Contracts

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
```

**Output will show:**
```
VehicleRegistry deployed to: 0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6
AlertSystem deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Step 2: Start Edge Server(s)

**Single Instance:**
```bash
cd edge_server
npm install
npm start
# Server running on http://localhost:3000
```

**Multiple Instances (Recommended):**
```bash
python deploy_edge_servers.py 5
# Starts 5 instances on ports 3000-3004
```

### Step 3: Initialize with Contract Addresses

```bash
curl -X POST http://localhost:3000/api/initialize \
  -H 'Content-Type: application/json' \
  -d '{
    "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
    "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }'
```

### Step 4: Register Vehicles

```bash
curl -X POST http://localhost:3000/api/vehicle/register \
  -H 'Content-Type: application/json' \
  -d '{
    "vehicleAddress": "0x70997970C51812e339D9B73B0245601B4ec4ba8e",
    "vehicleId": "VEHICLE_001"
  }'
```

### Step 5: Send Alerts/Process Sensor Data

```bash
curl -X POST http://localhost:3000/api/alert/send \
  -H 'Content-Type: application/json' \
  -d '{
    "vehiclePrivateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "alertMessage": "Accident detected on Highway 101",
    "alertType": "accident"
  }'
```

---

## 📁 Project Structure

```
edge_server/
├── index.js                      # Main edge server application
├── package.json                  # Dependencies & scripts
├── .env                          # Configuration (local)
├── .env.example                  # Configuration template
├── README.md                      # Full documentation
│
├── deploy_edge_servers.py        # Multi-instance deployment script
├── manage_edge_servers.py        # Monitoring & orchestration
├── test_demo.sh                  # Demo workflow script
│
├── IMPLEMENTATION_GUIDE.md       # This file
├── QUICK_START.md               # Quick start instructions
│
└── logs/
    └── edge_server_instance_*.log
```

---

## 🎯 Key Design Decisions

### 1. **Why Edge Server?**
- **Real-time Processing**: React to sensor events immediately
- **Reduced Bandwidth**: Process locally, send alerts to blockchain
- **Scalability**: Distribute load across multiple servers
- **Reliability**: Self-contained, can work independently

### 2. **Why Decision Engine?**
- **Prevents Spam**: Only meaningful alerts reach blockchain
- **Cost Efficient**: Fewer transactions = lower gas costs
- **Privacy**: Raw sensor data stays local
- **Extensible**: Can be upgraded to ML models

### 3. **Why Smart Contracts Check Registration?**
- **Security**: Prevents malicious actors from sending false alerts
- **Trust**: Only authorized vehicles can broadcast
- **Audit**: All alerts are traceable to their source

### 4. **Why Multiple Instances?**
- **Coverage**: Different/Highway sections covered by different servers
- **Load Distribution**: Distribute OBU connections
- **Fault Tolerance**: System continues if one server fails
- **Geographic Distribution**: Deploy servers strategically

---

## 🔄 Data Flow Examples

### Example 1: Accident Alert Flow

```
1. Vehicle's collision sensor triggers
   └─> OBU sends sensor data to edge server:
       POST /api/process/sensor-data
       { collision: true, speed: 80, ... }

2. Edge Server Decision Engine analyzes
   └─> collision === true
       └─> Decision: Send ACCIDENT alert

3. Edge Server submits to blockchain
   └─> Calls AlertSystem.sendAlert()
       └─> Transaction mined

4. Smart Contract validates
   └─> Checks: isRegistered(vehicleSender)
       └─> Yes! → Alert recorded

5. Alert is now on blockchain
   └─> Immutable
   └─> Queryable by other vehicles
   └─> Event emitted: AlertSent

6. Other vehicles listen to events
   └─> Receive alert via /api/alert/events (SSE)
   └─> Update driver display
   └─> Adjust route if needed
```

### Example 2: Multi-Instance Deployment

```
Highway Corridor (100 km):

Segment 1 (0-20km)     Segment 2 (20-40km)    Segment 3 (40-60km)
├─ Edge Server 1      ├─ Edge Server 2       ├─ Edge Server 3
└─ Port: 3000         └─ Port: 3001          └─ Port: 3002
  └─ Coverage: 0-20km   └─ Coverage: 20-40km   └─ Coverage: 40-60km

All servers → Same Blockchain → Unified Alert Network

Vehicles know which server to connect based on GPS location.
```

---

## 🧠 Decision Engine Rules

### Current Implementation (Rule-Based)

```javascript
function analyzeAndDecide(sensorData) {
  const { speed, collision, visibility, temperature } = sensorData;
  
  // Priority 1: Immediate Danger
  if (collision === true) {
    return { alert: 'ACCIDENT', severity: 'CRITICAL' };
  }
  
  // Priority 2: Environmental Hazards
  if (visibility < 50) {
    return { alert: 'HAZARD', severity: 'HIGH' };
  }
  
  if (temperature < -5) {
    return { alert: 'HAZARD', severity: 'HIGH' };
  }
  
  // Priority 3: Speed Violations
  if (speed > 120) {
    return { alert: 'SPEEDING', severity: 'MEDIUM' };
  }
  
  return { alert: 'NONE', severity: 'LOW' };
}
```

### Future Enhancement: ML Model

```python
# Replace decision engine with ML model
from sklearn.ensemble import IsolationForest

model = IsolationForest()
model.fit(training_sensor_data)

def analyzeAndDecide(sensorData):
  anomaly_score = model.decision_function([sensorData])
  if anomaly_score < threshold:
    return { alert: 'ANOMALY_DETECTED', severity: calculate_severity() }
  return { alert: 'NONE', severity: 'LOW' }
```

---

## 📊 Deployment Scenarios

### Scenario A: Single RSU (Test)

```bash
npm start
# Single server on port 3000
# Suitable for: Testing, development, small area coverage
```

**Use Case**: University campus, parking lot, single road segment

### Scenario B: Highway Corridor (Multiple RSUs)

```bash
python deploy_edge_servers.py 10 --start-port 3000
# 10 servers on ports 3000-3009
# 10 km coverage each = 100 km total coverage
```

**Use Case**: Highway monitoring, city arterial roads

### Scenario C: Smart City (Large Scale)

```bash
# Deploy in multiple clusters
python deploy_edge_servers.py 20 --start-port 3000  # City Center
python deploy_edge_servers.py 15 --start-port 4000  # Suburbs
python deploy_edge_servers.py 10 --start-port 5000  # Industrial Area

# Use load balancer (nginx) to distribute
# Put behind API gateway
```

**Use Case**: City-wide IoV network, multiple coverage zones

---

## 🛠️ Advanced Configuration

### 1. **Custom Decision Engine**

Edit `index.js` → `analyzeAndDecide()` to add your rules:

```javascript
function analyzeAndDecide(sensorData) {
  // YOUR CUSTOM LOGIC HERE
  
  // Example: Alert on both visible objects AND speed
  if (sensorData.objectDetected && sensorData.speed > 100) {
    return {
      shouldAlert: true,
      alertType: 'potential_collision',
      message: `Object detected ahead at ${sensorData.speed} km/h`
    };
  }
  
  // Continue with other rules...
}
```

### 2. **Custom Ganache Setup**

```bash
# Start Ganache with custom configuration
ganache-cli \
  --deterministic \
  --host 0.0.0.0 \
  --port 7545 \
  --gasLimit=10000000 \
  --account 0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f,1000000000000000000000000
```

### 3. **Load Balancing**

```bash
python manage_edge_servers.py lb-config
# Generates nginx.conf.example

# Copy and use:
sudo cp nginx.conf.example /etc/nginx/sites-available/edge-servers
sudo systemctl restart nginx

# Single entry point:
# http://localhost/api/alert/send (routes to any instance)
```

### 4. **Docker Deployment**

```bash
python manage_edge_servers.py docker-config
# Generates docker-compose.example.yml

docker-compose -f docker-compose.example.yml up -d
# All instances + Ganache containerized
```

---

## 📈 Performance Tuning

### 1. **Increase Alert Processing Speed**

```javascript
// In index.js, reduce connection timeout
const BLOCKCHAIN_TIMEOUT = 5000; // ms
```

### 2. **Batch Alerts**

```javascript
// If processing many alerts, consider batching:
let alertBatch = [];
const BATCH_SIZE = 10;

if (shouldAlert) {
  alertBatch.push(alert);
  if (alertBatch.length >= BATCH_SIZE) {
    // Submit batch to blockchain
    submitBatch(alertBatch);
    alertBatch = [];
  }
}
```

### 3. **Database for Local Caching**

```javascript
// Add MongoDB/PostgreSQL for sensor data
const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  vehicleId: String,
  timestamp: Date,
  data: Object,
  alertTriggered: Boolean
});

// Query historical data for ML training
```

---

## 🔍 Monitoring & Debugging

### Check Server Health

```bash
python manage_edge_servers.py health
# Shows status of all instances
```

### Monitor Specific Instance

```bash
python manage_edge_servers.py stats 1
# Shows detailed stats for instance 1
```

### View Logs

```bash
# Single instance (console)
npm start

# Multiple instances (files)
tail -f edge_server_instance_1.log
tail -f edge_server_instance_2.log

# All at once
for i in {1..5}; do tail -5 edge_server_instance_$i.log && echo "---"; done
```

### Real-Time Event Monitoring

```bash
# Listen to blockchain events
curl -N http://localhost:3000/api/alert/events | jq '.'

# In JavaScript
const eventSource = new EventSource('http://localhost:3000/api/alert/events');
eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `lsof -ti:3000 \| xargs kill -9` |
| Cannot connect to Ganache | Start Ganache: `ganache-cli` |
| `Cannot find module 'ethers'` | Run `npm install` in edge_server/ |
| Contracts not initialized | Call `/api/initialize` with correct addresses |
| Vehicle registration fails | Make sure vehicle is registered first |
| Ganache RPC timeout | Check `GANACHE_RPC_URL` in `.env` |
| Event stream not working | Use `curl -N` for SSE; ensure contracts initialized |

---

## 🎓 Learning Resources

### Smart Contracts Deep Dive
- Study `VehicleRegistry.sol` → Vehicle management
- Study `AlertSystem.sol` → Alert mechanics
- Try modifying them (e.g., add trust scores)

### Blockchain Interaction
- Test each endpoint with the `test_demo.sh` script
- Read through `index.js` comments
- Try adding new endpoints

### Deployment & DevOps
- Run `deploy_edge_servers.py` with different instance counts
- Generate load balancer configs with `manage_edge_servers.py`
- Try containerizing with Docker

### ML Integration (Future)
- Replace `analyzeAndDecide()` with scikit-learn/TensorFlow model
- Train on historical sensor data
- Deploy model inside edge server

---

## 📝 Next Steps

1. **Test the setup**
   ```bash
   cd edge_server
   ./test_demo.sh
   ```

2. **Deploy multiple instances**
   ```bash
   python deploy_edge_servers.py 5
   ```

3. **Build OBU client**
   ```javascript
   // Send sensor data to edge server
   const data = {
     vehiclePrivateKey: "0x...",
     sensorData: {...}
   };
   fetch('http://localhost:3000/api/process/sensor-data', {
     method: 'POST',
     body: JSON.stringify(data)
   });
   ```

4. **Add database** (for sensor history)
   - MongoDB for flexible schema
   - PostgreSQL for relations

5. **Upgrade Decision Engine**
   - Collect real sensor data
   - Train ML models
   - Replace rule-based logic

6. **Production Hardening**
   - Add authentication (JWT)
   - Implement rate limiting
   - Add HTTPS/TLS
   - Monitor with Prometheus
   - Deploy to Kubernetes

---

## 📞 Support & Contribution

- Check README.md for detailed API reference
- Review test_demo.sh for usage examples
- Modify index.js for custom logic
- Use manage_edge_servers.py for orchestration

---

**Created**: February 13, 2026
**Last Updated**: February 13, 2026
**Status**: Production-Ready Core | Ready for Enhancement
