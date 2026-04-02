#!/usr/bin/env python3
"""
创建示例数据脚本
"""

from app import create_app
from bom_system.core.database import db
from bom_system.models.dimension import Dimension, DimensionType
from bom_system.models.part import Part, PartStatus, PartType
from bom_system.models.project import Project, ProjectStatus, ProjectType


def create_sample_data():
    """创建示例数据"""
    app = create_app()

    with app.app_context():
        print("🔧 开始创建示例数据...")

        try:
            # 检查是否已有项目数据
            existing_project = Project.query.filter_by(code="DEMO_CAR_001").first()
            if existing_project:
                print(f"✅ 项目已存在: {existing_project.name}")
                project = existing_project
            else:
                # 创建示例项目
                project = Project(
                    name="示例汽车项目",
                    code="DEMO_CAR_001",
                    description="这是一个示例汽车零件项目，用于展示系统功能",
                    project_type=ProjectType.AUTOMOTIVE,
                    status=ProjectStatus.ACTIVE,
                    customer_name="示例客户公司",
                    product_name="示例汽车型号",
                )
                db.session.add(project)
                db.session.commit()
                print(f"✅ 创建项目: {project.name}")

            # 检查是否已有零件数据
            existing_parts = Part.query.filter_by(project_id=project.id).count()
            if existing_parts > 0:
                print(f"✅ 零件已存在: {existing_parts} 个")
                parts = Part.query.filter_by(project_id=project.id).all()
            else:
                # 创建示例零件
                parts_data = [
                    {
                        "part_name": "左侧侧板",
                        "part_number": "Y0704612",
                        "part_type": PartType.PLATE,
                        "status": PartStatus.APPROVED,
                        "description": "汽车左侧侧板零件",
                        "material_thickness": 1.5,
                        "quantity": 2,
                    },
                    {
                        "part_name": "前保险杠支架",
                        "part_number": "Y0704613",
                        "part_type": PartType.BRACKET,
                        "status": PartStatus.APPROVED,
                        "description": "前保险杠支架零件",
                        "material_thickness": 2.0,
                        "quantity": 1,
                    },
                    {
                        "part_name": "车门加强件",
                        "part_number": "Y0704614",
                        "part_type": PartType.REINFORCEMENT,
                        "status": PartStatus.PRODUCTION,
                        "description": "车门加强件",
                        "material_thickness": 1.8,
                        "quantity": 4,
                    },
                ]

                parts = []
                for part_data in parts_data:
                    part = Part(project_id=project.id, **part_data)
                    db.session.add(part)
                    parts.append(part)

                db.session.commit()
                print(f"✅ 创建零件: {len(parts)} 个")

            # 检查是否已有尺寸数据
            existing_dimensions = (
                Dimension.query.join(Part).filter(Part.project_id == project.id).count()
            )
            if existing_dimensions > 0:
                print(f"✅ 尺寸已存在: {existing_dimensions} 个")
            else:
                # 为每个零件创建示例尺寸
                dimensions_created = 0
                for part in parts:
                    dimensions_data = [
                        {
                            "characteristic": "长度尺寸",  # 添加必填字段
                            "dimension_name": "长度",
                            "dimension_type": DimensionType.LENGTH,
                            "nominal_value": 1200.0,
                            "upper_tolerance": 0.5,
                            "lower_tolerance": -0.5,
                            "actual_value": 1200.2,
                            "is_critical": True,
                        },
                        {
                            "characteristic": "宽度尺寸",  # 添加必填字段
                            "dimension_name": "宽度",
                            "dimension_type": DimensionType.WIDTH,
                            "nominal_value": 800.0,
                            "upper_tolerance": 0.3,
                            "lower_tolerance": -0.3,
                            "actual_value": 799.8,
                            "is_critical": False,
                        },
                        {
                            "characteristic": "厚度尺寸",  # 添加必填字段
                            "dimension_name": "厚度",
                            "dimension_type": DimensionType.THICKNESS,
                            "nominal_value": part.material_thickness,
                            "upper_tolerance": 0.1,
                            "lower_tolerance": -0.1,
                            "actual_value": part.material_thickness + 0.02,
                            "is_critical": True,
                        },
                    ]

                    for dim_data in dimensions_data:
                        dimension = Dimension(part_id=part.id, **dim_data)
                        db.session.add(dimension)
                        dimensions_created += 1

                db.session.commit()
                print(f"✅ 创建尺寸: {dimensions_created} 个")

            # 显示统计信息
            total_projects = Project.query.count()
            total_parts = Part.query.count()
            total_dimensions = Dimension.query.count()

            print("🎉 示例数据创建完成!")
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
    create_sample_data()
