import os
from urllib.parse import urlparse

import pymysql

DEFAULT_URL = "mysql+pymysql://root:123456@localhost:3306/bom_db"


def parse_mysql_url(dsn: str):
    u = urlparse(dsn)
    # u.scheme may be 'mysql+pymysql'
    username = u.username or "root"
    password = u.password or ""
    host = u.hostname or "localhost"
    port = u.port or 3306
    dbname = (u.path or "/bom_db").lstrip("/") or "bom_db"
    return username, password, host, port, dbname


def main():
    dsn = os.getenv("DATABASE_URL", DEFAULT_URL)
    user, pwd, host, port, db = parse_mysql_url(dsn)
    print(f"Connecting to MySQL {user}@{host}:{port}, creating DB if not exists: {db}")
    conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database=None)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        print("Database checked/created.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
