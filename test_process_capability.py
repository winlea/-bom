from app import create_app
from bom_system.process_capability import ProcessCapabilityService

app = create_app()

# 测试生成初始过程能力分析报告
def test_generate_process_capability():
    print("开始测试初始过程能力分析报告生成")
    
    # 模板文件路径
    template_path = r"C:\Users\Administrator\univer\output\01-初始过程能力分析报告 Y1393847.xls"
    print(f"模板文件路径: {template_path}")
    
    # 输出目录
    output_dir = r"C:\Users\Administrator\univer\output\test"
    print(f"输出目录: {output_dir}")
    
    # 创建服务实例
    service = ProcessCapabilityService(template_path)
    
    # 直接创建一个测试零件对象，不依赖数据库
    class TestPart:
        def __init__(self):
            self.part_number = "TEST-PART-001"
            self.part_name = "测试零件"
            self.drawing_2d = "D-TST-001"
            self.project_id = 1
    
    part = TestPart()
    print(f"测试零件: {part.part_number} - {part.part_name}")
    
    # 生成报告
    try:
        output_paths = service.generate_report(part, output_dir)
        print(f"生成完成，共生成 {len(output_paths)} 个文件")
        for path in output_paths:
            print(f"生成的文件: {path}")
    except Exception as e:
        print(f"生成报告时出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generate_process_capability()
