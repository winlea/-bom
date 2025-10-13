import requests

# 获取数据
response = requests.get('http://localhost:5000/api/parts?project_id=3')
data = response.json()

# 查找ID为90的记录
found = False
for item in data['items']:
    if item['id'] == 90:
        print(f'ID: {item["id"]}, 零件号: {item["part_number"]}, 零件名: {item["part_name"]}')
        found = True
        break

if not found:
    print('未找到ID为90的记录')