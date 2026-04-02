#!/usr/bin/env python3
"""
检查项目数据
"""

import sqlite3

# 连接到数据库
conn = sqlite3.connect('instance/bom_db.sqlite')
cursor = conn.cursor()

# 检查所有项目
print('=== All Projects ===')
try:
    cursor.execute('SELECT id, name FROM projects')
    projects = cursor.fetchall()
    print(f"Total projects: {len(projects)}")
    
    for project in projects:
        print(f"ID: {project[0]}, Name: {project[1]}")
        
        # 检查项目的零件
        cursor.execute('SELECT part_number, part_name FROM bom_table WHERE project_id = ?', (project[0],))
        parts = cursor.fetchall()
        print(f"  Parts: {len(parts)}")
        for part in parts:
            print(f"    - {part[0]}: {part[1]}")
            
        # 检查项目的尺寸
        cursor.execute('SELECT COUNT(*) FROM dimensions WHERE project_id = ?', (project[0],))
        dimensions = cursor.fetchone()
        print(f"  Dimensions: {dimensions[0]}")
        
        print()
        
except Exception as e:
    print(f"Error: {e}")

# 关闭连接
conn.close()
print('\nDatabase check completed.')
