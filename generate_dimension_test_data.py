from app import create_app
from bom_system.dimensions.models import Dimension
from bom_system.models import Project
from bom_system.models import db
import random

app = create_app()

# 测试数据 - 包含前端默认的零件 Y1392191
part_ids = ["Y1392191", "PART001", "PART002", "PART003", "PART004", "PART005"]
dimension_types = ["长度", "宽度", "高度", "直径", "厚度", "角度", "距离"]
units = ["mm", "cm", "m", "in"]
# 修改特性列表，使用CC或SC格式
characteristics = ["CC01", "CC02", "CC03", "SC01", "SC02", "SC03", "SC11", "SC12"]
datums = ["A", "B", "C", "D"]
fcf_symbols = ["○", "□", "△", "⌀"]

def generate_test_dimensions():
    """生成测试尺寸数据"""
    with app.app_context():
        # 清空现有数据
        Dimension.query.delete()
        db.session.commit()
        
        # 获取所有项目
        projects = Project.query.all()
        if not projects:
            print("没有项目数据，请先生成项目数据")
            return
        
        # 生成测试数据
        dimensions = []
        for project in projects:
            for part_id in part_ids:
                for group_no in range(1, 4):  # 每个零件3个组
                    for i in range(1, 6):  # 每组5个尺寸
                        dimension = Dimension(
                            project_id=str(project.id),  # 使用项目ID
                            part_id=part_id,
                            group_no=group_no,
                            dimension_type=random.choice(dimension_types),
                            nominal_value=str(round(random.uniform(10, 1000), 2)),
                            tolerance_value=f"±{round(random.uniform(0.01, 1.0), 3)}",
                            upper_tolerance=str(round(random.uniform(0.01, 1.0), 3)),
                            lower_tolerance=str(round(random.uniform(-1.0, -0.01), 3)),
                            unit=random.choice(units),
                            datum=random.choice(datums) if random.random() > 0.5 else None,
                            characteristic=random.choice(characteristics),  # 使用CC或SC格式的特性
                            fcf_symbol=random.choice(fcf_symbols) if random.random() > 0.5 else None,
                            fcf_value=str(round(random.uniform(0.1, 10), 2)) if random.random() > 0.5 else None,
                            fcf_modifier="M" if random.random() > 0.5 else None,
                            fcf_datums="-A-B" if random.random() > 0.5 else None,
                            notes=f"测试尺寸 {i} 组 {group_no}" if random.random() > 0.5 else None
                        )
                        dimensions.append(dimension)
        
        # 批量插入数据
        db.session.add_all(dimensions)
        db.session.commit()
        
        print(f"成功生成 {len(dimensions)} 条尺寸测试数据")

if __name__ == "__main__":
    generate_test_dimensions()
