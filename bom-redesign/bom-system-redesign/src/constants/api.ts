/**
 * API端点集中管理
 * 避免在代码中硬编码API路径
 */

// API基础路径
export const API_BASE = '/api';

// 项目相关
export const PROJECTS = `${API_BASE}/projects`;
export const PROJECT_DETAIL = (id: number) => `${API_BASE}/projects/${id}`;
export const PROJECT_IMPORT = `${API_BASE}/import/bom`;

// 零件相关
export const PARTS = `${API_BASE}/parts`;
export const PART_DETAIL = (id: number) => `${API_BASE}/parts/${id}`;
export const PART_IMAGE = (id: number) => `${API_BASE}/parts/${id}/image`;

// ODS相关
export const ODS_PREVIEW = (partId: number) => `${API_BASE}/ods/preview/${partId}`;
export const ODS_GENERATE = `${API_BASE}/ods/generate`;

// PSW相关
export const PSW_GENERATE = `${API_BASE}/psw/generate`;

// 过程能力分析
export const PROCESS_CAPABILITY_GENERATE = `${API_BASE}/process-capability/generate`;

// 图纸变更
export const DRAWING_CHANGES = `${API_BASE}/drawing-changes`;

// 报表
export const REPORT_GENERATE = `${API_BASE}/reports/generate`;

// 仪表板
export const DASHBOARD_RECENT = `${API_BASE}/dashboard/recent`;

// 图片相关
export const UPLOAD_BASE64 = `${API_BASE}/upload/base64`;
export const UPLOAD_URL = `${API_BASE}/upload/url`;
export const DOWNLOAD_IMAGE = (recordId: number) => `${API_BASE}/download/${recordId}`;

// 尺寸相关
export const DIMENSIONS = `${API_BASE}/dimensions`;
export const DIMENSION_DETAIL = (id: number) => `${API_BASE}/dimensions/${id}`;
