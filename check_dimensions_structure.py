#!/usr/bin/env python3
"""
检查dimensions表的结构
"""

import sqlite3

# 连接到数据库
conn = sqlite3.connect('instance/bom_db.sqlite')
cursor = conn.cursor()

# 检查dimensions表的结构
print('=== Dimensions Table Structure ===')
try:
    cursor.execute("PRAGMA table_info(dimensions);")
    columns = cursor.fetchall()
    for column in columns:
        print(f"- {column[1]} ({column[2]})")
    
except Exception as e:
    print(f"Error: {e}")

# 检查项目1的尺寸数据
print('\n=== Dimensions in Project 1 ===')
try:
    cursor.execute('''
        SELECT id, part_id, dimension_type, nominal_value, 
               upper_tolerance, lower_tolerance, unit, feature, 
               group_id, datum_a, datum_b, datum_c 
        FROM dimensions 
        WHERE project_id = 1 
        ORDER BY group_id, id
    ''')
    rows = cursor.fetchall()
    print(f"Total dimensions: {len(rows)}")
    
    for row in rows:
        print(f"ID: {row[0]}, Part: {row[1]}, Type: {row[2]}, Nominal: {row[3]}, "
              f"Upper: {row[4]}, Lower: {row[5]}, Unit: {row[6]}, Feature: {row[7]}, "
              f"Group: {row[8]}, Datums: {row[9]}/{row[10]}/{row[11]}")
              
except Exception as e:
    print(f"Error: {e}")

# 关闭连接
conn.close()
print('\nDatabase check completed.')
