import requests
import json

# 尝试获取所有项目的所有零件数据，看看是否有其他记录
try:
    # 获取所有项目
    projects_response = requests.get('http://localhost:5000/api/projects')
    projects_data = projects_response.json()
    
    print('所有项目:')
    for project in projects_data:
        print(f'项目ID: {project["id"]}, 项目名称: {project["name"]}')
    
    # 检查每个项目的零件数量
    for project in projects_data:
        project_id = project["id"]
        project_name = project["name"]
        
        # 获取项目的零件数据
        parts_response = requests.get(f'http://localhost:5000/api/parts?project_id={project_id}')
        parts_data = parts_response.json()
        
        print(f'\n项目{project_id} ({project_name}) 的零件数量: {len(parts_data["items"])}')
        
        # 如果是项目3，打印所有零件信息
        if project_id == 3:
            print('项目3的所有零件:')
            for i, item in enumerate(parts_data['items'], 1):
                print(f'{i}. ID: {item["id"]}, 零件号: {item["part_number"]}, 零件名: {item["part_name"]}')
        
except Exception as e:
    print(f'错误: {e}')