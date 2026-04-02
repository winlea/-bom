import base64
import json
import time
import urllib.request
from urllib.error import HTTPError

BASE = "http://127.0.0.1:5000"


def main():
    # health
    for _ in range(10):
        try:
            resp = urllib.request.urlopen(BASE + "/health", timeout=2)
            print("HEALTH", resp.status)
            break
        except Exception:
            time.sleep(0.5)
    else:
        raise SystemExit("Server not healthy")

    # tiny png
    PNG_1x1 = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    )
    payload = {
        "part_number": "TEST-CLI",
        "image_data": "data:image/png;base64,"
        + base64.b64encode(PNG_1x1).decode("ascii"),
    }
    req = urllib.request.Request(
        BASE + "/upload/base64",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        print("UPLOAD", resp.status)
        body = json.loads(resp.read().decode("utf-8"))
        print("BODY", body)
    except HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print("UPLOAD_ERROR", e.code, err_body)
        raise

    img_id = body["id"]
    resp = urllib.request.urlopen(BASE + f"/download/{img_id}", timeout=10)
    print("DOWNLOAD", resp.status, resp.headers.get("Content-Type"))
    content = resp.read()
    print("BYTES", len(content))


if __name__ == "__main__":
    main()
