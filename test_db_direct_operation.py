from app import create_app
from bom_system.models import Project, db

print("直接测试数据库操作...")

# 创建应用实例
app = create_app()

with app.app_context():
    try:
        print("\n=== 测试 1: 检查数据库连接 ===")
        # 测试数据库连接
        result = db.session.execute("SELECT 1").scalar()
        print(f"数据库连接测试: {result}")

        print("\n=== 测试 2: 检查projects表 ===")
        # 检查表是否存在
        from sqlalchemy import inspect

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"所有表: {tables}")

        if "projects" in tables:
            print("✓ projects表存在")

            # 检查字段
            columns = inspector.get_columns("projects")
            print("表字段:")
            for col in columns:
                print(f'  - {col["name"]}')
        else:
            print("✗ projects表不存在")

        print("\n=== 测试 3: 创建项目 ===")
        # 创建项目
        project = Project(name="测试项目", description="测试项目描述")
        print(f"创建项目对象: {project}")

        db.session.add(project)
        print("添加到会话")

        print("提交事务...")
        db.session.commit()
        print(f"项目创建成功，ID: {project.id}")

        print("\n=== 测试 4: 查询项目 ===")
        # 查询项目
        projects = Project.query.all()
        print(f"查询到 {len(projects)} 个项目:")
        for p in projects:
            print(f"  ID: {p.id}, 名称: {p.name}, 描述: {p.description}")

        print("\n=== 测试 5: 删除项目 ===")
        # 删除项目
        db.session.delete(project)
        db.session.commit()
        print("项目删除成功")

        # 再次查询
        projects_after_delete = Project.query.all()
        print(f"删除后剩余 {len(projects_after_delete)} 个项目")

        print("\n=== 测试完成 ===")
        print("所有测试通过!")

    except Exception as e:
        print(f"\n测试失败: {e}")
        import traceback

        traceback.print_exc()

    finally:
        # 关闭数据库连接
        db.session.close()
        print("\n操作完成")
