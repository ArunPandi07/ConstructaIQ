"""
Legacy entry point — delegates to scripts/e2e_project_flow_test.py.

For full Foundry pipeline verification, run:
    python scripts/e2e_backend_test.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scripts.e2e_project_flow_test import main

if __name__ == "__main__":
    raise SystemExit(main())
