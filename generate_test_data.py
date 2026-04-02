#!/usr/bin/env python3
"""
生成测试数据到数据库
"""

from app import create_app
from bom_system.models import db, Project, BomTable
from bom_system.dimensions.models import Dimension
import random
import string


def generate_random_string(length=8):
    """生成随机字符串"""
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(length))


def generate_test_data():
    """生成测试数据"""
    app = create_app()

    with app.app_context():
        print("🔧 开始生成测试数据...")

        try:
            # 生成测试项目
            projects = []
            for i in range(3):
                project = Project(
                    name=f"测试项目{i+1}_{generate_random_string(4)}",
                    description=f"这是测试项目{i+1}，用于测试尺寸管理功能",
                    status="active",
                    supplier_name=f"供应商{i+1}",
                    address=f"地址{i+1}",
                    supplier_code=f"SUP{i+1}_{generate_random_string(4)}",
                    customer_name=f"客户{i+1}",
                    customer_purchase=f"采购{i+1}",
                    quality_engineer=f"工程师{i+1}",
                    phone=f"1380013800{i+1}",
                    email=f"test{i+1}_{generate_random_string(4)}@example.com"
                )
                projects.append(project)
                db.session.add(project)
            db.session.commit()
            print(f"✅ 生成了 {len(projects)} 个测试项目")

            # 生成测试零件
            parts = []
            for project in projects:
                for i in range(5):
                    part = BomTable(
                        project_id=project.id,
                        part_number=f"PART{project.id}{i+1}",
                        part_name=f"零件{project.id}-{i+1}",
                        original_material=f"材料{i+1}",
                        final_material_cn=f"最终材料{i+1}",
                        net_weight_kg=round(random.uniform(0.1, 10.0), 2),
                        sequence=i+1
                    )
                    parts.append(part)
                    db.session.add(part)
            db.session.commit()
            print(f"✅ 生成了 {len(parts)} 个测试零件")

            # 生成测试尺寸
            dimensions = []
            dimension_types = [
                'normal', 'diameter', 'position', 'profile_surface', 'profile_line',
                'flatness', 'coplanarity', 'perpendicularity', 'angularity', 'concentricity',
                'radius', 'spherical_diameter', 'spherical_radius', 'straightness', 'roundness',
                'cylindricity', 'parallelism', 'symmetry', 'circular_runout', 'total_runout'
            ]
            datums = ['A', 'B', 'C', 'D', 'E', 'A-B', 'A-B-C', 'B-C']

            for part in parts:
                for i in range(3):
                    dimension_type = random.choice(dimension_types)
                    nominal_value = round(random.uniform(1.0, 100.0), 2)
                    upper_tolerance = round(random.uniform(0.01, 0.1), 3)
                    lower_tolerance = round(-random.uniform(0.01, 0.1), 3)
                    tolerance_value = round(random.uniform(0.01, 0.1), 3)
                    datum = random.choice(datums) if dimension_type in ['position', 'profile_surface', 'flatness', 'coplanarity'] else ''

                    dimension = Dimension(
                        project_id=part.project_id,
                        part_id=part.part_number,
                        group_no=i+1,
                        dimension_type=dimension_type,
                        nominal_value=str(nominal_value),
                        upper_tolerance=str(upper_tolerance) if dimension_type not in ['position', 'profile_surface', 'flatness', 'coplanarity'] else '',
                        lower_tolerance=str(lower_tolerance) if dimension_type not in ['position', 'profile_surface', 'flatness', 'coplanarity'] else '',
                        tolerance_value=str(tolerance_value) if dimension_type in ['position', 'profile_surface', 'flatness', 'coplanarity'] else '',
                        datum=datum,
                        characteristic=f"CC{i+1}" if random.random() > 0.5 else '',
                        notes=f"测试尺寸{i+1}"
                    )
                    dimensions.append(dimension)
                    db.session.add(dimension)
            db.session.commit()
            print(f"✅ 生成了 {len(dimensions)} 个测试尺寸")

            # 验证生成结果
            project_count = Project.query.count()
            part_count = BomTable.query.count()
            dimension_count = Dimension.query.count()
            
            print(f"\n生成结果：")
            print(f"项目数量: {project_count}")
            print(f"零件数量: {part_count}")
            print(f"尺寸数量: {dimension_count}")
            print("\n✅ 测试数据生成成功！")
            
        except Exception as e:
            print(f"❌ 生成测试数据失败: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()


if __name__ == "__main__":
    generate_test_data()
