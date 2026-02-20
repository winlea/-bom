import requests

# 测试/api/parts端点
def test_parts_endpoint():
    # 测试无项目ID的情况
    url_no_project = "http://localhost:5000/parts"
    # 测试项目1的情况
    url_project1 = "http://localhost:5000/parts?project_id=1"
    
    print("开始测试/api/parts端点...")
    
    # 测试无项目ID的情况
    print("\n1. 测试无项目ID的情况:")
    try:
        response = requests.get(url_no_project, timeout=30)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"返回记录数: {len(result)}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 测试项目1的情况
    print("\n2. 测试项目1的情况:")
    try:
        response = requests.get(url_project1, timeout=30)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"返回记录数: {len(result)}")
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    test_parts_endpoint()
