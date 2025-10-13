import requests
import json

# 获取项目3的所有零件数据
response = requests.get('http://localhost:5000/api/parts?project_id=3')
data = response.json()

# 打印总记录数
print(f'API返回的总记录数: {len(data["items"])}')

# 打印所有记录的详细信息
print('\n所有记录的详细信息:')
for i, item in enumerate(data['items'], 1):
    print(f'{i}. ID: {item["id"]}, 零件号: {item["part_number"]}, 零件名: {item["part_name"]}')

# 检查是否有重复的零件号
part_numbers = [item["part_number"] for item in data['items']]
unique_part_numbers = set(part_numbers)
print(f'\n零件号总数: {len(part_numbers)}')
print(f'唯一零件号数: {len(unique_part_numbers)}')
print(f'重复零件号数: {len(part_numbers) - len(unique_part_numbers)}')

# 检查是否有重复的ID
ids = [item["id"] for item in data['items']]
unique_ids = set(ids)
print(f'\nID总数: {len(ids)}')
print(f'唯一ID数: {len(unique_ids)}')
print(f'重复ID数: {len(ids) - len(unique_ids)}')

# 检查ID范围
print(f'\nID范围: {min(ids)} - {max(ids)}')
print(f'缺失的ID: {[i for i in range(min(ids), max(ids)+1) if i not in unique_ids]}')