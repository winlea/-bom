"""
添加 GDT 逻辑测试数据 - 关联到真实零件号
GDT = Geometric Dimensioning and Tolerancing (几何尺寸和公差)
"""

import os
import sys
import io

# 设置标准输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from bom_system.models import BomTable


def add_gdt_test_data():
    """添加 GDT 测试数据"""
    app = create_app()
    
    with app.app_context():
        # 获取项目4的零件
        parts = BomTable.query.filter_by(project_id=4).all()
        
        if not parts:
            print("错误: 项目4没有零件，请先创建零件")
            return
        
        # 选择前3个零件作为测试对象
        test_parts = parts[:3]
        print(f"为以下零件添加GDT测试数据:")
        for p in test_parts:
            print(f"  - {p.part_number}: {p.part_name}")
        print()
        
        # GDT 测试数据 - 关联到真实零件
        # 格式: {part_id: 零件编号, dimension_type: 尺寸类型, ...}
        gdt_data = [
            # ===== 零件1: 线性尺寸 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 1,
                "dimension_type": "LINEAR",
                "nominal_value": "50.0",
                "tolerance_value": "±0.1",
                "upper_tolerance": "0.1",
                "lower_tolerance": "-0.1",
                "unit": "mm",
                "datum": None,
                "characteristic": "KEY",
                "fcf_symbol": "⏐",
                "fcf_value": "0.05",
                "fcf_modifier": "M",
                "notes": "关键外观尺寸"
            },
            {
                "part_id": test_parts[0].part_number,
                "group_no": 2,
                "dimension_type": "LINEAR",
                "nominal_value": "120.0",
                "tolerance_value": "±0.15",
                "upper_tolerance": "0.15",
                "lower_tolerance": "-0.15",
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "fcf_symbol": "⏐",
                "fcf_value": "0.08",
                "fcf_modifier": "M",
                "notes": "关键功能尺寸，基准A定位"
            },
            {
                "part_id": test_parts[0].part_number,
                "group_no": 3,
                "dimension_type": "LINEAR",
                "nominal_value": "80.0",
                "tolerance_value": "±0.2",
                "upper_tolerance": "0.2",
                "lower_tolerance": "-0.2",
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "GENERAL",
                "notes": "一般装配尺寸"
            },
            # ===== 零件1: 直径尺寸 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 4,
                "dimension_type": "DIAMETER",
                "nominal_value": "25.0",
                "tolerance_value": "0/-0.05",
                "upper_tolerance": "0",
                "lower_tolerance": "-0.05",
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "KEY",
                "notes": "轴孔配合直径"
            },
            # ===== 零件1: 角度尺寸 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 5,
                "dimension_type": "ANGULAR",
                "nominal_value": "90.0",
                "tolerance_value": "±0.5",
                "upper_tolerance": "0.5",
                "lower_tolerance": "-0.5",
                "unit": "°",
                "datum": "A",
                "characteristic": "GENERAL",
                "notes": "安装面垂直度参考"
            },
            # ===== 零件1: 位置度 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 6,
                "dimension_type": "POSITION",
                "nominal_value": "0.3",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.3",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A-B-C",
                "characteristic": "KEY",
                "fcf_symbol": "⏐",
                "fcf_value": "0.2",
                "fcf_modifier": "M",
                "notes": "安装孔位置度(MMC状态控制)"
            },
            # ===== 零件1: 垂直度 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 7,
                "dimension_type": "PERPENDICULARITY",
                "nominal_value": "0.1",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.1",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "侧面对基准A的垂直度"
            },
            # ===== 零件1: 平面度 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 8,
                "dimension_type": "FLATNESS",
                "nominal_value": "0.05",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.05",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": None,
                "characteristic": "GENERAL",
                "notes": "安装面平面度"
            },
            # ===== 零件1: 圆度 =====
            {
                "part_id": test_parts[0].part_number,
                "group_no": 9,
                "dimension_type": "CIRCULARITY",
                "nominal_value": "0.03",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.03",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": None,
                "characteristic": "GENERAL",
                "notes": "圆形表面轮廓"
            },
            
            # ===== 零件2: 线性尺寸 =====
            {
                "part_id": test_parts[1].part_number,
                "group_no": 1,
                "dimension_type": "LINEAR",
                "nominal_value": "45.0",
                "tolerance_value": "±0.08",
                "upper_tolerance": "0.08",
                "lower_tolerance": "-0.08",
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "fcf_symbol": "⏐",
                "fcf_value": "0.03",
                "fcf_modifier": "M",
                "notes": "关键配合尺寸"
            },
            {
                "part_id": test_parts[1].part_number,
                "group_no": 2,
                "dimension_type": "LINEAR",
                "nominal_value": "60.0",
                "tolerance_value": "±0.1",
                "upper_tolerance": "0.1",
                "lower_tolerance": "-0.1",
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "GENERAL",
                "notes": "安装定位尺寸"
            },
            {
                "part_id": test_parts[1].part_number,
                "group_no": 3,
                "dimension_type": "LINEAR",
                "nominal_value": "30.0",
                "tolerance_value": "+0.1/0",
                "upper_tolerance": "0.1",
                "lower_tolerance": "0",
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "插入深度控制"
            },
            # ===== 零件2: 直径尺寸 =====
            {
                "part_id": test_parts[1].part_number,
                "group_no": 4,
                "dimension_type": "DIAMETER",
                "nominal_value": "15.0",
                "tolerance_value": "0/-0.03",
                "upper_tolerance": "0",
                "lower_tolerance": "-0.03",
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "定位销孔直径"
            },
            # ===== 零件2: 位置度 =====
            {
                "part_id": test_parts[1].part_number,
                "group_no": 5,
                "dimension_type": "POSITION",
                "nominal_value": "0.2",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.2",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "KEY",
                "fcf_symbol": "⏐",
                "fcf_value": "0.15",
                "fcf_modifier": "M",
                "notes": "孔组位置度"
            },
            # ===== 零件2: 平行度 =====
            {
                "part_id": test_parts[1].part_number,
                "group_no": 6,
                "dimension_type": "PARALLELISM",
                "nominal_value": "0.08",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.08",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "相对基准A的平行度"
            },
            # ===== 零件2: 圆柱度 =====
            {
                "part_id": test_parts[1].part_number,
                "group_no": 7,
                "dimension_type": "CYLINDRICITY",
                "nominal_value": "0.04",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.04",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": None,
                "characteristic": "GENERAL",
                "notes": "圆柱表面轮廓度"
            },
            
            # ===== 零件3: 线性尺寸 =====
            {
                "part_id": test_parts[2].part_number,
                "group_no": 1,
                "dimension_type": "LINEAR",
                "nominal_value": "100.0",
                "tolerance_value": "±0.2",
                "upper_tolerance": "0.2",
                "lower_tolerance": "-0.2",
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "GENERAL",
                "notes": "总长尺寸"
            },
            {
                "part_id": test_parts[2].part_number,
                "group_no": 2,
                "dimension_type": "LINEAR",
                "nominal_value": "75.0",
                "tolerance_value": "±0.15",
                "upper_tolerance": "0.15",
                "lower_tolerance": "-0.15",
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "宽度尺寸"
            },
            # ===== 零件3: 同轴度 =====
            {
                "part_id": test_parts[2].part_number,
                "group_no": 3,
                "dimension_type": "CONCENTRICITY",
                "nominal_value": "0.1",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.1",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "KEY",
                "notes": "台阶轴同轴度要求"
            },
            # ===== 零件3: 对称度 =====
            {
                "part_id": test_parts[2].part_number,
                "group_no": 4,
                "dimension_type": "SYMMETRY",
                "nominal_value": "0.15",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.15",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A",
                "characteristic": "GENERAL",
                "notes": "键槽对称度"
            },
            # ===== 零件3: 轮廓度 =====
            {
                "part_id": test_parts[2].part_number,
                "group_no": 5,
                "dimension_type": "PROFILE",
                "nominal_value": "0.2",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.2",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A-B",
                "characteristic": "KEY",
                "notes": "复杂曲面轮廓度"
            },
            # ===== 零件3: 跳动 =====
            {
                "part_id": test_parts[2].part_number,
                "group_no": 6,
                "dimension_type": "RUNOUT",
                "nominal_value": "0.08",
                "tolerance_value": "TYP",
                "upper_tolerance": "0.08",
                "lower_tolerance": None,
                "unit": "mm",
                "datum": "A",
                "characteristic": "KEY",
                "notes": "径向跳动要求"
            },
        ]
        
        # 导入 Dimension 模型
        from bom_system.dimensions.models import Dimension
        
        # 清除旧测试数据（保留其他数据）
        Dimension.query.filter(
            Dimension.part_id.in_([p.part_number for p in test_parts])
        ).delete(synchronize_session=False)
        db.session.commit()
        print(f"已清除旧测试数据\n")
        
        # 添加新数据
        current_part = None
        for dim_data in gdt_data:
            if dim_data["part_id"] != current_part:
                current_part = dim_data["part_id"]
                part_obj = next((p for p in parts if p.part_number == current_part), None)
                print(f"\n零件: {current_part} ({part_obj.part_name if part_obj else '未知'})")
                print("-" * 60)
            
            dim = Dimension(
                project_id="4",
                part_id=dim_data["part_id"],
                group_no=dim_data["group_no"],
                dimension_type=dim_data["dimension_type"],
                nominal_value=dim_data["nominal_value"],
                tolerance_value=dim_data["tolerance_value"],
                upper_tolerance=dim_data.get("upper_tolerance"),
                lower_tolerance=dim_data.get("lower_tolerance"),
                unit=dim_data["unit"],
                datum=dim_data.get("datum"),
                characteristic=dim_data.get("characteristic", "GENERAL"),
                fcf_symbol=dim_data.get("fcf_symbol"),
                fcf_value=dim_data.get("fcf_value"),
                fcf_modifier=dim_data.get("fcf_modifier"),
                notes=dim_data.get("notes"),
            )
            db.session.add(dim)
            
            # 打印详情
            fcf_info = f" FCF:{dim_data.get('fcf_symbol', '')}{dim_data.get('fcf_value', '')}{dim_data.get('fcf_modifier', '')}" if dim_data.get('fcf_symbol') else ""
            datum_info = f" Datum:{dim_data['datum']}" if dim_data.get('datum') else ""
            key_info = " [KEY]" if dim_data.get('characteristic') == 'KEY' else ""
            print(f"  #{dim_data['group_no']:2d} {dim_data['dimension_type']:<18} {dim_data['nominal_value']:>8} {dim_data['unit']:<3} {dim_data['tolerance_value']:<10}{fcf_info}{datum_info}{key_info}")
        
        db.session.commit()
        
        print("\n" + "=" * 60)
        print("GDT 测试数据添加完成！")
        print("=" * 60)
        
        # 统计
        print("\n各零件尺寸数量:")
        for p in test_parts:
            count = Dimension.query.filter_by(part_id=p.part_number).count()
            print(f"  {p.part_number}: {count} 条尺寸")


if __name__ == "__main__":
    add_gdt_test_data()
