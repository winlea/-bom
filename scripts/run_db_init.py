from app import create_app
from bom_system.models import db

app = create_app()
with app.app_context():
    db.create_all()
print("DB init OK")
