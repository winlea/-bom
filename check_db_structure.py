import sqlite3

# 检查数据库文件的结构
def check_db_structure():
    """检查数据库文件的结构"""
    print("开始检查数据库文件结构...")
    print("=" * 60)
    
    # 数据库文件路径
    db_path = "bom_db.sqlite"
    
    print(f"检查数据库文件: {db_path}")
    print()
    
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 获取所有表名
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("数据库中的表:")
        for table in tables:
            table_name = table[0]
            print(f"- {table_name}")
            
            # 获取表的结构
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            print("  列:")
            for col in columns:
                print(f"    {col[1]} ({col[2]})")
            print()
        
        # 检查dimensions表的记录数
        if 'dimensions' in [t[0] for t in tables]:
            cursor.execute("SELECT COUNT(*) FROM dimensions;")
            count = cursor.fetchone()[0]
            print(f"dimensions表中的记录数: {count}")
        
        # 关闭连接
        conn.close()
        
        print("=" * 60)
        print("检查完成！")
        
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    check_db_structure()
