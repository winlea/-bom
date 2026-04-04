# 项目文档索引

## 目录结构

```
├── bom_system/          # Python 后端代码
│   ├── api/             # API 控制器
│   ├── database/        # 数据库配置
│   ├── dimensions/      # 尺寸管理模块
│   ├── projects/        # 项目管理模块
│   ├── repositories/    # 数据访问层
│   ├── services/        # 业务服务层
│   └── templates/       # Excel 模板
│
├── bom-redesign/        # React 前端代码
│   └── src/
│       ├── components/   # React 组件
│       ├── hooks/       # 自定义 Hooks
│       ├── pages/       # 页面组件
│       ├── services/    # API 服务
│       ├── stores/      # 状态管理
│       ├── types/       # TypeScript 类型
│       └── utils/       # 工具函数
│
├── scripts/             # 工具脚本
│   ├── maintenance/      # 维护脚本
│   ├── migrations/      # 数据库迁移
│   ├── queries/         # 查询工具
│   └── tools/           # 辅助工具
│
├── docs/                # 项目文档
├── output/              # 输出文件
├── static/              # 静态资源
└── templates/           # HTML 模板
```

## 文档说明

| 文档 | 说明 |
|------|------|
| `CODE_REVIEW_GUIDE.md` | 代码审查标准与流程规范 |
| `ERROR_HANDLING_GUIDE.md` | 错误处理指南 |
| `api-contract.md` | API 接口文档 |
| `完整项目设计文档.md` | 项目完整设计文档 |
| `frontend_startup_guide.md` | 前端启动指南 |

## 代码规范

### 命名规范

| 类型 | Python | TypeScript |
|------|--------|------------|
| 模块/文件 | `snake_case.py` | `kebab-case.ts` |
| 类名 | `PascalCase` | `PascalCase` |
| 函数 | `snake_case()` | `camelCase()` |
| 常量 | `UPPER_SNAKE_CASE` | `UPPER_SNAKE_CASE` |
| 私有变量 | `_prefix` | `_prefix` |

### 代码风格

- Python: Black + isort + flake8
- TypeScript: Prettier + ESLint
- React: 函数组件 + Hooks

## 快速链接

- [API 文档](api-contract.md)
- [代码审查规范](CODE_REVIEW_GUIDE.md)
- [错误处理指南](ERROR_HANDLING_GUIDE.md)
