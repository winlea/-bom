import os
import time
from typing import List

from flask import Flask, render_template
from flask_cors import CORS

from bom_system.admin import admin_bp
from bom_system.api.error_handler import register_error_handlers
from bom_system.api_main import api_bp
from bom_system.config.manager import ConfigManager
from bom_system.database.session import init_db_engine
from bom_system.dimensions.api import dimensions_bp
from bom_system.dimensions.image_api import dimension_image_bp
from bom_system.models import db
from bom_system.projects import bp as projects_bp
from bom_system.templates.api import templates_bp

# Initialize config manager
config_manager = ConfigManager()

# 使用绝对路径连接数据库
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "instance", "bom_db.sqlite")
SQLALCHEMY_DATABASE_URI = config_manager.get(
    "DATABASE_URL", f"sqlite:///{DB_PATH}"
)
SQLALCHEMY_TRACK_MODIFICATIONS = config_manager.get(
    "SQLALCHEMY_TRACK_MODIFICATIONS", False
)

# 允许的 CORS 源列表
CORS_ORIGINS = config_manager.get("CORS_ORIGINS", "").split(",") if config_manager.get("CORS_ORIGINS") else []


def create_app() -> Flask:
    app = Flask(__name__)

    # Configure
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
    app.config["ASSET_VER"] = str(int(time.time()))

    # Init Flask-SQLAlchemy
    db.init_app(app)

    # Init 统一数据库会话管理（请求级 session 生命周期）
    init_db_engine(app)

    # 配置 CORS
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ]
    origins = CORS_ORIGINS or default_origins
    CORS(
        app,
        origins=origins,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Blueprints
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(admin_bp)
    app.register_blueprint(projects_bp, url_prefix="/api")
    app.register_blueprint(dimensions_bp)
    app.register_blueprint(dimension_image_bp)
    app.register_blueprint(templates_bp)

    # 全局错误处理器（确保异常返回 JSON 而非 HTML）
    register_error_handlers(app)

    # Health endpoint
    @app.get("/health")
    def health():
        return {"status": "ok"}

    # Front page
    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/parts")
    def parts_page():
        return render_template("index.html")

    @app.get("/projects")
    def projects_page():
        return render_template("index.html")

    @app.get("/projects/<path:subpath>")
    def projects_catchall(subpath):
        return render_template("index.html")

    # SPA fallback
    @app.get("/<path:subpath>")
    def spa_fallback(subpath):
        if subpath.startswith(("api/", "static/", "uploads/")):
            return ("Not Found", 404)
        return render_template("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        from bom_system.models import import_all_models

        import_all_models()
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
