from flask import jsonify


class APIResponse:
    """API响应工具类"""

    @staticmethod
    def success(data=None, message="Success", status_code=200):
        """成功响应

        Args:
            data: 响应数据
            message: 响应消息
            status_code: 状态码

        Returns:
            响应对象
        """
        response = {"success": True, "message": message, "data": data}
        return jsonify(response), status_code

    @staticmethod
    def error(message="Error", status_code=400, errors=None):
        """错误响应

        Args:
            message: 错误消息
            status_code: 状态码
            errors: 错误详情

        Returns:
            响应对象
        """
        response = {"success": False, "message": message, "errors": errors}
        return jsonify(response), status_code

    @staticmethod
    def created(data=None, message="Created"):
        """创建成功响应

        Args:
            data: 响应数据
            message: 响应消息

        Returns:
            响应对象
        """
        return APIResponse.success(data, message, 201)

    @staticmethod
    def no_content(message="No Content"):
        """无内容响应

        Args:
            message: 响应消息

        Returns:
            响应对象
        """
        return APIResponse.success(None, message, 204)

    @staticmethod
    def bad_request(message="Bad Request", errors=None):
        """请求错误响应

        Args:
            message: 错误消息
            errors: 错误详情

        Returns:
            响应对象
        """
        return APIResponse.error(message, 400, errors)

    @staticmethod
    def unauthorized(message="Unauthorized"):
        """未授权响应

        Args:
            message: 错误消息

        Returns:
            响应对象
        """
        return APIResponse.error(message, 401)

    @staticmethod
    def forbidden(message="Forbidden"):
        """禁止访问响应

        Args:
            message: 错误消息

        Returns:
            响应对象
        """
        return APIResponse.error(message, 403)

    @staticmethod
    def not_found(message="Not Found"):
        """资源不存在响应

        Args:
            message: 错误消息

        Returns:
            响应对象
        """
        return APIResponse.error(message, 404)

    @staticmethod
    def internal_server_error(message="Internal Server Error", errors=None):
        """服务器内部错误响应

        Args:
            message: 错误消息
            errors: 错误详情

        Returns:
            响应对象
        """
        return APIResponse.error(message, 500, errors)
