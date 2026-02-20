from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from bom_system.models import Project, db
from app import create_app

print('直接检查数据库...')

# 创建应用实例
app = create_app()

with app.app_context():
    try:
        # 获取数据库引擎
        engine = db.get_engine()
        print(f'数据库引擎: {engine}')
        
        # 检查连接
        with engine.connect() as conn:
            print('数据库连接成功')
            
            # 检查表结构
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f'数据库中的表: {tables}')
            
            # 检查projects表
            if 'projects' in tables:
                print('\n检查projects表结构:')
                columns = inspector.get_columns('projects')
                for col in columns:
                    print(f'列: {col["name"]}, 类型: {col["type"]}, 非空: {col["nullable"]}')
                
                # 检查表中的数据
                result = conn.execute("SELECT * FROM projects LIMIT 10")
                rows = result.fetchall()
                print(f'\nprojects表中的数据 ({len(rows)} 行):')
                for row in rows:
                    print(row)
            else:
                print('\nprojects表不存在')
                
                # 尝试创建表
                print('尝试创建表...')
                db.create_all()
                print('表创建完成')
                
                # 再次检查
                new_tables = inspector.get_table_names()
                print(f'创建后的表: {new_tables}')
        
        # 测试创建项目
        print('\n测试创建项目...')
        project = Project(name='测试项目', description='测试项目描述')
        db.session.add(project)
        db.session.commit()
        print(f'项目创建成功，ID: {project.id}')
        
        # 测试查询项目
        projects = Project.query.all()
        print(f'查询到 {len(projects)} 个项目:')
        for p in projects:
            print(f'ID: {p.id}, 名称: {p.name}')
            
    except Exception as e:
        print(f'操作失败: {e}')
        import traceback
        traceback.print_exc()
        
    finally:
        # 关闭数据库连接
        db.session.close()
        print('\n操作完成')
