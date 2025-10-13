import requests
import json

# 获取数据
response = requests.get('http://localhost:5000/api/parts?project_id=3')
data = response.json()

# 查找重复零件
duplicates = {}
for item in data['items']:
    part_number = item['part_number']
    if part_number not in duplicates:
        duplicates[part_number] = []
    duplicates[part_number].append(item)

# 打印重复零件的详细信息
print('Duplicate parts details:')
for part_number, items in duplicates.items():
    if len(items) > 1:
        print(f'\nPart Number: {part_number}, Count: {len(items)}')
        for i, item in enumerate(items):
            print(f'  Record {i+1} (ID: {item["id"]}):')
            print(f'    Part Name: {item.get("part_name", "N/A")}')
            print(f'    Original Material: {item.get("original_material", "N/A")}')
            print(f'    Final Material CN: {item.get("final_material_cn", "N/A")}')
            print(f'    Assembly Level: {item.get("assembly_level", "N/A")}')
            print(f'    BOM Sort: {item.get("bom_sort", "N/A")}')
            print(f'    2D Drawing: {item.get("drawing_2d", "N/A")}')
            print(f'    3D Drawing: {item.get("drawing_3d", "N/A")}')