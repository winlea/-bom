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

# 打印重复零件
print('Duplicate parts:')
for part_number, items in duplicates.items():
    if len(items) > 1:
        ids = [item['id'] for item in items]
        print(f'Part Number: {part_number}, Count: {len(items)}, IDs: {ids}')