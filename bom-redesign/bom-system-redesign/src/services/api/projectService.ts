/**
 * Project Service - 项目相关 API 服务
 */
import { apiClient } from './client';
import { PROJECTS, PROJECT_DETAIL, PROJECT_IMPORT, REPORT_GENERATE } from '@/constants/api';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  supplier_name?: string;
  customer_name?: string;
  created_at?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  supplier_name?: string;
  customer_name?: string;
  [key: string]: unknown;
}

export const projectService = {
  /**
   * 获取项目列表
   */
  async list(params?: { q?: string; limit?: number }): Promise<{ items: Project[] }> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return apiClient.get(`${PROJECTS}${query ? `?${query}` : ''}`);
  },

  /**
   * 获取单个项目
   */
  async get(id: number): Promise<Project> {
    return apiClient.get(PROJECT_DETAIL(id));
  },

  /**
   * 创建项目
   */
  async create(data: CreateProjectDto): Promise<Project> {
    return apiClient.post(PROJECTS, data);
  },

  /**
   * 更新项目
   */
  async update(id: number, data: Partial<CreateProjectDto>): Promise<Project> {
    return apiClient.put(PROJECT_DETAIL(id), data);
  },

  /**
   * 删除项目
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(PROJECT_DETAIL(id));
  },

  /**
   * 导入 BOM
   */
  async importBom(
    projectId: number,
    file: File
  ): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    return apiClient.uploadFile(PROJECT_IMPORT, file, { project_id: String(projectId) });
  },

  /**
   * 生成报表
   */
  async generateReport(projectId: number): Promise<Blob> {
    return apiClient.post(REPORT_GENERATE, { project_id: projectId });
  },
};
