import os
import sys

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
  status VARCHAR(30) DEFAULT 'created',
  created_at DATETIME NOT NULL,
  supplier_name VARCHAR(200),
  address VARCHAR(255),
  supplier_code VARCHAR(100),
  customer_name VARCHAR(200),
  customer_purchase VARCHAR(200),
  quality_engineer VARCHAR(100),
  quality_engineer_signature LONGBLOB,
  phone VARCHAR(50),
  email VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
                )
            )
            print("Created projects table with all fields")
    else:
        # Add new fields if they don't exist
        cols = {c["name"] for c in insp.get_columns("projects")}
        new_fields = [
            ("status", "VARCHAR(30) DEFAULT 'created'"),
            ("supplier_name", "VARCHAR(200)"),
            ("address", "VARCHAR(255)"),
            ("supplier_code", "VARCHAR(100)"),
            ("customer_name", "VARCHAR(200)"),
            ("customer_purchase", "VARCHAR(200)"),
            ("quality_engineer", "VARCHAR(100)"),
            ("quality_engineer_signature", "LONGBLOB"),
            ("phone", "VARCHAR(50)"),
            ("email", "VARCHAR(100)")
        ]
        for field_name, field_type in new_fields:
            if field_name not in cols:
                with eng.begin() as conn:
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {field_name} {field_type}"))
                    print(f"Added {field_name} to projects table")
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
