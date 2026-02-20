from app import create_app
from bom_system.models import db, BomTable, Project, ImportLog

# 清空数据库中的所有数据
def clear_all_data():
    app = create_app()
    
    with app.app_context():
        print("开始清空数据库中的所有数据...")
        
        try:
            # 先删除BOM记录
            bom_count = BomTable.query.count()
            BomTable.query.delete()
            db.session.commit()
            print(f"已删除 {bom_count} 条BOM记录")
            
            # 删除项目记录
            project_count = Project.query.count()
            Project.query.delete()
            db.session.commit()
            print(f"已删除 {project_count} 个项目记录")
            
            # 删除导入日志
            log_count = ImportLog.query.count()
            ImportLog.query.delete()
            db.session.commit()
            print(f"已删除 {log_count} 条导入日志")
            
            print("\n数据库清空完成!")
            
            # 验证清空结果
            total_bom = BomTable.query.count()
            total_projects = Project.query.count()
            total_logs = ImportLog.query.count()
            
            print(f"\n清空后验证:")
            print(f"BOM记录数: {total_bom}")
            print(f"项目记录数: {total_projects}")
            print(f"导入日志数: {total_logs}")
            
            if total_bom == 0 and total_projects == 0 and total_logs == 0:
                print("\n✅ 所有数据已成功清空!")
            else:
                print("\n❌ 数据清空不完全!")
                
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ 清空数据时发生错误: {e}")

if __name__ == "__main__":
    clear_all_data()
