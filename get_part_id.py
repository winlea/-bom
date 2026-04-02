#!/usr/bin/env python3
"""
获取零件 Y1392191 的实际 ID
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath('.'))

from bom_system.models import BomTable, db
from app import create_app

# 创建应用实例
app = create_app()

with app.app_context():
    # 查询零件 Y1392191
    part = BomTable.query.filter_by(part_number="Y1392191").first()
    
    if part:
        print(f"零件 Y1392191 的 ID: {part.id}")
        print(f"零件名称: {part.part_name}")
        print(f"项目 ID: {part.project_id}")
    else:
        print("未找到零件 Y1392191")
