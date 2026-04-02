import os


# 检查模板文件是否存在
def check_template_file():
    template_path = "E:\\NEW\\-bom\\WH-DFYF-H47-26-00 H47产品履历模版2026-2-7.xlsx"

    print(f"检查模板文件: {template_path}")
    print(f"文件是否存在: {os.path.exists(template_path)}")

    if os.path.exists(template_path):
        print(f"文件大小: {os.path.getsize(template_path)} 字节")
        print("模板文件存在，可以使用")
    else:
        print("模板文件不存在，请检查路径")


if __name__ == "__main__":
    check_template_file()
