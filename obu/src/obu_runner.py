"""Run a single OBU simulation from the command line.

Example:
  python obu/src/obu_runner.py --private-key <pk> --vehicle-id veh1 --category 0
"""
import argparse
import time
import random
import logging
import os
import json
from obu_client import VehicleOBU

logging.basicConfig(level=logging.INFO)
log = logging.getLogger('obu.runner')


def random_sensor_data():
    return {
        'speed': random.uniform(0, 120),
        'acceleration': random.uniform(-5, 5),
        'gps': {'lat': 12.34 + random.random() * 0.01, 'lon': 56.78 + random.random() * 0.01},
        'obstacle_distance': random.uniform(0, 200)
    }


def load_contract_addresses():
    """Load contract addresses from deployment_info.json if available"""
    try:
        # Try to load from edge_server deployment info
        info_path = os.path.join(os.path.dirname(__file__), '../../edge_server/deployment_info.json')
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                data = json.load(f)
                return {
                    'registryAddress': data.get('vehicleRegistryAddress'),
                    'alertSystemAddress': data.get('alertSystemAddress'),
                    'edgeServerRegistryAddress': data.get('edgeServerRegistryAddress')
                }
    except Exception as e:
        log.warning(f"Could not load contract addresses: {e}")
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--private-key', required=True)
    parser.add_argument('--vehicle-id', required=True)
    parser.add_argument('--category', type=int, default=0)
    parser.add_argument('--edge-server', default=None)
    parser.add_argument('--register', action='store_true')
    parser.add_argument('--interval', type=float, default=8.0)
    args = parser.parse_args()

    edge_servers = [args.edge_server] if args.edge_server else None
    obu = VehicleOBU(args.private_key, args.vehicle_id, args.category, edge_servers=edge_servers)

    # Try to initialize edge server with contract addresses if not already done
    if edge_servers or not args.edge_server:
        contract_addrs = load_contract_addresses()
        if contract_addrs and all(contract_addrs.values()):
            server = obu._choose_server()
            try:
                res = obu.initialize_server(server, contract_addrs)
                if res and res.get('message') != 'Edge server initialized successfully':
                    log.warning(f'Server initialization might not be needed: {res}')
            except Exception as e:
                log.debug(f'Could not initialize server (may already be initialized): {e}')

    if args.register:
        res = obu.register()
        log.info('Register result: %s', res)

    try:
        while True:
            sd = random_sensor_data()
            res = obu.process_sensor_data(sd, is_emergency_vehicle=(args.category == 1))
            log.info('Processed sensor => %s', res)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        log.info('OBU %s stopping', args.vehicle_id)


if __name__ == '__main__':
    main()
