import os
import json

# Edge servers can be provided as a JSON array string or comma-separated list
EDGE_SERVERS_RAW = os.environ.get('OBU_EDGE_SERVERS') or os.environ.get('EDGE_SERVERS')
if EDGE_SERVERS_RAW:
    try:
        EDGE_SERVERS = json.loads(EDGE_SERVERS_RAW)
    except Exception:
        EDGE_SERVERS = [s.strip() for s in EDGE_SERVERS_RAW.split(',') if s.strip()]
else:
    EDGE_SERVERS = [
        'http://localhost:3000',
        'http://localhost:3001'
    ]

# Default path to vehicles JSON (used by manager script)
VEHICLE_DATA_FILE = os.environ.get('OBU_VEHICLE_FILE', 'obu/vehicles.json')

# Network / retry defaults
HTTP_RETRIES = int(os.environ.get('OBU_HTTP_RETRIES', '3'))
HTTP_BACKOFF = float(os.environ.get('OBU_HTTP_BACKOFF', '0.5'))
