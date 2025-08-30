from app import create_app
from bom_system.models import BomTable, db

app = create_app()
with app.app_context():
    n = db.session.query(BomTable).delete()
    db.session.commit()
    print("Deleted rows:", n)
