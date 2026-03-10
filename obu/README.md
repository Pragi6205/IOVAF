# OBU (On-Board Unit) Simulator

On-Board Unit module for simulating connected vehicles in the IoV Blockchain system.

## Files

- `obu/src`: Python modules for OBU client, utilities, runner and Streamlit UI
- `obu/scripts`: Vehicle management scripts
- `obu/examples`: Demo scripts showing alert broadcasting and receiving
- `obu/vehicles.json`: Sample vehicle configurations
- `obu/requirements.txt`: Python dependencies
- `obu/USAGE_GUIDE.md`: Detailed usage documentation

## 🚀 Quick Start

### Option 1: Run the Streamlit UI (Interactive)

```bash
pip install -r obu/requirements.txt

# With environment variable (recommended - sets private key once)
export OBU_PRIVATE_KEY="0x<your_private_key>"
export OBU_VEHICLE_ID="veh_01"
export OBU_CATEGORY="0"
export OBU_EDGE_SERVERS='["http://localhost:3000"]'
streamlit run obu/src/ui_app.py

# Without environment (enter in UI)
streamlit run obu/src/ui_app.py
```

### Option 2: Run a Single OBU (Headless)

```bash
python3 obu/src/obu_runner.py \
  --private-key "0x<PK>" \
  --vehicle-id veh_1 \
  --category 0 \
  --register \
  --edge-server http://localhost:3000
```

### Option 3: Manage Multiple OBUs

```bash
# Start from file
python3 obu/scripts/manage_obu.py start --vehicles-file obu/vehicles.json

# Check status
python3 obu/scripts/manage_obu.py list

# Stop all
python3 obu/scripts/manage_obu.py stop
```

### Option 4: Run Demo Scripts

```bash
# Alert broadcasting and receiving demo
cd obu
python3 examples/alert_demo.py
```

## ✨ Key Features

### 📢 Alert Broadcasting
- Send hazard, accident, or congestion alerts to all vehicles
- Alerts stored on blockchain via smart contract
- Available to all other vehicles for real-time awareness

### 📨 Receipt of Alerts  
- View all alerts from the network
- Filter by type (ACCIDENT, HAZARD, CONGESTION, EMERGENCY)
- View emergency broadcasts only
- Real-time alert polling supported

### 🚨 Emergency Broadcasting (Emergency Vehicles Only)
- Send critical emergency messages
- Bypasses normal alert processing
- Propagates to all vehicles immediately

### 🔑 Session-Based Private Key
- Set `OBU_PRIVATE_KEY` environment variable once
- Private key cached in session
- No need to re-enter for every form

### 🌐 Configurable Edge Servers
- Set `OBU_EDGE_SERVERS` environment variable
- Supports JSON array or comma-separated list
- Random selection from available servers

## ⚙️ Configuration

### Environment Variables

```bash
# Vehicle Configuration
export OBU_PRIVATE_KEY="0x..."              # Vehicle private key (cached)
export OBU_VEHICLE_ID="veh_01"              # Vehicle identifier
export OBU_CATEGORY="0"                     # 0=NORMAL, 1=EMERGENCY, 2=RSU
export OBU_EDGE_SERVER="http://..."         # Single edge server URL

# Edge Servers (required)
export OBU_EDGE_SERVERS='["http://localhost:3000"]'    # JSON array
export OBU_EDGE_SERVERS="http://localhost:3000,..."    # Comma-separated

# Network Options
export OBU_HTTP_RETRIES="3"                 # HTTP retry attempts
export OBU_HTTP_BACKOFF="0.5"               # Retry backoff in seconds
```

## 📱 UI Tabs

### Tab 1: Register Vehicle
- Register vehicle on blockchain
- Requires private key from sidebar
- Shows transaction hash and block number

### Tab 2: Send Alert
- Send hazard, accident, or congestion alerts
- Choose priority (LOW, MEDIUM, HIGH)
- Alerts visible to all other vehicles

### Tab 3: Emergency Broadcast
- **Emergency vehicles only** (category=1)
- Send critical messages immediately
- Higher priority than regular alerts

### Tab 4: View Alerts
- Query blockchain for all alerts
- **Filter options:**
  - All Alerts
  - Emergency Only  
  - By Type (ACCIDENT, HAZARD, CONGESTION, EMERGENCY)
- See sender, message, type, priority, timestamp
- 🔄 Refresh button for real-time updates

## 📚 Python API

### Basic Usage

```python
from obu_client import VehicleOBU

# Create vehicle instance
obu = VehicleOBU(
    vehicle_private_key="0x...",
    vehicle_id="veh_01",
    vehicle_category=0  # 0=NORMAL, 1=EMERGENCY
)

# Register vehicle
response = obu.register()

# Send alert to all vehicles
alert_response = obu.send_alert(
    message="Debris on highway",
    alert_type=1,    # 1 = HAZARD
    priority=2       # 2 = HIGH
)

# Emergency vehicles: broadcast emergency
if obu.vehicle_category == 1:
    obu.emergency_broadcast("Ambulance approaching")

# Query alerts
all_alerts = obu.get_all_alerts()           # All alerts
emergency_only = obu.get_emergency_alerts() # Emergency only
hazards = obu.get_alerts_by_type(1)         # Type=HAZARD
```

### Alert Query Results

```python
alerts = obu.get_all_alerts()
# Returns:
{
  "totalAlerts": 5,
  "alerts": [
    {
      "message": "Debris on highway",
      "sender": "0x1234...5678",
      "timestamp": "2026-03-10T12:34:56Z",
      "alertType": "HAZARD",
      "priority": "HIGH",
      "isEmergencyBroadcast": false
    },
    ...
  ]
}
```

## 🔄 Alert Broadcasting Flow

```
Vehicle A sends alert
    ↓
Edge Server (validates & forwards)
    ↓
AlertSystem Smart Contract
    ↓
Blockchain (permanent storage)
    ↓
Vehicle B queries alerts ← retrieves from blockchain
```

**Sequence:**
1. Vehicle A calls `send_alert()` or `emergency_broadcast()`
2. Edge Server receives and validates alert
3. Calls AlertSystem contract to store on blockchain
4. Any Vehicle B can now query the alert
5. Vehicles can poll for new alerts periodically

## 📝 Example: Alert Polling Loop

```python
import time
from obu_client import VehicleOBU

obu = VehicleOBU("0x...", "veh_01", 0)

# Poll for alerts every 10 seconds
while True:
    alerts = obu.get_all_alerts()
    
    if alerts.get('totalAlerts', 0) > 0:
        print(f"Alerts available: {alerts['totalAlerts']}")
        for alert in alerts['alerts'][-3:]:
            print(f"  - {alert['message']} ({alert['alertType']})")
    
    time.sleep(10)
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Private Key: Not set" | Set `OBU_PRIVATE_KEY` env var or paste in sidebar |
| Edge server connection error | Verify edge server running (`npm start`) and port correct |
| "Contracts not initialized" | Check `EDGE_SERVER_REGISTRY_ADDRESS` is set in edge server |
| No alerts found | Verify other vehicles sent alerts to same edge server |
| "Only EMERGENCY vehicles..." | Set vehicle category to 1 for emergency broadcasts |

## 📖 For Detailed Information

See [USAGE_GUIDE.md](USAGE_GUIDE.md) for:
- Detailed configuration options
- Complete API reference  
- Alert polling patterns
- Multi-vehicle setups
- Advanced configuration
