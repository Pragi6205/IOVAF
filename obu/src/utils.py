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
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, json=json_payload, timeout=timeout)
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception:
                return {'raw': resp.text}
        except Exception as e:
            log.debug('POST %s attempt %s failed: %s', url, attempt, e)
            if attempt == retries:
                return {'error': str(e)}
            time.sleep(backoff * attempt)

def http_get(base_url: str, path: str, retries: int = 3, backoff: float = 0.5, timeout: float = 6.0):
    url = base_url.rstrip('/') + path
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception:
                return {'raw': resp.text}
        except Exception as e:
            log.debug('GET %s attempt %s failed: %s', url, attempt, e)
            if attempt == retries:
                return {'error': str(e)}
            time.sleep(backoff * attempt)
