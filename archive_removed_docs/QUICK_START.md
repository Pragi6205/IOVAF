# QUICK START - Edge Server

## 30-Second Setup

```bash
# 1. Deploy contracts
cd blockchain
npx hardhat run scripts/deploy.js --network ganache

# Note the contract addresses from output!
# Example:
# VehicleRegistry: 0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6
# AlertSystem: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# 2. Install & start edge server
cd ../edge_server
npm install
npm start

# 3. In another terminal, initialize:
curl -X POST http://localhost:3000/api/initialize \
  -H 'Content-Type: application/json' \
  -d '{
    "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
    "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }'

# 4. Register a vehicle:
curl -X POST http://localhost:3000/api/vehicle/register \
  -H 'Content-Type: application/json' \
  -d '{
    "vehicleAddress": "0x70997970C51812e339D9B73B0245601B4ec4ba8e",
    "vehicleId": "CAR_001"
  }'

# 5. Send an alert:
curl -X POST http://localhost:3000/api/alert/send \
  -H 'Content-Type: application/json' \
  -d '{
    "vehiclePrivateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "alertMessage": "Test alert from vehicle",
    "alertType": "accident"
  }'

# 6. View all alerts:
curl http://localhost:3000/api/alert/all | jq '.'
```

## Multi-Instance Deployment (1 minute)

```bash
cd edge_server

# Deploy 3 instances
python deploy_edge_servers.py 3

# Deploy 5 instances on ports 8000-8004
python deploy_edge_servers.py 5 --start-port 8000

# Initialize each instance:
for port in 3000 3001 3002; do
  curl -X POST http://localhost:$port/api/initialize \
    -H 'Content-Type: application/json' \
    -d '{
      "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
      "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    }'
done
```

## Monitor Health

```bash
# Check all instances
python manage_edge_servers.py health

# Get stats for instance 1
python manage_edge_servers.py stats 1

# List all instances
python manage_edge_servers.py list
```

## Run Demo

```bash
# Full workflow demo
./test_demo.sh
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check if server is running |
| POST | `/api/initialize` | Set contract addresses |
| POST | `/api/vehicle/register` | Register vehicle on blockchain |
| GET | `/api/vehicle/check/:address` | Check if vehicle registered |
| POST | `/api/alert/send` | Send alert to blockchain |
| GET | `/api/alert/all` | Get all alerts |
| GET | `/api/alert/events` | Real-time alert stream (SSE) |
| POST | `/api/process/sensor-data` | Process sensor data & auto-alert |
| GET | `/api/stats` | Server statistics |

## Sensor Data Processing

```bash
# Automatic alert on accident
curl -X POST http://localhost:3000/api/process/sensor-data \
  -H 'Content-Type: application/json' \
  -d '{
    "vehiclePrivateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "sensorData": {
      "speed": 100,
      "collision": true,
      "visibility": 100,
      "temperature": 20
    }
  }'
# → Automatically sends "ACCIDENT" alert to blockchain
```

## Environment Variables

```bash
# .env file
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_PRIVATE_KEY=0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f
PORT=3000
```

## Troubleshooting

```bash
# Port in use?
lsof -ti:3000 | xargs kill -9

# Ganache not running?
ganache-cli

# Dependencies missing?
npm install

# Contracts not deployed?
cd blockchain && npx hardhat run scripts/deploy.js --network ganache
```

## Files & Scripts

- **index.js** - Main server code
- **deploy_edge_servers.py** - Deploy N instances
- **manage_edge_servers.py** - Monitor & manage instances
- **test_demo.sh** - Full demo workflow
- **README.md** - Detailed documentation
- **IMPLEMENTATION_GUIDE.md** - Architecture & advanced usage

## Next: Enable Decision Engine Customization

```javascript
// Edit index.js -> analyzeAndDecide() function
// Add your custom alert rules here

// Example: Custom collision + speed rule
if (sensorData.collision && sensorData.speed > 100) {
  return {
    shouldAlert: true,
    alertType: 'critical_accident',
    message: 'High-speed collision detected!'
  };
}
```

---

**That's it!** You now have a fully functional edge server system ready for IoV applications.
