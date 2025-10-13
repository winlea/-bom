// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// 项目相关类型
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  created_at?: string;
  updated_at?: string;
  parts_count?: number;
  dimensions_count?: number;
  created_by?: number;
  tags?: string[];
}

// 零件相关类型
export interface Part {
  id: number;
  project_id: number;
  name: string;
  part_number?: string;
  description?: string;
  material?: string;
  weight?: number;
  image_url?: string;
  thumbnail_url?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at?: string;
  updated_at?: string;
  dimensions_count?: number;
  // 兼容旧字段
  imageUrl?: string;
  thumbnailUrl?: string;
  partNumber?: string;
  // 中文兼容字段
  产品编号?: string;
  名称?: string;
  描述?: string;
  材料?: string;
  重量?: number;
}

// 尺寸相关类型
export interface Dimension {
  id: number;
  part_id: number;
  name: string;
  type: 'linear' | 'angular' | 'geometric' | 'surface' | 'position' | 'runout' | 'profile' | 'other';
  nominal_value: number;
  tolerance_upper: number;
  tolerance_lower: number;
  unit: string;
  measurement_method?: string;
  gauge?: string;
  critical: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // 图片相关
  image_url?: string;
  thumbnail_url?: string;
  // 兼容旧字段
  imageUrl?: string;
  thumbnailUrl?: string;
  // 中文兼容字段
  名称?: string;
  类型?: string;
  公称值?: number;
  上公差?: number;
  下公差?: number;
  单位?: string;
  测量方法?: string;
  量具?: string;
  关键尺寸?: boolean;
  备注?: string;
}

// 尺寸类型枚举
export const DimensionType = {
  LINEAR: 'linear',
  ANGULAR: 'angular',
  GEOMETRIC: 'geometric',
  SURFACE: 'surface',
  POSITION: 'position',
  RUNOUT: 'runout',
  PROFILE: 'profile',
  OTHER: 'other',
} as const;

// 几何公差类型
export interface GeometricTolerance {
  id: number;
  dimension_id: number;
  type: 'straightness' | 'flatness' | 'circularity' | 'cylindricity' | 'profile_line' | 'profile_surface' | 'angularity' | 'perpendicularity' | 'parallelism' | 'position' | 'concentricity' | 'symmetry' | 'circular_runout' | 'total_runout';
  value: number;
  datum?: string;
  notes?: string;
}

// 导入相关类型
export interface ImportMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

// 报表相关类型
export interface QualificationRateData {
  part_id: number;
  part_name: string;
  part_number?: string;
  total_dimensions: number;
  qualified_dimensions: number;
  qualification_rate: number;
  critical_dimensions: number;
  critical_qualified: number;
  critical_qualification_rate: number;
}

// ODS生成器相关类型
export interface HeaderData {
  program: string;
  partName: string;
  partNo: string;
  customer: string;
  material: string;
  qbobStandard: string;
  drawingNo: string;
  drawingDate: string;
  version: string;
  stationName: string;
}

export interface DimensionItem {
  id: string;
  name: string;
  type: string;
  nominal: number;
  upper: number;
  lower: number;
  unit: string;
  critical: boolean;
  method?: string;
  gauge?: string;
  notes?: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 表格列配置类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

// 搜索过滤类型
export interface FilterOption {
  label: string;
  value: string;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 语言类型
export type Language = 'zh-CN' | 'en-US';

// 表单验证类型
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: ValidationRule;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
}

// 图表数据类型
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// 系统配置类型
export interface SystemConfig {
  siteName: string;
  logo?: string;
  theme: Theme;
  language: Language;
  pageSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
  exportFormat: 'excel' | 'csv' | 'pdf';
  dateFormat: string;
  timeFormat: string;
  timezone: string;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 路由元数据类型
export interface RouteMeta {
  title: string;
  icon?: React.ReactNode;
  hidden?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
  keepAlive?: boolean;
}

// 文件上传类型
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'done' | 'error';
  percent?: number;
  response?: any;
  error?: any;
}

// 权限相关类型
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

// 日志类型
export interface ActivityLog {
  id: string;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id: number;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}