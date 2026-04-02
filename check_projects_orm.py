from bom_system.app import create_app
from bom_system.models import Project, db

print("检查数据库中的项目...")

# 创建应用实例
app = create_app()

with app.app_context():
    try:
        # 查询所有项目
        projects = Project.query.all()

        print(f"找到 {len(projects)} 个项目:")
        for project in projects:
            print(
                f"ID: {project.id}, 名称: {project.name}, 描述: {project.description}, 状态: {project.status}, 创建时间: {project.created_at}"
            )

    except Exception as e:
        print(f"查询项目失败: {e}")

    finally:
        # 关闭数据库连接
        db.session.close()
