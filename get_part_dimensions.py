import sys
import os
import json

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath('.'))

from bom_system.models import BomTable, db
from app import create_app

# 创建应用实例
app = create_app()

with app.app_context():
    # 直接查询特定零件的尺寸信息
    project_id = "358"
    part_number = "Y1392191"
    
    print(f"正在查询零件 {part_number} 的尺寸信息...")
    
    # 尝试获取尺寸数据
    try:
        from bom_system.dimensions.models import Dimension
        from bom_system.dimensions.services import DimensionService
        
        service = DimensionService(db.session)
        dimensions = service.get_dimensions_by_part_number(project_id, part_number)
        
        print(f"\n尺寸数据 ({len(dimensions)} 条):")
        
        # 转换为字典格式
        result = []
        for dim in dimensions:
            dim_dict = {
                "id": dim.id,
                "groupNo": dim.group_no,
                "dimensionType": dim.dimension_type,
                "nominalValue": dim.nominal_value,
                "toleranceValue": dim.tolerance_value,
                "upperTolerance": dim.upper_tolerance,
                "lowerTolerance": dim.lower_tolerance,
                "datum": dim.datum,
                "characteristic": dim.characteristic,
                "notes": dim.notes,
                "imageUrl": dim.image_url
            }
            result.append(dim_dict)
            
            # 打印详细信息
            print(f"  ID: {dim.id}")
            print(f"  组号: {dim.group_no}")
            print(f"  类型: {dim.dimension_type}")
            print(f"  名义值: {dim.nominal_value}")
            print(f"  上公差: {dim.upper_tolerance}")
            print(f"  下公差: {dim.lower_tolerance}")
            print(f"  公差值: {dim.tolerance_value}")
            print(f"  基准: {dim.datum}")
            print(f"  特性: {dim.characteristic}")
            print(f"  备注: {dim.notes}")
            print()
        
        # 输出JSON格式
        print("\n=== 原始JSON数据 ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"获取尺寸数据时出错: {e}")
        import traceback
        traceback.print_exc()
