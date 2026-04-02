import requests
import json

# 测试获取零件列表（不按项目过滤）
print("=== 测试获取所有零件 ===")
try:
    response = requests.get('http://localhost:5000/api/parts?project_id=')
    print(f"状态码: {response.status_code}")
    parts = response.json()
    print(f"获取到 {len(parts)} 个零件")
    
    # 打印有图片的零件
    print("\n=== 有图片的零件 ===")
    parts_with_images = [p for p in parts if p.get('has_image')]
    print(f"找到 {len(parts_with_images)} 个有图片的零件")
    
    for i, part in enumerate(parts_with_images[:5]):
        print(f"零件 {i+1}:")
        print(f"  ID: {part.get('id')}")
        print(f"  零件编号: {part.get('part_number')}")
        print(f"  零件名称: {part.get('part_name')}")
        print(f"  图片URL: {part.get('image_url')}")
        print(f"  有图片: {part.get('has_image')}")
        print()
        
except Exception as e:
    print(f"获取零件列表失败: {e}")

# 直接测试ID为1的零件，这个零件肯定有图片数据
print("\n=== 测试ID为1的零件图片 ===")
try:
    part_id = 1
    print(f"测试获取图片: http://localhost:5000/api/parts/{part_id}/image")
    img_response = requests.get(f"http://localhost:5000/api/parts/{part_id}/image")
    print(f"图片请求状态码: {img_response.status_code}")
    if img_response.status_code == 200:
        print(f"图片大小: {len(img_response.content)} 字节")
        print(f"图片类型: {img_response.headers.get('Content-Type')}")
    else:
        print(f"图片请求失败: {img_response.text}")
except Exception as e:
    print(f"图片请求异常: {e}")

# 测试ID为2的零件
print("\n=== 测试ID为2的零件图片 ===")
try:
    part_id = 2
    print(f"测试获取图片: http://localhost:5000/api/parts/{part_id}/image")
    img_response = requests.get(f"http://localhost:5000/api/parts/{part_id}/image")
    print(f"图片请求状态码: {img_response.status_code}")
    if img_response.status_code == 200:
        print(f"图片大小: {len(img_response.content)} 字节")
        print(f"图片类型: {img_response.headers.get('Content-Type')}")
    else:
        print(f"图片请求失败: {img_response.text}")
except Exception as e:
    print(f"图片请求异常: {e}")
