# Architecture: Vehicles vs Edge Servers

## Overview

The IoV system now uses **separate hierarchies** for **Vehicles** and **Edge Infrastructure** (RSUs/Edge Servers). This clean separation of concerns ensures:

- ✅ Vehicles manage passenger/emergency vehicles only
- ✅ Edge Servers manage infrastructure (RSUs)
- ✅ Clear operational boundaries
- ✅ Independent scaling and management

## Contract Structure

### Three Smart Contracts

```
VehicleRegistry.sol
├── Purpose: Vehicle identity and trust
├── Categories: NORMAL_VEHICLE, EMERGENCY_VEHICLE
├── Data: Vehicle ID, category, trust score
└── Operations: Register, check, update trust

EdgeServerRegistry.sol
├── Purpose: RSU/Edge Infrastructure management
├── Data: Server ID, location, performance score
├── Status: Active/Inactive
└── Operations: Register, monitor performance, activate/deactivate

AlertSystem.sol
├── Purpose: Alert handling and routing
├── Dependencies: Both registries (vehicle + edge server)
├── Operations: Send alerts, relay (edge servers only)
└── Permissions: Based on vehicle type and edge server status
```

## Key Differences

### Vehicles (VehicleRegistry)
| Aspect | Details |
|--------|---------|
| Entities | Cars, trucks, ambulances, police cars, fire trucks |
| Categories | 2 types: NORMAL_VEHICLE, EMERGENCY_VEHICLE |
| Registration | Vehicle owners / fleet managers |
| Metrics | Trust score (behavior-based) |
| Lifecycle | Registered → Active → Deactivated |
| Focus | Identity, trustworthiness, role-based permissions |

### Edge Servers (EdgeServerRegistry)
| Aspect | Details |
|--------|---------|
| Entities | Road Side Units (RSUs), base stations, edge nodes |
| Status | Active or Inactive (not categorized) |
| Registration | Network administrators |
| Metrics | Performance score (QoS-based) |
| Lifecycle | Registered → Active → Deactivated |
| Focus | Infrastructure health, service quality, alert relay |

## Data Flow

### Alert Routing

```
┌─────────────────────┐
│  Vehicle Sends      │
│  Alert              │
└──────────┬──────────┘
           │
           ├─ Check: VehicleRegistry.isRegistered(vehicle)
           ├─ Check: VehicleRegistry.getTrustScore(vehicle)
           │
           ▼
┌─────────────────────┐
│  AlertSystem        │
│  sendAlert()        │
└──────────┬──────────┘
           │
           ├─ Store in blockchain
           └─ Emit AlertSent event
```

### Alert Relay (Edge Server Only)

```
┌───────────────────────┐
│  Edge Server Relays   │
│  Alert from Vehicle   │
└──────────┬────────────┘
           │
           ├─ Check: EdgeServerRegistry.isActiveEdgeServer(sender)
           ├─ Check: VehicleRegistry.isRegistered(originVehicle)
           │
           ▼
┌───────────────────────┐
│  AlertSystem          │
│  relayAlert()         │
└──────────┬────────────┘
           │
           ├─ Store relayed alert
           └─ Emit AlertSent event
```

### Emergency Broadcast

```
┌──────────────────────────┐
│  Emergency Vehicle       │
│  (Police/Ambulance)      │
└──────────┬───────────────┘
           │
           ├─ Check: VehicleRegistry.isEmergencyVehicle(vehicle)
           │
           ▼
┌──────────────────────────┐
│  AlertSystem             │
│  emergencyBroadcast()    │
│  (CRITICAL priority)     │
└──────────┬───────────────┘
           │
           ├─ Store with isEmergencyBroadcast flag
           └─ Emit EmergencyAlertBroadcast event
```

## API Endpoints

### Vehicle Management
- `POST /api/vehicle/register` - Register vehicle (category 0-1)
- `GET /api/vehicle/check/:address` - Check vehicle status

### Alert Management
- `POST /api/alert/send` - Vehicle sends alert
- `POST /api/alert/emergency-broadcast` - Emergency vehicle broadcast
- `POST /api/alert/process-sensor-data` - Automatic alert from sensors

### Edge Server Management
Future endpoints for edge server management will be:
- `POST /api/edgeserver/register` - Register an RSU
- `GET /api/edgeserver/info/:address` - Get RSU information
- `PUT /api/edgeserver/performance/:address` - Update performance metrics
- `POST /api/edgeserver/deactivate/:address` - Deactivate RSU

## Trust Levels

### Vehicle Trust Score (0-100)
- **100** (New): Full permissions, can send any alert
- **50-99**: Can send critical alerts only
- **0-49**: Severely restricted (admin review needed)
- **0**: Can be blacklisted

### Edge Server Performance Score (0-100)
- **100** (Excellent): High uptime, fast relay
- **50-99** (Good): Acceptable performance
- **0-49** (Poor): At risk of deactivation

## Deployment

When deploying, contracts are initialized in order:

```javascript
// 1. Deploy VehicleRegistry (no dependencies)
VehicleRegistry → deployed

// 2. Deploy EdgeServerRegistry (no dependencies)  
EdgeServerRegistry → deployed

// 3. Deploy AlertSystem (depends on both)
AlertSystem(vehicleRegistryAddr, edgeServerRegistryAddr) → deployed
```

## Configuration

### Edge Server Initialization

```bash
POST /api/initialize
{
  "registryAddress": "0x...VehicleRegistry",
  "alertSystemAddress": "0x...AlertSystem",
  "edgeServerRegistryAddress": "0x...EdgeServerRegistry"
}
```

All three contracts must be provided for proper operation.

## Benefits of Separation

1. **Scalability**: Each registry manages its own entity type
2. **Flexibility**: Different operational policies for vehicles vs infrastructure
3. **Security**: Separate permission models
4. **Monitoring**: Independent metrics and scoring
5. **Maintainability**: Clear code organization
6. **Extensibility**: Easy to add vehicle types or edge server features without affecting other

## Future Enhancements

### Vehicle Registry Extensions
- Vehicle maintenance history
- Insurance information tracking
- Driver reputation scores
- Fleet analytics

### Edge Server Registry Extensions
- Zone-based management (regional grouping)
- Service capacity tracking
- Bandwidth monitoring
- Alert processing load balancing
- Server clustering and replication

### Alert System Enhancements
- Predictive alert routing (ML-based)
- Alert compression for long-range transmission
- Multi-hop relay optimization
- Edge server load balancing
