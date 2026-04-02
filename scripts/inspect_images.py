import sys

from openpyxl import load_workbook

if len(sys.argv) < 2:
    print("Usage: python scripts/inspect_images.py <path.xlsx>")
    sys.exit(1)

path = sys.argv[1]
wb = load_workbook(path, data_only=True)
ws = wb.active
imgs = getattr(ws, "_images", [])
print("Image count:", len(imgs))
for i, img in enumerate(imgs, start=1):
    anc = getattr(img, "anchor", None)
    rc = None
    if hasattr(anc, "row") and hasattr(anc, "col"):
        rc = (anc.row + 1, anc.col + 1)
    elif hasattr(anc, "_from") and hasattr(anc._from, "row"):
        rc = (anc._from.row + 1, anc._from.col + 1)
    else:
        rc = str(anc)
    # try getting bytes
    size = None
    try:
        data = img._data()
        size = len(data) if data else None
    except Exception as e:
        size = f"err: {e}"
    print(f"{i}: anchor={rc}, data={size}")
