from app import create_app
from bom_system.models import db, BomTable, Project

# 检查项目1的BOM数据
def check_project1_data():
    app = create_app()
    
    with app.app_context():
        print("开始检查项目1的BOM数据...")
        
        # 查询项目1
        project1 = Project.query.filter(Project.id == 1).first()
        if project1:
            print(f"\n项目1信息:")
            print(f"ID: {project1.id}")
            print(f"名称: {project1.name}")
            print(f"状态: {project1.status}")
        else:
            print("\n项目1不存在!")
        
        # 查询项目1的BOM记录
        project1_bom = BomTable.query.filter(BomTable.project_id == 1).all()
        print(f"\n项目1的BOM记录数: {len(project1_bom)}")
        
        # 查询所有无项目ID的BOM记录
        no_project_bom = BomTable.query.filter(BomTable.project_id == None).all()
        print(f"无项目ID的BOM记录数: {len(no_project_bom)}")
        
        if no_project_bom:
            print("\n无项目ID的前5条BOM记录:")
            for i, bom in enumerate(no_project_bom[:5], 1):
                print(f"\n{i}. ID: {bom.id}")
                print(f"   零件编号: {bom.part_number}")
                print(f"   零件名称: {bom.part_name}")
                print(f"   项目ID: {bom.project_id}")
        
        print("\n检查完成!")

if __name__ == "__main__":
    check_project1_data()
