from sqlalchemy import inspect

from app import create_app
from bom_system.models import BomTable, db

app = create_app()
with app.app_context():
    insp = inspect(db.engine)
    cols = insp.get_columns("bom_table")
    print("COLUMNS:", [(c["name"], str(c["type"])) for c in cols])
    top = db.session.query(BomTable).order_by(BomTable.id.asc()).limit(5).all()
    for r in top:
        print("ROW", r.id, r.part_number, r.sequence, r.assembly_level)
