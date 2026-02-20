print('简单测试数据库操作...')

from bom_system.models import db, Project
from app import create_app

app = create_app()

with app.app_context():
    try:
        print('1. 测试数据库连接')
        # 使用更兼容的方式测试连接
        from sqlalchemy import text
        result = db.session.execute(text("SELECT 1")).scalar()
        print(f'   连接成功: {result}')
        
        print('\n2. 检查表是否存在')
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f'   表: {tables}')
        
        print('\n3. 尝试创建项目')
        project = Project(name='测试项目', description='测试描述')
        db.session.add(project)
        db.session.commit()
        print(f'   项目创建成功，ID: {project.id}')
        
        print('\n4. 尝试查询项目')
        projects = Project.query.all()
        print(f'   查询到 {len(projects)} 个项目')
        
        print('\n测试成功!')
        
    except Exception as e:
        print(f'\n测试失败: {e}')
        import traceback
        traceback.print_exc()
        
    finally:
        db.session.close()
        print('\n操作完成')
