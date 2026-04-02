#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试导入API功能
"""

import requests
import os

# 测试文件路径
test_file = "test_import_en.csv"

# 检查文件是否存在
if not os.path.exists(test_file):
    print(f"测试文件 {test_file} 不存在")
    exit(1)

# API端点
api_url = "http://localhost:5000/api/import/bom"

# 准备表单数据
files = {
    'file': (test_file, open(test_file, 'rb'), 'text/csv')
}
data = {
    'project_id': '1'
}

print(f"测试导入API: {api_url}")
print(f"使用文件: {test_file}")

try:
    # 发送请求
    response = requests.post(api_url, files=files, data=data)
    
    # 打印响应
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    if response.status_code == 200:
        print("导入成功!")
    else:
        print("导入失败!")
        
except Exception as e:
    print(f"测试失败: {str(e)}")
    import traceback
    traceback.print_exc()
