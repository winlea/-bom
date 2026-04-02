import sqlite3
import os

# 连接到数据库
db_path = 'instance/bom_db.sqlite'
if not os.path.exists(db_path):
    print(f"数据库文件 {db_path} 不存在")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查有图片数据的零件
print("=== 有图片数据的零件 ===")
cursor.execute("SELECT id, part_number, part_name, LENGTH(image_data) as image_size FROM bom_table WHERE image_data IS NOT NULL AND image_data != ''")
parts_with_images = cursor.fetchall()

print(f"找到 {len(parts_with_images)} 个有图片数据的零件")
for part in parts_with_images:
    part_id, part_number, part_name, image_size = part
    print(f"ID: {part_id}, 零件编号: {part_number}, 零件名称: {part_name}, 图片大小: {image_size} 字节")

# 检查所有零件的图片URL
print("\n=== 有图片URL的零件 ===")
cursor.execute("SELECT id, part_number, part_name, image_url FROM bom_table WHERE image_url IS NOT NULL AND image_url != ''")
parts_with_urls = cursor.fetchall()

print(f"找到 {len(parts_with_urls)} 个有图片URL的零件")
for part in parts_with_urls:
    part_id, part_number, part_name, image_url = part
    print(f"ID: {part_id}, 零件编号: {part_number}, 零件名称: {part_name}, 图片URL: {image_url}")

conn.close()
