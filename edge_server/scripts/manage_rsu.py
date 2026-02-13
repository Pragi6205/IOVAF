#!/usr/bin/env python3
"""
manage_rsu.py - Unified RSU manager

Usage:
  manage_rsu.py start --id ID --port PORT
  manage_rsu.py stop --id ID
  manage_rsu.py status --id ID
  manage_rsu.py list
  manage_rsu.py logs --id ID
  manage_rsu.py deploy --count N --start-port PORT [--admin-key KEY]

This script manages RSU (edge server) processes by creating PID files
and writing logs to the configured logs directory. It can also deploy
multiple instances and call the Node registrar to register them on-chain.
"""

import argparse
import subprocess
import os
from pathlib import Path
import sys
import time
import json
import signal
import socket

SCRIPT_DIR = Path(__file__).parent.resolve()
EDGE_SERVER_DIR = SCRIPT_DIR
PIDS_DIR = EDGE_SERVER_DIR / 'pids'
LOGS_OUT_DIR = EDGE_SERVER_DIR / 'logs'


def ensure_dir(d: Path):
    try:
        d.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass


def pidfile_for(id_):
    ensure_dir(PIDS_DIR)
    return str(PIDS_DIR / f'rsu_{id_}.pid')


def logfile_for(id_, port):
    ensure_dir(LOGS_OUT_DIR)
    return str(LOGS_OUT_DIR / f'rsu_{id_}_{port}.log')


def write_pid(pidfile, pid):
    try:
        with open(pidfile, 'w') as f:
            f.write(str(pid))
    except Exception:
        pass


def read_pid(pidfile):
    try:
        with open(pidfile, 'r') as f:
            return int(f.read().strip())
    except Exception:
        return None


def is_running(pid):
    try:
        os.kill(pid, 0)
        return True
    except Exception:
        return False


def stop_pid(pidfile):
    pid = read_pid(pidfile)
    if not pid:
        return False
    try:
        os.kill(pid, signal.SIGTERM)
        return True
    except Exception:
        return False


def is_port_available(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        res = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return res != 0
    except Exception:
        return False


def validate_node_installed():
    try:
        subprocess.run(['node', '--version'], check=True, capture_output=True)
        return True
    except Exception:
        print('Error: Node.js is not installed or not in PATH')
        return False


def check_dependencies(edge_server_dir: Path):
    node_modules = edge_server_dir / 'node_modules'
    if not node_modules.exists():
        print("Dependencies not found. Running 'npm install'...")
        try:
            subprocess.run(['npm', 'install'], cwd=str(edge_server_dir), check=True)
            return True
        except subprocess.CalledProcessError as e:
            print('Failed to install dependencies:', e)
            return False
    return True


def start_instance(id_, port, env_overrides=None):
    if not is_port_available(port):
        print(f'Port {port} is in use')
        return None

    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)

    logfile = open(logfile_for(id_, port), 'a')

    try:
        proc = subprocess.Popen(['npm', 'start'], cwd=str(EDGE_SERVER_DIR), stdout=logfile, stderr=subprocess.STDOUT, env=env)
        write_pid(pidfile_for(id_), proc.pid)
        return proc
    except Exception as e:
        print('Failed to start instance:', e)
        return None


def stop_instance(id_):
    pidfile = pidfile_for(id_)
    pid = read_pid(pidfile)
    if not pid:
        print(f'Instance {id_} not found')
        return
    try:
        os.kill(pid, signal.SIGTERM)
        try:
            Path(pidfile).unlink()
        except Exception:
            pass
        print(f'Stopped instance {id_} (pid {pid})')
    except Exception as e:
        print('Failed to stop instance:', e)


def status_instance(id_):
    pidfile = pidfile_for(id_)
    pid = read_pid(pidfile)
    if not pid:
        print(f'Instance {id_} not found')
        return
    print(f'Instance {id_} pid: {pid} running={is_running(pid)}')


def list_instances():
    ensure_dir(PIDS_DIR)
    pids = list(PIDS_DIR.glob('rsu_*.pid'))
    if not pids:
        print('No managed RSU instances (no pid files)')
        return
    for p in pids:
        id_ = p.stem.split('_', 1)[1]
        pid = read_pid(str(p))
        print(f'ID={id_} PID={pid} running={is_running(pid)}')


def show_logs(id_):
    ensure_dir(LOGS_OUT_DIR)
    matches = list(LOGS_OUT_DIR.glob(f'rsu_{id_}_*.log'))
    if not matches:
        print('No log files found for', id_)
        return
    for m in matches:
        print(f'----- {m} -----')
        try:
            print(m.read_text()[:2000])
        except Exception:
            print('(unable to read log file)')


def deploy_instances(count, start_port, admin_key=None):
    if not validate_node_installed():
        sys.exit(1)
    if not check_dependencies(EDGE_SERVER_DIR):
        sys.exit(1)

    # read .env from edge_server dir to merge into child envs
    edge_env = {}
    env_file = EDGE_SERVER_DIR / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                edge_env[k.strip()] = v.strip()

    processes = []
    deployment = {'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'), 'instances': []}

    for i in range(count):
        id_ = i + 1
        port = start_port + i
        if not is_port_available(port):
            print(f'✗ Instance {id_}: Port {port} is already in use, skipping')
            continue

        pk = '0x' + os.urandom(32).hex()
        child_env = os.environ.copy()
        child_env['PORT'] = str(port)
        child_env['GANACHE_PRIVATE_KEY'] = pk
        child_env['LOG_DIR'] = str(LOGS_OUT_DIR)
        for k, v in edge_env.items():
            if k not in child_env:
                child_env[k] = v

        print(f'Starting instance {id_} on port {port}...', end=' ', flush=True)
        proc = start_instance(id_, port, env_overrides=child_env)
        if not proc:
            print('✗')
            continue
        print(f'PID={proc.pid}')
        processes.append({'id': id_, 'port': port, 'pid': proc.pid, 'privateKey': pk})
        time.sleep(0.5)

    if not processes:
        print('\n✗ Failed to start any instances')
        return

    # register instances using node registrar
    for p in processes:
        id_ = p['id']
        port = p['port']
        pk = p['privateKey']
        reg_cmd = ['node', 'scripts/register_edge_server.js', '--private-key', pk, '--server-id', f'RSU-{id_}', '--location', f'port:{port}']
        reg_env = os.environ.copy()
        for k, v in edge_env.items():
            if k not in reg_env:
                reg_env[k] = v
        if admin_key:
            reg_env['ADMIN_PRIVATE_KEY'] = admin_key

        fund_amount = os.environ.get('FUND_AMOUNT', '0.05')
        if fund_amount:
            reg_cmd += ['--fund-amount', str(fund_amount)]

        print(f'Registering instance {id_} via registrar...')
        reg_proc = subprocess.run(reg_cmd, cwd=str(EDGE_SERVER_DIR), env=reg_env, capture_output=True, text=True)
        tx = None
        if reg_proc.returncode == 0:
            try:
                out = reg_proc.stdout.strip()
                res = json.loads(out)
                tx = res.get('txHash')
                print(f'Registration success tx={tx}')
            except Exception:
                print('Registrar succeeded (no JSON output)')
        else:
            print('Registrar failed:', reg_proc.stderr.strip()[:400])

        deployment['instances'].append({'id': id_, 'port': port, 'pid': p['pid'], 'txHash': tx, 'url': f'http://localhost:{port}'})

    # write deployment info
    try:
        with open(str(EDGE_SERVER_DIR / 'deployment_info.json'), 'w') as f:
            json.dump(deployment, f, indent=2)
        print('Wrote deployment_info.json')
    except Exception as e:
        print('Failed to write deployment_info.json:', e)


def main():
    parser = argparse.ArgumentParser(description='Manage RSU edge server instances')
    sub = parser.add_subparsers(dest='cmd')

    p_start = sub.add_parser('start')
    p_start.add_argument('--id', required=True)
    p_start.add_argument('--port', required=True, type=int)

    p_stop = sub.add_parser('stop')
    p_stop.add_argument('--id', required=True)

    p_status = sub.add_parser('status')
    p_status.add_argument('--id', required=True)

    p_list = sub.add_parser('list')

    p_deploy = sub.add_parser('deploy')
    p_deploy.add_argument('--count', required=True, type=int, help='Number of instances to deploy')
    p_deploy.add_argument('--start-port', required=True, type=int, help='Starting port for instances')
    p_deploy.add_argument('--admin-key', required=False, help='Admin private key for on-chain registration (or set ADMIN_PRIVATE_KEY env)')

    p_logs = sub.add_parser('logs')
    p_logs.add_argument('--id', required=True)

    p_stopall = sub.add_parser('stop-all')

    args = parser.parse_args()

    if args.cmd == 'start':
        start_instance(args.id, args.port)
    elif args.cmd == 'stop':
        stop_instance(args.id)
    elif args.cmd == 'status':
        status_instance(args.id)
    elif args.cmd == 'list':
        list_instances()
    elif args.cmd == 'logs':
        show_logs(args.id)
    elif args.cmd == 'deploy':
        admin_key = args.admin_key or os.environ.get('ADMIN_PRIVATE_KEY')
        if not admin_key:
            print('Warning: no admin key provided; registration may fail unless ADMIN_PRIVATE_KEY is set in environment')
        deploy_instances(args.count, args.start_port, admin_key)
    elif args.cmd == 'stop-all':
        # stop all recorded pids
        ensure_dir(PIDS_DIR)
        stopped = 0
        for p in PIDS_DIR.glob('rsu_*.pid'):
            pid = read_pid(str(p))
            if pid and is_running(pid):
                try:
                    os.kill(pid, signal.SIGTERM)
                    stopped += 1
                except Exception:
                    pass
        print(f'Stopped {stopped} instances')
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
