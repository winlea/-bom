import requests
import json

# 获取项目3的零件数据
try:
    parts_response = requests.get('http://localhost:5000/api/parts?project_id=3')
    parts_data = parts_response.json()
    
    print(f'项目3的零件数量: {len(parts_data["items"])}')
    print('\n项目3的所有零件（包含序号）:')
    
    # 创建一个字典来存储序号和零件号的组合
    sequence_part_pairs = {}
    duplicate_pairs = []
    
    for i, item in enumerate(parts_data['items'], 1):
        sequence = item.get('sequence', 'N/A')
        part_number = item.get('part_number', 'N/A')
        pair = (sequence, part_number)
        
        print(f'{i}. ID: {item["id"]}, 序号: {sequence}, 零件号: {part_number}, 零件名: {item["part_name"]}')
        
        # 检查是否已经有相同的序号和零件号组合
        if pair in sequence_part_pairs:
            duplicate_pairs.append({
                'duplicate_id': item['id'],
                'original_id': sequence_part_pairs[pair],
                'sequence': sequence,
                'part_number': part_number,
                'part_name': item['part_name']
            })
        else:
            sequence_part_pairs[pair] = item['id']
    
    print(f'\n序号+零件号组合总数: {len(sequence_part_pairs)}')
    print(f'重复的序号+零件号组合数: {len(duplicate_pairs)}')
    
    if duplicate_pairs:
        print('\n重复的记录:')
        for dup in duplicate_pairs:
            print(f'重复记录ID: {dup["duplicate_id"]}, 原始记录ID: {dup["original_id"]}, 序号: {dup["sequence"]}, 零件号: {dup["part_number"]}, 零件名: {dup["part_name"]}')
    
    # 检查只有零件号重复的情况
    part_numbers = {}
    duplicate_parts = []
    
    for item in parts_data['items']:
        part_number = item.get('part_number', 'N/A')
        if part_number in part_numbers:
            duplicate_parts.append({
                'duplicate_id': item['id'],
                'original_id': part_numbers[part_number],
                'part_number': part_number,
                'duplicate_sequence': item.get('sequence', 'N/A'),
                'original_sequence': None,  # 需要查找
                'duplicate_name': item['part_name'],
                'original_name': None  # 需要查找
            })
        else:
            part_numbers[part_number] = item['id']
    
    # 填充原始记录的信息
    for dup in duplicate_parts:
        for item in parts_data['items']:
            if item['id'] == dup['original_id']:
                dup['original_sequence'] = item.get('sequence', 'N/A')
                dup['original_name'] = item['part_name']
                break
    
    print(f'\n只有零件号重复的情况:')
    for dup in duplicate_parts:
        print(f'零件号: {dup["part_number"]}')
        print(f'  记录1 - ID: {dup["original_id"]}, 序号: {dup["original_sequence"]}, 名称: {dup["original_name"]}')
        print(f'  记录2 - ID: {dup["duplicate_id"]}, 序号: {dup["duplicate_sequence"]}, 名称: {dup["duplicate_name"]}')
        print()
    
except Exception as e:
    print(f'错误: {e}')