from app import create_app
from bom_system.models import db

print("使用SQLAlchemy检查数据库...")

app = create_app()

with app.app_context():
    print("数据库URL:", app.config["SQLALCHEMY_DATABASE_URI"])

    # 检查连接
    try:
        from sqlalchemy import text

        db.session.execute(text("SELECT 1"))
        print("✅ 数据库连接成功!")
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        exit(1)

    # 检查表
    from sqlalchemy import inspect

    inspector = inspect(db.engine)
    tables = inspector.get_table_names()

    print(f"\n数据库中的表 ({len(tables)} 个):")
    for table in tables:
        print(f"- {table}")

    # 检查projects表
    if "projects" in tables:
        print("\n检查projects表数据...")
        from bom_system.models import Project

        projects = Project.query.all()
        print(f"找到 {len(projects)} 个项目:")
        for project in projects:
            print(f"  ID: {project.id}, Name: {project.name}, Status: {project.status}")

    # 检查bom_table表
    if "bom_table" in tables:
        print("\n检查bom_table表数据...")
        from bom_system.models import BomTable

        boms = BomTable.query.limit(10).all()
        print(f"找到 {len(boms)} 条BOM记录:")
        for bom in boms:
            print(
                f"  ID: {bom.id}, Project ID: {bom.project_id}, Part Number: {bom.part_number}"
            )

    # 检查import_logs表
    if "import_logs" in tables:
        print("\n检查import_logs表数据...")
        from bom_system.models import ImportLog

        logs = ImportLog.query.all()
        print(f"找到 {len(logs)} 条导入日志:")
        for log in logs:
            print(
                f"  ID: {log.id}, Project ID: {log.project_id}, Created Count: {log.created_count}, Errors Count: {log.errors_count}"
            )

print("\n检查完成!")
