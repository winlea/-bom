# 前后端API契约定义

## 1. 项目管理 API

### 1.1 获取项目列表
- **URL**: `/api/projects`
- **Method**: `GET`
- **Parameters**:
  - `q` (可选): 搜索关键词
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": [
      {
        "id": 1,
        "name": "项目名称",
        "description": "项目描述",
        "status": "created",
        "created_at": "2023-06-15T00:00:00Z"
      }
    ]
  }
  ```

### 1.2 获取单个项目
- **URL**: `/api/projects/{projectId}`
- **Method**: `GET`
- **Parameters**:
  - `projectId`: 项目ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "id": 1,
      "name": "项目名称",
      "description": "项目描述",
      "status": "created",
      "created_at": "2023-06-15T00:00:00Z"
    }
  }
  ```

### 1.3 创建项目
- **URL**: `/api/projects`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "项目名称",
    "description": "项目描述"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Created",
    "data": {
      "id": 1,
      "name": "项目名称",
      "description": "项目描述",
      "status": "created",
      "created_at": "2023-06-15T00:00:00Z"
    }
  }
  ```

### 1.4 更新项目
- **URL**: `/api/projects/{projectId}`
- **Method**: `PUT`
- **Parameters**:
  - `projectId`: 项目ID
- **Body**:
  ```json
  {
    "name": "新项目名称",
    "description": "新项目描述"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "id": 1,
      "name": "新项目名称",
      "description": "新项目描述",
      "status": "created",
      "created_at": "2023-06-15T00:00:00Z"
    }
  }
  ```

### 1.5 删除项目
- **URL**: `/api/projects/{projectId}`
- **Method**: `DELETE`
- **Parameters**:
  - `projectId`: 项目ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success"
  }
  ```

## 2. BOM 管理 API

### 2.1 获取零件列表
- **URL**: `/api/items`
- **Method**: `GET`
- **Parameters**:
  - `q` (可选): 搜索关键词
  - `limit` (可选): 限制数量，默认20
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "items": [
        {
          "id": 1,
          "part_number": "PART-001",
          "part_name": "零件名称",
          "created_at": "2023-06-15T00:00:00Z"
        }
      ]
    }
  }
  ```

### 2.2 导入 BOM
- **URL**: `/api/import/bom`
- **Method**: `POST`
- **Body** (multipart/form-data):
  - `file`: 文件
  - `project_id` (可选): 项目ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "created": 10,
      "errors": [],
      "status": "success"
    }
  }
  ```

### 2.3 上传图片（Base64）
- **URL**: `/api/upload/base64`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "part_number": "PART-001",
    "image_data": "base64编码的图片数据",
    "part_name": "零件名称"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "id": 1,
      "status": "success"
    }
  }
  ```

### 2.4 上传图片（URL）
- **URL**: `/api/upload/url`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "part_number": "PART-001",
    "url": "图片URL",
    "part_name": "零件名称"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "id": 1,
      "status": "success"
    }
  }
  ```

### 2.5 下载图片
- **URL**: `/api/download/{recordId}`
- **Method**: `GET`
- **Parameters**:
  - `recordId`: 记录ID
- **Response**:
  - 图片文件

## 3. 维度管理 API

### 3.1 获取维度列表
- **URL**: `/api/dimensions`
- **Method**: `GET`
- **Parameters**:
  - `partId` (可选): 零件ID
  - `projectId` (可选): 项目ID
  - `search` (可选): 搜索关键词
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": [
      {
        "id": 1,
        "groupNo": 1,
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1",
        "notes": "备注",
        "imageUrl": "图片URL"
      }
    ],
    "total": 1
  }
  ```

### 3.2 创建维度
- **URL**: `/api/dimensions/projects/{projectId}`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "groupNo": 1,
    "dimensionType": "linear",
    "nominalValue": "10.0",
    "toleranceValue": "0.1",
    "upperTolerance": "0.05",
    "lowerTolerance": "-0.05",
    "datum": "A",
    "characteristic": "尺寸1",
    "notes": "备注"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Created",
    "data": {
      "id": 1,
      "groupNo": 1,
      "dimensionType": "linear",
      "nominalValue": "10.0",
      "toleranceValue": "0.1",
      "upperTolerance": "0.05",
      "lowerTolerance": "-0.05",
      "datum": "A",
      "characteristic": "尺寸1",
      "notes": "备注"
    }
  }
  ```

### 3.3 更新维度
- **URL**: `/api/dimensions/{dimensionId}`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "nominalValue": "10.5",
    "toleranceValue": "0.15"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "id": 1,
      "groupNo": 1,
      "dimensionType": "linear",
      "nominalValue": "10.5",
      "toleranceValue": "0.15",
      "upperTolerance": "0.05",
      "lowerTolerance": "-0.05",
      "datum": "A",
      "characteristic": "尺寸1",
      "notes": "备注"
    }
  }
  ```

### 3.4 删除维度
- **URL**: `/api/dimensions/{dimensionId}`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Success"
  }
  ```

## 4. 错误响应格式

所有API错误响应都遵循以下格式：

```json
{
  "success": false,
  "message": "错误消息",
  "errors": [
    "错误详情1",
    "错误详情2"
  ]
}
```

### 常见错误状态码
- `400`: 请求错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误
