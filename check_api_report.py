import xlrd

# 打开API生成的报告文件
workbook = xlrd.open_workbook('C:/Users/Administrator/univer/output/process_capability/Y1392191_初始过程能力分析报告 .xls')

# 获取第一个工作表
worksheet = workbook.sheet_by_index(0)

# 读取E6单元格的值（0-based索引：行5, 列4）
part_number_cell = worksheet.cell_value(5, 4)
print(f"E6单元格的值: {part_number_cell}")

# 读取E7单元格的值（0-based索引：行6, 列4）
drawing_2d_cell = worksheet.cell_value(6, 4)
print(f"E7单元格的值: {drawing_2d_cell}")

# 读取产品描述（0-based索引：行4, 列11）
part_name_cell = worksheet.cell_value(4, 11)
print(f"产品描述: {part_name_cell}")
