from app import create_app
from bom_system.models import db, BomTable

# 验证导入的BOM数据，检查序号和图片
def verify_imported_data_detailed():
    app = create_app()
    
    with app.app_context():
        print("开始验证导入的BOM数据...")
        
        # 查询所有BOM记录
        all_bom = BomTable.query.order_by(BomTable.bom_sort).all()
        
        print(f"\n数据库中的BOM记录数: {len(all_bom)}")
        
        if all_bom:
            print("\n导入的BOM记录（按序号排序）:")
            for i, bom in enumerate(all_bom, 1):
                print(f"\n{i}. ID: {bom.id}")
                print(f"   零件编号: {bom.part_number}")
                print(f"   零件名称: {bom.part_name}")
                print(f"   装配等级: {bom.assembly_level}")
                print(f"   序号: {bom.sequence}")
                print(f"   BOM排序: {bom.bom_sort}")
                print(f"   图片URL: {bom.image_url}")
                print(f"   图片数据存在: {bom.image_data is not None}")
                print(f"   2D图号: {bom.drawing_2d}")
                print(f"   3D图号: {bom.drawing_3d}")
        else:
            print("\n数据库中没有BOM记录!")
        
        # 检查是否有重复序号
        sequences = [bom.sequence for bom in all_bom if bom.sequence]
        duplicate_sequences = [seq for seq in sequences if sequences.count(seq) > 1]
        if duplicate_sequences:
            print(f"\n警告: 发现重复序号: {set(duplicate_sequences)}")
        else:
            print("\n✓ 所有序号都是唯一的")
        
        # 检查图片处理
        image_count = sum(1 for bom in all_bom if bom.image_data or bom.image_url)
        print(f"\n包含图片的记录数: {image_count}")
        
        print("\n验证完成!")

if __name__ == "__main__":
    verify_imported_data_detailed()
