import requests

# 获取项目3的零件数据
response = requests.get("http://localhost:5000/api/parts?project_id=3")
if response.status_code == 200:
    data = response.json()
    parts = data.get('items', [])
    
    print(f"项目3总零件数: {len(parts)}")
    
    # 检查序号和零件号组合
    combinations = {}
    for part in parts:
        part_number = part.get('part_number', '')
        sequence = part.get('sequence', '')
        combination = f"{sequence}|{part_number}"
        
        if combination not in combinations:
            combinations[combination] = []
        combinations[combination].append(part)
    
    # 检查是否有重复的组合
    duplicate_combinations = {k: v for k, v in combinations.items() if len(v) > 1}
    
    print(f"唯一序号+零件号组合数: {len(combinations)}")
    print(f"重复组合数: {len(duplicate_combinations)}")
    
    if duplicate_combinations:
        print("\n重复的序号+零件号组合:")
        for combo, parts_list in duplicate_combinations.items():
            print(f"  组合: {combo}")
            for part in parts_list:
                print(f"    ID: {part.get('id')}, 零件号: {part.get('part_number')}, 序号: {part.get('sequence')}")
    else:
        print("没有重复的序号+零件号组合")
    
    # 获取项目11的零件数据
    response11 = requests.get("http://localhost:5000/api/parts?project_id=11")
    if response11.status_code == 200:
        data11 = response11.json()
        parts11 = data11.get('items', [])
        
        print(f"\n项目11总零件数: {len(parts11)}")
        
        # 检查序号和零件号组合
        combinations11 = {}
        for part in parts11:
            part_number = part.get('part_number', '')
            sequence = part.get('sequence', '')
            combination = f"{sequence}|{part_number}"
            
            if combination not in combinations11:
                combinations11[combination] = []
            combinations11[combination].append(part)
        
        # 检查是否有重复的组合
        duplicate_combinations11 = {k: v for k, v in combinations11.items() if len(v) > 1}
        
        print(f"唯一序号+零件号组合数: {len(combinations11)}")
        print(f"重复组合数: {len(duplicate_combinations11)}")
        
        if duplicate_combinations11:
            print("\n重复的序号+零件号组合:")
            for combo, parts_list in duplicate_combinations11.items():
                print(f"  组合: {combo}")
                for part in parts_list:
                    print(f"    ID: {part.get('id')}, 零件号: {part.get('part_number')}, 序号: {part.get('sequence')}")
        else:
            print("没有重复的序号+零件号组合")
else:
    print(f"获取项目3数据失败: {response.status_code}")