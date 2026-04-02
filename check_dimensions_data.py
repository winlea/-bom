#!/usr/bin/env python3
"""
检查数据库中的尺寸数据
"""

import sqlite3

# 连接到数据库
conn = sqlite3.connect('instance/bom_db.sqlite')
cursor = conn.cursor()

# 检查项目1的尺寸数据
print('=== Dimensions in Project 1 ===')
try:
    cursor.execute('''
        SELECT id, part_id, dimension_type, name, nominal_value, 
               upper_tolerance, lower_tolerance, unit, feature, 
               group_id, datum_a, datum_b, datum_c 
        FROM dimensions 
        WHERE project_id = 1 
        ORDER BY group_id, id
    ''')
    rows = cursor.fetchall()
    print(f"Total dimensions: {len(rows)}")
    
    for row in rows:
        print(f"ID: {row[0]}, Part: {row[1]}, Type: {row[2]}, Name: {row[3]}, "
              f"Nominal: {row[4]}, Upper: {row[5]}, Lower: {row[6]}, Unit: {row[7]}, "
              f"Feature: {row[8]}, Group: {row[9]}, Datums: {row[10]}/{row[11]}/{row[12]}")
              
except Exception as e:
    print(f"Error: {e}")

# 关闭连接
conn.close()
print('\nDatabase check completed.')
