from flask import Flask
from werkzeug.exceptions import HTTPException
from bom_system.api.response import APIResponse


def register_error_handlers(app: Flask):
    """注册错误处理器
    
    Args:
        app: Flask应用实例
    """
    
    # 处理 HTTP 异常
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """处理HTTP异常"""
        return APIResponse.error(
            message=e.description or str(e),
            status_code=e.code or 400
        )
    
    # 处理通用异常
    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        """处理通用异常"""
        # 记录异常信息
        app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return APIResponse.internal_server_error(
            message="An internal server error occurred"
        )
    
    # 处理 404 错误
    @app.errorhandler(404)
    def handle_not_found(e):
        """处理404错误"""
        return APIResponse.not_found(
            message="The requested resource was not found"
        )
    
    # 处理 405 错误
    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        """处理405错误"""
        return APIResponse.error(
            message="Method not allowed",
            status_code=405
        )
    
    # 处理 400 错误
    @app.errorhandler(400)
    def handle_bad_request(e):
        """处理400错误"""
        return APIResponse.bad_request(
            message=str(e) or "Bad request"
        )
