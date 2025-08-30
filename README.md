# BOM 表图像管理系统（Python + MySQL）

最小可用（MVP）版本，提供 Base64/URL 图像上传与下载接口。

## 快速开始

1) 创建虚拟环境并安装依赖

```
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

2) 准备数据库（本地 MySQL 8）

```
mysql -u root -p
# 输入密码：123456（可在环境变量覆盖）
CREATE DATABASE IF NOT EXISTS bom_db;
```

3) 设置环境变量（可选）

```
# Windows PowerShell 示例
$env:DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/bom_db"
$env:MAX_IMAGE_BYTES = "5242880"   # 5MB
$env:ALLOWED_IMAGE_MIME = "image/png,image/jpeg"
```

4) 启动服务

```
python app.py
```

5) 健康检查

```
curl http://127.0.0.1:5000/health
```

## API 示例

- 上传 Base64 图像

```
POST /upload/base64
Content-Type: application/json
{
  "part_number": "Y0704612",
  "image_data": "data:image/png;base64,iVBORw0KG...",
  "part_name": "可选"
}
```

- 通过 URL 抓取并存储图像

```
POST /upload/url
Content-Type: application/json
{
  "part_number": "Y0704612",
  "url": "https://example.com/image.png",
  "part_name": "可选"
}
```

- 下载图像

```
GET /download/1
```

## 说明
- 当前使用 `db.create_all()` 自动建表，后续可切换至 Flask-Migrate。
- 图像校验基于 `imghdr`，并限制大小与 MIME 类型。
- 配置项可通过环境变量覆盖，详见 `bom_system/config.py`。

