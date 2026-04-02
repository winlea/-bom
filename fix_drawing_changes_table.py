from app import create_app
from bom_system.models import db
from sqlalchemy import text

print("修复drawing_changes表结构...")

app = create_app()

with app.app_context():
    # 先删除现有的drawing_changes表
    print("删除现有drawing_changes表...")
    with db.engine.connect() as connection:
        connection.execute(text('DROP TABLE IF EXISTS drawing_changes'))
        connection.commit()
    
    # 重新导入所有模型
    from bom_system.models import BomTable, DrawingChange, ImportLog, Project
    
    # 重新创建表结构
    print("重新创建表结构...")
    db.create_all()
    
    # 验证表结构
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    
    # 检查drawing_changes表的列
    print("\ndrawing_changes表结构:")
    columns = inspector.get_columns('drawing_changes')
    for column in columns:
        print(f"- {column['name']}: {column['type']}")

print("表结构修复完成!")
