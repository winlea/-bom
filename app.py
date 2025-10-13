from flask import Flask, render_template
from flask_cors import CORS

# 已移除 admin 模块
from bom_system.api import api_bp
from bom_system.config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from bom_system.dimensions.api import dimensions_bp
from bom_system.dimensions.image_api import dimension_image_bp
from bom_system.models import db
from bom_system.projects import bp as projects_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # Configure
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
    import time
    app.config["ASSET_VER"] = str(int(time.time()))

    # Init extensions
    db.init_app(app)

    # Configure CORS
    CORS(
        app,
        origins=[
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
        ],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Blueprints
    app.register_blueprint(api_bp, url_prefix="/api")
    # 已移除 admin 模块注册
    app.register_blueprint(projects_bp)
    app.register_blueprint(dimensions_bp)
    app.register_blueprint(dimension_image_bp)

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
        if (
            subpath.startswith("api/")
            or subpath.startswith("static/")
            or subpath.startswith("uploads/")
        ):
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
