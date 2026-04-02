#!/usr/bin/env python3
"""
检查dimensions表的实际数据
"""

import sqlite3

# 连接到数据库
conn = sqlite3.connect('instance/bom_db.sqlite')
cursor = conn.cursor()

# 检查项目1的尺寸数据
print('=== Dimensions in Project 1 ===')
try:
    cursor.execute('''
        SELECT project_id, part_id, group_no, dimension_type, nominal_value, 
               tolerance_value, upper_tolerance, lower_tolerance, unit, 
               datum, characteristic, notes 
        FROM dimensions 
        WHERE project_id = '1' 
        ORDER BY group_no
    ''')
    rows = cursor.fetchall()
    print(f"Total dimensions: {len(rows)}")
    
    for row in rows:
        print(f"Project: {row[0]}, Part: {row[1]}, Group: {row[2]}, Type: {row[3]}, "
              f"Nominal: {row[4]}, Tolerance: {row[5]}, Upper: {row[6]}, Lower: {row[7]}, "
              f"Unit: {row[8]}, Datum: {row[9]}, Characteristic: {row[10]}, Notes: {row[11]}")
              
except Exception as e:
    print(f"Error: {e}")

# 关闭连接
conn.close()
print('\nDatabase check completed.')
