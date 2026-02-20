import requests

# 检查项目列表API
def check_projects_api():
    url = "http://localhost:5000/api/projects"
    
    print("开始检查项目列表API...")
    
    try:
        response = requests.get(url, timeout=30)
        
        print(f"\n响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n项目数: {len(result)}")
            
            if result:
                print("\n项目列表:")
                for i, project in enumerate(result, 1):
                    print(f"\n{i}. ID: {project.get('id')}")
                    print(f"   名称: {project.get('name')}")
                    print(f"   描述: {project.get('description')}")
                    print(f"   状态: {project.get('status')}")
        else:
            print(f"\nAPI调用失败: {response.status_code}")
            
    except Exception as e:
        print(f"\n请求失败: {e}")

if __name__ == "__main__":
    check_projects_api()
