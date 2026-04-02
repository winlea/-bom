import base64
import json
import time
import urllib.request
from threading import Thread

import app as app_module

app = app_module.create_app()


def run_app():
    app.run(host="127.0.0.1", port=5001, debug=False, use_reloader=False)


def main():
    th = Thread(target=run_app, daemon=True)
    th.start()
    time.sleep(1.5)

    # health
    resp = urllib.request.urlopen("http://127.0.0.1:5001/health", timeout=5)
    print("HEALTH", resp.status)

    # tiny png
    PNG_1x1 = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    )
    payload = {
        "part_number": "TEST-1",
        "image_data": "data:image/png;base64,"
        + base64.b64encode(PNG_1x1).decode("ascii"),
    }
    req = urllib.request.Request(
        "http://127.0.0.1:5001/upload/base64",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=10)
    print("UPLOAD", resp.status)
    body = json.loads(resp.read().decode("utf-8"))
    print("BODY", body)

    img_id = body["id"]
    resp = urllib.request.urlopen(
        f"http://127.0.0.1:5001/download/{img_id}", timeout=10
    )
    print("DOWNLOAD", resp.status, resp.headers.get("Content-Type"))
    content = resp.read()
    print("BYTES", len(content))


if __name__ == "__main__":
    main()
