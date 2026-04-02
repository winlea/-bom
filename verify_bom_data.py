from app import create_app
from bom_system.models import BomTable, db


# 验证BOM数据是否正确保存
def verify_bom_data():
    app = create_app()

    with app.app_context():
        print("开始验证BOM数据...")

        # 查询所有BOM记录
        total_records = BomTable.query.count()
        print(f"\n数据库中BOM记录总数: {total_records}")

        if total_records > 0:
            print("\n最近10条记录:")
            recent_records = (
                BomTable.query.order_by(BomTable.created_at.desc()).limit(10).all()
            )

            for i, record in enumerate(recent_records, 1):
                print(f"\n{i}. ID: {record.id}")
                print(f"   零件编号: {record.part_number}")
                print(f"   零件名称: {record.part_name}")
                print(f"   装配等级: {record.assembly_level}")
                print(f"   序号: {record.sequence}")
                print(f"   创建时间: {record.created_at}")
                print(f"   项目ID: {record.project_id}")

            # 检查是否有图片数据
            has_image_data = BomTable.query.filter(
                BomTable.image_data.isnot(None)
            ).count()
            print(f"\n包含图片数据的记录数: {has_image_data}")

            # 检查是否有URL图片
            has_image_url = BomTable.query.filter(
                BomTable.image_url.isnot(None)
            ).count()
            print(f"包含图片URL的记录数: {has_image_url}")

        else:
            print("\n数据库中没有BOM记录!")

        print("\n验证完成!")


if __name__ == "__main__":
    verify_bom_data()
