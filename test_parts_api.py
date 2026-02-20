import requests

# 测试/api/parts端点
def test_parts_api():
    url = "http://localhost:5000/parts"
    
    print("开始测试/api/parts端点...")
    
    try:
        # 测试无项目ID的情况
        response = requests.get(url, timeout=30)
        
        print(f"\n响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n成功获取BOM数据!")
            print(f"返回记录数: {len(result)}")
            
            if result:
                print("\n前5条记录:")
                for i, part in enumerate(result[:5], 1):
                    print(f"\n{i}. ID: {part.get('id')}")
                    print(f"   零件编号: {part.get('part_number')}")
                    print(f"   零件名称: {part.get('part_name')}")
                    print(f"   项目ID: {part.get('project_id')}")
                    print(f"   装配等级: {part.get('assembly_level')}")
                    print(f"   序号: {part.get('sequence')}")
        else:
            print(f"\n请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except Exception as e:
        print(f"\n请求失败: {e}")

if __name__ == "__main__":
    test_parts_api()
