#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查数据库中的项目和零件数据
"""

from bom_system.models import db, Project, BomTable
from app import create_app

app = create_app()

with app.app_context():
    # 检查项目数据
    print("=== 项目数据 ===")
    projects = Project.query.all()
    print(f"总项目数: {len(projects)}")
    
    for project in projects:
        print(f"项目ID: {project.id}, 名称: {project.name}, 状态: {project.status}")
        
        # 检查该项目的零件数据
        parts = BomTable.query.filter_by(project_id=project.id).all()
        print(f"  零件数: {len(parts)}")
        for part in parts[:5]:  # 只显示前5个零件
            print(f"  - 零件编号: {part.part_number}, 名称: {part.part_name}")
        if len(parts) > 5:
            print(f"  ... 还有 {len(parts) - 5} 个零件")

print("\n检查完成!")
