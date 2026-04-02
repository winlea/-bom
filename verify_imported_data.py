from app import create_app
from bom_system.models import BomTable, db


# 验证导入的BOM数据
def verify_imported_data():
    app = create_app()

    with app.app_context():
        print("开始验证导入的BOM数据...")

        # 查询所有BOM记录
        all_bom = BomTable.query.all()

        print(f"\n数据库中的BOM记录数: {len(all_bom)}")

        if all_bom:
            print("\n导入的BOM记录:")
            for i, bom in enumerate(all_bom[:10], 1):
                print(f"\n{i}. ID: {bom.id}")
                print(f"   零件编号: {bom.part_number}")
                print(f"   零件名称: {bom.part_name}")
                print(f"   项目ID: {bom.project_id}")
                print(f"   装配等级: {bom.assembly_level}")
                print(f"   序号: {bom.sequence}")

            if len(all_bom) > 10:
                print(f"\n... 还有 {len(all_bom) - 10} 条记录未显示")
        else:
            print("\n数据库中没有BOM记录!")

        print("\n验证完成!")


if __name__ == "__main__":
    verify_imported_data()
