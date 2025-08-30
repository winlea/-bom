# 一键启动脚本（PowerShell）
# 1) 创建虚拟环境
# 2) 安装依赖
# 3) 创建数据库并初始化表
# 4) 启动服务

$ErrorActionPreference = 'Stop'

if (!(Test-Path .venv)) {
  python -m venv .venv
}

. .venv\Scripts\Activate.ps1

pip install -r requirements.txt

# 可选：加载 .env；config.py 会自动加载 .env，如需覆盖请自行编辑 .env

python scripts\create_database.py
python run_db_init.py

python app.py

