#!/usr/bin/env python3
"""
检查数据库中的项目数据
"""

from app import create_app
from bom_system.models import db, Project, BomTable
from bom_system.dimensions.models import Dimension


def check_db():
    """检查数据库中的项目数据"""
    app = create_app()

    with app.app_context():
        print("🔧 开始检查数据库...")

        try:
            # 检查项目数量
            project_count = Project.query.count()
            print(f"项目数量: {project_count}")

            # 检查项目列表
            projects = Project.query.all()
            print("项目列表:")
            for project in projects:
                print(f"  - {project.name} (ID: {project.id})")

            # 检查零件数量
            part_count = BomTable.query.count()
            print(f"零件数量: {part_count}")

            # 检查零件列表
            parts = BomTable.query.all()
            print("零件列表:")
            for part in parts:
                print(f"  - {part.part_number} (ID: {part.id}, 项目ID: {part.project_id})")

            # 检查尺寸数量
            dimension_count = Dimension.query.count()
            print(f"尺寸数量: {dimension_count}")

            # 检查尺寸列表
            dimensions = Dimension.query.limit(5).all()
            print("尺寸列表 (前5个):")
            for dimension in dimensions:
                print(f"  - ID: {dimension.id}, 项目ID: {dimension.project_id}, 零件ID: {dimension.part_id}, 类型: {dimension.dimension_type}")

        except Exception as e:
            print(f"❌ 检查数据库失败: {str(e)}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    check_db()
