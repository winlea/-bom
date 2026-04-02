# 尺寸绘制功能架构文档

## 1. 系统架构概述

本系统采用前后端分离架构，前端使用 React + TypeScript 实现，后端使用 Python + FastAPI 实现。尺寸绘制功能作为系统的一个核心模块，负责根据尺寸数据绘制相应的图形。

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     前端层                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐
│  │ DimensionDrawing│  │ DimensionDrawing│  │ Dimension │
│  │   Canvas        │  │   Config        │  │  Drawing  │
│  │  核心绘制组件     │  │  配置组件       │  │  预览组件  │
│  └─────────────────┘  └─────────────────┘  └───────────┘
├─────────────────────────────────────────────────────────┤
│                     API 层                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐
│  │  尺寸绘制 API    │  │  配置管理 API    │  │  数据保存  │
│  │  /api/dimensions/draw │  /api/dimensions/config │  /api/dimensions/save │
│  └─────────────────┘  └─────────────────┘  └───────────┘
├─────────────────────────────────────────────────────────┤
│                     后端层                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐
│  │  尺寸绘制服务    │  │  配置管理服务    │  │  数据存储  │
│  │  DrawingService │  │  ConfigService  │  │  Database │
│  └─────────────────┘  └─────────────────┘  └───────────┘
└─────────────────────────────────────────────────────────┘
```

## 2. 前端架构设计

### 2.1 组件设计

#### 2.1.1 DimensionDrawingCanvas 组件
- **功能**：核心绘制组件，负责根据尺寸数据绘制画布
- **输入**：尺寸数据数组、绘制配置
- **输出**：绘制结果（Canvas 元素）
- **实现**：使用 Canvas API 进行绘制，根据尺寸数量分区画布，绘制不同类型的尺寸数据

#### 2.1.2 DimensionDrawingConfig 组件
- **功能**：配置组件，负责接收用户输入的尺寸数据和配置参数
- **输入**：用户输入的尺寸数据和配置参数
- **输出**：处理后的尺寸数据和配置参数
- **实现**：使用 React 表单组件，支持添加、编辑、删除尺寸数据，支持配置画布大小、边距和间距

#### 2.1.3 DimensionDrawingPreview 组件
- **功能**：预览组件，负责显示绘制结果
- **输入**：绘制结果（Canvas 元素）
- **输出**：可视化预览
- **实现**：使用 React 组件，显示 Canvas 绘制结果，支持放大、缩小、导出等操作

### 2.2 数据流设计

```
用户输入 → DimensionDrawingConfig → DimensionDrawingCanvas → DimensionDrawingPreview
                                 ↓
                            API 调用 → 后端服务 → 数据库存储
```

### 2.3 技术选型

- **框架**：React 18
- **语言**：TypeScript
- **状态管理**：React Context API + useReducer
- **UI 组件**：自定义组件 + Tailwind CSS
- **绘制技术**：Canvas API
- **HTTP 客户端**：Fetch API

## 3. 后端架构设计

### 3.1 服务设计

#### 3.1.1 DrawingService
- **功能**：处理尺寸绘制相关的业务逻辑
- **方法**：
  - `generateDrawing(dimensions, config)`：根据尺寸数据和配置生成绘制结果
  - `validateDimensions(dimensions)`：验证尺寸数据的有效性

#### 3.1.2 ConfigService
- **功能**：管理绘制配置
- **方法**：
  - `getConfig(userId)`：获取用户的绘制配置
  - `saveConfig(userId, config)`：保存用户的绘制配置

#### 3.1.3 DataService
- **功能**：处理数据存储和检索
- **方法**：
  - `saveDrawing(userId, drawingData)`：保存绘制结果
  - `getDrawing(drawingId)`：获取绘制结果
  - `listDrawings(userId)`：列出用户的绘制结果

### 3.2 API 设计

#### 3.2.1 尺寸绘制 API
- **URL**：`/api/dimensions/draw`
- **方法**：POST
- **请求体**：
  ```json
  {
    "dimensions": [
      {
        "type": "diameter",
        "nominalValue": "10",
        "toleranceValue": "0.1",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": ""
      },
      {
        "type": "position",
        "nominalValue": "",
        "toleranceValue": "0.2",
        "upperTolerance": "",
        "lowerTolerance": "",
        "datum": "A"
      },
      {
        "type": "position",
        "nominalValue": "",
        "toleranceValue": "0.1",
        "upperTolerance": "",
        "lowerTolerance": "",
        "datum": "B"
      }
    ],
    "config": {
      "canvasWidth": 800,
      "canvasHeight": 600,
      "padding": 20,
      "spacing": 10,
      "backgroundColor": "#ffffff"
    }
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "imageUrl": "data:image/png;base64,...",
      "drawingId": "12345"
    }
  }
  ```

#### 3.2.2 配置管理 API
- **URL**：`/api/dimensions/config`
- **方法**：GET, POST
- **请求体**：
  ```json
  {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "padding": 20,
    "spacing": 10,
    "backgroundColor": "#ffffff"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "config": {
        "canvasWidth": 800,
        "canvasHeight": 600,
        "padding": 20,
        "spacing": 10,
        "backgroundColor": "#ffffff"
      }
    }
  }
  ```

#### 3.2.3 数据保存 API
- **URL**：`/api/dimensions/save`
- **方法**：POST
- **请求体**：
  ```json
  {
    "drawingId": "12345",
    "dimensions": [...],
    "config": {...},
    "imageUrl": "data:image/png;base64,..."
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "drawingId": "12345",
      "savedAt": "2026-03-23T10:00:00Z"
    }
  }
  ```

### 3.3 数据模型设计

#### 3.3.1 Drawing 表
| 字段名 | 数据类型 | 描述 |
|-------|---------|------|
| id | UUID | 绘制 ID |
| user_id | UUID | 用户 ID |
| name | VARCHAR(255) | 绘制名称 |
| dimensions | JSONB | 尺寸数据 |
| config | JSONB | 绘制配置 |
| image_data | TEXT | 绘制结果（Base64 编码） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### 3.3.2 Config 表
| 字段名 | 数据类型 | 描述 |
|-------|---------|------|
| id | UUID | 配置 ID |
| user_id | UUID | 用户 ID |
| canvas_width | INTEGER | 画布宽度 |
| canvas_height | INTEGER | 画布高度 |
| padding | INTEGER | 边距 |
| spacing | INTEGER | 间距 |
| background_color | VARCHAR(20) | 背景颜色 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3.4 技术选型

- **框架**：FastAPI
- **语言**：Python 3.9+
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy
- **认证**：JWT
- **部署**：Docker

## 4. 实现细节

### 4.1 前端实现

#### 4.1.1 DimensionDrawingCanvas 组件实现

1. **画布分区逻辑**：
   - 根据尺寸数量计算分区数量
   - 计算每个分区的高度：`(canvasHeight - 2 * padding - (partitionCount - 1) * spacing) / partitionCount`
   - 计算每个分区的位置：`padding + i * (partitionHeight + spacing)`

2. **尺寸绘制逻辑**：
   - 对于孔径尺寸：绘制尺寸符号（⌀）、名义值和公差
   - 对于位置度尺寸：绘制基准框，包含位置度符号（⌖）、公差值和基准
   - 确保基准框对齐：第三个位置度的基准框与第二个位置度的基准框左边对齐

3. **Canvas 绘制优化**：
   - 使用 `requestAnimationFrame` 优化绘制性能
   - 缓存绘制结果，避免重复绘制
   - 使用 `measureText` 方法计算文本尺寸，确保文本显示完整

#### 4.1.2 DimensionDrawingConfig 组件实现

1. **尺寸数据管理**：
   - 支持添加、编辑、删除尺寸数据
   - 支持选择尺寸类型（孔径、位置度等）
   - 支持输入名义值、公差值和基准

2. **配置参数管理**：
   - 支持配置画布大小、边距和间距
   - 支持选择背景颜色
   - 提供默认配置值

3. **表单验证**：
   - 验证尺寸数据的有效性
   - 验证配置参数的合理性

#### 4.1.3 DimensionDrawingPreview 组件实现

1. **预览功能**：
   - 显示 Canvas 绘制结果
   - 支持放大、缩小操作
   - 支持导出为图片

2. **交互功能**：
   - 支持点击预览区域查看详细信息
   - 支持拖拽调整预览大小

### 4.2 后端实现

#### 4.2.1 DrawingService 实现

1. **绘制生成**：
   - 接收尺寸数据和配置参数
   - 验证数据有效性
   - 生成绘制结果
   - 返回绘制结果（Base64 编码）

2. **数据验证**：
   - 验证尺寸类型的有效性
   - 验证名义值和公差值的格式
   - 验证基准的格式

#### 4.2.2 ConfigService 实现

1. **配置管理**：
   - 存储用户的绘制配置
   - 读取用户的绘制配置
   - 验证配置参数的合理性

#### 4.2.3 DataService 实现

1. **数据存储**：
   - 保存绘制结果到数据库
   - 读取绘制结果从数据库
   - 管理绘制结果的生命周期

## 5. 性能优化

### 5.1 前端优化

- **Canvas 绘制优化**：
  - 使用 `requestAnimationFrame` 优化绘制性能
  - 缓存绘制结果，避免重复绘制
  - 使用 `measureText` 方法计算文本尺寸，确保文本显示完整

- **状态管理优化**：
  - 使用 React.memo 优化组件渲染
  - 使用 useCallback 优化事件处理函数
  - 使用 useMemo 优化计算结果

- **网络优化**：
  - 使用 HTTP/2 或 HTTP/3
  - 实现请求缓存
  - 优化图片大小和格式

### 5.2 后端优化

- **API 优化**：
  - 使用 FastAPI 的异步处理
  - 实现请求验证和错误处理
  - 优化响应时间

- **数据库优化**：
  - 使用索引优化查询性能
  - 实现缓存机制
  - 优化数据存储结构

- **部署优化**：
  - 使用 Docker 容器化部署
  - 实现负载均衡
  - 优化资源使用

## 6. 安全性考虑

### 6.1 前端安全

- **输入验证**：
  - 验证用户输入的尺寸数据和配置参数
  - 防止 XSS 攻击
  - 防止 CSRF 攻击

- **数据保护**：
  - 保护用户的绘制数据
  - 防止数据泄露

### 6.2 后端安全

- **API 安全**：
  - 实现 JWT 认证
  - 实现 API 速率限制
  - 防止 SQL 注入攻击

- **数据安全**：
  - 加密存储敏感数据
  - 实现数据备份和恢复
  - 防止数据泄露

## 7. 部署与集成

### 7.1 前端部署

- **构建流程**：
  - 使用 Vite 构建前端应用
  - 优化静态资源
  - 部署到 CDN

- **集成方式**：
  - 作为独立应用部署
  - 作为现有应用的模块集成

### 7.2 后端部署

- **构建流程**：
  - 使用 Docker 构建后端服务
  - 优化依赖管理
  - 部署到容器编排平台

- **集成方式**：
  - 作为独立服务部署
  - 与现有后端服务集成

### 7.3 数据库部署

- **部署方式**：
  - 使用 PostgreSQL 数据库
  - 实现数据库备份和恢复
  - 优化数据库性能

## 8. 监控与维护

### 8.1 监控

- **前端监控**：
  - 监控页面加载时间
  - 监控绘制性能
  - 监控用户行为

- **后端监控**：
  - 监控 API 响应时间
  - 监控数据库性能
  - 监控系统资源使用

### 8.2 维护

- **日志管理**：
  - 实现结构化日志
  - 定期清理日志
  - 监控日志异常

- **故障处理**：
  - 实现故障自动检测
  - 实现故障自动恢复
  - 建立故障处理流程

## 9. 总结

本架构设计提供了一个完整的尺寸绘制功能实现方案，包括前端绘制、后端服务和数据存储。通过采用现代技术栈和优化策略，确保了系统的性能、安全性和可维护性。同时，架构设计也考虑了系统的扩展性和集成性，为后续功能的添加和与其他系统的集成提供了基础。