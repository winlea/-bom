import xlrd

# 打开模板文件
workbook = xlrd.open_workbook('C:/Users/Administrator/univer/output/01-初始过程能力分析报告 Y1393847.xls')

# 获取第一个工作表
worksheet = workbook.sheet_by_index(0)

# 打印工作表信息
print('工作表名称:', worksheet.name)
print('行数:', worksheet.nrows)
print('列数:', worksheet.ncols)

# 打印前10行数据
print('\n前10行数据:')
for i in range(min(10, worksheet.nrows)):
    print(f'行{i}:', worksheet.row_values(i))

# 打印前5列的列名（如果有的话）
print('\n前5列的列名:')
if worksheet.nrows > 0:
    header_row = worksheet.row_values(0)
    for i in range(min(5, len(header_row))):
        print(f'列{i}:', header_row[i])
