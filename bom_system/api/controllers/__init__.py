"""API Controllers Package"""
from .base import BaseController, get_db_session, _escape_like_pattern, _get_platform_excel_handler
from .image import image_bp
from .import_controller import import_bp
from .part import part_bp
from .report import report_bp
from .drawing_change import drawing_bp
from .ods import ods_bp
from .process_capability import capability_bp
from .item import item_bp

__all__ = [
    "BaseController",
    "get_db_session",
    "_escape_like_pattern",
    "_get_platform_excel_handler",
    "image_bp",
    "import_bp",
    "part_bp",
    "report_bp",
    "drawing_bp",
    "ods_bp",
    "capability_bp",
    "item_bp",
]


def register_controllers(app):
    """Register all controllers with the Flask app"""
    from .image import image_bp
    from .import_controller import import_bp
    from .part import part_bp
    from .report import report_bp
    from .drawing_change import drawing_bp
    from .ods import ods_bp
    from .process_capability import capability_bp
    from .item import item_bp
    
    # Register all blueprints with /api prefix
    app.register_blueprint(image_bp, url_prefix='/api')
    app.register_blueprint(import_bp, url_prefix='/api')
    app.register_blueprint(part_bp, url_prefix='/api')
    app.register_blueprint(report_bp, url_prefix='/api')
    app.register_blueprint(drawing_bp, url_prefix='/api')
    app.register_blueprint(ods_bp, url_prefix='/api')
    app.register_blueprint(capability_bp, url_prefix='/api')
    app.register_blueprint(item_bp, url_prefix='/api')
