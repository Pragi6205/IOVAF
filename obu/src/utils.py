import requests
import random
import time
import logging
from typing import Any, Dict, Optional

log = logging.getLogger('obu.utils')

def pick_edge_server(edge_servers):
    if not edge_servers:
        raise ValueError('No edge servers provided')
    return random.choice(edge_servers)

def http_post(base_url: str, path: str, json_payload: Dict[str, Any],
              retries: int = 3, backoff: float = 0.5, timeout: float = 8.0) -> Optional[Dict[str, Any]]:
    url = base_url.rstrip('/') + path
    last_error = None
    
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, json=json_payload, timeout=timeout)
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception as je:
                log.warning('Could not parse JSON response from %s: %s', url, je)
                return {'raw': resp.text, 'status_code': resp.status_code}
        except requests.exceptions.RequestException as e:
            last_error = e
            log.debug('POST %s attempt %d/%d failed: %s', url, attempt, retries, e)
            if attempt < retries:
                time.sleep(backoff * attempt)
    
    error_msg = str(last_error) if last_error else 'Unknown error'
    log.error('POST %s failed after %d retries: %s', url, retries, error_msg)
    return {'error': error_msg, 'status': 'failed'}

def http_get(base_url: str, path: str, retries: int = 3, backoff: float = 0.5, timeout: float = 6.0) -> Optional[Dict[str, Any]]:
    url = base_url.rstrip('/') + path
    last_error = None
    
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception as je:
                log.warning('Could not parse JSON response from %s: %s', url, je)
                return {'raw': resp.text, 'status_code': resp.status_code}
        except requests.exceptions.RequestException as e:
            last_error = e
            log.debug('GET %s attempt %d/%d failed: %s', url, attempt, retries, e)
            if attempt < retries:
                time.sleep(backoff * attempt)
    
    error_msg = str(last_error) if last_error else 'Unknown error'
    log.error('GET %s failed after %d retries: %s', url, retries, error_msg)
    return {'error': error_msg, 'status': 'failed'}

