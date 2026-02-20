print('测试项目创建约束...')

from bom_system.models import db, Project
from app import create_app
import datetime

app = create_app()

with app.app_context():
    try:
        print('1. 检查数据库连接')
        from sqlalchemy import text
        result = db.session.execute(text("SELECT 1")).scalar()
        print(f'   连接成功: {result}')
        
        print('\n2. 检查表结构')
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        columns = inspector.get_columns('projects')
        print('   表字段:')
        for col in columns:
            print(f'   - {col["name"]}: {col["type"]}, 非空: {col["nullable"]}')
        
        print('\n3. 检查是否存在同名项目')
        existing = Project.query.filter_by(name='测试项目').first()
        if existing:
            print(f'   存在同名项目，ID: {existing.id}')
            # 删除同名项目
            db.session.delete(existing)
            db.session.commit()
            print('   已删除同名项目')
        else:
            print('   不存在同名项目')
        
        print('\n4. 尝试创建项目（使用简单数据）')
        project = Project(
            name='test_project',
            description='test description',
            status='created',
            created_at=datetime.datetime.utcnow()
        )
        print(f'   项目对象: {project}')
        
        db.session.add(project)
        print('   添加到会话')
        
        print('   提交事务...')
        db.session.commit()
        print(f'   项目创建成功，ID: {project.id}')
        
        print('\n5. 清理测试数据')
        db.session.delete(project)
        db.session.commit()
        print('   测试数据清理成功')
        
        print('\n测试成功!')
        
    except Exception as e:
        print(f'\n测试失败: {e}')
        import traceback
        traceback.print_exc()
        
    finally:
        db.session.close()
        print('\n操作完成')
