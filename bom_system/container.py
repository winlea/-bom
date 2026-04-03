import logging
from dependency_injector import containers, providers
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Session

from bom_system.config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from bom_system.database.session import get_db_session
from bom_system.interfaces.bom import IBOMService
from bom_system.interfaces.dimension import IDimensionService
from bom_system.interfaces.project import IProjectService
from bom_system.models import db
from bom_system.repositories.bom import IBOMRepository
from bom_system.repositories.dimension import IDimensionRepository
from bom_system.repositories.project import IProjectRepository
from bom_system.repositories.impl.bom import BOMRepository
from bom_system.repositories.impl.dimension import DimensionRepository
from bom_system.repositories.impl.project import ProjectRepository

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

    # ── 仓储层（具体实现） ────────────────────────────────────
    bom_repository = providers.Factory(
        BOMRepository,
        session=db_session,
    )

    dimension_repository = providers.Factory(
        DimensionRepository,
        session=db_session,
    )

    project_repository = providers.Factory(
        ProjectRepository,
        session=db_session,
    )

    # ── 服务层（延迟创建） ───────────────────────────────────
    # 注意：IBOMService / IDimensionService / IProjectService 是抽象接口，
    # 不能直接实例化。这里改为 Callable provider，在运行时创建具体实例。
    # TODO: 创建 BOMServiceImpl / DimensionServiceImpl / ProjectServiceImpl 后替换。

    bom_service = providers.Callable(
        lambda session: _create_bom_service(session),
        session=db_session,
    )

    dimension_service = providers.Callable(
        lambda session: _create_dimension_service(session),
        session=db_session,
    )

    project_service = providers.Callable(
        lambda session: _create_project_service(session),
        session=db_session,
    )


# ── 服务工厂函数 ────────────────────────────────────────────

def _create_bom_service(session: Session):
    """创建 BOM 服务实例（当前使用模块级函数作为临时实现）"""
    from bom_system import services as bom_services
    # 返回一个简单的适配器，将模块级函数包装为类接口
    return _BOMServiceAdapter(session)


def _create_dimension_service(session: Session):
    """创建尺寸服务实例"""
    from bom_system.dimensions.services import DimensionService
    return DimensionService(session)


def _create_project_service(session: Session):
    """创建项目服务实例"""
    # TODO: 实现 ProjectService 类后替换
    logger.warning("ProjectService 尚未实现，使用占位符")
    return None


class _BOMServiceAdapter:
    """临时适配器：将 services.py 的模块级函数包装为 IBOMService 接口"""

    def __init__(self, session: Session):
        self._session = session
