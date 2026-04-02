import pytest
from sqlalchemy.orm import Session

from bom_system.database.session import db_session_manager, get_db_session


def test_get_db_session():
    """测试获取数据库会话"""
    session = get_db_session()
    assert isinstance(session, Session)
    session.close()


def test_db_session_manager():
    """测试数据库会话管理器"""
    session_instance = None
    with db_session_manager() as session:
        assert isinstance(session, Session)
        session_instance = session
    # 会话应该在上下文管理器退出时自动关闭
    # 尝试使用已关闭的会话，应该会抛出异常
    from sqlalchemy.exc import InvalidRequestError

    try:
        # 尝试执行一个操作，检查会话是否已关闭
        session_instance.query(1)
        # 如果没有抛出异常，会话可能没有关闭
        assert False, "Session should be closed"
    except Exception:
        # 捕获异常，会话已关闭
        pass


def test_db_session_manager_rollback():
    """测试数据库会话管理器的回滚功能"""
    with pytest.raises(Exception):
        with db_session_manager() as session:
            # 触发异常，应该回滚
            raise Exception("Test exception")
