#!/usr/bin/env python3
"""
创建测试数据脚本
"""

from app import create_app
from bom_system.models import db, Project, BomTable
from bom_system.dimensions.models import Dimension


def create_test_data():
    """创建测试数据"""
    app = create_app()

    with app.app_context():
        print("🔧 开始创建测试数据...")

        try:
            # 检查是否已有项目数据
            existing_project = Project.query.filter_by(name="测试项目").first()
            if existing_project:
                print(f"✅ 项目已存在: {existing_project.name}")
                project = existing_project
            else:
                # 创建测试项目
                project = Project(
                    name="测试项目",
                    description="这是一个测试项目，用于展示尺寸管理功能",
                    status="active"
                )
                db.session.add(project)
                db.session.commit()
                print(f"✅ 创建项目: {project.name}")

            # 检查是否已有零件数据
            existing_part = BomTable.query.filter_by(part_number="Y1392191").first()
            if existing_part:
                print(f"✅ 零件已存在: {existing_part.part_number}")
                part = existing_part
            else:
                # 创建测试零件
                part = BomTable(
                    project_id=project.id,
                    part_number="Y1392191",
                    part_name="测试零件",
                    sequence="1",
                    assembly_level=1,
                    bom_sort=1
                )
                db.session.add(part)
                db.session.commit()
                print(f"✅ 创建零件: {part.part_number}")

            # 检查是否已有尺寸数据
            existing_dimensions = Dimension.query.filter_by(
                project_id=str(project.id),
                part_id=part.part_number
            ).count()
            if existing_dimensions > 0:
                print(f"✅ 尺寸已存在: {existing_dimensions} 个")
            else:
                # 创建测试尺寸
                dimensions_data = [
                    {
                        "project_id": str(project.id),
                        "part_id": part.part_number,
                        "group_no": 1,
                        "dimension_type": "diameter",
                        "nominal_value": "10.0",
                        "upper_tolerance": "0.05",
                        "lower_tolerance": "-0.05",
                        "datum": "A",
                        "characteristic": "CC01",
                        "notes": "测试尺寸1"
                    },
                    {
                        "project_id": str(project.id),
                        "part_id": part.part_number,
                        "group_no": 1,
                        "dimension_type": "position",
                        "nominal_value": "",
                        "tolerance_value": "0.1",
                        "datum": "A-B",
                        "characteristic": "SC02",
                        "notes": "测试尺寸2"
                    },
                    {
                        "project_id": str(project.id),
                        "part_id": part.part_number,
                        "group_no": 2,
                        "dimension_type": "linear",
                        "nominal_value": "50.0",
                        "upper_tolerance": "0.1",
                        "lower_tolerance": "-0.1",
                        "datum": "",
                        "characteristic": "",
                        "notes": "测试尺寸3"
                    }
                ]

                dimensions_created = 0
                for dim_data in dimensions_data:
                    dimension = Dimension(**dim_data)
                    db.session.add(dimension)
                    dimensions_created += 1

                db.session.commit()
                print(f"✅ 创建尺寸: {dimensions_created} 个")

            # 显示统计信息
            total_projects = Project.query.count()
            total_parts = BomTable.query.count()
            total_dimensions = Dimension.query.count()

            print("🎉 测试数据创建完成!")
            print("📊 统计信息:")
            print(f"   - 项目数量: {total_projects}")
            print(f"   - 零件数量: {total_parts}")
            print(f"   - 尺寸数量: {total_dimensions}")

            return True

        except Exception as e:
            print(f"❌ 创建数据失败: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return False


if __name__ == "__main__":
    create_test_data()
