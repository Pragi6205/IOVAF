#!/usr/bin/env python3
"""
clean_edge_server.py

Edge-server specific cleanup script. It archives known runtime/dev files
and removes run-time artifacts like logs and pid files.

Usage:
  python3 scripts/clean_edge_server.py --archive --clean-logs [--dry-run]

This script is safe/reversible: archived files are moved to
`edge_server/archive_removed/`.
"""

import argparse
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2] / 'edge_server'
ARCHIVE_DIR = ROOT / 'archive_removed'
LOGS_DIR = ROOT / 'logs'

# Candidate runtime/dev files to archive (relative to edge_server)
CANDIDATES = [
    'stop_edge_servers.py',
    'test_demo.sh',
    'deployment_info.json',
    '.env'
]


def archive_files(dry_run=True):
    found = []
    for name in CANDIDATES:
        p = ROOT / name
        if p.exists():
            found.append(p)

    if not found:
        print('No candidate runtime files found to archive.')
        return []

    if dry_run:
        for p in found:
            print('(dry) would archive', p.relative_to(ROOT))
        return found

    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    moved = []
    for p in found:
        dest = ARCHIVE_DIR / p.name
        print('Archiving', p.relative_to(ROOT), '->', dest.relative_to(ROOT))
        shutil.move(str(p), str(dest))
        moved.append((p, dest))
    return moved


def clean_logs(dry_run=True):
    if not LOGS_DIR.exists():
        print('No logs directory found; nothing to clean')
        return False
    if dry_run:
        print('(dry) would remove contents of', LOGS_DIR)
        return True

    for item in LOGS_DIR.iterdir():
        try:
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        except Exception as e:
            print('Warning: failed to remove', item, e)
    print('Cleaned', LOGS_DIR)
    return True


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--archive', action='store_true')
    p.add_argument('--clean-logs', action='store_true')
    p.add_argument('--dry-run', action='store_true')
    return p.parse_args()


def main():
    args = parse_args()
    if not (args.archive or args.clean_logs):
        print('Nothing requested; pass --archive or --clean-logs')
        sys.exit(0)

    if args.archive:
        archive_files(dry_run=args.dry_run)

    if args.clean_logs:
        clean_logs(dry_run=args.dry_run)

    print('Done')


if __name__ == '__main__':
    main()
