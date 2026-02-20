import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from bom_system.models import BomTable, Project, ImportLog, db
from app import create_app

app = create_app()

def check_bom_records():
    """检查BOM记录的project_id字段"""
    print("开始检查BOM记录...")
    print("=" * 60)
    
    with app.app_context():
        # 获取所有BOM记录
        all_bom_records = BomTable.query.all()
        print(f"总BOM记录数: {len(all_bom_records)}")
        print()
        
        # 按project_id分组统计
        project_counts = {}
        for bom in all_bom_records:
            project_id = bom.project_id
            if project_id not in project_counts:
                project_counts[project_id] = 0
            project_counts[project_id] += 1
        
        print("按project_id分组统计:")
        for project_id, count in project_counts.items():
            print(f"project_id={project_id}: {count}条记录")
        print()
        
        # 检查最近的几条记录
        print("最近10条BOM记录详情:")
        recent_bom_records = BomTable.query.order_by(BomTable.id.desc()).limit(10).all()
        for i, bom in enumerate(recent_bom_records, 1):
            print(f"{i}. ID: {bom.id}, Project ID: {bom.project_id}, Part Number: {bom.part_number}")
        print()
        
        # 检查最近的导入日志
        print("最近5条导入日志:")
        recent_import_logs = ImportLog.query.order_by(ImportLog.id.desc()).limit(5).all()
        for i, log in enumerate(recent_import_logs, 1):
            print(f"{i}. ID: {log.id}, Project ID: {log.project_id}, Created Count: {log.created_count}, Errors Count: {log.errors_count}")
        print()
        
        # 检查最近的项目
        print("最近5个项目:")
        recent_projects = Project.query.order_by(Project.id.desc()).limit(5).all()
        for i, project in enumerate(recent_projects, 1):
            print(f"{i}. ID: {project.id}, Name: {project.name}")
        print()
        
        # 检查是否有project_id为None的记录
        none_project_id_records = BomTable.query.filter_by(project_id=None).count()
        print(f"project_id为None的记录数: {none_project_id_records}")
        print("=" * 60)
        print("检查完成！")

if __name__ == "__main__":
    check_bom_records()
