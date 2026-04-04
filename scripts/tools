import os
import win32com.client
import pythoncom

# 初始化COM环境
pythoncom.CoInitialize()

# 模板文件路径
template_path = r"C:\Users\Administrator\univer\output\01 Y0855010 零件保证书 PSW.xlsx"
# 新模板文件路径
new_template_path = r"C:\Users\Administrator\univer\PSW_Template.xlsx"

# 启动Excel应用程序
excel = win32com.client.Dispatch('Excel.Application')
excel.Visible = False
excel.DisplayAlerts = False

try:
    # 打开模板文件
    wb = excel.Workbooks.Open(template_path)
    # 选择PSW工作表
    ws = wb.Worksheets('PSW')
    
    # 遍历所有形状，找到并删除图片2
    shapes = ws.Shapes
    image_count = 0
    
    print("查找并删除图片2...")
    
    # 先收集所有图片形状
    image_shapes = []
    for i in range(1, shapes.Count + 1):
        shape = shapes.Item(i)
        if shape.Type == 13:  # 13 表示图片形状
            image_count += 1
            image_shapes.append((image_count, shape))
            print(f"找到图片 {image_count}: {shape.Name}")
    
    # 删除图片2
    for image_num, shape in image_shapes:
        if image_num == 2:
            print(f"删除图片 {image_num}: {shape.Name}")
            shape.Delete()
            print("图片2删除成功！")
            break
    
    # 保存为新模板文件
    wb.SaveAs(new_template_path)
    print(f"新模板文件保存成功: {new_template_path}")
    
    # 关闭工作簿
    wb.Close()
    
finally:
    # 退出Excel应用程序
    excel.Quit()
    print("操作完成！")
