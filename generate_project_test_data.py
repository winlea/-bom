from app import create_app
from bom_system.models import Project
from bom_system.models import db

app = create_app()

def generate_test_projects():
    """生成测试项目数据"""
    with app.app_context():
        # 清空现有数据
        Project.query.delete()
        db.session.commit()
        
        # 生成测试数据
        projects = [
            Project(
                name="PROJ001",
                description="测试项目 1",
                status="created",
                supplier_name="供应商 A",
                address="北京市朝阳区",
                supplier_code="SUP001",
                customer_name="客户 A",
                customer_purchase="采购 A",
                quality_engineer="张三",
                phone="13800138000",
                email="zhangsan@example.com"
            ),
            Project(
                name="PROJ002",
                description="测试项目 2",
                status="created",
                supplier_name="供应商 B",
                address="上海市浦东新区",
                supplier_code="SUP002",
                customer_name="客户 B",
                customer_purchase="采购 B",
                quality_engineer="李四",
                phone="13900139000",
                email="lisi@example.com"
            ),
            Project(
                name="PROJ003",
                description="测试项目 3",
                status="created",
                supplier_name="供应商 C",
                address="广州市天河区",
                supplier_code="SUP003",
                customer_name="客户 C",
                customer_purchase="采购 C",
                quality_engineer="王五",
                phone="13700137000",
                email="wangwu@example.com"
            )
        ]
        
        # 批量插入数据
        db.session.add_all(projects)
        db.session.commit()
        
        print(f"成功生成 {len(projects)} 条项目测试数据")

if __name__ == "__main__":
    generate_test_projects()
