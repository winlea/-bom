import os
import sys
from bom_system.process_capability import ProcessCapabilityService
from bom_system.models import BomTable, db
from app import create_app

# 创建一个模拟的BomTable对象
class MockBomTable:
    def __init__(self):
        self.part_number = 12345
        self.part_name = "测试零件"
        self.drawing_2d = "D12345"
        self.project_id = 1

# 测试函数
def test_process_capability():
    # 模板文件路径
    template_path = r"C:\Users\Administrator\univer\output\01-初始过程能力分析报告 Y1393847.xls"
    if not os.path.exists(template_path):
        print(f"模板文件不存在: {template_path}")
        return
    
    # 创建服务实例
    service = ProcessCapabilityService(template_path)
    
    # 创建模拟零件对象
    part = MockBomTable()
    
    # 输出目录
    output_dir = os.path.join(os.path.dirname(template_path), "process_capability")
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成报告
    try:
        print(f"开始生成报告，零件号: {str(part.part_number)}")
        output_path = service.generate_report(part, output_dir)
        print(f"报告生成成功: {str(output_path)}")
        print(f"文件是否存在: {os.path.exists(output_path)}")
    except Exception as e:
        print(f"生成报告时出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_process_capability()
