# Project Context

## Purpose
BOM（Bill of Materials）管理系统，用于管理项目、零件、尺寸信息，支持BOM导入、报表生成和质量控制等功能。

## Tech Stack
- **Language**: Python, TypeScript
- **Framework**: Flask (后端), React (前端)
- **Database**: PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS + Vite

## Conventions
### Code Style
- Python: PEP 8, 使用 Black 和 isort 进行格式化
- TypeScript: ESLint + Prettier

### Git Flow
- main for production, develop for integration

### Testing
- Python: pytest with >80% coverage required
- TypeScript: Jest for unit tests

## Architecture Notes
- 后端采用分层架构：API层、服务层、仓库层、数据层
- 前端采用组件化架构，使用React hooks和状态管理
- 前后端通过RESTful API进行通信

## Domain Knowledge
- BOM (Bill of Materials): 物料清单，用于记录产品的组成部分
- 尺寸管理: 定义和管理零件的尺寸信息，包括尺寸验证和图片生成
- ODS报表: OpenDocument Spreadsheet格式的检验报告
- 质量控制: 验证零件尺寸是否符合标准，统计合格率
