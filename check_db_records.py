import os
import sqlite3

# 直接查询SQLite数据库，检查导入的记录

# 使用当前目录下的数据库文件
db_path = os.path.join(os.getcwd(), "bom_db.sqlite")
print(f"当前工作目录: {os.getcwd()}")
print(f"数据库路径: {db_path}")


def check_bom_records():
    """检查BomTable中的记录"""
    print("开始检查数据库记录...")
    print(f"数据库路径: {db_path}")

    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 查询所有BomTable记录
        cursor.execute(
            "SELECT id, project_id, part_number, part_name, created_at FROM bom_table ORDER BY created_at DESC LIMIT 100"
        )
        records = cursor.fetchall()

        print(f"\n找到 {len(records)} 条BomTable记录")

        # 打印前20条记录
        if records:
            print("\n前20条记录:")
            print("ID | Project ID | Part Number | Part Name | Created At")
            print("-" * 80)

            for i, record in enumerate(records[:20]):
                id, project_id, part_number, part_name, created_at = record
                print(
                    f"{id} | {project_id} | {part_number} | {part_name} | {created_at}"
                )

            # 按project_id分组统计
            cursor.execute(
                "SELECT project_id, COUNT(*) FROM BomTable GROUP BY project_id"
            )
            project_counts = cursor.fetchall()

            print("\n按项目分组统计:")
            print("Project ID | Count")
            print("-" * 30)
            for project_id, count in project_counts:
                print(f"{project_id} | {count}")
        else:
            print("\n❌ 没有找到BomTable记录")

        # 检查Project表
        cursor.execute(
            "SELECT id, name, description, status, created_at FROM Project ORDER BY created_at DESC"
        )
        projects = cursor.fetchall()

        print(f"\n找到 {len(projects)} 条Project记录")

        if projects:
            print("\n项目列表:")
            print("ID | Name | Description | Status | Created At")
            print("-" * 80)

            for project in projects:
                id, name, description, status, created_at = project
                print(f"{id} | {name} | {description} | {status} | {created_at}")
        else:
            print("\n❌ 没有找到Project记录")

        # 检查ImportLog表
        cursor.execute(
            "SELECT id, project_id, filename, created_count, errors_count, created_at FROM ImportLog ORDER BY created_at DESC"
        )
        import_logs = cursor.fetchall()

        print(f"\n找到 {len(import_logs)} 条ImportLog记录")

        if import_logs:
            print("\n导入日志列表:")
            print(
                "ID | Project ID | Filename | Created Count | Errors Count | Created At"
            )
            print("-" * 100)

            for log in import_logs:
                id, project_id, filename, created_count, errors_count, created_at = log
                print(
                    f"{id} | {project_id} | {filename} | {created_count} | {errors_count} | {created_at}"
                )
        else:
            print("\n❌ 没有找到ImportLog记录")

        conn.close()

    except Exception as e:
        print(f"\n❌ 查询数据库失败: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    check_bom_records()
