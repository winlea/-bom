import sqlite3

print('检查数据库连接...')

try:
    # 连接数据库
    conn = sqlite3.connect('bom_db.sqlite')
    cursor = conn.cursor()
    print('数据库连接成功')
    
    # 检查是否存在projects表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
    projects_table = cursor.fetchone()
    
    if projects_table:
        print('projects表存在')
        
        # 查看表结构
        cursor.execute("PRAGMA table_info(projects)")
        columns = cursor.fetchall()
        print('表结构:')
        for col in columns:
            print(f'ID: {col[0]}, 名称: {col[1]}, 类型: {col[2]}, 非空: {col[3]}, 默认值: {col[4]}, 主键: {col[5]}')
        
        # 查看表中的数据
        cursor.execute("SELECT * FROM projects LIMIT 10")
        rows = cursor.fetchall()
        print(f'\n表中数据 ({len(rows)} 行):')
        for row in rows:
            print(row)
    else:
        print('projects表不存在')
        
    # 关闭连接
    conn.close()
    
except Exception as e:
    print(f'数据库操作失败: {e}')
