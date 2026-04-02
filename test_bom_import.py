import os

import requests


# 测试BOM导入功能
def test_bom_import():
    url = "http://localhost:5000/import/bom"

    # 使用H47模板文件
    file_path = "WH-DFYF-H47-26-00 H47产品履历模版2026-2-7.xlsx"

    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        return

    # 读取文件
    with open(file_path, "rb") as f:
        files = {
            "file": (
                file_path,
                f,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        }
        data = {"project_id": ""}  # 不指定项目ID，测试无项目导入

        print("开始测试BOM导入...")
        print(f"使用文件: {file_path}")

        try:
            response = requests.post(url, files=files, data=data, timeout=60)

            print(f"\n响应状态码: {response.status_code}")
            print(f"响应内容: {response.text}")

            if response.status_code == 200:
                result = response.json()
                print(f"\n导入成功!")
                print(f"创建记录数: {result.get('created', 0)}")
                print(f"错误数: {len(result.get('errors', []))}")
                if result.get("errors"):
                    print("\n错误详情:")
                    for error in result.get("errors", []):
                        print(f"- {error}")
            else:
                print("\n导入失败!")
                print(f"错误信息: {response.text}")

        except Exception as e:
            print(f"\n请求失败: {e}")


if __name__ == "__main__":
    test_bom_import()
