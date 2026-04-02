import os
import sys
from bom_system.process_capability import ProcessCapabilityService
from bom_system.models import BomTable

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath('.'))

# 创建一个测试零件对象
class MockPart:
    def __init__(self, part_number, part_name, drawing_2d):
        self.part_number = part_number
        self.part_name = part_name
        self.drawing_2d = drawing_2d

# 测试数据
part = MockPart(
    part_number="TEST-123",
    part_name="测试零件",
    drawing_2d="D-TEST-123"
)

# 模板路径
template_path = "C:/Users/Administrator/univer/output/01-初始过程能力分析报告 Y1393847.xls"

# 输出目录
output_dir = "C:/Users/Administrator/univer/output/test_process_capability"

# 确保输出目录存在
os.makedirs(output_dir, exist_ok=True)

# 创建服务实例
service = ProcessCapabilityService(template_path)

# 生成报告
print("开始生成报告...")
output_path = service.generate_report(part, output_dir)

print(f"报告生成成功: {output_path}")
print(f"文件存在: {os.path.exists(output_path)}")
print(f"文件大小: {os.path.getsize(output_path)} 字节")

# 验证文件内容
print("\n验证文件内容...")
try:
    import xlrd
    workbook = xlrd.open_workbook(output_path)
    worksheet = workbook.sheet_by_index(0)
    
    # 读取填充的单元格
    part_number_cell = worksheet.cell_value(5, 4)  # E6
    part_name_cell = worksheet.cell_value(5, 11)   # L6
    drawing_2d_cell = worksheet.cell_value(6, 4)   # E7
    
    print(f"零件号 (E6): {part_number_cell}")
    print(f"产品描述 (L6): {part_name_cell}")
    print(f"图纸号 (E7): {drawing_2d_cell}")
    
    # 验证数据是否正确填充
    if part_number_cell == part.part_number:
        print("✓ 零件号填充正确")
    else:
        print("✗ 零件号填充错误")
    
    if part_name_cell == part.part_name:
        print("✓ 产品描述填充正确")
    else:
        print("✗ 产品描述填充错误")
    
    if drawing_2d_cell == part.drawing_2d:
        print("✓ 图纸号填充正确")
    else:
        print("✗ 图纸号填充错误")
        
except Exception as e:
    print(f"验证文件内容时出错: {e}")
