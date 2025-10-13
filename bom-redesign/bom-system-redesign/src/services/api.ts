import { ApiResponse, PaginatedResponse, Project, Part, Dimension, ImportResult, QualificationRateData } from '@/types';

// API基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

// 请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// 错误处理
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `请求失败: ${response.statusText}`,
        errorData
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, '网络请求失败', error);
  }
}

// 分页请求函数
async function paginatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaginatedResponse<T>> {
  const response = await request<PaginatedResponse<T>>(endpoint, options);
  return response.data as PaginatedResponse<T>;
}

// 项目API
export const projectsApi = {
  // 获取项目列表
  getProjects: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return paginatedRequest<Project>(`/projects${query ? `?${query}` : ''}`);
  },

  // 获取单个项目
  getProject: (id: number) => request<Project>(`/projects/${id}`),

  // 创建项目
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),

  // 更新项目
  updateProject: (id: number, project: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),

  // 删除项目
  deleteProject: (id: number) =>
    request<void>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // 获取项目统计
  getProjectStats: () => request<any>('/projects/stats'),
};

// 零件API
export const partsApi = {
  // 获取零件列表
  getParts: (params?: {
    projectId?: number;
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return paginatedRequest<Part>(`/parts${query ? `?${query}` : ''}`);
  },

  // 获取单个零件
  getPart: (id: number) => request<Part>(`/parts/${id}`),

  // 创建零件
  createPart: (part: Omit<Part, 'id' | 'created_at' | 'updated_at'>) =>
    request<Part>('/parts', {
      method: 'POST',
      body: JSON.stringify(part),
    }),

  // 更新零件
  updatePart: (id: number, part: Partial<Part>) =>
    request<Part>(`/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(part),
    }),

  // 删除零件
  deletePart: (id: number) =>
    request<void>(`/parts/${id}`, {
      method: 'DELETE',
    }),

  // 上传零件图片
  uploadPartImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return request<{ imageUrl: string }>(`/parts/${id}/image`, {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  },

  // 获取零件图片
  getPartImage: (id: number) => `${API_BASE_URL}/parts/${id}/image`,
};

// 尺寸API
export const dimensionsApi = {
  // 获取尺寸列表
  getDimensions: (params?: {
    partId?: number;
    projectId?: number;
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    critical?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return paginatedRequest<Dimension>(`/dimensions${query ? `?${query}` : ''}`);
  },

  // 获取单个尺寸
  getDimension: (id: number) => request<Dimension>(`/dimensions/${id}`),

  // 创建尺寸
  createDimension: (dimension: Omit<Dimension, 'id' | 'created_at' | 'updated_at'>) =>
    request<Dimension>('/dimensions', {
      method: 'POST',
      body: JSON.stringify(dimension),
    }),

  // 更新尺寸
  updateDimension: (id: number, dimension: Partial<Dimension>) =>
    request<Dimension>(`/dimensions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dimension),
    }),

  // 删除尺寸
  deleteDimension: (id: number) =>
    request<void>(`/dimensions/${id}`, {
      method: 'DELETE',
    }),

  // 批量创建尺寸
  createDimensions: (dimensions: Omit<Dimension, 'id' | 'created_at' | 'updated_at'>[]) =>
    request<Dimension[]>('/dimensions/batch', {
      method: 'POST',
      body: JSON.stringify(dimensions),
    }),

  // 批量更新尺寸
  updateDimensions: (updates: { id: number; data: Partial<Dimension> }[]) =>
    request<Dimension[]>('/dimensions/batch', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 批量删除尺寸
  deleteDimensions: (ids: number[]) =>
    request<void>('/dimensions/batch', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    }),

  // 生成尺寸图片
  generateDimensionImage: (id: number) => request<{ imageUrl: string }>(`/dimensions/${id}/generate-image`),

  // 批量生成尺寸图片
  generateDimensionImages: (ids: number[]) =>
    request<{ [id: number]: string }>('/dimensions/batch-generate-images', {
      method: 'POST',
      body: JSON.stringify(ids),
    }),

  // 保存Canvas图片
  saveCanvasImages: (images: { id: number; dataUrl: string }[]) =>
    request<void>('/dimensions/images/batch-save-canvas', {
      method: 'POST',
      body: JSON.stringify(images),
    }),
};

// 导入API
export const importApi = {
  // 导入BOM数据
  importBom: (projectId: number, file: File, mapping: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    
    return request<ImportResult>(`/projects/${projectId}/import`, {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  },

  // 预览导入数据
  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return request<any>('/import/preview', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  },

  // 下载导入模板
  downloadTemplate: (type: 'parts' | 'dimensions') =>
    fetch(`${API_BASE_URL}/import/template/${type}`).then(response => {
      if (!response.ok) {
        throw new Error('下载模板失败');
      }
      return response.blob();
    }),
};

// 报表API
export const reportsApi = {
  // 获取合格率数据
  getQualificationRate: (params?: {
    projectId?: number;
    partId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<QualificationRateData[]>(`/reports/qualification-rate${query ? `?${query}` : ''}`);
  },

  // 获取高级合格率数据
  getAdvancedQualificationRate: (params?: {
    projectId?: number;
    partId?: number;
    groupBy?: 'part' | 'dimension_type' | 'date';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<any>(`/reports/advanced-qualification-rate${query ? `?${query}` : ''}`);
  },

  // 获取矩阵合格率数据
  getMatrixQualificationRate: (params?: {
    projectId?: number;
    partIds?: number[];
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    
    const query = searchParams.toString();
    return request<any>(`/reports/matrix-qualification-rate${query ? `?${query}` : ''}`);
  },

  // 导出报表
  exportReport: (type: string, params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    
    const query = searchParams.toString();
    return fetch(`${API_BASE_URL}/reports/export/${type}${query ? `?${query}` : ''}`).then(response => {
      if (!response.ok) {
        throw new Error('导出报表失败');
      }
      return response.blob();
    });
  },
};

// ODS生成器API
export const odsApi = {
  // 生成ODS文档
  generateOds: (data: any) =>
    request<{ downloadUrl: string }>('/ods/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取ODS模板列表
  getTemplates: () => request<any[]>('/ods/templates'),

  // 预览ODS
  previewOds: (data: any) =>
    request<{ html: string }>('/ods/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 用户API
export const usersApi = {
  // 登录
  login: (username: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // 登出
  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  // 获取当前用户信息
  getCurrentUser: () => request<any>('/auth/me'),

  // 刷新Token
  refreshToken: () =>
    request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    }),
};

// 系统配置API
export const systemApi = {
  // 获取系统配置
  getConfig: () => request<any>('/system/config'),

  // 更新系统配置
  updateConfig: (config: any) =>
    request<any>('/system/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // 获取系统信息
  getSystemInfo: () => request<any>('/system/info'),
};

export default {
  projects: projectsApi,
  parts: partsApi,
  dimensions: dimensionsApi,
  import: importApi,
  reports: reportsApi,
  ods: odsApi,
  users: usersApi,
  system: systemApi,
};