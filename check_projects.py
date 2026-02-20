import sqlite3

# 检查数据库中的项目
conn = sqlite3.connect('bom_db.sqlite')
cursor = conn.cursor()

print('检查数据库中的项目...')

# 查询项目表
cursor.execute('SELECT * FROM projects')
projects = cursor.fetchall()

print(f'找到 {len(projects)} 个项目:')
for project in projects:
    print(f'ID: {project[0]}, 名称: {project[1]}, 描述: {project[2]}, 状态: {project[3]}, 创建时间: {project[4]}')

# 关闭连接
conn.close()
