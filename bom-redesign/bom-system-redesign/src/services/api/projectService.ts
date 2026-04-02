import axiosInstance from './axiosInstance';

// 项目类型定义
export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  created_at?: string;
  parts_count?: number;
}

// 创建项目请求参数
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

// 项目服务类
class ProjectService {
  /**
   * 获取项目列表
   * @param q 搜索关键词
   * @returns 项目列表
   */
  async getProjects(q?: string): Promise<Project[]> {
    const params = q ? { q } : {};
    const response = await axiosInstance.get('/projects', { params });
    return response as unknown as Project[];
  }

  /**
   * 获取单个项目
   * @param projectId 项目ID
   * @returns 项目详情
   */
  async getProject(projectId: number): Promise<Project> {
    const response = await axiosInstance.get(`/projects/${projectId}`);
    return response.data || response;
  }

  /**
   * 创建项目
   * @param data 项目数据
   * @returns 创建的项目
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await axiosInstance.post('/projects', data);
    return response.data || response;
  }

  /**
   * 更新项目
   * @param projectId 项目ID
   * @param data 项目数据
   * @returns 更新后的项目
   */
  async updateProject(projectId: number, data: Partial<CreateProjectRequest>): Promise<Project> {
    const response = await axiosInstance.put(`/projects/${projectId}`, data);
    return response.data || response;
  }

  /**
   * 删除项目
   * @param projectId 项目ID
   * @returns 是否删除成功
   */
  async deleteProject(projectId: number): Promise<boolean> {
    await axiosInstance.delete(`/projects/${projectId}`);
    return true;
  }

  /**
   * 获取项目的零件
   * @param projectId 项目ID
   * @returns 零件列表
   */
  async getProjectParts(projectId: number): Promise<any[]> {
    const response = await axiosInstance.get(`/parts?project_id=${projectId}`);
    return response as unknown as any[];
  }
}

// 导出项目服务实例
export default new ProjectService();
