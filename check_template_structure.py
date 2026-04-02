import xlrd

# 模板文件路径
template_path = r"C:\Users\Administrator\univer\output\01-初始过程能力分析报告 Y1393847.xls"

# 打开模板文件
workbook = xlrd.open_workbook(template_path)

# 获取第一个工作表
worksheet = workbook.sheet_by_index(0)

# 打印工作表信息
print(f"工作表名称: {worksheet.name}")
print(f"行数: {worksheet.nrows}")
print(f"列数: {worksheet.ncols}")

# 分析关键单元格
print("\n分析关键单元格:")

# E6 单元格 (行6, 列5，1-based) -> (行5, 列4，0-based)
e6_value = worksheet.cell_value(5, 4)
e6_type = worksheet.cell_type(5, 4)
print(f"E6 (0-based: 5,4) 值: '{e6_value}', 类型: {e6_type}")

# L5 单元格 (行5, 列12，1-based) -> (行4, 列11，0-based)
l5_value = worksheet.cell_value(4, 11)
l5_type = worksheet.cell_type(4, 11)
print(f"L5 (0-based: 4,11) 值: '{l5_value}', 类型: {l5_type}")

# E7 单元格 (行7, 列5，1-based) -> (行6, 列4，0-based)
e7_value = worksheet.cell_value(6, 4)
e7_type = worksheet.cell_type(6, 4)
print(f"E7 (0-based: 6,4) 值: '{e7_value}', 类型: {e7_type}")

# 检查周围单元格，确认位置是否正确
print("\n检查周围单元格:")
for row in range(3, 8):  # 行4-8（1-based）
    for col in range(3, 13):  # 列D-L（1-based）
        value = worksheet.cell_value(row, col)
        cell_type = worksheet.cell_type(row, col)
        if value or cell_type != 0:
            print(f"行{row+1}, 列{chr(65+col)}: '{value}', 类型: {cell_type}")
