import os
import json

# 检查前端项目目录
frontend_dir = "bom-redesign/bom-system-redesign"

print("开始测试前端环境...")

# 检查前端目录是否存在
if not os.path.exists(frontend_dir):
    print(f"❌ 错误: 前端目录不存在: {frontend_dir}")
else:
    print(f"✅ 前端目录存在: {frontend_dir}")

# 检查package.json文件
package_json_path = os.path.join(frontend_dir, "package.json")
if os.path.exists(package_json_path):
    print(f"✅ package.json文件存在")
    with open(package_json_path, 'r', encoding='utf-8') as f:
        try:
            package_data = json.load(f)
            print(f"  项目名称: {package_data.get('name')}")
            print(f"  版本: {package_data.get('version')}")
            print(f"  脚本命令:")
            for script_name, script_cmd in package_data.get('scripts', {}).items():
                print(f"    - {script_name}: {script_cmd}")
        except json.JSONDecodeError:
            print("❌ 错误: package.json文件格式不正确")
else:
    print(f"❌ 错误: package.json文件不存在")

# 检查node_modules目录
node_modules_path = os.path.join(frontend_dir, "node_modules")
if os.path.exists(node_modules_path):
    print("✅ node_modules目录存在")
else:
    print("❌ 警告: node_modules目录不存在，需要运行 'npm install'")

# 检查vite.config.ts文件
vite_config_path = os.path.join(frontend_dir, "vite.config.ts")
if os.path.exists(vite_config_path):
    print("✅ vite.config.ts文件存在")
else:
    print("❌ 错误: vite.config.ts文件不存在")

# 检查index.html文件
index_html_path = os.path.join(frontend_dir, "index.html")
if os.path.exists(index_html_path):
    print("✅ index.html文件存在")
else:
    print("❌ 错误: index.html文件不存在")

# 检查src目录
src_dir = os.path.join(frontend_dir, "src")
if os.path.exists(src_dir):
    print("✅ src目录存在")
    # 检查main.tsx文件
    main_tsx_path = os.path.join(src_dir, "main.tsx")
    if os.path.exists(main_tsx_path):
        print("✅ main.tsx文件存在")
    else:
        print("❌ 错误: main.tsx文件不存在")
else:
    print("❌ 错误: src目录不存在")

print("\n前端环境测试完成!")
print("\n建议操作:")
print("1. 如果node_modules目录不存在，先运行: npm install")
print("2. 然后运行: npm run dev")
print("3. 或直接运行: npx vite")
