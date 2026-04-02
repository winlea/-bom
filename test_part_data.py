from bom_system.models import BomTable
from app import create_app

# 创建应用实例
app = create_app()

with app.app_context():
    # 获取零件ID为1的零件信息
    part = BomTable.query.get(1)
    if part:
        print(f"零件ID: {part.id}")
        print(f"零件号: {part.part_number}")
        print(f"零件名称: {part.part_name}")
        print(f"2D图纸: {part.drawing_2d}")
    else:
        print("未找到零件ID为1的零件")
