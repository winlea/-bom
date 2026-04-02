#!/usr/bin/env python3
"""
生成测试尺寸数据，用于测试组合图纸功能
"""

import requests
import json

# 测试数据：包含不同类型的尺寸，用于测试组合图纸功能
test_dimensions = [
    # 组1：孔径 + 位置度
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 1,
        "dimensionType": "diameter",
        "nominalValue": "10",
        "upperTolerance": "0.1",
        "lowerTolerance": "-0.1",
        "datum": "",
        "characteristic": "SC01",
        "notes": "孔径尺寸"
    },
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 1,
        "dimensionType": "position",
        "toleranceValue": "0.2",
        "datum": "ABC",
        "characteristic": "SC02",
        "notes": "位置度尺寸"
    },
    # 组2：普通尺寸 + 垂直度
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 2,
        "dimensionType": "normal",
        "nominalValue": "25",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "",
        "characteristic": "SC03",
        "notes": "普通线性尺寸"
    },
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 2,
        "dimensionType": "perpendicularity",
        "toleranceValue": "0.1",
        "datum": "A",
        "characteristic": "SC04",
        "notes": "垂直度尺寸"
    },
    # 组3：半径 + 平面度
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 3,
        "dimensionType": "radius",
        "nominalValue": "5",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "",
        "characteristic": "SC05",
        "notes": "半径尺寸"
    },
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 3,
        "dimensionType": "flatness",
        "toleranceValue": "0.02",
        "datum": "",
        "characteristic": "SC06",
        "notes": "平面度尺寸"
    },
    # 组4：球直径 + 同心度
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 4,
        "dimensionType": "spherical_diameter",
        "nominalValue": "15",
        "upperTolerance": "0.1",
        "lowerTolerance": "-0.1",
        "datum": "",
        "characteristic": "SC07",
        "notes": "球直径尺寸"
    },
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 4,
        "dimensionType": "concentricity",
        "toleranceValue": "0.05",
        "datum": "A",
        "characteristic": "SC08",
        "notes": "同心度尺寸"
    },
    # 组5：角度 + 平行度
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 5,
        "dimensionType": "angular",
        "nominalValue": "90",
        "upperTolerance": "1",
        "lowerTolerance": "-1",
        "datum": "",
        "characteristic": "SC09",
        "notes": "角度尺寸"
    },
    {
        "project_id": "131231",
        "partId": "TEST-001",
        "groupNo": 5,
        "dimensionType": "parallelism",
        "toleranceValue": "0.05",
        "datum": "B",
        "characteristic": "SC10",
        "notes": "平行度尺寸"
    }
]

def create_dimension(dimension_data):
    """创建单个尺寸"""
    url = f"http://localhost:5000/api/dimensions/projects/{dimension_data['project_id']}"
    data = {
        "partId": dimension_data['partId'],
        "groupNo": dimension_data['groupNo'],
        "dimensionType": dimension_data['dimensionType'],
        "nominalValue": dimension_data.get('nominalValue', ''),
        "toleranceValue": dimension_data.get('toleranceValue', ''),
        "upperTolerance": dimension_data.get('upperTolerance', ''),
        "lowerTolerance": dimension_data.get('lowerTolerance', ''),
        "datum": dimension_data.get('datum', ''),
        "characteristic": dimension_data.get('characteristic', ''),
        "notes": dimension_data.get('notes', '')
    }
    
    response = requests.post(url, json=data)
    return response.json()

def main():
    """主函数"""
    print("开始生成测试尺寸数据...")
    
    success_count = 0
    error_count = 0
    
    for i, dimension in enumerate(test_dimensions, 1):
        print(f"正在创建第 {i} 个尺寸...")
        try:
            result = create_dimension(dimension)
            if result.get('success'):
                success_count += 1
                print(f"✓ 成功创建尺寸: 组号 {dimension['groupNo']}, 类型 {dimension['dimensionType']}")
            else:
                error_count += 1
                print(f"✗ 创建尺寸失败: {result.get('message')}")
        except Exception as e:
            error_count += 1
            print(f"✗ 创建尺寸时发生错误: {str(e)}")
    
    print(f"\n生成测试数据完成:")
    print(f"成功: {success_count} 个")
    print(f"失败: {error_count} 个")
    
    # 验证数据是否正确添加
    print("\n验证数据...")
    response = requests.get("http://localhost:5000/api/dimensions?projectId=131231")
    if response.status_code == 200:
        data = response.json()
        print(f"当前数据库中尺寸数量: {data.get('total', 0)}")
        print(f"数据获取成功: {data.get('success')}")
    else:
        print("验证数据失败")

if __name__ == "__main__":
    main()
