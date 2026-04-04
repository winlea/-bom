import sqlite3
conn = sqlite3.connect(r'c:\Users\Administrator\Odoo\-bom\bom_db.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])
cursor.execute('SELECT COUNT(*) FROM projects')
print("Projects count:", cursor.fetchone()[0])
conn.close()
