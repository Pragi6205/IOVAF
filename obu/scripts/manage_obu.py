#!/usr/bin/env python3
"""Manage multiple OBU runner instances: start, stop, list."""
import argparse
import json
import os
import subprocess
import signal
import time

PIDS_FILE = os.path.join(os.path.dirname(__file__), '..', 'obu_pids.json')


def load_vehicles(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)


def save_pids(pids):
    with open(PIDS_FILE, 'w') as f:
        json.dump(pids, f)


def load_pids():
    if not os.path.exists(PIDS_FILE):
        return {}
    with open(PIDS_FILE, 'r') as f:
        return json.load(f)


def start(vehicles_file, count=None, use_streamlit=False):
    vehicles = load_vehicles(vehicles_file)
    pids = load_pids()

    to_start = vehicles if count is None else vehicles[:count]

    if use_streamlit:
        # Start Streamlit UI instances for each vehicle
        base_port = 8501
        print(f'\n{"="*60}')
        print('Starting Streamlit UI instances for vehicles')
        print(f'{"="*60}\n')
        
        for idx, v in enumerate(to_start):
            pk = v['vehiclePrivateKey']
            vid = v['vehicleId']
            cat = v.get('vehicleCategory', 0)
            edge = v.get('edgeServer', '')
            port = base_port + idx

            env = os.environ.copy()
            env['OBU_VEHICLE_ID'] = vid
            env['OBU_PRIVATE_KEY'] = pk
            env['OBU_CATEGORY'] = str(cat)
            env['OBU_EDGE_SERVER'] = edge or ''

            ui_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'ui_app.py')
            cmd = [
                'python', '-m',
                'streamlit', 'run', ui_path,
                '--server.port', str(port),
                '--server.headless', 'true'
            ]

            print(f'Starting Streamlit for {vid} on http://localhost:{port}')
            p = subprocess.Popen(cmd, env=env)
            pids[vid] = p.pid
            time.sleep(0.5)

        save_pids(pids)
        print(f'\n{"="*60}')
        print(f'Started {len(to_start)} Streamlit UI instances')
        print(f'{"="*60}\n')
        print('Use Ctrl+C to stop all instances')
        
        try:
            # Keep the parent process alive so logs continue to print
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print('\nShutting down all instances...')
            stop_all()
    else:
        # Traditional OBU runner processes
        for v in to_start:
            pk = v['vehiclePrivateKey']
            vid = v['vehicleId']
            cat = v.get('vehicleCategory', 0)
            edge = v.get('edgeServer')

            cmd = [
                'python3', os.path.join(os.path.dirname(__file__), '..', 'src', 'obu_runner.py'),
                '--private-key', pk,
                '--vehicle-id', vid,
                '--category', str(cat),
                '--register'
            ]
            if edge:
                cmd += ['--edge-server', edge]

            print('Starting', vid)
            p = subprocess.Popen(cmd)
            pids[vid] = p.pid
            time.sleep(0.2)

        save_pids(pids)
        print('Started', len(to_start), 'OBUs')


def stop_all():
    pids = load_pids()
    for vid, pid in list(pids.items()):
        try:
            print('Stopping', vid, pid)
            os.kill(pid, signal.SIGTERM)
            time.sleep(0.1)
            pids.pop(vid, None)
        except Exception as e:
            print('Error stopping', vid, e)
    save_pids(pids)
    print('Stopped all known OBUs')


def list_running():
    pids = load_pids()
    print('Known OBUs:')
    for vid, pid in pids.items():
        print('-', vid, pid)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd')

    p_start = sub.add_parser('start')
    p_start.add_argument('--vehicles-file', default=os.path.join(os.path.dirname(__file__), '..', 'vehicles.json'))
    p_start.add_argument('--count', type=int, default=None)
    p_start.add_argument('--ui', action='store_true', help='Start Streamlit UI instances instead of background runners')

    sub.add_parser('stop')
    sub.add_parser('list')

    args = parser.parse_args()

    if args.cmd == 'start':
        start(args.vehicles_file, args.count, use_streamlit=args.ui)
    elif args.cmd == 'stop':
        stop_all()
    elif args.cmd == 'list':
        list_running()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
