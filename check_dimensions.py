# 直接导入必要的模块，不使用app.py的配置
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from bom_system.dimensions.models import Dimension

# 使用与app.py相同的数据库连接路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'instance', 'bom_db.sqlite')
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'

# 创建数据库引擎和会话
engine = create_engine(SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

try:
    # 查看尺寸数据数量
    count = session.query(Dimension).count()
    print(f"尺寸数据数量: {count}")
    
    # 查看前5条尺寸数据
    print("前5条尺寸数据:")
    for dim in session.query(Dimension).limit(5).all():
        print(f"ID: {dim.id}, 项目ID: {dim.project_id}, 零件ID: {dim.part_id}, 特性: {dim.characteristic}, 名义值: {dim.nominal_value}, 上公差: {dim.upper_tolerance}, 下公差: {dim.lower_tolerance}")
finally:
    # 关闭会话
    session.close()
