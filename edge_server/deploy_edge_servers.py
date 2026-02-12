#!/usr/bin/env python3
"""
Edge Server Deployment Script
Deploys multiple instances of the edge server on consecutive ports.

Usage:
    python deploy_edge_servers.py <num_instances> [--start-port PORT]
    
Examples:
    python deploy_edge_servers.py 3                  # Deploy 3 instances on ports 3000, 3001, 3002
    python deploy_edge_servers.py 5 --start-port 8000  # Deploy 5 instances on ports 8000, 8001, ...
"""

import sys
import subprocess
import time
import os
import signal
import argparse
from pathlib import Path

# Default configuration
DEFAULT_START_PORT = 3000
SCRIPT_DIR = Path(__file__).parent.resolve()
EDGE_SERVER_DIR = SCRIPT_DIR

def validate_node_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"✓ Node.js {result.stdout.strip()} is installed")
        return True
    except FileNotFoundError:
        print("✗ Error: Node.js is not installed or not in PATH")
        return False

def check_dependencies(edge_server_dir):
    """Check if dependencies are installed"""
    node_modules = edge_server_dir / 'node_modules'
    if not node_modules.exists():
        print("⚠ Dependencies not found. Running 'npm install'...")
        try:
            subprocess.run(
                ['npm', 'install'],
                cwd=edge_server_dir,
                check=True,
                capture_output=True
            )
            print("✓ Dependencies installed")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install dependencies: {e}")
            return False
    print("✓ Dependencies already installed")
    return True

def is_port_available(port):
    """Check if a port is available"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        result = sock.connect_ex(('localhost', port))
        available = result != 0
        sock.close()
        return available
    except Exception:
        return False

def start_edge_server(instance_id, port, edge_server_dir):
    """Start a single edge server instance"""
    if not is_port_available(port):
        print(f"✗ Instance {instance_id}: Port {port} is already in use")
        return None
    
    try:
        # Set environment variables and start the server
        env = os.environ.copy()
        env['PORT'] = str(port)
        
        # Use nohup on Unix-like systems or START on Windows
        if sys.platform == 'win32':
            process = subprocess.Popen(
                ['npm', 'start'],
                cwd=edge_server_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # On Unix/Linux/Mac: use nohup to run in background
            log_file = edge_server_dir / f'edge_server_instance_{instance_id}.log'
            process = subprocess.Popen(
                ['npm', 'start'],
                cwd=edge_server_dir,
                env=env,
                stdout=open(log_file, 'w'),
                stderr=subprocess.STDOUT,
                preexec_fn=os.setsid  # Create new process group
            )
        
        return process
    except Exception as e:
        print(f"✗ Instance {instance_id}: Failed to start - {e}")
        return None

def deploy_servers(num_instances, start_port, edge_server_dir):
    """Deploy multiple edge server instances"""
    
    print(f"\n{'='*60}")
    print(f"Edge Server Deployment Manager")
    print(f"{'='*60}")
    print(f"Number of instances: {num_instances}")
    print(f"Starting port: {start_port}")
    print(f"Port range: {start_port} - {start_port + num_instances - 1}")
    print(f"{'='*60}\n")
    
    # Validate Node.js is installed
    if not validate_node_installed():
        sys.exit(1)
    
    # Check and install dependencies
    if not check_dependencies(edge_server_dir):
        sys.exit(1)
    
    processes = []
    
    # Start each instance
    for i in range(num_instances):
        port = start_port + i
        instance_id = i + 1
        
        print(f"Starting instance {instance_id} on port {port}...", end=" ", flush=True)
        
        process = start_edge_server(instance_id, port, edge_server_dir)
        
        if process:
            processes.append({
                'id': instance_id,
                'port': port,
                'process': process,
                'pid': process.pid
            })
            print(f"✓ (PID: {process.pid})")
            time.sleep(1)  # Small delay between starts
        else:
            print("✗")
    
    if not processes:
        print("\n✗ Failed to start any instances")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"✓ Successfully started {len(processes)} edge server instance(s)")
    print(f"{'='*60}\n")
    
    # Display server information
    print("Edge Server Instances Running:\n")
    for proc in processes:
        print(f"  Instance {proc['id']}: http://localhost:{proc['port']}")
        print(f"    - PID: {proc['pid']}")
        print(f"    - Health Check: http://localhost:{proc['port']}/health")
        print(f"    - Endpoints:")
        print(f"      • POST /api/initialize (Set contract addresses)")
        print(f"      • POST /api/vehicle/register (Register vehicle)")
        print(f"      • POST /api/alert/send (Send alert to blockchain)")
        print(f"      • GET /api/alert/all (Get all alerts)")
        print(f"")
    
    # Display instructions
    print(f"{'='*60}")
    print("IMPORTANT: Next Steps")
    print(f"{'='*60}")
    print("1. Deploy your Hardhat contracts:")
    print("   $ cd blockchain && npx hardhat run scripts/deploy.js --network ganache")
    print("")
    print("2. Initialize each edge server with contract addresses:")
    print("   $ curl -X POST http://localhost:3000/api/initialize \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{")
    print("       \"registryAddress\": \"0x...\",")
    print("       \"alertSystemAddress\": \"0x...\"")
    print("     }'")
    print("")
    print("3. Check server health:")
    print("   $ curl http://localhost:3000/health")
    print("")
    print("4. To stop servers, run:")
    print("   $ python stop_edge_servers.py")
    print(f"{'='*60}\n")
    
    return processes

def save_deployment_info(processes, edge_server_dir):
    """Save deployment information to a file for later reference"""
    info_file = edge_server_dir / 'deployment_info.json'
    
    import json
    deployment_info = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'instances': [
            {
                'id': proc['id'],
                'port': proc['port'],
                'pid': proc['pid'],
                'url': f'http://localhost:{proc["port"]}'
            }
            for proc in processes
        ]
    }
    
    with open(info_file, 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"Deployment info saved to: {info_file}")

def main():
    parser = argparse.ArgumentParser(
        description='Deploy multiple instances of the edge server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy_edge_servers.py 3                    # Deploy 3 instances on ports 3000, 3001, 3002
  python deploy_edge_servers.py 5 --start-port 8000  # Deploy 5 instances starting at port 8000
        """
    )
    
    parser.add_argument(
        'num_instances',
        type=int,
        help='Number of edge server instances to deploy'
    )
    
    parser.add_argument(
        '--start-port',
        type=int,
        default=DEFAULT_START_PORT,
        help=f'Starting port number (default: {DEFAULT_START_PORT})'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.num_instances < 1:
        print("Error: Number of instances must be at least 1")
        sys.exit(1)
    
    if args.num_instances > 100:
        print("Error: Too many instances (max 100)")
        sys.exit(1)
    
    if args.start_port < 1024 or args.start_port > 65000:
        print("Error: Port must be between 1024 and 65000")
        sys.exit(1)
    
    # Deploy servers
    processes = deploy_servers(args.num_instances, args.start_port, EDGE_SERVER_DIR)
    
    # Save deployment info
    save_deployment_info(processes, EDGE_SERVER_DIR)
    
    # Keep script running
    try:
        print("Press Ctrl+C to stop all servers\n")
        while True:
            time.sleep(1)
            # Check if any process died
            for proc in processes:
                if proc['process'].poll() is not None:
                    print(f"⚠ Instance {proc['id']} (port {proc['port']}) has stopped")
    except KeyboardInterrupt:
        print("\n\nShutting down all edge server instances...")
        
        for proc in processes:
            try:
                if sys.platform == 'win32':
                    proc['process'].terminate()
                else:
                    os.killpg(os.getpgid(proc['pid']), signal.SIGTERM)
                print(f"  ✓ Stopped Instance {proc['id']} (port {proc['port']})")
            except Exception as e:
                print(f"  ✗ Error stopping instance {proc['id']}: {e}")
        
        print("\nAll edge servers stopped")
        sys.exit(0)

if __name__ == '__main__':
    main()
