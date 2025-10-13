import requests
import json

# 获取项目11的零件数据
try:
    parts_response = requests.get('http://localhost:5000/api/parts?project_id=11')
    parts_data = parts_response.json()
    
    print(f'项目11的零件数量: {len(parts_data["items"])}')
    print('\n项目11的所有零件:')
    for i, item in enumerate(parts_data['items'], 1):
        print(f'{i}. ID: {item["id"]}, 零件号: {item["part_number"]}, 零件名: {item["part_name"]}')
    
    # 检查是否有重复的零件号
    part_numbers = [item["part_number"] for item in parts_data['items']]
    unique_part_numbers = set(part_numbers)
    print(f'\n零件号总数: {len(part_numbers)}')
    print(f'唯一零件号数: {len(unique_part_numbers)}')
    print(f'重复零件号数: {len(part_numbers) - len(unique_part_numbers)}')
    
except Exception as e:
    print(f'错误: {e}')