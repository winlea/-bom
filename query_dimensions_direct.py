#!/usr/bin/env python3
"""
直接查询数据库获取零件尺寸信息
"""

import sys
import os
import json

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from bom_system.dimensions.models import Dimension
from bom_system.models import db

def get_part_dimensions(project_id, part_number):
    """
    直接查询数据库获取零件的尺寸信息
    
    Args:
        project_id: 项目ID
        part_number: 零件编号
    """
    app = create_app()
    
    with app.app_context():
        # 直接使用SQLAlchemy查询
        from sqlalchemy import and_
        
        dimensions = db.session.query(Dimension).filter(
            and_(
                Dimension.project_id == project_id,
                Dimension.part_id == part_number
            )
        ).order_by(Dimension.group_no.asc()).all()
        
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
        
        # 输出结果
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    # 项目ID和零件编号
    project_id = "358"
    part_number = "Y1392191"
    
    get_part_dimensions(project_id, part_number)
