from app import create_app
from bom_system.models import db, BomTable

# 检查项目1的BOM数据
def check_project1_bom():
    app = create_app()
    
    with app.app_context():
        print("开始检查项目1的BOM数据...")
        
        # 查询项目1的BOM记录
        project1_bom = BomTable.query.filter(BomTable.project_id == 1).all()
        
        print(f"\n项目1的BOM记录数: {len(project1_bom)}")
        
        if project1_bom:
            print("\n项目1的前5条BOM记录:")
            for i, bom in enumerate(project1_bom[:5], 1):
                print(f"\n{i}. ID: {bom.id}")
                print(f"   零件编号: {bom.part_number}")
                print(f"   零件名称: {bom.part_name}")
                print(f"   项目ID: {bom.project_id}")
                print(f"   装配等级: {bom.assembly_level}")
                print(f"   序号: {bom.sequence}")
        else:
            print("\n项目1没有BOM数据!")
        
        # 查询所有无项目ID的BOM记录
        no_project_bom = BomTable.query.filter(BomTable.project_id == None).all()
        print(f"\n无项目ID的BOM记录数: {len(no_project_bom)}")
        
        if no_project_bom:
            print("\n无项目ID的前5条BOM记录:")
            for i, bom in enumerate(no_project_bom[:5], 1):
                print(f"\n{i}. ID: {bom.id}")
                print(f"   零件编号: {bom.part_number}")
                print(f"   零件名称: {bom.part_name}")
                print(f"   项目ID: {bom.project_id}")
        
        print("\n检查完成!")

if __name__ == "__main__":
    check_project1_bom()
