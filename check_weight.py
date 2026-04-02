from bom_system.models import BomTable, db
from bom_system.api_main import api_bp
from flask import Flask

# 创建Flask应用
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bom_db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

with app.app_context():
    # 创建数据库表
    db.create_all()
    # 查询所有零件
    parts = BomTable.query.all()
    print("零件重量数据:")
    for part in parts:
        print(f'零件编号: {part.part_number}, 重量: {part.net_weight_kg}')
