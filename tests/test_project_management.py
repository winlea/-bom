import pytest

from app import create_app
from bom_system.models import Project, db, import_all_models

# 全局应用实例
app = create_app()

# 测试前准备
def setup_module():
    """模块级别的设置，创建数据库表"""
    with app.app_context():
        # 显式导入所有模型以确保它们被注册
        from bom_system.models import Project, BomTable, ImportLog, DrawingChange
        from bom_system.dimensions.models import Dimension
        import_all_models()
        db.create_all()
        
        # 验证表是否创建成功
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"创建的表 ({len(tables)} 个):")
        for table in tables:
            print(f"- {table}")
        
        # 特别检查projects表
        if "projects" in tables:
            print("✓ projects表创建成功!")
        else:
            print("✗ projects表创建失败!")

# 测试后清理
def teardown_module():
    """模块级别的清理，删除数据库表"""
    with app.app_context():
        db.drop_all()


def test_create_project():
    """测试创建项目"""
    with app.app_context():
        project = None
        try:
            # 创建项目
            project = Project(
                name="测试项目",
                description="测试项目描述",
                status="created",
                customer_name="测试客户",
                supplier_name="测试供应商",
                supplier_code="SUP123"
            )
            db.session.add(project)
            db.session.commit()
            
            # 验证项目创建成功
            assert project.id is not None
            assert project.name == "测试项目"
            assert project.status == "created"
        finally:
            # 清理测试数据
            if project:
                db.session.delete(project)
                db.session.commit()


def test_update_project():
    """测试更新项目"""
    with app.app_context():
        project = None
        try:
            # 创建项目
            project = Project(
                name="测试项目",
                description="测试项目描述",
                status="created"
            )
            db.session.add(project)
            db.session.commit()
            
            # 更新项目
            project.name = "更新后的项目"
            project.status = "imported"
            db.session.commit()
            
            # 验证更新成功
            updated_project = db.session.query(Project).get(project.id)
            assert updated_project.name == "更新后的项目"
            assert updated_project.status == "imported"
        finally:
            # 清理测试数据
            if project:
                db.session.delete(project)
                db.session.commit()


def test_delete_project():
    """测试删除项目"""
    with app.app_context():
        project = None
        try:
            # 创建项目
            project = Project(
                name="测试项目",
                description="测试项目描述",
                status="created"
            )
            db.session.add(project)
            db.session.commit()
            project_id = project.id
            
            # 删除项目
            db.session.delete(project)
            db.session.commit()
            
            # 验证项目已删除
            deleted_project = db.session.query(Project).get(project_id)
            assert deleted_project is None
        finally:
            pass


def test_get_projects():
    """测试获取项目列表"""
    with app.app_context():
        project1 = None
        project2 = None
        try:
            # 创建多个项目
            project1 = Project(
                name="项目1",
                description="项目1描述",
                status="created"
            )
            project2 = Project(
                name="项目2",
                description="项目2描述",
                status="imported"
            )
            db.session.add(project1)
            db.session.add(project2)
            db.session.commit()
            
            # 获取项目列表
            projects = db.session.query(Project).all()
            assert len(projects) >= 2
            assert any(p.name == "项目1" for p in projects)
            assert any(p.name == "项目2" for p in projects)
        finally:
            # 清理测试数据
            if project1:
                db.session.delete(project1)
            if project2:
                db.session.delete(project2)
            db.session.commit()
