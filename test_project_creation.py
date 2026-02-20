import requests
import json
import time

# 测试创建项目API
url = "http://localhost:5000/api/projects"
headers = {
    "Content-Type": "application/json"
}
data = {
    "name": "测试项目" + str(int(time.time())),
    "description": "测试项目描述"
}

print("测试创建项目API...")
print(f"URL: {url}")
print(f"Headers: {headers}")
print(f"Data: {json.dumps(data)}")

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"\n响应状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ 项目创建成功！")
    else:
        print(f"\n❌ 项目创建失败，状态码: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ 请求失败: {str(e)}")

# 测试获取项目列表
print("\n" + "="*50)
print("测试获取项目列表API...")

list_url = "http://localhost:5000/api/projects"

try:
    list_response = requests.get(list_url)
    print(f"响应状态码: {list_response.status_code}")
    print(f"响应内容: {list_response.text}")
    
    if list_response.status_code == 200:
        print("\n✅ 获取项目列表成功！")
    else:
        print(f"\n❌ 获取项目列表失败，状态码: {list_response.status_code}")
        
except Exception as e:
    print(f"\n❌ 请求失败: {str(e)}")
