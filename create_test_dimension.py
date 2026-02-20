import requests

# 创建测试尺寸记录并测试删除功能
def create_test_dimension():
    """创建测试尺寸记录并测试删除功能"""
    print("开始创建测试尺寸记录...")
    print("=" * 60)
    
    # 创建测试尺寸记录
    create_url = "http://localhost:5000/api/dimensions/projects/1"
    print(f"创建尺寸记录: {create_url}")
    
    test_data = {
        "partId": "Y1606842",
        "groupNo": 1,
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1",
        "notes": "测试尺寸"
    }
    
    try:
        # 创建尺寸记录
        create_response = requests.post(create_url, json=test_data)
        print(f"创建尺寸的响应状态码: {create_response.status_code}")
        print(f"创建尺寸的响应内容: {create_response.text}")
        
        if create_response.status_code in [200, 201]:
            create_result = create_response.json()
            if create_result.get('success'):
                created_dimension = create_result.get('data')
                dimension_id = created_dimension.get('id')
                print(f"\n✅ 尺寸记录创建成功！ID: {dimension_id}")
                print()
                
                # 测试删除尺寸
                delete_url = f"http://localhost:5000/api/dimensions/{dimension_id}/delete-with-reorder"
                print(f"测试删除尺寸: {delete_url}")
                
                delete_response = requests.delete(delete_url)
                print(f"删除尺寸的响应状态码: {delete_response.status_code}")
                print(f"删除尺寸的响应内容: {delete_response.text}")
                
                if delete_response.status_code == 200:
                    delete_result = delete_response.json()
                    if delete_result.get('success'):
                        print("\n✅ 尺寸删除成功！")
                    else:
                        print(f"\n❌ 删除尺寸失败: {delete_result.get('message')}")
                else:
                    print(f"\n❌ 删除尺寸失败，状态码: {delete_response.status_code}")
            else:
                print(f"\n❌ 创建尺寸失败: {create_result.get('message')}")
        else:
            print(f"\n❌ 创建尺寸失败，状态码: {create_response.status_code}")
    except Exception as e:
        print(f"\n❌ 请求失败: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("=" * 60)
    print("测试完成！")

if __name__ == "__main__":
    create_test_dimension()
