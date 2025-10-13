import requests
import json

# 直接查询数据库中的记录
try:
    # 使用一个特殊的API来查询所有记录（如果存在的话）
    # 或者我们可以创建一个临时的API端点
    response = requests.get('http://localhost:5000/api/parts?project_id=3')
    data = response.json()
    
    # 检查返回的JSON数据
    print('返回的JSON数据:')
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    # 检查是否有隐藏的记录
    print(f'\n返回的items数组长度: {len(data["items"])}')
    print(f'实际ID列表: {[item["id"] for item in data["items"]]}')
    
except Exception as e:
    print(f'错误: {e}')