"""Run a single OBU simulation from the command line.

Example:
  python obu/src/obu_runner.py --private-key <pk> --vehicle-id veh1 --category 0
"""
import argparse
import time
import random
import logging
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
