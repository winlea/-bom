import json
import sys

import requests

if len(sys.argv) < 2:
    print("Usage: python scripts/import_excel_to_system.py <path.xlsx> [base_url]")
    sys.exit(1)

path = sys.argv[1]
base = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:5000"

with open(path, "rb") as f:
    files = {
        "file": (
            path,
            f,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
    r = requests.post(base + "/import/bom", files=files, timeout=60)
    print(r.status_code, r.text)
