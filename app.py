from flask import Flask, render_template
from flask_cors import CORS

from bom_system.admin import admin_bp
from bom_system.api import api_bp
from bom_system.config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from bom_system.dimensions.api import dimensions_bp
from bom_system.dimensions.image_api import dimension_image_bp
from bom_system.models import db
# from bom_system.ods.api import ods_bp
# from bom_system.ods.qualification_export_api import export_bp
# from bom_system.ods.new_template_api import new_ods_bp
# from bom_system.ods.enhanced_api import enhanced_ods_bp
# from bom_system.ods.wz1d_api import wz1d_bp
# from bom_system.ods.enhanced_wz1d_api import enhanced_wz1d_bp
from bom_system.parts import bp as parts_bp
from bom_system.projects import bp as projects_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # Configure
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
    # Asset version to bust caches on UI updates
    import time

    app.config["ASSET_VER"] = str(int(time.time()))

    # Init extensions
    db.init_app(app)

    # 配置CORS，允许前端跨域访问
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
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(parts_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(dimensions_bp)
    app.register_blueprint(dimension_image_bp)
    # app.register_blueprint(ods_bp)
    # app.register_blueprint(export_bp)
    # app.register_blueprint(new_ods_bp)
    # app.register_blueprint(enhanced_ods_bp)
    # app.register_blueprint(wz1d_bp)
    # app.register_blueprint(enhanced_wz1d_bp)
    
    # 注册动态预览API蓝图
    # from bom_system.ods.dynamic_preview_api import dynamic_preview_bp
    # app.register_blueprint(dynamic_preview_bp)

    # Simple health endpoint
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
        # SPA route for project details, let frontend handle routing
        return render_template("index.html")

    # SPA fallback for other client-side routes (exclude API/static/uploads)
    @app.get("/<path:subpath>")
    def spa_fallback(subpath):
        if (
            subpath.startswith("api/")
            or subpath.startswith("static/")
            or subpath.startswith("uploads/")
        ):
            # Let Flask handle actual API/static routes (return 404 here)
            return ("Not Found", 404)
        return render_template("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        # 导入所有模型
        from bom_system.models import import_all_models

        import_all_models()
        # Create tables if not exist (MVP, later replace with migrations)
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
