import requests
import json

# 检查项目API的返回格式
try:
    projects_response = requests.get('http://localhost:5000/api/projects')
    print('项目API返回的原始数据:')
    print(projects_response.text[:500])  # 只打印前500个字符
    
    # 尝试解析JSON
    projects_data = projects_response.json()
    print('\n解析后的数据类型:', type(projects_data))
    
    if isinstance(projects_data, dict):
        print('字典键:', list(projects_data.keys()))
    elif isinstance(projects_data, list):
        print('列表长度:', len(projects_data))
        if len(projects_data) > 0:
            print('第一个元素:', projects_data[0])
    
except Exception as e:
    print(f'错误: {e}')