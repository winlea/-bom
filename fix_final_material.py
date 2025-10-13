"""
修复终审拟代材料数据：将original_material字段的值复制到final_material_cn字段
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app

def fix_final_material():
    """将original_material字段的值复制到final_material_cn字段"""
    with app.app_context():
        try:
            # 使用原生SQL更新数据，避免ORM的兼容性问题
            from bom_system.models import db
            from sqlalchemy import text
            
            sql = text("""
                UPDATE bom_table 
                SET final_material_cn = original_material 
                WHERE final_material_cn IS NULL AND original_material IS NOT NULL
            """)
            
            result = db.session.execute(sql)
            updated_count = result.rowcount
            db.session.commit()
            
            print(f"成功更新 {updated_count} 条记录")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"更新失败: {e}")
            return False

if __name__ == "__main__":
    fix_final_material()