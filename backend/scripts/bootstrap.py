"""Idempotent bootstrap: seed supplier and crew master catalogs before first analyze."""

import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent


def _run_seed(script_name: str) -> int:
    path = SCRIPTS_DIR / script_name
    result = subprocess.run([sys.executable, str(path)], check=False)
    return result.returncode


def main() -> int:
    print("ConstructaIQ bootstrap: seeding master catalogs...")
    codes = [
        _run_seed("seed_supplier_master.py"),
        _run_seed("seed_crew_master.py"),
    ]
    if any(c != 0 for c in codes):
        print("Bootstrap completed with errors.", file=sys.stderr)
        return 1
    print("Bootstrap complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
