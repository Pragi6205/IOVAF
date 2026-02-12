#!/bin/bash
# Stop all edge server instances
# This script stops all running edge server processes that were deployed

import json
import os
import signal
import sys
from pathlib import Path

def stop_all_instances():
    """Stop all running edge server instances"""
    
    deployment_file = Path('deployment_info.json')
    
    if not deployment_file.exists():
        print("No deployment info found.")
        print("Make sure you ran: python deploy_edge_servers.py")
        return False
    
    with open(deployment_file, 'r') as f:
        data = json.load(f)
        instances = data.get('instances', [])
    
    if not instances:
        print("No instances to stop.")
        return True
    
    print(f"\n{'='*60}")
    print("Stopping Edge Server Instances")
    print(f"{'='*60}\n")
    
    stopped = 0
    failed = 0
    
    for instance in instances:
        instance_id = instance['id']
        port = instance['port']
        pid = instance['pid']
        
        print(f"Stopping Instance {instance_id} (Port {port}, PID {pid})...", end=" ", flush=True)
        
        try:
            # Try to kill the process
            if sys.platform == 'win32':
                os.system(f"taskkill /PID {pid} /F")
            else:
                os.kill(pid, signal.SIGTERM)
                # Wait a moment
                import time
                time.sleep(0.5)
            
            print("✓ Stopped")
            stopped += 1
        except ProcessLookupError:
            print("✓ (Already stopped)")
            stopped += 1
        except Exception as e:
            print(f"✗ Error: {e}")
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"Results: {stopped} stopped, {failed} failed")
    print(f"{'='*60}\n")
    
    return failed == 0

if __name__ == '__main__':
    stop_all_instances()
