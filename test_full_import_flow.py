import requests
import json
import time
import os

# 测试完整的导入流程：创建项目 + 上传文件导入

base_url = "http://localhost:5000/api"

def test_create_project():
    """测试创建新项目"""
    print("\n" + "="*60)
    print("1. 测试创建新项目...")
    
    url = f"{base_url}/projects"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "name": f"测试项目_{int(time.time())}",
        "description": "测试完整导入流程"
    }
    
    print(f"请求URL: {url}")
    print(f"请求数据: {json.dumps(data)}")
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            project_data = response.json()
            project_id = project_data.get("id")
            print(f"\n✅ 项目创建成功！项目ID: {project_id}")
            return project_id
        else:
            print(f"\n❌ 项目创建失败，状态码: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"\n❌ 请求失败: {str(e)}")
        return None

def test_import_bom(project_id, file_path):
    """测试导入BOM文件"""
    print("\n" + "="*60)
    print(f"2. 测试导入BOM文件到项目 {project_id}...")
    
    url = f"{base_url}/projects/{project_id}/import"
    
    print(f"请求URL: {url}")
    print(f"上传文件: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        print(f"\n❌ 文件不存在: {file_path}")
        return None
    
    try:
        # 准备multipart/form-data请求
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            }
            data = {
                'mapping': json.dumps({})
            }
            
            response = requests.post(url, files=files, data=data)
            
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code in [200, 202]:
            import_data = response.json()
            import_log_id = import_data.get("import_log_id")
            print(f"\n✅ BOM文件上传成功！导入日志ID: {import_log_id}")
            return import_log_id
        else:
            print(f"\n❌ BOM文件上传失败，状态码: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"\n❌ 请求失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_process_import(import_log_id):
    """测试处理导入日志"""
    print("\n" + "="*60)
    print(f"3. 测试处理导入日志 {import_log_id}...")
    
    url = f"{base_url}/imports/{import_log_id}/process"
    
    print(f"请求URL: {url}")
    
    try:
        response = requests.post(url)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            process_data = response.json()
            created_count = process_data.get("created", 0)
            errors_count = process_data.get("errors_count", 0)
            print(f"\n✅ 导入处理成功！")
            print(f"创建记录数: {created_count}")
            print(f"错误数: {errors_count}")
            return created_count
        else:
            print(f"\n❌ 导入处理失败，状态码: {response.status_code}")
            return 0
            
    except Exception as e:
        print(f"\n❌ 请求失败: {str(e)}")
        return 0

def test_get_parts(project_id):
    """测试获取项目的零件列表"""
    print("\n" + "="*60)
    print(f"4. 测试获取项目 {project_id} 的零件列表...")
    
    url = f"{base_url}/parts"
    params = {
        "project_id": project_id
    }
    
    print(f"请求URL: {url}")
    print(f"请求参数: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            parts_data = response.json()
            parts_count = len(parts_data)
            print(f"\n✅ 获取零件列表成功！")
            print(f"零件数量: {parts_count}")
            
            # 打印前5个零件
            if parts_count > 0:
                print("\n前5个零件:")
                for i, part in enumerate(parts_data[:5]):
                    print(f"{i+1}. 序号: {part.get('sequence')}, 零件号: {part.get('part_number')}, 零件名称: {part.get('part_name')}")
            
            return parts_count
        else:
            print(f"\n❌ 获取零件列表失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return 0
            
    except Exception as e:
        print(f"\n❌ 请求失败: {str(e)}")
        return 0

if __name__ == "__main__":
    print("开始测试完整导入流程...")
    print(f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 模板文件路径
    template_file = "E:\\NEW\\-bom\\WH-DFYF-H47-26-00 H47产品履历模版2026-2-7.xlsx"
    
    # 1. 创建新项目
    project_id = test_create_project()
    
    if project_id:
        # 2. 上传并导入BOM文件
        import_log_id = test_import_bom(project_id, template_file)
        
        if import_log_id:
            # 3. 处理导入
            created_count = test_process_import(import_log_id)
            
            if created_count > 0:
                # 4. 验证导入结果
                parts_count = test_get_parts(project_id)
                
                print("\n" + "="*60)
                print("测试总结:")
                print(f"✅ 项目创建: 成功 (ID: {project_id})")
                print(f"✅ 文件上传: 成功 (导入日志ID: {import_log_id})")
                print(f"✅ 导入处理: 成功 (创建 {created_count} 条记录)")
                print(f"✅ 数据验证: 成功 (获取到 {parts_count} 条零件记录)")
                print("\n🎉 完整导入流程测试成功！")
            else:
                print("\n❌ 导入处理失败，无法验证数据")
        else:
            print("\n❌ 文件上传失败，无法继续测试")
    else:
        print("\n❌ 项目创建失败，无法继续测试")
    
    print("\n测试完成！")
