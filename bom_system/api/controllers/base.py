"""Base Controller with common utilities"""
import logging
import sys
from functools import wraps

from flask import Blueprint, request
from sqlalchemy import or_, and_

from ..response import APIResponse
from ...database.session import get_db_session

logger = logging.getLogger(__name__)


def _escape_like_pattern(q: str) -> str:
    """转义LIKE模式中的特殊字符，防止SQL注入和意外匹配"""
    return q.replace('\\', '\\\\').replace('%', r'\%').replace('_', r'\_')


def _get_platform_excel_handler():
    """获取平台特定的Excel处理器"""
    if sys.platform == 'win32':
        try:
            import win32com.client
            import pythoncom
            return 'win32com', win32com, pythoncom
        except ImportError:
            logger.warning("win32com not available, falling back to openpyxl")
    return 'openpyxl', None, None


class BaseController:
    """Base controller with common functionality"""
    
    def __init__(self):
        self.session = None
    
    def get_session(self):
        """获取数据库会话"""
        return get_db_session()
    
    def serialize_model(self, model, fields: list = None):
        """序列化模型对象"""
        if fields is None:
            fields = [c.name for c in model.__table__.columns]
        return {f: getattr(model, f) for f in fields if hasattr(model, f)}
