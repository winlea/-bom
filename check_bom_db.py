import sqlite3

print('检查bom_db.sqlite数据库...')

try:
    # 连接数据库
    conn = sqlite3.connect('bom_db.sqlite')
    cursor = conn.cursor()
    print('数据库连接成功')
    
    # 检查表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    print(f'\n数据库中的表 ({len(tables)} 个):')
    for table in tables:
        print(f'- {table[0]}')
    
    # 检查每个表的结构
    for table in tables:
        table_name = table[0]
        print(f'\n检查表 {table_name} 的结构:')
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        for col in columns:
            print(f'  - {col[1]} ({col[2]})')
        
        # 检查数据
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f'  数据行数: {count}')
    
    # 测试插入数据
    print('\n测试插入项目数据...')
    cursor.execute("INSERT INTO projects (name, description, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", 
                  ('测试项目', '测试项目描述', 'created'))
    conn.commit()
    print('项目插入成功')
    
    # 测试查询数据
    cursor.execute("SELECT * FROM projects LIMIT 5")
    projects = cursor.fetchall()
    print(f'\n查询到 {len(projects)} 个项目:')
    for p in projects:
        print(f'ID: {p[0]}, 名称: {p[1]}, 状态: {p[3]}')
    
    # 关闭连接
    conn.close()
    print('\n操作完成')
    
except Exception as e:
    print(f'操作失败: {e}')
    import traceback
    traceback.print_exc()
