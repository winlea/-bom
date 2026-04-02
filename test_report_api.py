#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试报表生成API功能
"""

import os
from app import create_app
from bom_system.models import db, Project, BomTable
from bom_system.templates.dynamic_ods_generator import create_simple_ods_from_data

app = create_app()

with app.app_context():
    print("=== 测试报表生成API功能 ===")
    
    # 获取项目信息
    project_id = 1
    project = Project.query.get(project_id)
    
    if not project:
        print(f"项目ID {project_id} 不存在")
        exit(1)
    
    print(f"项目: {project.name}")
    
    # 获取项目零件
    parts = BomTable.query.filter_by(project_id=project_id).order_by(
        BomTable.bom_sort.asc(), BomTable.created_at.desc()
    ).all()
    
    if not parts:
        print("项目没有零件数据")
        exit(1)
    
    print(f"零件数: {len(parts)}")
    
    # 准备报表数据
    report_data = []
    for part in parts:
        report_data.append({
            "sequence": part.sequence,
            "part_number": part.part_number,
            "part_name": part.part_name,
            "drawing_2d": part.drawing_2d,
            "drawing_3d": part.drawing_3d,
            "original_material": part.original_material,
            "final_material_cn": part.final_material_cn,
            "part_category": part.part_category,
            "net_weight_kg": part.net_weight_kg,
        })
    
    project_info = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "generated_time": project.created_at.isoformat() if project.created_at else None,
    }
    
    # 测试简单ODS创建
    print("\n测试简单ODS创建...")
    try:
        output_file = create_simple_ods_from_data(report_data, project_info)
        print(f"成功生成报表: {output_file}")
        print(f"文件大小: {os.path.getsize(output_file)} bytes")
    except Exception as e:
        print(f"失败: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n测试完成!")
