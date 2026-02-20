from app import create_app
from bom_system.models import db, import_all_models
from bom_system.models import Project, BomTable, ImportLog

print('初始化数据库...')

app = create_app()

print(f'Flask应用配置:')
print(f'  SQLALCHEMY_DATABASE_URI: {app.config.get("SQLALCHEMY_DATABASE_URI")}')
print()

with app.app_context():
    print('导入所有模型...')
    # 确保所有模型都被导入
    import_all_models()
    # 显式导入当前文件中的模型
    print('模型导入完成')
    
    print('创建表结构...')
    db.create_all()
    print('表结构创建完成')
    
    # 验证表是否创建成功
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f'\n创建的表 ({len(tables)} 个):')
    for table in tables:
        print(f'- {table}')
    
    # 特别检查projects表
    if 'projects' in tables:
        print('\n✓ projects表创建成功!')
    else:
        print('\n✗ projects表创建失败!')
    
    # 特别检查dimensions表
    if 'dimensions' in tables:
        print('✓ dimensions表创建成功!')
    else:
        print('✗ dimensions表创建失败!')

print("DB init OK")
