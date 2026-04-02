import requests


# 测试尺寸删除功能
def test_dimension_delete():
    """测试尺寸删除功能"""
    print("开始测试尺寸删除功能...")
    print("=" * 60)

    # 首先获取项目的尺寸数据，找到一个要删除的尺寸ID
    project_id = "1"
    part_number = "Y1606842"

    print(f"测试项目: {project_id}, 零件号: {part_number}")
    print()

    # 获取尺寸数据
    dimensions_url = f"http://localhost:5000/api/dimensions/projects/{project_id}?part_number={part_number}"
    print(f"获取尺寸数据: {dimensions_url}")

    try:
        response = requests.get(dimensions_url)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                dimensions = result.get("data", [])
                print(f"成功获取尺寸数据，共{len(dimensions)}条记录")
                print()

                if dimensions:
                    # 选择第一条尺寸记录进行删除测试
                    dimension_to_delete = dimensions[0]
                    dimension_id = dimension_to_delete.get("id")
                    group_no = dimension_to_delete.get("groupNo")

                    print(f"准备删除尺寸: ID={dimension_id}, 组号={group_no}")
                    print()

                    # 测试删除尺寸
                    delete_url = f"http://localhost:5000/api/dimensions/{dimension_id}/delete-with-reorder"
                    print(f"测试删除尺寸: {delete_url}")

                    delete_response = requests.delete(delete_url)
                    print(f"删除尺寸的响应状态码: {delete_response.status_code}")
                    print(f"删除尺寸的响应内容: {delete_response.text}")

                    if delete_response.status_code == 200:
                        delete_result = delete_response.json()
                        if delete_result.get("success"):
                            print("✅ 尺寸删除成功！")

                            # 验证删除后尺寸数据是否更新
                            verify_response = requests.get(dimensions_url)
                            if verify_response.status_code == 200:
                                verify_result = verify_response.json()
                                if verify_result.get("success"):
                                    updated_dimensions = verify_result.get("data", [])
                                    print(
                                        f"删除后尺寸记录数: {len(updated_dimensions)}"
                                    )
                                    print("✅ 尺寸数据已更新！")
                                else:
                                    print("❌ 验证删除结果失败")
                            else:
                                print("❌ 验证删除结果失败，无法获取尺寸数据")
                        else:
                            print(f"❌ 删除尺寸失败: {delete_result.get('message')}")
                    else:
                        print(f"❌ 删除尺寸失败，状态码: {delete_response.status_code}")
                else:
                    print("❌ 未找到尺寸数据，无法进行删除测试")
            else:
                print(f"❌ 获取尺寸数据失败: {result.get('message')}")
        else:
            print(f"❌ 获取尺寸数据失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")

    print("=" * 60)
    print("测试完成！")


if __name__ == "__main__":
    test_dimension_delete()
