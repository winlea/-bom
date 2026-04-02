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
from bom_system.repositories.impl.bom import BOMRepository
from bom_system.repositories.impl.dimension import DimensionRepository
from bom_system.repositories.impl.project import ProjectRepository
from bom_system.repositories.project import IProjectRepository


class Container(containers.DeclarativeContainer):
    """依赖注入容器"""

    # 配置
    config = providers.Configuration()

    # 数据库
    db = providers.Singleton(
        SQLAlchemy,
        metadata=db.metadata,
    )

    # 数据库会话
    db_session = providers.Factory(
        get_db_session,
    )

    # 仓储提供者
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

    # 服务提供者（后续实现具体类后注册）
    bom_service = providers.Factory(
        IBOMService,
        bom_repository=bom_repository,
    )

    dimension_service = providers.Factory(
        IDimensionService,
        dimension_repository=dimension_repository,
    )

    project_service = providers.Factory(
        IProjectService,
        project_repository=project_repository,
    )
