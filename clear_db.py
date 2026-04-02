#!/usr/bin/env python3
"""
清空数据库中的所有数据
"""

from app import create_app
from bom_system.models import db, Project, BomTable
from bom_system.dimensions.models import Dimension, DimensionVersion, DimensionTemplate


def clear_db():
    """清空数据库中的所有数据"""
    app = create_app()

    with app.app_context():
        print("🔧 开始清空数据库...")

        try:
            # 先删除尺寸相关的表
            print("删除尺寸模板...")
            db.session.query(DimensionTemplate).delete()
            print("删除尺寸版本...")
            db.session.query(DimensionVersion).delete()
            print("删除尺寸...")
            db.session.query(Dimension).delete()
            
            # 再删除零件表
            print("删除零件...")
            db.session.query(BomTable).delete()
            
            # 最后删除项目表
            print("删除项目...")
            db.session.query(Project).delete()
            
            # 提交事务
            db.session.commit()
            print("✅ 数据库清空成功！")
            
            # 验证清空结果
            project_count = Project.query.count()
            part_count = BomTable.query.count()
            dimension_count = Dimension.query.count()
            
            print(f"清空后：")
            print(f"项目数量: {project_count}")
            print(f"零件数量: {part_count}")
            print(f"尺寸数量: {dimension_count}")
            
        except Exception as e:
            print(f"❌ 清空数据库失败: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()


if __name__ == "__main__":
    clear_db()
