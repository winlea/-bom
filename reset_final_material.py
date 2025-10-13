"""
重置终审拟代材料数据：将那些被自动复制的final_material_cn字段重置为空值
只保留那些真正从BOM表中导入的终审拟代材料数据
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app

def reset_final_material():
    """将终审拟代材料字段重置为空值，只保留真正从BOM表中导入的数据"""
    with app.app_context():
        try:
            from bom_system.models import db, BomTable
            
            # 查找所有记录
            all_parts = BomTable.query.all()
            count = 0
            updated_count = 0
            
            for part in all_parts:
                count += 1
                # 如果终审拟代材料和原图材料完全相同，很可能是被自动复制的
                if part.final_material_cn == part.original_material and part.final_material_cn is not None:
                    part.final_material_cn = None
                    updated_count += 1
            
            db.session.commit()
            print(f"检查了 {count} 条记录")
            print(f"成功重置 {updated_count} 条记录的终审拟代材料字段为空")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"重置失败: {e}")
            return False

if __name__ == "__main__":
    reset_final_material()