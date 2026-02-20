from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from bom_system.config import SQLALCHEMY_DATABASE_URI

# 创建数据库引擎
engine = create_engine(SQLALCHEMY_DATABASE_URI)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session() -> Session:
    """获取数据库会话"""
    return SessionLocal()


@contextmanager
def db_session_manager():
    """数据库会话管理器，使用上下文管理器"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()
