# GD&T 尺寸添加及管理系统设计思路

## 1. 核心需求分析

### 1.1 尺寸公差逻辑及规则
- **GD&T 符号系统**：支持几何公差符号（位置度、垂直度、平行度等）
- **公差计算规则**：根据GD&T标准计算公差带
- **尺寸验证逻辑**：验证尺寸是否符合公差要求
- **基准系统**：支持多基准参考系统

### 1.2 尺寸添加功能
- **尺寸创建**：支持添加线性尺寸、角度尺寸、几何公差
- **尺寸编辑**：修改尺寸属性、公差值、基准等
- **尺寸删除**：移除不需要的尺寸
- **尺寸复制**：快速复制相似尺寸

### 1.3 显示与Excel导出
- **尺寸可视化**：在CAD图纸上显示尺寸标注
- **尺寸列表**：表格形式展示所有尺寸
- **Excel导出**：将尺寸数据导出为Excel文件
- **模板定制**：支持自定义Excel导出模板

## 2. 系统架构设计

### 2.1 技术栈
- **前端**：React + TypeScript + Tailwind CSS
- **后端**：Flask + PostgreSQL
- **数据存储**：PostgreSQL + Redis
- **文件处理**：OpenPyXL (Excel导出)

### 2.2 核心模块
1. **尺寸管理模块**：处理尺寸的CRUD操作
2. **公差计算模块**：实现GD&T公差计算逻辑
3. **Excel导出模块**：生成Excel格式的尺寸报告
4. **可视化模块**：在前端展示尺寸标注

## 3. 数据库设计

### 3.1 核心表结构

#### dimensions 表
| 字段名 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| `id` | `UUID` | 尺寸ID |
| `part_id` | `UUID` | 零件ID (外键) |
| `dimension_name` | `VARCHAR(255)` | 尺寸名称 |
| `dimension_value` | `DECIMAL(10,4)` | 尺寸值 |
| `tolerance_type` | `VARCHAR(50)` | 公差类型 (对称/不对称/极限) |
| `tolerance_upper` | `DECIMAL(10,4)` | 上偏差 |
| `tolerance_lower` | `DECIMAL(10,4)` | 下偏差 |
| `gd_t_symbol` | `VARCHAR(50)` | GD&T符号 |
| `datum_a` | `VARCHAR(50)` | 基准A |
| `datum_b` | `VARCHAR(50)` | 基准B |
| `datum_c` | `VARCHAR(50)` | 基准C |
| `created_at` | `TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | 更新时间 |

#### dimension_inspections 表
| 字段名 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| `id` | `UUID` | 检验ID |
| `dimension_id` | `UUID` | 尺寸ID (外键) |
| `inspection_value` | `DECIMAL(10,4)` | 检验值 |
| `is_pass` | `BOOLEAN` | 是否合格 |
| `inspected_at` | `TIMESTAMP` | 检验时间 |
| `inspector` | `VARCHAR(100)` | 检验员 |

## 4. 尺寸公差逻辑实现

### 4.1 公差类型
1. **对称公差**：±T
2. **不对称公差**：+T1/-T2
3. **极限公差**：最小值/最大值

### 4.2 GD&T符号支持
- **形状公差**：直线度、平面度、圆度、圆柱度
- **方向公差**：平行度、垂直度、倾斜度
- **位置公差**：位置度、同轴度、对称度
- **跳动公差**：圆跳动、全跳动

### 4.3 公差验证逻辑
```python
def validate_dimension(dimension_value, tolerance_type, tolerance_upper, tolerance_lower):
    if tolerance_type == "对称":
        min_value = dimension_value - tolerance_upper
        max_value = dimension_value + tolerance_upper
    elif tolerance_type == "不对称":
        min_value = dimension_value - tolerance_lower
        max_value = dimension_value + tolerance_upper
    elif tolerance_type == "极限":
        min_value = tolerance_lower
        max_value = tolerance_upper
    else:
        return False
    
    return min_value <= dimension_value <= max_value
```

## 5. 尺寸添加功能设计

### 5.1 尺寸添加流程
1. **选择零件**：从零件列表中选择要添加尺寸的零件
2. **填写尺寸信息**：
   - 尺寸名称
   - 尺寸值
   - 公差类型
   - 公差值
   - GD&T符号（可选）
   - 基准（可选）
3. **验证尺寸**：系统自动验证尺寸是否符合公差规则
4. **保存尺寸**：将尺寸信息保存到数据库

### 5.