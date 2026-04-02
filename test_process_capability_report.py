#!/usr/bin/env python3
"""
测试生成初始过程能力分析报告
"""

import requests
import json
import os

# 后端API地址
BASE_URL = "http://localhost:5000/api"

# 测试数据
TEST_DATA = {
    "part_id": 1  # 零件 Y1392191 的实际 ID
}

def test_generate_report():
    """测试生成初始过程能力分析报告"""
    url = f"{BASE_URL}/process-capability/generate"
    headers = {"Content-Type": "application/json"}
    
    print("开始测试生成初始过程能力分析报告...")
    print(f"API URL: {url}")
    print(f"请求数据: {json.dumps(TEST_DATA, indent=2)}")
    print("=" * 50)
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(TEST_DATA))
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            # 检查响应头
            content_type = response.headers.get('Content-Type')
            content_disposition = response.headers.get('Content-Disposition')
            
            print(f"Content-Type: {content_type}")
            print(f"Content-Disposition: {content_disposition}")
            print(f"文件大小: {len(response.content)} bytes")
            
            # 保存文件
            if content_disposition:
                # 从Content-Disposition中提取文件名
                import re
                match = re.search(r'filename="([^"]+)"', content_disposition)
                if match:
                    filename = match.group(1)
                    # 解码URL编码的文件名
                    import urllib.parse
                    filename = urllib.parse.unquote(filename)
                else:
                    filename = "process_capability_report.xlsx"
            else:
                filename = "process_capability_report.xlsx"
            
            # 保存文件
            output_path = os.path.join(os.path.dirname(__file__), "output", filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ 报告生成成功，文件已保存到: {output_path}")
            print(f"文件大小: {os.path.getsize(output_path)} bytes")
            print(f"文件存在: {os.path.exists(output_path)}")
        else:
            # 尝试解析错误响应
            try:
                error_data = response.json()
                print(f"❌ 生成失败: {error_data.get('error')}")
                if 'details' in error_data:
                    print(f"错误详情: {error_data.get('details')}")
            except:
                print(f"❌ 生成失败，状态码: {response.status_code}")
                print(f"响应内容: {response.text}")
                
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")

if __name__ == "__main__":
    test_generate_report()
