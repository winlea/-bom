import sqlite3
from datetime import datetime
conn = sqlite3.connect(r'c:\Users\Administrator\Odoo\-bom\bom_db.sqlite')
cursor = conn.cursor()
cursor.execute("""
    INSERT INTO projects (name, description, supplier_name, customer_name, created_at)
    VALUES (?, ?, ?, ?, ?)
""", ('测试项目', '自动创建的测试数据', '测试供应商', '测试客户', datetime.now().isoformat()))
conn.commit()
print("Inserted project ID:", cursor.lastrowid)
cursor.execute('SELECT * FROM projects')
print("Projects:", cursor.fetchall())
conn.close()
