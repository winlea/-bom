import sqlite3

print("简单检查数据库...")

try:
    # 连接数据库
    conn = sqlite3.connect("bom_db.sqlite")
    cursor = conn.cursor()
    print("数据库连接成功")

    # 执行简单查询
    cursor.execute("SELECT sqlite_version()")
    version = cursor.fetchone()
    print(f"SQLite版本: {version[0]}")

    # 检查表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    print(f"\n数据库中的表 ({len(tables)} 个):")
    for table in tables:
        print(f"- {table[0]}")

    # 检查每个表的结构
    for table in tables:
        table_name = table[0]
        print(f"\n检查表 {table_name} 的结构:")
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")

        # 检查数据
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  数据行数: {count}")

    # 关闭连接
    conn.close()
    print("\n检查完成")

except Exception as e:
    print(f"检查失败: {e}")
    import traceback

    traceback.print_exc()
