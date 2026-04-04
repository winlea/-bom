"""Dependency Injection Container"""
import logging
from dependency_injector import containers, providers
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Session

from bom_system.database.session import get_db_session
from bom_system.models import db
from bom_system.services.bom_service import BOMService
from bom_system.services.project_service import ProjectService

logger = logging.getLogger(__name__)


class Container(containers.DeclarativeContainer):
    """依赖注入容器
    
    仓储层已注册具体实现类。
    服务层使用 Callable provider 延迟创建，确保在请求上下文中获取 session。
    """

    # 配置
    config = providers.Configuration()

    # ── 数据库 ──────────────────────────────────────────────
    db = providers.Singleton(
        SQLAlchemy,
        metadata=db.metadata,
    )

    # 数据库会话 (每次调用从 flask.g 获取当前请求的 session)
    db_session = providers.Factory(get_db_session)

    # ── 服务层 ───────────────────────────────────────────────
    bom_service = providers.Callable(
        lambda session: BOMService(session),
        session=db_session,
    )

    project_service = providers.Callable(
        lambda session: ProjectService(session),
        session=db_session,
    )

    dimension_service = providers.Callable(
        lambda session: _create_dimension_service(session),
        session=db_session,
    )


def _create_dimension_service(session: Session):
    """创建尺寸服务实例"""
    from bom_system.dimensions.services import DimensionService
    return DimensionService(session)


# ── 全局容器实例 ───────────────────────────────────────────
container = Container()
