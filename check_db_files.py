import os
import sqlite3

print('检查数据库文件...')

# 检查当前目录
print(f'当前目录: {os.getcwd()}')

# 检查所有.db和.sqlite文件
files = [f for f in os.listdir('.') if f.endswith('.db') or f.endswith('.sqlite')]
print(f'数据库文件: {files}')

# 检查每个数据库文件
for file in files:
    print(f'\n检查文件: {file}')
    try:
        conn = sqlite3.connect(file)
        cursor = conn.cursor()
        
        # 检查表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f'  表数量: {len(tables)}')
        for table in tables:
            print(f'  - {table[0]}')
        
        conn.close()
    except Exception as e:
        print(f'  检查失败: {e}')

print('\n检查完成')
