#!/bin/bash
# Edge Server Demo & Test Script
# This script demonstrates the complete workflow of the edge server

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EDGE_SERVER_URL="${1:-http://localhost:3000}"
VEHICLE_PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
VEHICLE_ADDRESS="0x70997970C51812e339D9B73B0245601B4ec4ba8e"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Edge Server Demo & Test Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

# Function to run curl with pretty output
run_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${GREEN}[TEST]${NC} $description"
    echo -e "  ${BLUE}$method $EDGE_SERVER_URL$endpoint${NC}"
    
    if [ -z "$data" ]; then
        curl -s -X $method "$EDGE_SERVER_URL$endpoint" \
            -H 'Content-Type: application/json' | jq '.' || echo "Failed"
    else
        echo -e "  ${BLUE}Body:${NC} $data"
        curl -s -X $method "$EDGE_SERVER_URL$endpoint" \
            -H 'Content-Type: application/json' \
            -d "$data" | jq '.' || echo "Failed"
    fi
    echo ""
}

# Test 1: Health Check
print_section "Test 1: Health Check"
run_api_call "GET" "/health" "" "Checking if edge server is running"

# Test 2: Initialize Server (REQUIRED)
print_section "Test 2: Initialize Edge Server with Contracts"
echo -e "${YELLOW}NOTE: You must first deploy the contracts and get the addresses!${NC}"
echo -e "${YELLOW}Run: cd blockchain && npx hardhat run scripts/deploy.js --network ganache${NC}"
echo ""
echo "Example initialization (YOU NEED TO UPDATE WITH YOUR ACTUAL ADDRESSES):"

INIT_DATA='{
  "registryAddress": "0x5FbDB2315678afccb333f8a9c36758534Cc6EBBf6",
  "alertSystemAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
}'

run_api_call "POST" "/api/initialize" "$INIT_DATA" "Initialize with contract addresses"

# Test 3: Check Server Health After Init
print_section "Test 3: Verify Initialization"
run_api_call "GET" "/health" "" "Verify contracts are initialized"

# Test 4: Register Vehicle
print_section "Test 4: Register Vehicle on Blockchain"

REGISTER_DATA=$(cat <<EOF
{
  "vehicleAddress": "$VEHICLE_ADDRESS",
  "vehicleId": "DEMO_VEHICLE_001"
}
EOF
)

run_api_call "POST" "/api/vehicle/register" "$REGISTER_DATA" "Register vehicle on blockchain"

# Test 5: Check Vehicle Registration
print_section "Test 5: Check if Vehicle is Registered"
run_api_call "GET" "/api/vehicle/check/$VEHICLE_ADDRESS" "" "Verify vehicle registration"

# Test 6: Send Alert
print_section "Test 6: Send Alert to Blockchain"

ALERT_DATA=$(cat <<EOF
{
  "vehiclePrivateKey": "$VEHICLE_PRIVATE_KEY",
  "alertMessage": "Accident detected on Highway 101 at coordinates (40.7128, -74.0060)",
  "alertType": "accident"
}
EOF
)

run_api_call "POST" "/api/alert/send" "$ALERT_DATA" "Send accident alert to blockchain"

# Test 7: Get All Alerts
print_section "Test 7: Get All Alerts from Blockchain"
run_api_call "GET" "/api/alert/all" "" "Retrieve all alerts"

# Test 8: Process Sensor Data (Hazard)
print_section "Test 8: Process Sensor Data - Low Visibility Alert"

SENSOR_DATA=$(cat <<EOF
{
  "vehiclePrivateKey": "$VEHICLE_PRIVATE_KEY",
  "sensorData": {
    "speed": 80,
    "collision": false,
    "visibility": 20,
    "temperature": 15,
    "gpsCoords": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
EOF
)

run_api_call "POST" "/api/process/sensor-data" "$SENSOR_DATA" "Process sensor data with low visibility"

# Test 9: Process Sensor Data (Extreme Cold)
print_section "Test 9: Process Sensor Data - Extreme Cold Alert"

SENSOR_DATA=$(cat <<EOF
{
  "vehiclePrivateKey": "$VEHICLE_PRIVATE_KEY",
  "sensorData": {
    "speed": 100,
    "collision": false,
    "visibility": 100,
    "temperature": -15,
    "gpsCoords": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
EOF
)

run_api_call "POST" "/api/process/sensor-data" "$SENSOR_DATA" "Process sensor data with extreme cold"

# Test 10: Process Sensor Data (Speeding)
print_section "Test 10: Process Sensor Data - Speeding Alert"

SENSOR_DATA=$(cat <<EOF
{
  "vehiclePrivateKey": "$VEHICLE_PRIVATE_KEY",
  "sensorData": {
    "speed": 150,
    "collision": false,
    "visibility": 100,
    "temperature": 20,
    "gpsCoords": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
EOF
)

run_api_call "POST" "/api/process/sensor-data" "$SENSOR_DATA" "Process sensor data with speeding"

# Test 11: Process Sensor Data (No Alert)
print_section "Test 11: Process Sensor Data - Normal Conditions"

SENSOR_DATA=$(cat <<EOF
{
  "vehiclePrivateKey": "$VEHICLE_PRIVATE_KEY",
  "sensorData": {
    "speed": 80,
    "collision": false,
    "visibility": 100,
    "temperature": 20,
    "gpsCoords": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
EOF
)

run_api_call "POST" "/api/process/sensor-data" "$SENSOR_DATA" "Process sensor data with normal conditions (no alert)"

# Test 12: Get Server Statistics
print_section "Test 12: Get Edge Server Statistics"
run_api_call "GET" "/api/stats" "" "Get server statistics"

# Test 13: Final Alert List
print_section "Test 13: Final Alert List"
run_api_call "GET" "/api/alert/all" "" "Show all alerts on blockchain"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Demo Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Key Takeaways:${NC}"
echo -e "  1. Edge server acts as interface between OBU and blockchain"
echo -e "  2. Sensor data is processed locally (Decision Engine)"
echo -e "  3. Only alerts are sent to blockchain (scalable)"
echo -e "  4. All alerts are immutably stored on-chain"
echo -e "  5. Smart contracts ensure only registered vehicles can alert"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  • Modify decision engine rules in index.js"
echo -e "  • Deploy multiple instances: python deploy_edge_servers.py 5"
echo -e "  • Integrate with real vehicle OBU systems"
echo -e "  • Add ML-based anomaly detection"
echo ""

echo -e "${YELLOW}Real-Time Event Listening:${NC}"
echo -e "  curl -N http://localhost:3000/api/alert/events"
echo ""
