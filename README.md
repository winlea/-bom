# BOM 表图像管理系统

基于 Flask + SQLite + React 的 BOM 表管理系统，提供完整的项目管理、零件管理、维度管理和图像管理功能。

## 项目架构

### 后端架构
- **框架**: Flask
- **数据库**: SQLite
- **设计模式**: 依赖注入、仓储模式
- **核心组件**:
  - 服务接口层（`interfaces/`）
  - 仓储实现层（`repositories/`）
  - 依赖注入容器（`container.py`）
  - 数据库会话管理（`database/session.py`）
  - 配置管理（`config/manager.py`）
  - 标准化API响应（`api/response.py`）
  - 错误处理（`api/error_handler.py`）

### 前端架构
- **框架**: React + TypeScript
- **状态管理**: Zustand
- **API客户端**: Axios
- **UI组件**: 自定义组件库

## 快速开始

### 1. 后端设置

1) 创建虚拟环境并安装依赖

```
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

2) 数据库初始化（SQLite自动创建）

```
python run_db_init.py
```

3) 设置环境变量（可选）

```
# Windows PowerShell 示例
$env:FLASK_ENV = "development"
$env:FLASK_DEBUG = "True"
$env:DATABASE_URL = "sqlite:///bom_db.sqlite"
$env:SECRET_KEY = "your-secret-key-here"
```

4) 启动后端服务

```
python app.py
```

5) 健康检查

```
curl http://127.0.0.1:5000/health
```

### 2. 前端设置

1) 进入前端目录

```
cd bom-redesign\bom-system-redesign
```

2) 安装依赖

```
npm install
```

3) 启动前端开发服务器

```
npm run dev
```

4) 访问前端应用

```
http://localhost:5173
```

## 核心功能

### 1. 项目管理
- 创建、编辑、删除项目
- 项目列表查询与搜索

### 2. 零件管理
- 导入 BOM 表（Excel）
- 零件列表查询与搜索
- 零件详情查看

### 3. 维度管理
- 创建、编辑、删除维度
- 维度列表查询与筛选
- 维度图像关联

### 4. 图像管理
- Base64 图像上传
- URL 图像抓取
- 图像下载与预览

## API 文档

完整的 API 契约定义请参考 [api-contract.md](api-contract.md) 文件。

## 测试

项目包含完整的单元测试，覆盖核心功能：

```
python -m pytest tests/ -v
```

## 技术栈

### 后端
- Python 3.13+
- Flask 2.0+
- SQLAlchemy
- dependency-injector
- pytest

### 前端
- React 18+
- TypeScript
- Zustand
- Axios
- Tailwind CSS

## 配置管理

项目使用环境变量进行配置管理，主要配置项包括：
- `DATABASE_URL`: 数据库连接字符串
- `FLASK_ENV`: 运行环境（development/production）
- `FLASK_DEBUG`: 调试模式
- `SECRET_KEY`: 密钥

详细配置请参考 `.env.example` 文件。

## 代码质量

项目采用严格的代码审查流程：

### 代码检查工具

| 工具 | 用途 | 命令 |
|------|------|------|
| black | 代码格式化 | `black bom_system/` |
| isort | import排序 | `isort bom_system/` |
| flake8 | 代码风格检查 | `flake8 bom_system/` |
| mypy | 类型检查 | `mypy bom_system/` |
| ESLint | 前端代码检查 | `npm run lint` |
| Prettier | 前端格式化 | `npm run lint:format` |

### Pre-commit Hooks

安装提交前检查：

```bash
pip install pre-commit
pre-commit install
```

### 代码审查流程

1. 创建分支：`git checkout -b feature/xxx`
2. 提交前检查：`pre-commit run --all-files`
3. 创建Pull Request
4. 等待审查通过
5. 合并到主分支

详细规范请参考：
- [代码审查标准与流程](./.github/CODE_REVIEW_README.md)
- [完整审查指南](./CODE_REVIEW_GUIDE.md)

---

## 项目结构

```
├── bom_system/          # 后端核心代码
│   ├── api/             # API 相关代码
│   ├── config/          # 配置管理
│   ├── database/        # 数据库相关代码
│   ├── interfaces/      # 服务接口
│   ├── repositories/    # 仓储实现
│   ├── container.py     # 依赖注入容器
│   └── models.py        # 数据模型
├── bom-redesign/        # 前端代码
│   └── bom-system-redesign/  # React 应用
├── tests/               # 测试代码
├── static/              # 静态文件
├── templates/           # 模板文件
├── app.py               # 后端入口
├── run_db_init.py       # 数据库初始化脚本
├── requirements.txt     # 后端依赖
└── README.md            # 项目文档
```

