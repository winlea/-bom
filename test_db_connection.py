from sqlalchemy import create_engine, inspect

# 测试数据库连接和表结构
def test_db_connection():
    """测试数据库连接和表结构"""
    print("开始测试数据库连接和表结构...")
    print("=" * 60)
    
    # 导入配置
    try:
        from bom_system.config import SQLALCHEMY_DATABASE_URI
        print(f"从 bom_system.config 导入的 SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI}")
    except Exception as e:
        print(f"导入配置失败: {e}")
        return
    
    try:
        # 创建数据库引擎
        engine = create_engine(SQLALCHEMY_DATABASE_URI)
        print("数据库引擎创建成功!")
        
        # 检查表结构
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n数据库中的表 ({len(tables)} 个):")
        for table in tables:
            print(f"- {table}")
        
        # 检查dimensions表
        if 'dimensions' in tables:
            print("\n✓ dimensions表存在!")
            
            # 获取表的结构
            columns = inspector.get_columns('dimensions')
            print("dimensions表的列:")
            for col in columns:
                print(f"  - {col['name']} ({col['type']})")
        else:
            print("\n✗ dimensions表不存在!")
        
    except Exception as e:
        print(f"数据库操作失败: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 60)
    print("测试完成！")

if __name__ == "__main__":
    test_db_connection()
