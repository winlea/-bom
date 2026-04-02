# 根据gd-t设计一个尺寸添加及管理系统-先提供设计思路 - 架构设计文档

> **生成时间**: 2026-03-21 14:00
> **版本**: v2.0.8
> **架构师**: Super Dev ARCHITECT 专家

---

## 1. 架构概述

### 1.1 系统目标

- **可扩展性**: 支持水平扩展，应对业务增长
- **可用性**: 99.9% 系统可用性
- **性能**: 低延迟、高吞吐
- **安全性**: 端到端安全防护

### 1.2 架构原则

1. **服务拆分**: 按业务领域拆分微服务
2. **数据库分离**: 读写分离、缓存层
3. **异步处理**: 消息队列解耦
4. **监控运维**: 全链路追踪、实时告警

### 1.3 需求到架构的落地映射

- 架构设计必须回到研究报告和 PRD 的关键流程，不能脱离实际需求做空泛微服务模板。
- 技术选型应优先服务于当前阶段交付速度、稳定性、可维护性和团队认知成本。
- 对高频路径优先做低延迟设计，对高风险路径优先做权限、审计、幂等和回滚设计。
- 前后端契约应围绕页面与任务流定义，而不是围绕数据库表结构反推。

---

## 2. 技术栈

### 2.0 语言工程策略

- **业务偏好语言**: 未指定（默认支持主流语言）
- **落地策略**: 文档、Spec 与实现建议优先按偏好语言输出；跨模块场景可混合使用最合适语言。

### 2.1 前端技术栈

| 层级 | 技术选型 | 说明 |
|:---|:---|:---|
| **框架** | React | 组件化开发 |
| **状态管理** | Redux Toolkit / Zustand | 全局状态管理 |
| **UI 框架** | shadcn/ui + Radix UI + Tailwind CSS | 组件库 |
| **构建工具** | Vite | 打包构建 |
| **HTTP 客户端** | Axios | API 请求 |
| **路由** | React Router | 页面路由 |

### 2.2 后端技术栈

| 层级 | 技术选型 | 说明 |
|:---|:---|:---|
| **运行时** | Node | 服务器运行时 |
| **框架** | Express / Fastify / NestJS | Web 框架 |
| **API 规范** | RESTful | 接口设计 |
| **认证** | JWT | Token 认证 |
| **ORM** | Prisma / TypeORM | 数据库 ORM |
| **验证** | Joi/Zod | 数据验证 |



### 2.3 数据存储

| 存储 | 技术选型 | 用途 |
|:---|:---|:---|
| **主数据库** | PostgreSQL 14+ | 持久化存储 |
| **缓存** | Redis | 缓存层 |
| **文件存储** | AWS S3 / 阿里云 OSS | 文件/图片 |
| **搜索** | Elasticsearch | 全文搜索 |

### 2.4 基础设施

| 组件 | 技术选型 | 说明 |
|:---|:---|:---|
| **容器化** | Docker | 应用容器 |
| **编排** | Kubernetes | 容器编排 |
| **CI/CD** | GitHub Actions | 持续集成 |
| **监控** | Prometheus + Grafana | 指标监控 |
| **日志** | ELK Stack | 日志分析 |
| **追踪** | Jaeger | 分布式追踪 |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                       用户层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Web App  │  │ iOS App  │  │ Android  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼────────────┼────────────┼────────────────────────┘
        │            │            │
┌───────┼────────────┼────────────┼────────────────────────┐
│       │    CDN     │            │                      │
│  ┌────▼────────────┴────────┐    │                      │
│  │      负载均衡器          │    │                      │
│  └──────┬────────────────────┘    │                      │
└─────────┼─────────────────────────┼──────────────────────┘
          │                         │
┌─────────┼─────────────────────────┼──────────────────────┐
│         │      API 网关层         │                      │
│  ┌──────▼─────────────────────────▼──┐                   │
│  │  API Gateway (Kong / Nginx)      │                   │
│  │  - 认证授权                     │                   │
│  │  - 限流熔断                     │                   │
│  │  - 路由转发                     │                   │
│  └──────┬────────────────────────────┘                   │
└─────────┼──────────────────────────────────────────────┘
          │
┌─────────┼──────────────────────────────────────────────┐
│         │      服务层                                  │
│  ┌──────▼──────┐  ┌──────────┐  ┌──────────┐          │
│  │   API 服务  │  │ Auth 服务 │  │ User 服务 │  ...    │
│  └─────────────┘  └──────────┘  └──────────┘          │
└─────────┼──────────────────────────────────────────────┘
          │
┌─────────┼──────────────────────────────────────────────┐
│         │      数据层                                  │
│  ┌──────▼──────┐  ┌──────────┐  ┌──────────┐          │
│  │ PostgreSQL  │  │  Redis   │  │   S3     │          │
│  └─────────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 分层架构

#### 3.2.1 表现层 (Presentation Layer)

- **职责**: 用户界面、交互逻辑
- **技术**: React + shadcn/ui + Radix UI + Tailwind CSS
- **组件**:
  - 页面组件 (Pages)
  - 业务组件 (Components)
  - 布局组件 (Layouts)
  - 服务层 (Services)

#### 3.2.2 API 层 (API Layer)

- **职责**: 请求处理、协议转换
- **技术**: Express / Fastify / NestJS
- **组件**:
  - 路由定义
  - 中间件
  - 控制器
  - 请求验证

#### 3.2.3 业务层 (Business Layer)

- **职责**: 业务逻辑、规则引擎
- **组件**:
  - 服务
  - 领域模型
  - 业务规则
  - 工作流引擎

#### 3.2.4 数据访问层 (Data Access Layer)

- **职责**: 数据持久化、缓存管理
- **技术**: Prisma / TypeORM + Redis
- **组件**:
  - Repository
  - DAO
  - Cache Manager
  - Transaction Manager

---

## 4. 核心模块设计

### 4.1 认证授权模块


### 认证模块 (Auth Module)

**职责**:
- 用户注册/登录
- Token 签发/验证
- 密码管理

**接口**:
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify
```

**实现要点**:
- JWT Token 签发使用 RS256
- Refresh Token 存储在 Redis
- 密码使用 bcrypt (cost=10)


### 4.2 用户管理模块


### 用户模块 (User Module)

**职责**:
- 用户信息管理
- 权限验证
- 用户状态管理

**接口**:
```
GET /api/v1/users/me
PATCH /api/v1/users/me
PUT /api/v1/users/me/password
GET /api/v1/users/:id
```

**实现要点**:
- 实现乐观锁防止并发修改
- 使用 RBAC 权限模型
- 敏感操作需要二次验证


### 4.3 业务模块


### 业务模块 (Business Module)

**职责**:
- 核心业务逻辑
- 数据验证
- 业务规则执行

**接口**:
```
GET /api/v1/resources
POST /api/v1/resources
GET /api/v1/resources/:id
PATCH /api/v1/resources/:id
DELETE /api/v1/resources/:id
```

**实现要点**:
- 实现幂等性
- 数据验证使用 Pydantic/Zod
- 审计日志记录所有变更


### 4.4 领域边界与职责拆分

- 认证授权、用户与组织、核心业务流程、通知与异步任务、审计日志应作为明确边界拆分。
- 每个边界需要定义输入输出 DTO、权限要求、状态流转与失败补偿策略。
- 共享能力只沉淀稳定基础设施，不把业务细节塞进“common utils”。
- 高变化模块优先与低变化模块解耦，降低后续迭代成本。

---

## 5. 数据库设计

### 5.1 数据库选型

**主数据库**: PostgreSQL
- 理由: 成熟稳定、功能丰富、ACID 支持
- 版本: PostgreSQL 14+

**缓存**: Redis
- 理由: 高性能、数据结构丰富
- 用途: 会话存储、热点数据缓存

### 5.2 表结构设计


### 表结构

**users 表**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

**sessions 表**:
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);
```

**audit_logs 表**:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```


### 5.3 索引策略


### 索引设计

| 表 | 索引 | 类型 | 用途 |
|:---|:---|:---|:---|
| users | idx_email | B-tree | 邮箱查询 |
| users | idx_username | B-tree | 用户名查询 |
| sessions | idx_user_id | B-tree | 用户会话查询 |
| sessions | idx_token | B-tree | Token 验证 |
| audit_logs | idx_user_id | B-tree | 用户审计日志 |
| audit_logs | idx_created_at | B-tree | 时间范围查询 |

### 查询优化
- 使用连接池 (pgbouncer)
- 实现查询缓存层
- 慢查询监控 (>100ms)


---

## 6. API 设计

### 6.1 RESTful 规范

```
GET    /api/resources          # 列表
GET    /api/resources/:id      # 详情
POST   /api/resources          # 创建
PUT    /api/resources/:id      # 更新
PATCH  /api/resources/:id      # 部分更新
DELETE /api/resources/:id      # 删除
```

### 6.2 核心 API 端点


### API 端点列表

#### 认证相关
```
POST   /api/v1/auth/register        # 用户注册
POST   /api/v1/auth/login           # 用户登录
POST   /api/v1/auth/logout          # 用户登出
POST   /api/v1/auth/refresh         # 刷新 Token
POST   /api/v1/auth/verify          # 验证 Token
POST   /api/v1/auth/forgot-password # 忘记密码
POST   /api/v1/auth/reset-password  # 重置密码
```

#### 用户相关
```
GET    /api/v1/users/me             # 当前用户信息
PATCH  /api/v1/users/me             # 更新用户信息
PUT    /api/v1/users/me/password    # 修改密码
GET    /api/v1/users/:id            # 用户详情 (管理员)
```

#### 业务资源
```
GET    /api/v1/resources            # 资源列表
POST   /api/v1/resources            # 创建资源
GET    /api/v1/resources/:id        # 资源详情
PATCH  /api/v1/resources/:id        # 更新资源
DELETE /api/v1/resources/:id        # 删除资源
```


### 6.3 错误码规范

```
200 OK               # 成功
201 Created          # 创建成功
400 Bad Request      # 请求错误
401 Unauthorized     # 未认证
403 Forbidden        # 无权限
404 Not Found        # 不存在
422 Unprocessable   # 验证失败
500 Server Error     # 服务器错误
```

### 6.4 集成契约与版本策略

- API 必须有版本策略，避免前端页面被无意破坏。
- 外部依赖需定义超时、重试、降级、熔断与错误映射规则。
- DTO 应稳定、可验证、可测试，避免把数据库内部字段直接暴露给前端。
- Webhook、消息、回调类接口要有幂等键与审计记录。

---

## 7. 安全设计

### 7.1 认证机制

- **方式**: JWT (JSON Web Token)
- **流程**:
  1. 用户登录获取 Token
  2. 请求携带 Token
  3. 服务验证 Token
  4. Token 过期重新获取

### 7.2 授权机制

- **模型**: RBAC (Role-Based Access Control)
- **角色**:
  - 超级管理员
  - 管理员
  - 普通用户
  - 访客

### 7.3 数据加密

- **传输加密**: TLS 1.3
- **存储加密**: AES-256
- **密码加密**: bcrypt

### 7.4 安全防护

- **SQL 注入**: 参数化查询
- **XSS**: 输出转义
- **CSRF**: Token 验证
- **限流**: 令牌桶算法

---

## 8. 性能设计

### 8.1 性能目标

| 指标 | 目标值 |
|:---|:---|
| **API 响应时间** | P50 < 100ms, P95 < 200ms, P99 < 500ms |
| **页面加载时间** | FCP < 1.5s, LCP < 2.5s |
| **并发用户** | 1000+ 并发 |
| **QPS** | 5000+ QPS |

### 8.2 性能优化策略


### 后端优化

**数据库优化**:
- 连接池配置 (max_connections=100)
- 查询结果缓存 (Redis)
- 慢查询日志优化

**应用层优化**:
- 异步 I/O 处理
- 请求限流 (100 req/s)
- 响应压缩 (gzip)

**前端优化**:
- 代码分割和懒加载
- 资源 CDN 加速
- 图片优化和缓存

### 监控指标
- API 响应时间 P95 < 200ms
- 数据库查询时间 < 50ms
- 错误率 < 0.1%


### 8.3 容错与降级策略

- 关键写操作采用幂等机制，防止重复提交。
- 第三方依赖异常时优先降级核心功能而不是整体瘫痪。
- 任务流中断后应支持恢复、补偿或人工处理入口。
- 前端异常要给出可执行的下一步，不允许只显示技术报错。

---

## 9. 可观测性

### 9.1 监控指标

- **系统指标**: CPU、内存、磁盘、网络
- **应用指标**: QPS、响应时间、错误率
- **业务指标**: DAU、订单量、转化率

### 9.2 日志规范

- **格式**: JSON
- **级别**: DEBUG, INFO, WARN, ERROR
- **内容**: 时间戳、级别、消息、上下文

### 9.3 告警策略

- **告警渠道**: 邮件、钉钉、PagerDuty
- **告警级别**: P0-P4
- **响应时间**: P0 < 15min, P1 < 30min

### 9.4 审计与可追溯性

- 对登录、权限变更、关键数据修改、批量操作、发布/审批动作保留审计轨迹。
- 日志结构需支持按用户、资源、请求链路、时间窗口检索。
- 前后端共享 trace/request id，确保问题能跨层定位。
- 质量门禁输出应沉淀为可回溯产物，而不是一次性终端信息。

---

## 10. 部署架构

### 10.1 容器化

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

### 10.2 Kubernetes 部署


### Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

### ConfigMap 配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  NODE_ENV: "production"
```

### Secret 配置

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  url: "postgresql://user:pass@host:5432/db"
```

### Ingress 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: app-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
```


### 10.3 CI/CD 流程

```yaml
# GitHub Actions
name: CI/CD
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: kubectl apply -f k8s/
```

### 10.4 发布与回滚策略

- 使用分环境发布策略，至少区分本地、测试、预发布、生产。
- 高风险变更建议灰度、特性开关或分批发布。
- 发布说明需包含数据库变更、兼容性影响、回滚步骤与监控关注项。
- 回滚方案必须在上线前验证，不接受“出问题再看”。

---

## 附录

### A. 技术选型对比


### 技术选型对比

| 方面 | 选择 | 备选 | 理由 |
|:---|:---|:---|:---|
| 前端框架 | React | Vue, Angular | 生态成熟，组件丰富 |
| 状态管理 | Redux Toolkit | Zustand, Jotai | 标准方案，文档完善 |
| UI 库 | Ant Design | Material-UI | 设计规范完善 |
| 后端框架 | Express | Fastify, Koa | 灵活，中间件丰富 |
| ORM | Prisma | TypeORM, Sequelize | 类型安全，迁移友好 |
| 数据库 | PostgreSQL | MySQL, MongoDB | 功能强大，JSON 支持 |
| 缓存 | Redis | Memcached | 功能丰富，持久化 |


### B. 架构决策记录 (ADR)


### 架构决策记录 (ADR)

#### ADR-001: 选择 JWT 作为认证方案

**状态**: 已接受

**背景**: 需要无状态的认证机制支持分布式部署

**决策**: 使用 JWT (JSON Web Token) 进行身份验证

**理由**:
- 无状态，易于横向扩展
- 标准化，跨语言支持
- 包含声明，减少数据库查询

**后果**:
- 优点: 无需 Session 存储，支持分布式
- 缺点: Token 无法撤销，需要短过期时间

#### ADR-002: 选择 PostgreSQL 作为主数据库

**状态**: 已接受

**背景**: 需要关系型数据库支持复杂查询

**决策**: 使用 PostgreSQL 作为主数据库

**理由**:
- 功能强大，支持 JSON、全文搜索
- ACID 完整，数据一致性强
- 开源免费，社区活跃

**后果**:
- 优点: 数据完整性好，扩展性强
- 缺点: 配置相对复杂


### C. 参考文档

- [12-Factor App](https://12factor.net/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [REST API Design](https://restfulapi.net/)
