#!/usr/bin/env python3
"""
添加测试尺寸数据
"""

import requests
import json

# 后端API地址
BASE_URL = "http://localhost:5000/api"

# 测试数据
TEST_DIMENSIONS = [
    # 项目358，零件Y1392191的尺寸数据
    {
        "project_id": "358",
        "part_id": "Y1392191",
        "dimensions": [
            # 组1: 直径 + 位置度
            {
                "groupNo": 1,
                "dimensionType": "diameter",
                "nominalValue": "9",
                "toleranceValue": "",
                "upperTolerance": "0.1",
                "lowerTolerance": "0",
                "datum": "",
                "characteristic": "CC01",
                "notes": "Hole Diameter"
            },
            {
                "groupNo": 1,
                "dimensionType": "position",
                "nominalValue": "0",
                "toleranceValue": "0.5",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "ABC",
                "characteristic": "SC01",
                "notes": "Hole Position"
            },
            # 组2: 普通尺寸 + 垂直度
            {
                "groupNo": 2,
                "dimensionType": "normal",
                "nominalValue": "100",
                "toleranceValue": "",
                "upperTolerance": "0.2",
                "lowerTolerance": "-0.2",
                "datum": "",
                "characteristic": "CC02",
                "notes": "Length"
            },
            {
                "groupNo": 2,
                "dimensionType": "perpendicularity",
                "nominalValue": "0",
                "toleranceValue": "0.1",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "A",
                "characteristic": "SC02",
                "notes": "Perpendicularity"
            },
            # 组3: 半径 + 平面度
            {
                "groupNo": 3,
                "dimensionType": "radius",
                "nominalValue": "5",
                "toleranceValue": "",
                "upperTolerance": "0.1",
                "lowerTolerance": "-0.1",
                "datum": "",
                "characteristic": "CC03",
                "notes": "Corner Radius"
            },
            {
                "groupNo": 3,
                "dimensionType": "flatness",
                "nominalValue": "0",
                "toleranceValue": "0.05",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "",
                "characteristic": "SC03",
                "notes": "Surface Flatness"
            },
            # 组4: 多个位置度
            {
                "groupNo": 4,
                "dimensionType": "position",
                "nominalValue": "0",
                "toleranceValue": "0.3",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "AB",
                "characteristic": "SC04",
                "notes": "Hole 1 Position"
            },
            {
                "groupNo": 4,
                "dimensionType": "position",
                "nominalValue": "0",
                "toleranceValue": "0.3",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "AB",
                "characteristic": "SC05",
                "notes": "Hole 2 Position"
            },
            # 组5: 球直径 + 同心度
            {
                "groupNo": 5,
                "dimensionType": "spherical_diameter",
                "nominalValue": "20",
                "toleranceValue": "",
                "upperTolerance": "0.2",
                "lowerTolerance": "-0.2",
                "datum": "",
                "characteristic": "CC04",
                "notes": "Sphere Diameter"
            },
            {
                "groupNo": 5,
                "dimensionType": "concentricity",
                "nominalValue": "0",
                "toleranceValue": "0.1",
                "upperTolerance": "",
                "lowerTolerance": "",
                "datum": "A",
                "characteristic": "SC06",
                "notes": "Concentricity"
            }
        ]
    }
]

def add_dimension(project_id, part_id, dimension):
    """添加单个尺寸数据"""
    url = f"{BASE_URL}/dimensions/projects/{project_id}"
    headers = {"Content-Type": "application/json"}
    
    # 准备数据
    data = {
        "partId": part_id,
        "groupNo": dimension["groupNo"],
        "dimensionType": dimension["dimensionType"],
        "nominalValue": dimension["nominalValue"],
        "toleranceValue": dimension["toleranceValue"],
        "upperTolerance": dimension["upperTolerance"],
        "lowerTolerance": dimension["lowerTolerance"],
        "datum": dimension["datum"],
        "characteristic": dimension["characteristic"],
        "notes": dimension["notes"]
    }
    
    print(f"添加尺寸到项目 {project_id}，零件 {part_id}")
    print(f"尺寸信息: {dimension['dimensionType']}, 名义值: {dimension['nominalValue']}, 特性: {dimension['characteristic']}")
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result = response.json()
        
        if result.get("success"):
            print(f"✅ 成功添加尺寸，ID: {result.get('data', {}).get('id')}")
        else:
            print(f"❌ 添加失败: {result.get('message')}")
            
    except Exception as e:
        print(f"❌ 添加尺寸时出错: {str(e)}")
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                print(f"错误详情: {error_data.get('message')}")
            except:
                pass

def main():
    """主函数"""
    print("开始添加测试尺寸数据...")
    print("=" * 50)
    
    for test_data in TEST_DIMENSIONS:
        project_id = test_data["project_id"]
        part_id = test_data["part_id"]
        dimensions = test_data["dimensions"]
        
        print(f"处理项目 {project_id}，零件 {part_id}")
        for i, dimension in enumerate(dimensions, 1):
            print(f"\n添加第 {i} 个尺寸")
            add_dimension(project_id, part_id, dimension)
        
        print("-" * 50)
    
    print("测试尺寸数据添加完成！")

if __name__ == "__main__":
    main()
