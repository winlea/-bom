# 代码审查标准与流程规范

## 一、审查原则

### 1.1 核心原则
- **代码可读性优先**：代码是给人看的，其次是给机器执行
- **一致性**：整个代码库保持统一的风格和模式
- **实用性**：标准应能实际提升代码质量，不过度也不不足
- **持续改进**：定期回顾和优化审查标准

### 1.2 审查目标
- 减少代码缺陷流入生产环境
- 促进知识共享和团队协作
- 建立和维护代码规范
- 识别代码中的潜在风险和改进点

---

## 二、技术规范

### 2.1 Python后端规范

#### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 模块 | 小写下划线 | `user_service.py` |
| 类名 | 大驼峰 | `UserService`, `BomTable` |
| 函数 | 小写下划线 | `get_user_by_id()` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT` |
| 私有变量 | 前缀下划线 | `_private_method()` |

#### 函数设计原则
```python
# ✅ 推荐：单一职责，清晰的输入输出
def calculate_bom_weight(part_ids: list[int]) -> float:
    """计算BOM总重量"""
    parts = BomTable.query.filter(BomTable.id.in_(part_ids)).all()
    return sum(p.net_weight_kg for p in parts if p.net_weight_kg)

# ❌ 避免：职责不清，副作用过多
def process_data(data):
    # 同时做：验证、转换、保存、发送邮件
    pass
```

#### 类型提示要求
```python
# ✅ 推荐：所有公共API必须有类型提示
def get_project_summary(project_id: int) -> dict[str, Any]:
    ...

# ✅ 推荐：复杂参数使用TypeAlias或dataclass
from dataclasses import dataclass

@dataclass
class ImportResult:
    success_count: int
    failed_count: int
    errors: list[str]
```

#### 错误处理规范
```python
# ✅ 推荐：具体的异常类型，清晰的错误信息
class BomImportError(Exception):
    """BOM导入相关错误"""
    pass

def import_bom_file(file_path: str) -> ImportResult:
    if not os.path.exists(file_path):
        raise BomImportError(f"文件不存在: {file_path}")
    
    try:
        data = parse_excel(file_path)
    except Exception as e:
        raise BomImportError(f"解析Excel失败: {e}") from e
```

#### 数据库操作规范
```python
# ✅ 推荐：使用上下文管理器，明确的事务边界
from contextlib import contextmanager

@contextmanager
def transaction():
    try:
        yield db.session
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

# ✅ 推荐：Repository模式封装数据访问
class ProjectRepository:
    def __init__(self, session: db.Session):
        self._session = session
    
    def find_by_id(self, project_id: int) -> Project | None:
        return self._session.get(Project, project_id)
```

### 2.2 TypeScript/React前端规范

#### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | 大驼峰，.tsx | `BomTableRow.tsx` |
| 工具函数 | 小驼峰 | `formatDate.ts` |
| Hooks | use前缀 | `useBomData.ts` |
| 常量 | 全大写下划线 | `API_BASE_URL` |
| 类型/接口 | 大驼峰/I前缀 | `IUserData`, `BomPart` |

#### 组件设计原则
```typescript
// ✅ 推荐：函数组件 + 明确的Props接口
interface BomRowProps {
  part: BomPart;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const BomRow: React.FC<BomRowProps> = ({ part, onEdit, onDelete }) => {
  return (
    <tr>
      <td>{part.partNumber}</td>
      <td>{part.partName}</td>
    </tr>
  );
};

// ❌ 避免：类组件（除非有复杂生命周期需求）
// ❌ 避免：Props没有类型定义
```

#### 状态管理规范
```typescript
// ✅ 推荐：使用Zustand store管理全局状态
interface BomStore {
  parts: BomPart[];
  selectedId: number | null;
  fetchParts: () => Promise<void>;
  selectPart: (id: number | null) => void;
}

// ✅ 推荐：本地状态使用useState，复杂状态用useReducer
const [bomData, setBomData] = useState<BomPart[]>([]);
```

#### API调用规范
```typescript
// ✅ 推荐：封装API服务层
// services/bomApi.ts
export const bomApi = {
  getParts: (projectId: number) => 
    api.get<BomPart[]>(`/projects/${projectId}/parts`),
  
  createPart: (data: CreatePartDto) =>
    api.post<BomPart>('/parts', data),
};

// ✅ 推荐：统一错误处理
try {
  await bomApi.getParts(id);
} catch (error) {
  toast.error('获取BOM数据失败');
  console.error('BOM fetch error:', error);
}
```

---

## 三、审查检查清单

### 3.1 代码风格检查
- [ ] 符合项目的命名规范
- [ ] 代码格式化（Python: black, 前端: prettier）已应用
- [ ] import语句排序正确（isort）
- [ ] 无不必要的空行或空白字符
- [ ] 单行长度符合规范（Python: 88, TypeScript: 120）

### 3.2 代码质量检查
- [ ] 无硬编码的魔法数字/字符串
- [ ] 无重复代码（DRY原则）
- [ ] 函数长度合理（建议不超过50行）
- [ ] 类/模块职责单一
- [ ] 变量命名清晰有意义

### 3.3 功能完整性检查
- [ ] 所有公开API有文档字符串/注释
- [ ] 边界条件和异常情况已处理
- [ ] 输入参数有验证
- [ ] 返回值类型明确
- [ ] 有适当的日志记录

### 3.4 安全性检查
- [ ] 无SQL注入风险
- [ ] 无XSS风险（前端）
- [ ] 敏感信息不硬编码
- [ ] 权限验证正确实现
- [ ] 文件上传有类型和大小限制

### 3.5 性能检查
- [ ] 数据库查询有适当索引
- [ ] 无N+1查询问题
- [ ] 避免不必要的循环查询
- [ ] 前端列表有分页或虚拟滚动
- [ ] 大文件处理有流式方案

### 3.6 测试覆盖检查
- [ ] 核心业务逻辑有单元测试
- [ ] 公共API有集成测试
- [ ] 关键边界条件有测试
- [ ] 测试代码本身质量合格

---

## 四、审查流程

### 4.1 提交流程

```
开发者 → 本地检查 → 提交PR → 自动化检查 → 代码审查 → 合并
```

### 4.2 PR创建要求

1. **标题格式**：`[类型] 简短描述`
   - 类型：`feat`, `fix`, `refactor`, `docs`, `test`, `chore`
   - 示例：`[feat] 添加BOM导入进度显示`

2. **PR描述模板**：
   ```markdown
   ## 变更描述
   <!-- 简要说明本次变更的内容和目的 -->
   
   ## 变更类型
   - [ ] 新功能
   - [ ] Bug修复
   - [ ] 代码重构
   - [ ] 文档更新
   - [ ] 测试相关
   
   ## 关联Issue
   <!-- 关联的任务或Issue编号 -->
   
   ## 测试说明
   <!-- 如何验证本次变更 -->
   
   ## 注意事项
   <!-- 需要审查者特别关注的内容 -->
   ```

### 4.3 审查者职责

1. **及时响应**：在1个工作日内完成审查
2. **全面检查**：按照检查清单逐项审核
3. **建设性反馈**：提出改进建议，而非单纯指出问题
4. **分类标注**：用标签标注问题严重程度
   - 🔴 **Must Fix**：必须修复才能合并
   - 🟡 **Should Fix**：建议修复
   - 🔵 **Nitpick**：小问题，可选择性接受

### 4.4 审查通过标准

- 无🔴Must Fix级别问题
- 自动化检查全部通过
- 至少1名审查者approve
- 测试覆盖无下降

---

## 五、自动化检查配置

### 5.1 Pre-commit Hook配置

```yaml
# .pre-commit-config.yaml
repos:
  # Python
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        args: [--config=pyproject.toml]

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: [--config=pyproject.toml]

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: [--config=pyproject.toml]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]

  # TypeScript/React
  - repo: https://github.com/prettier/prettier
    rev: 3.0.0
    hooks:
      - id: prettier

  - repo: https://github.com/typescript-eslint/typescript-eslint
    rev: v6.0.0
    hooks:
      - id: typescript-eslint
```

### 5.2 CI/CD检查

```yaml
# .github/workflows/code-review.yml
name: Code Quality Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  python-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest --cov=bom_system tests/
      
      - name: Code style check
        run: |
          black --check bom_system/
          isort --check-only bom_system/
          flake8 bom_system/
          mypy bom_system/

  typescript-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Lint
        run: npm run lint
```

---

## 六、审查反馈模板

### 6.1 审查意见格式

```markdown
### 🔴 [Must Fix] 错误处理缺失

**位置**: `bom_system/services.py:45`

**问题**: 
函数`import_bom`没有处理文件解析失败的情况，可能导致未捕获的异常。

**建议**:
```python
try:
    data = parse_excel(file_path)
except ParseError as e:
    logger.error(f"解析失败: {e}")
    raise BomImportError("文件格式错误") from e
```

---

### 6.2 正面反馈

```markdown
### ✅ 优秀实践

**位置**: `bom_system/api/response.py`

**亮点**:
- 类型提示完整
- 文档字符串清晰
- 错误处理合理

---
```

---

## 七、常见问题处理

### 7.1 审查意见不一致
- 优先参考本规范文档
- 有争议时团队讨论决定
- 记录讨论结论避免重复

### 7.2 大型PR处理
- 拆分为多个小PR
- 或分阶段审查（架构→实现→细节）

### 7.3 紧急修复
- 可先合并后审查
- 需在24小时内补充审查
- 必须有完整的测试覆盖

---

## 八、持续改进

- **季度回顾**：每季度审视规范有效性
- **问题收集**：记录审查中的常见问题
- **工具升级**：跟进工具新版本功能
- **培训分享**：分享优秀实践和典型问题

---

*文档版本: v1.0*
*最后更新: 2026-04-03*
