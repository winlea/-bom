import sqlite3

print("检查BOM数据...")

try:
    # 连接数据库
    conn = sqlite3.connect("bom_db.sqlite")
    cursor = conn.cursor()
    print("数据库连接成功")

    # 检查bom_table表
    print("\n=== 检查bom_table表 ===")
    cursor.execute("SELECT COUNT(*) FROM bom_table")
    count = cursor.fetchone()[0]
    print(f"总记录数: {count}")

    if count > 0:
        # 检查前10条记录
        print("\n前10条记录:")
        cursor.execute(
            "SELECT id, project_id, part_number, part_name, created_at FROM bom_table ORDER BY created_at DESC LIMIT 10"
        )
        rows = cursor.fetchall()
        for row in rows:
            print(
                f"ID: {row[0]}, 项目ID: {row[1]}, 零件编号: {row[2]}, 零件名称: {row[3]}, 创建时间: {row[4]}"
            )

        # 按项目ID分组
        print("\n按项目ID分组:")
        cursor.execute(
            "SELECT project_id, COUNT(*) FROM bom_table GROUP BY project_id ORDER BY project_id"
        )
        groups = cursor.fetchall()
        for group in groups:
            print(f"项目ID: {group[0]}, 记录数: {group[1]}")
    else:
        print("\nbom_table表为空")

    # 检查import_logs表
    print("\n=== 检查import_logs表 ===")
    cursor.execute("SELECT COUNT(*) FROM import_logs")
    log_count = cursor.fetchone()[0]
    print(f"导入日志数: {log_count}")

    if log_count > 0:
        # 检查前5条导入日志
        print("\n前5条导入日志:")
        cursor.execute(
            "SELECT id, project_id, filename, created_count, errors_count, created_at FROM import_logs ORDER BY created_at DESC LIMIT 5"
        )
        logs = cursor.fetchall()
        for log in logs:
            print(
                f"ID: {log[0]}, 项目ID: {log[1]}, 文件名: {log[2]}, 创建数: {log[3]}, 错误数: {log[4]}, 时间: {log[5]}"
            )

    # 检查projects表
    print("\n=== 检查projects表 ===")
    cursor.execute("SELECT COUNT(*) FROM projects")
    project_count = cursor.fetchone()[0]
    print(f"项目数: {project_count}")

    if project_count > 0:
        # 检查所有项目
        print("\n所有项目:")
        cursor.execute(
            "SELECT id, name, status, created_at FROM projects ORDER BY created_at DESC"
        )
        projects = cursor.fetchall()
        for project in projects:
            print(
                f"ID: {project[0]}, 名称: {project[1]}, 状态: {project[2]}, 创建时间: {project[3]}"
            )

    # 关闭连接
    conn.close()
    print("\n检查完成")

except Exception as e:
    print(f"检查失败: {e}")
    import traceback

    traceback.print_exc()
