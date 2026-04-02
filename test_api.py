import requests
import json

# API URL
api_url = 'http://127.0.0.1:5000/api/process-capability/generate'

# 测试数据
payload = {
    "part_id": 1  # 假设零件ID为1
}

# 发送请求
print("发送API请求...")
response = requests.post(api_url, json=payload)

# 打印响应
print(f"响应状态码: {response.status_code}")
print(f"响应头: {dict(response.headers)}")

# 尝试解析响应内容
try:
    response_data = response.json()
    print(f"响应数据: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
except json.JSONDecodeError:
    print(f"响应内容: {response.text}")
