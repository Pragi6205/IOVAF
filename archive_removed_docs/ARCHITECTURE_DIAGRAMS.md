# Edge Server Architecture Diagrams

## System Overview Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    IoV ECOSYSTEM OVERVIEW                        │
└──────────────────────────────────────────────────────────────────┘

                            VEHICLES
                         ┌────────────┐
                         │ OBU #1     │
                         │ Sensors    │
                         └─────┬──────┘
                               │ HTTP JSON
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
  ┌─────────┐            ┌─────────┐            ┌─────────┐
  │ Edge    │            │ Edge    │            │ Edge    │
  │ Server1 │            │ Server2 │            │ Server3 │
  │ Port    │            │ Port    │            │ Port    │
  │ 3000    │            │ 3001    │            │ 3002    │
  └────┬────┘            └────┬────┘            └────┬────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                     Smart Contract Calls
                     (via ethers.js)
                              │
                      ┌───────▼────────┐
                      │ Ganache RPC    │
                      │ (Blockchain)   │
                      └────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
              ┌─────▼───────┐      ┌─────▼────────┐
              │ Vehicle     │      │ Alert        │
              │ Registry    │      │ System       │
              │ (Smart      │      │ (Smart       │
              │  Contract)  │      │  Contract)   │
              └─────────────┘      └──────────────┘
                    │                    │
                    └─────────┬──────────┘
                              │
                   ┌──────────▼───────────┐
                   │  Blockchain State    │
                   │  (Immutable Ledger)  │
                   │                      │
                   │ - Vehicle Records    │
                   │ - Alert History      │
                   │ - Transaction Logs   │
                   └──────────────────────┘
```

---

## Data Flow: Accident Alert

```
TIME ──────────────────────────────────────────────────────►

┌─────────────┐
│   Vehicle   │
│ Hit another │
│   vehicle   │
└────────┬────┘
         │
         │ Collision sensor triggered
         │ OBU reads: collision=true, speed=80
         │
         ▼
    (HTTP POST)
┌──────────────────────────────────────┐
│   Edge Server                        │
│                                      │
│   POST /api/process/sensor-data      │
│   {                                  │
│     vehiclePrivateKey: "0x...",      │
│     sensorData: {                    │
│       collision: true,               │
│       speed: 80                      │
│     }                                │
│   }                                  │
│                                      │
│   ▼                                  │
│   ┌─────────────────────────┐        │
│   │ Decision Engine         │        │
│   │ Analyzes sensor data    │        │
│   │ collision === true?     │        │
│   │ YES! → ACCIDENT alert   │        │
│   └────────┬────────────────┘        │
│            │                         │
│            ▼                         │
│   Call AlertSystem.sendAlert()       │
│   TX: "Accident detected..."         │
│                                      │
└───────────┬────────────────────────────┘
            │
        (Contract Call)
            │
            ▼
    ┌───────────────────┐
    │ Smart Contract    │
    │ AlertSystem       │
    │                   │
    │ Validates:        │
    │ ✓ Vehicle exists  │
    │ ✓ Vehicle reg'd   │
    │ ✓ Message valid   │
    │                   │
    │ ▼                 │
    │ Add to alerts[]   │
    │ Emit AlertSent()  │
    │ Return TX hash    │
    └─────┬─────────────┘
          │
          ▼ (Recorded on blockchain)
    ┌──────────────────┐
    │ Blockchain Block │
    │ #15              │
    │                  │
    │ Alert: Accident  │
    │ From: 0x70997... │
    │ Time: 1739...    │
    │ TX: 0xabcd...    │
    └──────────────────┘
          │
          ▼ (Event broadcast)
    ┌──────────────────┐
    │ Other Vehicles   │
    │ Listen to events │
    │                  │
    │ Alert received:  │
    │ "ACCIDENT"       │
    │ Update display   │
    │ Adjust route     │
    └──────────────────┘
```

---

## Multi-Instance Architecture

```
┌────────────────────────────────────────────────────────┐
│         HIGHWAY CORRIDOR (100 KM)                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Segment 1      Segment 2      Segment 3      Seg 4  │
│  0-25 KM        25-50 KM       50-75 KM       75-100 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────┐│
│  │ Edge    │    │ Edge    │    │ Edge    │    │Edge ││
│  │ Server1 │    │ Server2 │    │ Server3 │    │Srv 4││
│  │ Port    │    │ Port    │    │ Port    │    │Port ││
│  │ 3000    │    │ 3001    │    │ 3002    │    │3003 ││
│  └────┬────┘    └────┬────┘    └────┬────┘    └──┬──┘│
│       │              │              │             │   │
│  ┌────┴──────────────┴──────────────┴─────────────┘   │
│  │                                                     │
│  │      All connect to same blockchain               │
│  │    (Shared, unified, immutable ledger)            │
│  │                                                    │
│  └─────────────────┬──────────────────────────────────┘
│                    │
│          ┌─────────▼──────────┐
│          │   Ganache RPC      │
│          │   Single source    │
│          │   of truth         │
│          └────────────────────┘
│
│  Features:
│  ⭐ Horizontal scaling - add more instances anytime
│  ⭐ Geographic distribution - each handles its area
│  ⭐ Fault tolerance - one fails, others continue
│  ⭐ Load distribution - spread OBU connections
│  ⭐ Unified blockchain - all feed same ledger
└────────────────────────────────────────────────────────┘
```

---

## Decision Engine Logic Flow

```
┌─────────────────────┐
│  Sensor Data Input  │
│  {                  │
│   speed: 150,       │
│   collision: false, │
│   visibility: 30,   │
│   temperature: -10  │
│  }                  │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────────┐
    │ collision===true? │
    │ ┌──────┐ ┌──────┐│
    │ │ Yes  │ │ No   ││
    │ └──┬───┘ └──┬───┘│
    │    │        │    │
    └────┼────────┼────┘
         │        │
         │        ▼
         │   ┌──────────────────┐
         │   │visibility < 50?  │
         │   │ ┌──────┐ ┌──────┐│
         │   │ │ Yes  │ │ No   ││
         │   │ └──┬───┘ └──┬───┘│
         │   │    │        │    │
         │   └────┼────────┼────┘
         │        │        │
    ┌────▼────┴──▼────┴─────┘
    │
    ▼
ALERT TYPE DETERMINED:

┌─────────────────────────────────┐
│ ACCIDENT ALERT                  │
│ ├─ Message: "Accident detected" │
│ ├─ Type: accident               │
│ ├─ Severity: CRITICAL           │
│ └─ Action: Send to blockchain   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ HAZARD ALERT                    │
│ ├─ Message: "Low visibility"    │
│ ├─ Type: hazard                 │
│ ├─ Severity: HIGH               │
│ └─ Action: Send to blockchain   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ SPEEDING ALERT                  │
│ ├─ Message: "Excessive speed"   │
│ ├─ Type: speeding               │
│ ├─ Severity: MEDIUM             │
│ └─ Action: Send to blockchain   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ NO ALERT                        │
│ ├─ Reason: Normal conditions    │
│ ├─ Action: No blockchain call   │
│ └─ Notes: Saves gas & bandwidth │
└─────────────────────────────────┘
```

---

## API Endpoint Flow Diagram

```
              EDGE SERVER ENDPOINTS
┌────────────────────────────────────────────┐
│                                            │
│  Health Checks                             │
│  ├─ GET /health                            │
│  └─ GET /api/stats                         │
│                                            │
│  Blockchain Setup                          │
│  ├─ POST /api/initialize                   │
│  │  └─ Set contract addresses              │
│  │                                         │
│  Vehicle Management                        │
│  ├─ POST /api/vehicle/register             │
│  │  └─ Register vehicle on blockchain      │
│  ├─ GET /api/vehicle/check/:address        │
│  │  └─ Verify if registered                │
│  │                                         │
│  Alert Management                          │
│  ├─ POST /api/alert/send ⭐ (Core)         │
│  │  └─ Send alert to blockchain            │
│  ├─ GET /api/alert/all                     │
│  │  └─ Retrieve alert history              │
│  ├─ GET /api/alert/events (SSE)            │
│  │  └─ Real-time alert streaming           │
│  │                                         │
│  Sensor Processing                         │
│  ├─ POST /api/process/sensor-data ⭐       │
│  │  └─ Auto-analyze & alert                │
│  │                                         │
└────────────────────────────────────────────┘

⭐ = Core endpoints for IoV functionality
```

---

## Deployment Topology

```
SCENARIO A: Single Edge Server (Development)
═════════════════════════════════════════════

    ┌─────────┐
    │ Vehicle │
    └────┬────┘
         │
         ▼
   ┌──────────────┐
   │ Edge Server  │
   │ Port: 3000   │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Ganache RPC  │
   └──────────────┘


SCENARIO B: Highway Coverage (5 instances)
═════════════════════════════════════════════

┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│Veh1 │  │Veh2 │  │Veh3 │  │Veh4 │  │Veh5 │
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│3000 │  │3001 │  │3002 │  │3003 │  │3004 │
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │        │        │        │
   └────────┼────────┼────────┼────────┘
            │        │        │
            ▼        ▼        ▼
         ┌──────────────────┐
         │  Ganache RPC     │
         │ (Single Truth)   │
         └──────────────────┘


SCENARIO C: City-Wide (Multi-zone with load balancer)
═════════════════════════════════════════════════════

    ┌─────────────────────────┐
    │  Vehicles / OBUs        │
    │  (Cities A, B, C)       │
    └────────────┬────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Nginx Load       │
         │ Balancer         │
         │ (Single URL)     │
         └────────┬──────────┘
                  │
        ┌─────────┼──────────┐
        │         │          │
        ▼         ▼          ▼
    City A    City B      City C
    ┌──┬──┬    ┌──┬─┐    ┌──┬──┐
    │ES│ES│    │ES │    │ES│ES│
    │1 │2 │    │3  │    │4 │5 │
    │  │  │    │   │    │  │  │
    └──┴──┴    └──┬─┘    └──┴──┘
       3000,3001   3002        3003,3004
        │         │            │
        └─────────┼────────────┘
                  │
              ┌───▼────────┐
              │ Ganache    │
              │ (Master)   │
              └────────────┘
```

---

## Request/Response Cycle

```
OBU → Edge Server → Smart Contract → Blockchain

┌──────────────────────────────────────────────────────┐
│ 1. OBU sends request to Edge Server                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  POST /api/alert/send                               │
│  {                                                  │
│    vehiclePrivateKey: "0x59c6...",                 │
│    alertMessage: "Accident detected",              │
│    alertType: "accident"                           │
│  }                                                  │
│                                                     │
│  ┌─ Status: 202 Accepted (queued)                  │
│                                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 2. Edge Server processes & validates                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  • Parse request JSON                              │
│  • Validate private key format                     │
│  • Create wallet signer                            │
│  • Connect to AlertSystem contract                 │
│                                                     │
│  ┌─ Processing: 100-500ms                          │
│                                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 3. Edge Server calls Smart Contract                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  const tx = await alertSystemContract.sendAlert(   │
│    "Accident detected"                              │
│  );                                                 │
│                                                     │
│  ┌─ Transaction submitted                          │
│  ┌─ Awaiting confirmation                          │
│                                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 4. Blockchain executes Smart Contract               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  •Validate: isRegistered(msg.sender)?          │
│  • Store: alerts.push(Alert)                       │
│  • Emit: AlertSent event                           │
│  • Return: Transaction hash & block #              │
│                                                     │
│  ┌─ Mining: 1-3 seconds (Ganache)                  │
│                                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 5. Edge Server returns response to OBU              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  HTTP 200 OK                                        │
│  {                                                  │
│    "message": "Alert sent to blockchain",          │
│    "vehicleAddress": "0x70997...",                │
│    "transactionHash": "0xabcd...",                │
│    "blockNumber": 15,                             │
│    "timestamp": "2026-02-13T10:30:45Z"            │
│  }                                                  │
│                                                     │
│  ┌─ Total time: ~2-5 seconds                       │
│                                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 6. Other vehicles listen & react                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  EventSource: /api/alert/events                    │
│                                                     │
│  ┌─ Event: AlertSent(...)                          │
│  ┌─ Data: { message, sender, txHash, blockNum }   │
│  ┌─ Action: Update vehicle displays/routing        │
│                                                     │
│  ┌─ Real-time: <100ms after blockchain confirm    │
│                                                     │
└──────────────────────────────────────────────────────┘
```

---

## File Structure & Dependencies

```
edge_server/
│
├── index.js (Main Application)
│   ├── Imports:
│   │   ├── express (Web framework)
│   │   ├── ethers.js (Blockchain - CRITICAL)
│   │   ├── cors (Cross-origin)
│   │   └── dotenv (Configuration)
│   │
│   ├── Core Functions:
│   │   ├── initializeBlockchain() - Connect to Ganache
│   │   ├── setContractAddresses() - Bind smart contracts
│   │   ├── analyzeAndDecide() - Decision engine (CUSTOMIZABLE)
│   │   └── 9 API endpoints
│   │
│   └── Port: 3000 (default)
│
├── package.json
│   ├── Dependencies:
│   │   ├── "express": "^5.2.1"
│   │   ├── "ethers": "^6.7.1" ⭐ (KEY!)
│   │   ├── "cors": "^2.8.6"
│   │   ├── "dotenv": "^17.2.4"
│   │   └── "nodemon": "^3.1.11" (dev)
│   │
│   └── Scripts:
│       ├── "start": node index.js
│       └── "dev": nodemon index.js
│
├── .env (Configuration)
│   ├── GANACHE_RPC_URL
│   ├── GANACHE_PRIVATE_KEY  
│   └── PORT
│
├── deploy_edge_servers.py (Multi-instance launcher)
│   ├── Validates: Node.js installed, dependencies present
│   ├── Checks: Port availability
│   ├── Creates: Multiple server processes
│   └── Logs: deployment_info.json
│
├── manage_edge_servers.py (Monitor & orchestrate)
│   ├── Commands:
│   │   ├── health - Check all instances
│   │   ├── stats - Instance statistics
│   │   ├── lb-config - nginx config
│   │   └── docker-config - Docker Compose
│   │
│   └── Reads: deployment_info.json
│
├── test_demo.sh (Full workflow test)
│   ├── Tests: All 8 main endpoints
│   ├── Validates: Vehicle registration
│   ├── Demonstrates: Alert flow
│   └── Shows: sensor data processing
│
└── Documentation/
    ├── README.md - API reference
    ├── QUICK_START.md - 30-second setup
    ├── IMPLEMENTATION_GUIDE.md - Architecture & design
    └── (This file) - Diagrams
```

---

## Critical Success Factors

```
✅ All Dependencies Included
   └─ ethers.js for blockchain
   └─ Express for HTTP server
   └─ CORS for OBU communication

✅ Smart Contract Integration
   └─ ABI bindings ready
   └─ Transaction handling complete
   └─ Event listening implemented

✅ Scalability Built-In
   └─ Multi-instance deployment script
   └─ Load balancer configuration
   └─ Health monitoring tools

✅ Decision Engine Extensible
   └─ Simple rule-based implementation
   └─ Easy to replace with ML
   └─ Customizable trigger rules

✅ Production-Ready Code
   └─ Error handling
   └─ Async/await patterns
   └─ Environment configuration
   └─ Logging & monitoring
```

---

**Documentation Generated**: February 13, 2026
