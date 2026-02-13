# IoV (Internet of Vehicles) Blockchain System - Documentation Index

## 📋 Quick Navigation

### 🚀 Getting Started
1. **[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** - Project status and overview (start here!)
2. **[edge_server/QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md)** - How to run the edge server
3. **[README.md](./README.md)** - Main project documentation

### 🏗️ Architecture & Design
- **[edge_server/MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md)** - Detailed module breakdown
- **[edge_server/ARCHITECTURE_DIAGRAMS.md](./edge_server/ARCHITECTURE_DIAGRAMS.md)** - System diagrams
- **[Plan.md](./Plan.md)** - Original project plan

### 💻 Smart Contracts
- **[blockchain/contracts/VehicleRegistry.sol](./blockchain/contracts/VehicleRegistry.sol)** - Vehicle identity & categories
- **[blockchain/contracts/AlertSystem.sol](./blockchain/contracts/AlertSystem.sol)** - Alert management with types
- **[blockchain/README.md](./blockchain/README.md)** - Contract documentation

### 📡 Edge Server Code
**Modular Structure**:
```
edge_server/
├── index.js                          # Main Express app
├── constants.js                      # Enums (ALERT_TYPE, VEHICLE_CATEGORY, etc.)
│
├── config/
│   └── config.js                     # Configuration management
│
├── services/                         # Business logic
│   ├── blockchain.js                 # Blockchain operations
│   └── decisionEngine.js              # Sensor analysis
│
├── routes/                           # API endpoints
│   ├── health.js                     # Health & stats
│   ├── vehicles.js                   # Vehicle management
│   └── alerts.js                     # Alert management
│
├── middleware/
│   └── validation.js                 # Input validation
│
└── utils/
    └── logger.js                     # Logging
```

### 🔧 Implementation Guides
- **[edge_server/IMPLEMENTATION_GUIDE.md](./edge_server/IMPLEMENTATION_GUIDE.md)** - Advanced configuration
- **[edge_server/QUICK_START.md](./edge_server/QUICK_START.md)** - Original quick start

### 📊 Project Status
| Component | Status | Lines of Code | Documentation |
|-----------|--------|---------------|---------------|
| VehicleRegistry.sol | ✅ Enhanced | 92 | Complete |
| AlertSystem.sol | ✅ Enhanced | 180+ | Complete |
| Edge Server | ✅ Refactored | ~1,395 (9 modules) | Complete |
| Decision Engine | ✅ Expanded | 170 | Complete |
| API Endpoints | ✅ All Working | 9 endpoints | Complete |
| Documentation | ✅ Comprehensive | 3,000+ lines | Complete |

---

## 🎯 Feature Overview

### Smart Contract Features
- ✅ **Vehicle Categories**: NORMAL_VEHICLE, EMERGENCY_VEHICLE, RSU
- ✅ **Trust Scoring**: 0-100 score with admin updates
- ✅ **Alert Types**: ACCIDENT, HAZARD, CONGESTION, EMERGENCY
- ✅ **Alert Priorities**: LOW, MEDIUM, HIGH, CRITICAL
- ✅ **Emergency Broadcasting**: Exclusive to emergency vehicles
- ✅ **Role-based Access**: Different permissions for each vehicle type
- ✅ **Event Emissions**: Full audit trail

### Decision Engine Features
- ✅ **11 Alert Triggers**: From collision detection to weather warnings
- ✅ **Sensor Integration**: Processes speed, visibility, temperature, weather
- ✅ **Automatic Alerts**: Sends appropriate alerts based on conditions
- ✅ **Priority Assignment**: Correctly maps severity to priority levels

### API Endpoints (9 total)
```
Health & Stats:
  GET /health                              # Server status
  GET /api/stats                           # Statistics

Vehicle Management:
  POST /api/initialize                     # Initialize with contract addresses
  POST /api/vehicle/register               # Register vehicle with category
  GET /api/vehicle/check/:address          # Check vehicle registration

Alert Management:
  POST /api/alert/send                     # Send regular alert
  POST /api/alert/emergency-broadcast      # Emergency broadcast (exclusive)
  GET /api/alert/all                       # Get all alerts
  GET /api/alert/by-type/:type             # Filter alerts by type
  GET /api/alert/emergency                 # Get only emergency alerts
  POST /api/alert/process-sensor-data      # Auto-trigger alerts from sensors
```

---

## 📖 Documentation Map

### For Developers
**Want to understand the code?**
1. Start: [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md)
2. Then: Read individual module files in order (blockchain → decisionEngine → routes)
3. Reference: [constants.js](./edge_server/constants.js) for enums

**Want to add features?**
1. For sensors: Edit [services/decisionEngine.js](./edge_server/services/decisionEngine.js)
2. For endpoints: Edit [routes/alerts.js](./edge_server/routes/alerts.js) or create new route
3. For validation: Edit [middleware/validation.js](./edge_server/middleware/validation.js)

**Want to deploy?**
1. See: [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md)
2. Then: [IMPLEMENTATION_GUIDE.md](./edge_server/IMPLEMENTATION_GUIDE.md)

### For System Architects
1. Start: [Plan.md](./Plan.md)
2. Then: [ARCHITECTURE_DIAGRAMS.md](./edge_server/ARCHITECTURE_DIAGRAMS.md)
3. Reference: [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)

### For Smart Contract Developers
1. Start: [blockchain/contracts/VehicleRegistry.sol](./blockchain/contracts/VehicleRegistry.sol)
2. Then: [blockchain/contracts/AlertSystem.sol](./blockchain/contracts/AlertSystem.sol)
3. Deploy: [blockchain/scripts/deploy.js](./blockchain/scripts/deploy.js)

### For Project Managers
1. Status: [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)
2. Overview: [README.md](./README.md)
3. Timeline: [Plan.md](./Plan.md)

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Setup blockchain
cd blockchain
npm install
ganache --accounts 10 --host 127.0.0.1 &
npx hardhat run scripts/deploy.js --network ganache
# Note: contract addresses

# 2. Setup edge server
cd ../edge_server
npm install
echo "PORT=3000
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_PRIVATE_KEY=0x..." > .env
npm start

# 3. Initialize
curl -X POST http://localhost:3000/api/initialize \
  -H "Content-Type: application/json" \
  -d '{"registryAddress": "0x...", "alertSystemAddress": "0x..."}'

# 4. Test
curl http://localhost:3000/health
```

Full guide: [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md)

---

## 🔗 File References

### Smart Contracts
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| [VehicleRegistry.sol](./blockchain/contracts/VehicleRegistry.sol) | Solidity | 92 | Vehicle management with categories |
| [AlertSystem.sol](./blockchain/contracts/AlertSystem.sol) | Solidity | 180+ | Alert handling with types |
| [deploy.js](./blockchain/scripts/deploy.js) | Script | - | Deployment script |

### Edge Server (Modular)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| [index.js](./edge_server/index.js) | Main | 73 | Express app setup |
| [constants.js](./edge_server/constants.js) | Config | 47 | Enums |
| [config/config.js](./edge_server/config/config.js) | Config | 65 | Configuration |
| [services/blockchain.js](./edge_server/services/blockchain.js) | Service | 280 | Blockchain ops |
| [services/decisionEngine.js](./edge_server/services/decisionEngine.js) | Service | 170 | Sensor analysis |
| [routes/vehicles.js](./edge_server/routes/vehicles.js) | Routes | 150 | Vehicle endpoints |
| [routes/alerts.js](./edge_server/routes/alerts.js) | Routes | 300+ | Alert endpoints |
| [routes/health.js](./edge_server/routes/health.js) | Routes | 50 | Health endpoints |
| [middleware/validation.js](./edge_server/middleware/validation.js) | Middleware | 200 | Validation |
| [utils/logger.js](./edge_server/utils/logger.js) | Utility | 60 | Logging |

### Documentation
| File | Audience | Read Time | Content |
|------|----------|-----------|---------|
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Everyone | 10 min | Project status & overview |
| [README.md](./README.md) | Everyone | 10 min | Main documentation |
| [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md) | Developers | 20 min | Detailed module guide |
| [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md) | Developers | 15 min | Getting started |
| [ARCHITECTURE_DIAGRAMS.md](./edge_server/ARCHITECTURE_DIAGRAMS.md) | Architects | 15 min | System diagrams |
| [IMPLEMENTATION_GUIDE.md](./edge_server/IMPLEMENTATION_GUIDE.md) | DevOps | 20 min | Advanced config |
| [Plan.md](./Plan.md) | Managers | 10 min | Original plan |

---

## 📞 Key Concepts

### Vehicle Categories (Smart Contract)
```javascript
enum VehicleCategory {
  NORMAL_VEHICLE = 0,      // Regular vehicles
  EMERGENCY_VEHICLE = 1,   // Ambulances, police, fire
  RSU = 2                  // Road Side Units
}
```

### Alert Types (Smart Contract)
```javascript
enum AlertType {
  ACCIDENT = 0,     // Vehicle collision
  HAZARD = 1,       // Environmental/road hazards
  CONGESTION = 2,   // Traffic/speed issues
  EMERGENCY = 3     // Emergency vehicle alerts
}
```

### Alert Priorities (Smart Contract)
```javascript
enum AlertPriority {
  LOW = 0,          // General information
  MEDIUM = 1,       // Moderate alert
  HIGH = 2,         // Urgent alert
  CRITICAL = 3      // Immediate action required
}
```

### Trust Score
- Range: 0-100
- Managed by admin
- Restricts low-trust vehicles from sending non-critical alerts
- Calculated based on vehicle behavior

---

## 🎓 Learning Path

**If you're new to the project**:
1. Read: [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) (overview)
2. Read: [README.md](./README.md) (features)
3. Read: [Plan.md](./Plan.md) (goals)
4. Skim: [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md) (structure)
5. Try: [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md) (run it)

**If you want to modify the code**:
1. Read: [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md) (fully)
2. Read: Specific module you want to edit
3. Read: Related middleware/validation
4. Modify and test

**If you want to deploy**:
1. Read: [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md)
2. Read: [IMPLEMENTATION_GUIDE.md](./edge_server/IMPLEMENTATION_GUIDE.md)
3. Follow deployment steps

---

## ✅ What's Included

- ✅ Smart contracts with real-world features
- ✅ Modular edge server (9 focused modules)
- ✅ 9 fully functional API endpoints
- ✅ Advanced decision engine (11 triggers)
- ✅ Comprehensive documentation
- ✅ Example deployment scripts
- ✅ Configuration management
- ✅ Input validation
- ✅ Logging system
- ✅ Error handling

---

## 🎯 Next Steps

### To Run the System
→ See [QUICK_START_MODULAR.md](./edge_server/QUICK_START_MODULAR.md)

### To Understand the Code
→ See [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md)

### To Add Features
→ Edit appropriate module, see [MODULAR_ARCHITECTURE.md](./edge_server/MODULAR_ARCHITECTURE.md) "Extensibility" section

### To Deploy to Production
→ See [IMPLEMENTATION_GUIDE.md](./edge_server/IMPLEMENTATION_GUIDE.md)

---

**Project Status**: ✅ Complete & Ready for Use

Last Updated: January 2024
Version: 2.0.0
