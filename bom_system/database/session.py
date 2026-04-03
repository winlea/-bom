"""
统一数据库会话管理模块

使用 Flask 的 g 对象管理请求级 session 生命周期，
确保：
1. 每个请求复用同一个 session（避免连接泄漏）
2. 请求结束自动 close（避免资源泄漏）
3. 异常时自动 rollback
"""

import logging
from contextlib import contextmanager

from flask import Flask, g
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from bom_system.config import SQLALCHEMY_DATABASE_URI

logger = logging.getLogger(__name__)

# 模块级引擎（单例，带连接池）
_engine = None
_session_factory = None


def init_db_engine(app: Flask) -> None:
    """在 app 工厂中调用，初始化数据库引擎。

    将引擎绑定到 app.config 以支持 Flask-SQLAlchemy 的 db.init_app(app)。
    """
    global _engine, _session_factory

    # 从 app.config 读取（app.py 中已设置）
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", SQLALCHEMY_DATABASE_URI)
    echo = app.config.get("SQLALCHEMY_ECHO", False)

    _engine = create_engine(
        uri,
        echo=echo,
        pool_pre_ping=True,  # 连接前检测是否存活
        pool_recycle=3600,    # 1小时回收连接
    )
    _session_factory = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

    logger.info("数据库引擎初始化完成")

    # 注册请求钩子
    @app.before_request
    def _before_request():
        """请求开始时创建 session"""
        g.db_session = _session_factory()

    @app.teardown_request
    def _teardown_request(exception=None):
        """请求结束时清理 session"""
        session = g.pop("db_session", None)
        if session is not None:
            try:
                if exception:
                    session.rollback()
                else:
                    session.commit()
            except Exception:
                session.rollback()
                logger.exception("会话清理失败")
            finally:
                session.close()


def get_db_session() -> Session:
    """获取当前请求的数据库 session。

    必须在请求上下文中调用。
    在非请求上下文中（如脚本、测试），使用 db_session_manager()。
    """
    if hasattr(g, "db_session") and g.db_session is not None:
        return g.db_session
    # 回退：为非请求上下文创建独立 session
    if _session_factory is None:
        _init_standalone()
    return _session_factory()


def _init_standalone():
    """独立模式初始化（无 Flask app 时使用）"""
    global _engine, _session_factory
    if _engine is None:
        _engine = create_engine(
            SQLALCHEMY_DATABASE_URI,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        _session_factory = sessionmaker(
            autocommit=False, autoflush=False, bind=_engine
        )


@contextmanager
def db_session_manager():
    """上下文管理器，用于非请求上下文（脚本、测试、后台任务）。

    用法：
        with db_session_manager() as session:
            session.query(...)
    """
    _init_standalone()
    session = _session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_engine():
    """获取底层引擎（用于需要原始连接的场景）"""
    _init_standalone()
    return _engine
