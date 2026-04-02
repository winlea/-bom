import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from bom_system.models import BomTable, db

app = create_app()


def check_bom_weights():
    """检查BOM记录中的净重数据"""
    print("开始检查BOM记录中的净重数据...")
    print("=" * 60)

    with app.app_context():
        # 获取最近的项目记录（项目ID: 10）
        project_id = 10
        bom_records = BomTable.query.filter_by(project_id=project_id).all()

        print(f"项目ID: {project_id} 的BOM记录数: {len(bom_records)}")
        print()

        # 统计有净重和无净重的记录
        has_weight_count = 0
        no_weight_count = 0

        for i, bom in enumerate(bom_records[:20], 1):  # 检查前20条
            net_weight = bom.net_weight_kg

            if net_weight is not None:
                has_weight_count += 1
            else:
                no_weight_count += 1

            print(f"{i}. 零件号: {bom.part_number}, 净重: {net_weight}")

        print()
        print(f"前20条记录统计: 有净重: {has_weight_count}, 无净重: {no_weight_count}")
        print()

        # 检查所有记录的净重状态
        total_has_weight = 0
        total_no_weight = 0

        for bom in bom_records:
            if bom.net_weight_kg is not None:
                total_has_weight += 1
            else:
                total_no_weight += 1

        print(f"所有记录统计: 有净重: {total_has_weight}, 无净重: {total_no_weight}")
        print()

        # 检查是否有净重不为空的记录
        if total_has_weight > 0:
            print("有净重数据的记录示例:")
            for bom in bom_records:
                if bom.net_weight_kg is not None:
                    print(f"零件号: {bom.part_number}, 净重: {bom.net_weight_kg}")
                    break

        print("=" * 60)
        print("检查完成！")


if __name__ == "__main__":
    check_bom_weights()
