from bom_system.process_capability import ProcessCapabilityService
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
        
        # 模板路径
        template_path = "C:/Users/Administrator/univer/output/01-初始过程能力分析报告 Y1393847.xls"
        
        # 输出目录
        output_dir = "C:/Users/Administrator/univer/output/test_process_capability"
        
        # 创建服务实例
        service = ProcessCapabilityService(template_path)
        
        # 生成报告
        output_path = service.generate_report(part, output_dir)
        
        print(f"报告生成成功: {output_path}")
    else:
        print("未找到零件ID为1的零件")
