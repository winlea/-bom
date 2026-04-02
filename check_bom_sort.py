from app import create_app
from bom_system.models import BomTable, db


# 检查BomTable的bom_sort字段值
def check_bom_sort():
    app = create_app()

    with app.app_context():
        print("开始检查BomTable的bom_sort字段值...")

        # 查询所有BOM记录，按id排序
        all_bom = BomTable.query.order_by(BomTable.id).all()

        print(f"\n数据库中的BOM记录数: {len(all_bom)}")

        if all_bom:
            print("\nBOM记录的bom_sort值:")
            for i, bom in enumerate(all_bom[:20], 1):
                print(
                    f"ID: {bom.id}, 零件编号: {bom.part_number}, bom_sort: {bom.bom_sort}, 项目ID: {bom.project_id}"
                )

            if len(all_bom) > 20:
                print(f"\n... 还有 {len(all_bom) - 20} 条记录未显示")
        else:
            print("\n数据库中没有BOM记录!")

        # 检查项目1的BOM记录
        project1_bom = BomTable.query.filter(BomTable.project_id == 1).all()
        print(f"\n项目1的BOM记录数: {len(project1_bom)}")

        print("\n检查完成!")


if __name__ == "__main__":
    check_bom_sort()
