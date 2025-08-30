from sqlalchemy import inspect, text

from app import create_app
from bom_system.models import db

app = create_app()
with app.app_context():
    eng = db.engine
    insp = inspect(eng)
    tables = insp.get_table_names()
    if "projects" not in tables:
        with eng.begin() as conn:
            conn.execute(
                text(
                    """
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
                )
            )
            print("Created projects table")
    # add project_id to bom_table if missing
    cols = {c["name"] for c in insp.get_columns("bom_table")}
    if "project_id" not in cols:
        with eng.begin() as conn:
            conn.execute(text("ALTER TABLE bom_table ADD COLUMN project_id INT NULL"))
            conn.execute(
                text("ALTER TABLE bom_table ADD INDEX idx_project_id (project_id)")
            )
            conn.execute(
                text(
                    "ALTER TABLE bom_table ADD CONSTRAINT fk_bom_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE"
                )
            )
            print("Added project_id to bom_table")
    print("Migration done.")
