import requests
import json

# 获取数据
response = requests.get('http://localhost:5000/api/parts?project_id=3')
data = response.json()

# 查找ID为90的记录
for item in data['items']:
    if item['id'] == 90:
        print('ID为90的记录详细信息:')
        print(json.dumps(item, indent=2, ensure_ascii=False))
        break