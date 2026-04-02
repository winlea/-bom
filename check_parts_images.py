import sqlite3
import os

# 连接到数据库
db_path = 'instance/bom_db.sqlite'
if not os.path.exists(db_path):
    print(f"数据库文件 {db_path} 不存在")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查数据库中的表
print("=== 数据库中的表 ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
for table in tables:
    print(f"表名: {table[0]}")

# 检查每个表的结构
for table in tables:
    table_name = table[0]
    print(f"\n=== {table_name} 表结构 ===")
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    for col in columns:
        print(f"{col[1]} - {col[2]}")

# 检查零件相关表的数据
for table in tables:
    table_name = table[0]
    if 'bom' in table_name.lower() or 'part' in table_name.lower():
        print(f"\n=== {table_name} 数据 ===")
        try:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            rows = cursor.fetchall()
            print(f"找到 {len(rows)} 条记录")
            if rows:
                # 打印列名
                cursor.execute(f"PRAGMA table_info({table_name})")
                cols = cursor.fetchall()
                col_names = [col[1] for col in cols]
                print("列名:", col_names)
                # 打印前3条记录
                for i, row in enumerate(rows[:3]):
                    print(f"记录 {i+1}:", row)
        except Exception as e:
            print(f"查询 {table_name} 时出错: {e}")

conn.close()
