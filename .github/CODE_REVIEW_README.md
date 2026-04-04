# 代码审查快速开始指南

## 📋 目录

- [环境准备](#环境准备)
- [提交前检查](#提交前检查)
- [创建Pull Request](#创建pull-request)
- [审查者指南](#审查者指南)
- [常见问题](#常见问题)

---

## 环境准备

### 1. 安装Git Hooks (推荐)

```bash
# 安装pre-commit hooks
pip install pre-commit
pre-commit install

# 手动运行检查
pre-commit run --all-files
```

### 2. Python环境

```bash
# 安装开发依赖
pip install -r requirements.txt

# 可选：仅安装lint工具
pip install black isort flake8 mypy
```

### 3. 前端环境

```bash
cd bom-redesign/bom-system-redesign
npm install
```

---

## 提交前检查

### Python代码检查

```bash
# 格式化代码
black bom_system/ tests/ scripts/

# 检查import顺序
isort --check bom_system/ tests/ scripts/

# 代码风格检查
flake8 bom_system/ tests/ scripts/

# 类型检查
mypy bom_system/ --config-file=pyproject.toml
```

### 前端代码检查

```bash
cd bom-redesign/bom-system-redesign

# 检查并修复
npm run lint:fix

# 格式化
npm run lint:format

# 类型检查
npm run type-check
```

### 运行测试

```bash
# Python测试
pytest tests/ -v --cov=bom_system

# 前端测试
npm test
```

---

## 创建Pull Request

### PR标题格式

```
[类型] 简短描述
```

示例：
- `[feat] 添加BOM导入进度显示`
- `[fix] 修复零件删除时的关联数据处理`
- `[refactor] 重构项目服务层代码`

### 提交信息规范

```bash
# 格式
git commit -m "type(scope): description"

# 示例
git commit -m "feat(api): 添加零件批量导入接口"
git commit -m "fix(ui): 修复表格排序在Safari下的显示问题"
git commit -m "docs: 更新API文档"
```

### 分支命名规范

```bash
# 功能分支
git checkout -b feature/add-bom-import

# 修复分支
git checkout -b fix/login-redirect

# 重构分支
git checkout -b refactor/service-layer
```

---

## 审查者指南

### 审查流程

1. **接收PR通知** → GitHub会发送邮件通知
2. **查看变更** → 在GitHub PR页面查看diff
3. **运行本地检查**（如需要）
4. **逐项审查** → 按照CODE_REVIEW_GUIDE.md中的检查清单
5. **提交审查意见**
6. **做出决定** → Approve / Request Changes / Comment

### 审查重点

| 优先级 | 项目 | 说明 |
|--------|------|------|
| P0 | 功能正确性 | 代码逻辑是否正确 |
| P0 | 安全性 | 是否有安全漏洞 |
| P1 | 代码风格 | 是否符合规范 |
| P1 | 错误处理 | 异常情况是否处理 |
| P2 | 性能 | 是否有性能问题 |
| P2 | 可维护性 | 代码是否清晰易懂 |

### 审查意见标注

```markdown
🔴 **[Must Fix]** - 必须修复才能合并
🟡 **[Should Fix]** - 建议修复
🔵 **[Nitpick]** - 小问题，可选
💡 **[Suggestion]** - 改进建议
✅ **[Good]** - 做得好的地方
```

### 审查通过标准

- ✅ 无🔴Must Fix级别问题
- ✅ 自动化检查全部通过
- ✅ 至少1名审查者approve
- ✅ 测试覆盖无下降

---

## 常见问题

### Q: pre-commit hook安装失败？

```bash
# Windows
pip install pre-commit
pre-commit install

# 如果使用conda
conda install -c conda-forge pre-commit
```

### Q: black/isort 格式化冲突？

确保使用统一的配置文件`pyproject.toml`

```bash
# 强制使用项目配置格式化
black --config=pyproject.toml .
```

### Q: mypy报错太多？

可以逐步启用类型检查，在pyproject.toml中调整配置

### Q: 紧急修复需要快速合并？

对于紧急修复：
1. 在PR标题标注`[URGENT]`
2. 可以先合并，24小时内补充审查
3. 必须有完整测试覆盖

### Q: 审查意见有争议？

1. 先尝试本地复现问题
2. 讨论时提供具体的代码建议
3. 必要时团队会议讨论
4. 记录讨论结论，更新规范文档

---

## 📚 参考资料

- [代码审查标准与流程规范](../CODE_REVIEW_GUIDE.md)
- [Python代码规范 PEP8](https://pep8.org/)
- [Google Python风格指南](https://google.github.io/styleguide/pyguide.html)
- [Airbnb JavaScript风格指南](https://github.com/airbnb/javascript)

---

*有问题？请创建Issue或联系团队负责人*
