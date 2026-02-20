import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from bom_system.models import BomTable, db
from app import create_app

app = create_app()

def check_bom_images():
    """检查BOM记录中的图片数据"""
    print("开始检查BOM记录中的图片数据...")
    print("=" * 60)
    
    with app.app_context():
        # 获取最近的项目记录（项目ID: 9）
        project_id = 9
        bom_records = BomTable.query.filter_by(project_id=project_id).all()
        
        print(f"项目ID: {project_id} 的BOM记录数: {len(bom_records)}")
        print()
        
        # 统计有图片和无图片的记录
        has_image_count = 0
        no_image_count = 0
        
        for i, bom in enumerate(bom_records[:10], 1):  # 只检查前10条
            image_data_exists = bom.image_data is not None
            image_url_exists = bom.image_url is not None
            
            if image_data_exists or image_url_exists:
                has_image_count += 1
            else:
                no_image_count += 1
            
            print(f"{i}. 零件号: {bom.part_number}, 图片数据: {'有' if image_data_exists else '无'}, 图片URL: {'有' if image_url_exists else '无'}")
        
        print()
        print(f"前10条记录统计: 有图片: {has_image_count}, 无图片: {no_image_count}")
        print()
        
        # 检查所有记录的图片状态
        total_has_image = 0
        total_no_image = 0
        
        for bom in bom_records:
            if bom.image_data is not None or bom.image_url is not None:
                total_has_image += 1
            else:
                total_no_image += 1
        
        print(f"所有记录统计: 有图片: {total_has_image}, 无图片: {total_no_image}")
        print("=" * 60)
        print("检查完成！")

if __name__ == "__main__":
    check_bom_images()
