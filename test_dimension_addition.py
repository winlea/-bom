#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试优化后的尺寸添加功能
"""

import requests
import json

# 基础URL
BASE_URL = "http://localhost:5000/api/dimensions"

# 测试项目ID
TEST_PROJECT_ID = "1"
# 测试零件ID
TEST_PART_ID = "test_part"

print("开始测试优化后的尺寸添加功能...\n")

# 测试1: 批量创建尺寸API
def test_bulk_create_dimensions():
    print("测试1: 批量创建尺寸API")
    try:
        # 准备测试数据
        test_dimensions = [
            {
                "partId": TEST_PART_ID,
                "dimensionType": "linear",
                "nominalValue": "100.0",
                "toleranceValue": "0.5",
                "upperTolerance": "0.25",
                "lowerTolerance": "-0.25",
                "datum": "A",
                "characteristic": "test",
                "notes": "测试尺寸1"
            },
            {
                "partId": TEST_PART_ID,
                "dimensionType": "diameter",
                "nominalValue": "50.0",
                "toleranceValue": "0.3",
                "upperTolerance": "0.15",
                "lowerTolerance": "-0.15",
                "datum": "B",
                "characteristic": "test",
                "notes": "测试尺寸2"
            },
            {
                "partId": TEST_PART_ID,
                "dimensionType": "angular",
                "nominalValue": "45",
                "toleranceValue": "0.5",
                "upperTolerance": "0.25",
                "lowerTolerance": "-0.25",
                "datum": "C",
                "characteristic": "test",
                "notes": "测试尺寸3"
            }
        ]
        
        # 发送请求
        url = f"{BASE_URL}/projects/{TEST_PROJECT_ID}/bulk"
        response = requests.post(url, json=test_dimensions)
        
        print(f"请求URL: {url}")
        print(f"请求数据: {json.dumps(test_dimensions, indent=2, ensure_ascii=False)}")
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 201:
            result = response.json()
            if result.get("success"):
                print("✓ 批量创建尺寸成功")
                print(f"  创建了 {result.get('data', {}).get('count', 0)} 个尺寸")
                return True
            else:
                print(f"❌ 批量创建尺寸失败: {result.get('message')}")
                return False
        else:
            print(f"❌ 批量创建尺寸失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 批量创建尺寸测试失败: {str(e)}")
        return False

# 测试2: 批量创建尺寸API - 验证失败情况
def test_bulk_create_dimensions_validation():
    print("\n测试2: 批量创建尺寸API - 验证失败情况")
    try:
        # 准备无效的测试数据（缺少必要字段）
        test_dimensions = [
            {
                "partId": TEST_PART_ID,
                # 缺少dimensionType
                "nominalValue": "100.0",
                "toleranceValue": "0.5"
            }
        ]
        
        # 发送请求
        url = f"{BASE_URL}/projects/{TEST_PROJECT_ID}/bulk"
        response = requests.post(url, json=test_dimensions)
        
        print(f"请求URL: {url}")
        print(f"请求数据: {json.dumps(test_dimensions, indent=2, ensure_ascii=False)}")
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 400:
            result = response.json()
            if not result.get("success"):
                print("✓ 验证失败测试成功 - 正确返回了400错误")
                print(f"  错误信息: {result.get('message')}")
                return True
            else:
                print("❌ 验证失败测试失败 - 应该返回失败结果")
                return False
        else:
            print(f"❌ 验证失败测试失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 验证失败测试失败: {str(e)}")
        return False

# 测试3: 批量创建尺寸API - 空数组情况
def test_bulk_create_dimensions_empty():
    print("\n测试3: 批量创建尺寸API - 空数组情况")
    try:
        # 准备空数组
        test_dimensions = []
        
        # 发送请求
        url = f"{BASE_URL}/projects/{TEST_PROJECT_ID}/bulk"
        response = requests.post(url, json=test_dimensions)
        
        print(f"请求URL: {url}")
        print(f"请求数据: {json.dumps(test_dimensions, indent=2, ensure_ascii=False)}")
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 400:
            result = response.json()
            if not result.get("success"):
                print("✓ 空数组测试成功 - 正确返回了400错误")
                print(f"  错误信息: {result.get('message')}")
                return True
            else:
                print("❌ 空数组测试失败 - 应该返回失败结果")
                return False
        else:
            print(f"❌ 空数组测试失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 空数组测试失败: {str(e)}")
        return False

# 测试4: 获取项目尺寸列表
def test_get_project_dimensions():
    print("\n测试4: 获取项目尺寸列表")
    try:
        # 发送请求
        url = f"{BASE_URL}/projects/{TEST_PROJECT_ID}?part_number={TEST_PART_ID}"
        response = requests.get(url)
        
        print(f"请求URL: {url}")
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                dimensions = result.get("data", [])
                print(f"✓ 获取项目尺寸列表成功")
                print(f"  尺寸数量: {len(dimensions)}")
                if dimensions:
                    print(f"  第一个尺寸: {json.dumps(dimensions[0], indent=2, ensure_ascii=False)}")
                return True
            else:
                print(f"❌ 获取项目尺寸列表失败: {result.get('message')}")
                return False
        else:
            print(f"❌ 获取项目尺寸列表失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取项目尺寸列表测试失败: {str(e)}")
        return False

# 运行所有测试
def run_all_tests():
    tests = [
        test_bulk_create_dimensions,
        test_bulk_create_dimensions_validation,
        test_bulk_create_dimensions_empty,
        test_get_project_dimensions
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
    
    print("\n测试结果汇总:")
    print(f"总测试数: {len(tests)}")
    print(f"通过测试数: {sum(results)}")
    print(f"失败测试数: {len(tests) - sum(results)}")
    
    if all(results):
        print("\n✅ 所有测试通过！")
    else:
        print("\n❌ 部分测试失败，请检查代码")

if __name__ == "__main__":
    run_all_tests()
