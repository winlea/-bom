import requests
import os

def test_image_api():
    """测试图片API是否能够正常工作"""
    print("开始测试图片API...")
    print("=" * 60)
    
    # 测试获取零件列表，确认has_image字段
    parts_url = "http://localhost:5000/api/parts"
    params = {"project_id": 9}
    
    print(f"测试获取零件列表: {parts_url}?project_id=9")
    
    try:
        response = requests.get(parts_url, params=params)
        if response.status_code == 200:
            parts = response.json()
            print(f"成功获取零件列表，共{len(parts)}条记录")
            print()
            
            # 找到一个有图片的零件
            part_with_image = None
            for part in parts:
                if part.get('has_image'):
                    part_with_image = part
                    break
            
            if part_with_image:
                part_id = part_with_image.get('id')
                part_number = part_with_image.get('part_number')
                print(f"找到有图片的零件: ID={part_id}, 零件号={part_number}")
                print()
                
                # 测试获取图片
                image_url = f"http://localhost:5000/api/parts/{part_id}/image"
                print(f"测试获取图片: {image_url}")
                
                image_response = requests.get(image_url)
                if image_response.status_code == 200:
                    # 检查响应头
                    content_type = image_response.headers.get('Content-Type', '')
                    print(f"成功获取图片，Content-Type: {content_type}")
                    print(f"图片数据大小: {len(image_response.content)}字节")
                    
                    # 保存图片到本地（可选）
                    save_path = f"test_image_{part_id}.jpg"
                    with open(save_path, 'wb') as f:
                        f.write(image_response.content)
                    print(f"图片已保存到: {save_path}")
                    print()
                    print("✅ 图片API测试成功！")
                else:
                    print(f"❌ 获取图片失败，状态码: {image_response.status_code}")
                    print(f"响应内容: {image_response.text}")
            else:
                print("❌ 未找到有图片的零件")
        else:
            print(f"❌ 获取零件列表失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
    
    print("=" * 60)
    print("测试完成！")

if __name__ == "__main__":
    test_image_api()
