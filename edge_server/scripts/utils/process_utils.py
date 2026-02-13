import os
import signal
from pathlib import Path


def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)


def write_pid(pidfile, pid):
    ensure_dir(Path(pidfile).parent)
    with open(pidfile, 'w') as f:
        f.write(str(pid))


def read_pid(pidfile):
    try:
        with open(pidfile, 'r') as f:
            return int(f.read().strip())
    except Exception:
        return None


def is_running(pid):
    if not pid:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    else:
        return True


def stop_pid(pid):
    try:
        os.kill(pid, signal.SIGTERM)
        return True
    except Exception:
        return False
