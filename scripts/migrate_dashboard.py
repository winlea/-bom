from sqlalchemy import inspect, text

from app import create_app
from bom_system.models import db

app = create_app()
with app.app_context():
    eng = db.engine
    insp = inspect(eng)
    cols = (
        {c["name"] for c in insp.get_columns("projects")}
        if "projects" in insp.get_table_names()
        else set()
    )
    if "status" not in cols:
        with eng.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE projects ADD COLUMN status VARCHAR(30) DEFAULT 'created'"
                )
            )
            print("Added projects.status")

    if "import_logs" not in insp.get_table_names():
        with eng.begin() as conn:
            conn.execute(
                text(
                    """
CREATE TABLE import_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NULL,
  filename VARCHAR(255),
  created_count INT,
  errors_count INT,
  message TEXT,
  created_at DATETIME NOT NULL,
  INDEX idx_il_project_id (project_id),
  CONSTRAINT fk_il_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
                )
            )
            print("Created import_logs")
    print("Migration done.")
