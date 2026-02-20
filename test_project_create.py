import requests
import json

# 测试项目创建API
url = 'http://localhost:5000/api/projects'
headers = {
    'Content-Type': 'application/json'
}

# 测试数据
test_data = {
    'name': '测试项目',
    'description': '测试项目描述'
}

print('测试创建项目...')
print('请求数据:', json.dumps(test_data, ensure_ascii=False))

response = requests.post(url, headers=headers, json=test_data)

print('响应状态码:', response.status_code)
print('响应内容:', response.text)

if response.status_code == 200:
    try:
        data = response.json()
        print('项目创建成功:', json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print('解析响应失败:', e)
else:
    print('项目创建失败')
