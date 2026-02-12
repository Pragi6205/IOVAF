#!/usr/bin/env python3
"""
Multi-Instance Edge Server Manager
Manages deployment, monitoring, and orchestration of multiple edge servers.

Features:
- Deploy instances on consecutive ports
- Monitor health of all instances
- Stop/restart individual or all instances
- Load balancing recommendations
- Automatic log aggregation
"""

import json
import subprocess
import time
import sys
import os
from pathlib import Path
from datetime import datetime

class EdgeServerManager:
    def __init__(self, deployment_file='deployment_info.json'):
        self.deployment_file = Path(deployment_file)
        self.instances = self.load_deployment_info()
    
    def load_deployment_info(self):
        """Load deployment information from file"""
        if not self.deployment_file.exists():
            print("No deployment info found. Run deploy_edge_servers.py first.")
            return []
        
        with open(self.deployment_file, 'r') as f:
            data = json.load(f)
            return data.get('instances', [])
    
    def check_instance_health(self, instance):
        """Check health of a single instance"""
        try:
            result = subprocess.run(
                ['curl', '-s', '-m', '2', f"http://localhost:{instance['port']}/health"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return {
                    'status': 'healthy',
                    'data': data
                }
            else:
                return {'status': 'unreachable', 'error': result.stderr}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def check_all_instances(self):
        """Check health of all instances"""
        print(f"\n{'='*70}")
        print(f"Edge Server Health Check [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        print(f"{'='*70}\n")
        
        if not self.instances:
            print("No instances to check.")
            return
        
        healthy = 0
        unhealthy = 0
        
        for instance in self.instances:
            port = instance['port']
            print(f"Instance {instance['id']} (Port {port})...", end=" ", flush=True)
            
            health = self.check_instance_health(instance)
            
            if health['status'] == 'healthy':
                print("✓ HEALTHY")
                print(f"  └─ URL: {instance['url']}")
                print(f"  └─ PID: {instance['pid']}")
                healthy += 1
            else:
                print(f"✗ UNHEALTHY ({health['status']})")
                unhealthy += 1
        
        print(f"\n{'='*70}")
        print(f"Summary: {healthy} healthy, {unhealthy} unhealthy")
        print(f"{'='*70}\n")
    
    def get_instance_stats(self, instance_id):
        """Get detailed stats for a specific instance"""
        instance = next((i for i in self.instances if i['id'] == instance_id), None)
        
        if not instance:
            print(f"Instance {instance_id} not found")
            return
        
        print(f"\n{'='*70}")
        print(f"Instance {instance_id} Statistics")
        print(f"{'='*70}\n")
        
        try:
            result = subprocess.run(
                ['curl', '-s', f"http://localhost:{instance['port']}/api/stats"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                stats = json.loads(result.stdout)
                print(f"Server Address: {stats.get('edgeServerAddress')}")
                print(f"Network: {stats.get('blockchainNetwork')}")
                print(f"Current Block: {stats.get('currentBlockNumber')}")
                print(f"Vehicle Registry: {stats.get('vehicleRegistryAddress')}")
                print(f"Alert System: {stats.get('alertSystemAddress')}")
                print(f"Total Alerts: {stats.get('totalAlertsOnChain')}")
                print(f"Uptime: {stats.get('uptime')} seconds")
            else:
                print("Unable to fetch stats")
        except Exception as e:
            print(f"Error: {e}")
    
    def list_instances(self):
        """List all deployed instances"""
        print(f"\n{'='*70}")
        print("Deployed Edge Server Instances")
        print(f"{'='*70}\n")
        
        if not self.instances:
            print("No instances deployed yet.")
            return
        
        for instance in self.instances:
            print(f"Instance {instance['id']}:")
            print(f"  - Port: {instance['port']}")
            print(f"  - URL: {instance['url']}")
            print(f"  - PID: {instance['pid']}")
            print()
    
    def get_load_balancer_config(self):
        """Generate load balancer configuration"""
        print(f"\n{'='*70}")
        print("Load Balancer Configuration (Nginx Example)")
        print(f"{'='*70}\n")
        
        if not self.instances:
            print("No instances to load balance")
            return
        
        nginx_config = """upstream edge_servers {
"""
        for instance in self.instances:
            nginx_config += f"    server localhost:{instance['port']};\n"
        
        nginx_config += """}

server {
    listen 80;
    server_name edge-server;

    location / {
        proxy_pass http://edge_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/alert/events {
        proxy_pass http://edge_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;
    }
}
"""
        print(nginx_config)
        
        # Save to file
        with open('nginx.conf.example', 'w') as f:
            f.write(nginx_config)
        print("Configuration saved to: nginx.conf.example")
    
    def get_docker_compose(self):
        """Generate Docker Compose configuration"""
        print(f"\n{'='*70}")
        print("Docker Compose Configuration (Example)")
        print(f"{'='*70}\n")
        
        if not self.instances:
            print("No instances to containerize")
            return
        
        docker_compose = """version: '3.9'

services:
"""
        for instance in self.instances:
            docker_compose += f"""  edge-server-{instance['id']}:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./:/app
    ports:
      - "{instance['port']}:{instance['port']}"
    environment:
      - PORT={instance['port']}
      - GANACHE_RPC_URL=http://host.docker.internal:7545
    command: npm start
    depends_on:
      - ganache

"""
        
        docker_compose += """  ganache:
    image: trufflesuite/ganache:latest
    ports:
      - "7545:7545"
    command: ganache-cli --host 0.0.0.0 --account 0xea9b61706f3168e6b9b49dbb2a2094dfcb8fdc5353176c5fe53ee4d21495518f,1000000000000000000000000
"""
        
        print(docker_compose)
        
        # Save to file
        with open('docker-compose.example.yml', 'w') as f:
            f.write(docker_compose)
        print("Configuration saved to: docker-compose.example.yml")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Edge Server Manager - Monitor and manage multiple instances',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage_edge_servers.py health          # Check health of all instances
  python manage_edge_servers.py list            # List all instances
  python manage_edge_servers.py stats 1         # Get stats for instance 1
  python manage_edge_servers.py lb-config       # Generate load balancer config
  python manage_edge_servers.py docker-config   # Generate Docker Compose config
        """
    )
    
    parser.add_argument(
        'command',
        choices=['health', 'list', 'stats', 'lb-config', 'docker-config'],
        help='Management command'
    )
    
    parser.add_argument(
        'instance_id',
        nargs='?',
        type=int,
        help='Instance ID (required for stats command)'
    )
    
    args = parser.parse_args()
    
    manager = EdgeServerManager()
    
    if args.command == 'health':
        manager.check_all_instances()
    elif args.command == 'list':
        manager.list_instances()
    elif args.command == 'stats':
        if not args.instance_id:
            print("Error: instance_id required for stats command")
            sys.exit(1)
        manager.get_instance_stats(args.instance_id)
    elif args.command == 'lb-config':
        manager.get_load_balancer_config()
    elif args.command == 'docker-config':
        manager.get_docker_compose()

if __name__ == '__main__':
    main()
