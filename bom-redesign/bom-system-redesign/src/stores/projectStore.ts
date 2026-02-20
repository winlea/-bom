import { create } from 'zustand';
import projectService, { Project, CreateProjectRequest } from '../services/api/projectService';

// 项目状态接口
interface ProjectState {
  // 状态
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // 操作
  getProjects: (q?: string) => Promise<void>;
  getProject: (projectId: number) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  updateProject: (projectId: number, data: Partial<CreateProjectRequest>) => Promise<Project>;
  deleteProject: (projectId: number) => Promise<void>;
  clearCurrentProject: () => void;
  clearError: () => void;
}

// 创建项目状态存储
export const useProjectStore = create<ProjectState>((set, get) => ({
  // 初始状态
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  
  // 获取项目列表
  getProjects: async (q?: string) => {
    try {
      set({ loading: true, error: null });
      const projects = await projectService.getProjects(q);
      set({ projects, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to get projects', loading: false });
    }
  },
  
  // 获取单个项目
  getProject: async (projectId: number) => {
    try {
      set({ loading: true, error: null });
      const project = await projectService.getProject(projectId);
      set({ currentProject: project, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to get project', loading: false });
    }
  },
  
  // 创建项目
  createProject: async (data: CreateProjectRequest) => {
    try {
      set({ loading: true, error: null });
      const project = await projectService.createProject(data);
      const { projects } = get();
      set({ 
        projects: [...projects, project], 
        currentProject: project, 
        loading: false 
      });
      return project;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create project', loading: false });
      throw error;
    }
  },
  
  // 更新项目
  updateProject: async (projectId: number, data: Partial<CreateProjectRequest>) => {
    try {
      set({ loading: true, error: null });
      const updatedProject = await projectService.updateProject(projectId, data);
      const { projects, currentProject } = get();
      const updatedProjects = projects.map(project => 
        project.id === projectId ? updatedProject : project
      );
      set({ 
        projects: updatedProjects, 
        currentProject: currentProject?.id === projectId ? updatedProject : currentProject, 
        loading: false 
      });
      return updatedProject;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update project', loading: false });
      throw error;
    }
  },
  
  // 删除项目
  deleteProject: async (projectId: number) => {
    try {
      set({ loading: true, error: null });
      await projectService.deleteProject(projectId);
      const { projects } = get();
      set({ 
        projects: projects.filter(project => project.id !== projectId), 
        currentProject: null, 
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete project', loading: false });
    }
  },
  
  // 清除当前项目
  clearCurrentProject: () => {
    set({ currentProject: null });
  },
  
  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
