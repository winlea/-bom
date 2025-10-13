import requests

# 获取数据
response = requests.get('http://localhost:5000/api/parts?project_id=3')
data = response.json()

# 打印所有记录的详细信息
print('所有记录的详细信息:')
for item in data['items']:
    print(f'ID: {item["id"]}, 零件号: {item["part_number"]}, 零件名: {item["part_name"]}')