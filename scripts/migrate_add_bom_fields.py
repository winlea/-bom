from sqlalchemy import inspect, text

from app import create_app
from bom_system.models import db

app = create_app()

DDL_ALTERS = [
    "ALTER TABLE bom_table MODIFY part_number VARCHAR(100)",
    "ALTER TABLE bom_table MODIFY part_name VARCHAR(200)",
]

ADD_COLS = [
    ("sequence", "VARCHAR(50)"),
    ("assembly_level", "INT"),
    ("bom_sort", "INT"),
    ("drawing_2d", "VARCHAR(100)"),
    ("drawing_3d", "VARCHAR(100)"),
    ("original_material", "VARCHAR(200)"),
    ("final_material_cn", "VARCHAR(200)"),
    ("part_category", "VARCHAR(100)"),
    ("net_weight_kg", "DOUBLE"),
]

with app.app_context():
    eng = db.engine
    insp = inspect(eng)
    cols = {c["name"] for c in insp.get_columns("bom_table")}

    with eng.begin() as conn:
        # modify existing lengths
        for ddl in DDL_ALTERS:
            try:
                conn.execute(text(ddl))
            except Exception as e:
                # ignore failures (already correct etc.)
                print("WARN:", ddl, e)
        # add missing columns
        for name, typ in ADD_COLS:
            if name not in cols:
                ddl = f"ALTER TABLE bom_table ADD COLUMN {name} {typ} NULL"
                conn.execute(text(ddl))
                print("ADDED", name)
            else:
                print("EXIST", name)
    print("Migration done.")
