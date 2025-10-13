import { useEffect, useCallback, useState } from 'react';
import { useAppContext, appActions } from '@/contexts/app-context';
import api from '@/services/api';
import { Project, Part, Dimension, SearchParams } from '@/types';

// 项目管理Hook
export function useProjects() {
  const { state, dispatch } = useAppContext();
  const [searchParams, setSearchParams] = useState<SearchParams>({});

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    dispatch(appActions.setProjectsLoading(true));
    dispatch(appActions.setProjectsError(null));
    
    try {
      const response = await api.projects.getProjects(searchParams);
      dispatch(appActions.setProjects(response.items));
    } catch (error) {
      dispatch(appActions.setProjectsError(error instanceof Error ? error.message : '获取项目列表失败'));
    } finally {
      dispatch(appActions.setProjectsLoading(false));
    }
  }, [dispatch, searchParams]);

  // 创建项目
  const createProject = useCallback(async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.projects.createProject(project);
      dispatch(appActions.addProject(response.data));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '创建成功',
        message: `项目 "${project.name}" 已创建`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '创建项目失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 更新项目
  const updateProject = useCallback(async (id: number, project: Partial<Project>) => {
    try {
      const response = await api.projects.updateProject(id, project);
      dispatch(appActions.updateProject(id, project));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '更新成功',
        message: `项目 "${project.name}" 已更新`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '更新失败',
        message: error instanceof Error ? error.message : '更新项目失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 删除项目
  const deleteProject = useCallback(async (id: number) => {
    try {
      await api.projects.deleteProject(id);
      dispatch(appActions.deleteProject(id));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '删除成功',
        message: '项目已删除',
      }));
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '删除失败',
        message: error instanceof Error ? error.message : '删除项目失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 初始化加载
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects: state.projects,
    loading: state.projectsLoading,
    error: state.projectsError,
    currentProject: state.currentProject,
    searchParams,
    setSearchParams,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject: (project: Project | null) => dispatch(appActions.setCurrentProject(project)),
  };
}

// 零件管理Hook
export function useParts(projectId?: number) {
  const { state, dispatch } = useAppContext();
  const [searchParams, setSearchParams] = useState<SearchParams>({ projectId });

  // 获取零件列表
  const fetchParts = useCallback(async () => {
    dispatch(appActions.setPartsLoading(true));
    dispatch(appActions.setPartsError(null));
    
    try {
      const response = await api.parts.getParts(searchParams);
      dispatch(appActions.setParts(response.items));
    } catch (error) {
      dispatch(appActions.setPartsError(error instanceof Error ? error.message : '获取零件列表失败'));
    } finally {
      dispatch(appActions.setPartsLoading(false));
    }
  }, [dispatch, searchParams]);

  // 创建零件
  const createPart = useCallback(async (part: Omit<Part, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.parts.createPart(part);
      dispatch(appActions.addPart(response.data));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '创建成功',
        message: `零件 "${part.name}" 已创建`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '创建零件失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 更新零件
  const updatePart = useCallback(async (id: number, part: Partial<Part>) => {
    try {
      const response = await api.parts.updatePart(id, part);
      dispatch(appActions.updatePart(id, part));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '更新成功',
        message: `零件 "${part.name}" 已更新`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '更新失败',
        message: error instanceof Error ? error.message : '更新零件失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 删除零件
  const deletePart = useCallback(async (id: number) => {
    try {
      await api.parts.deletePart(id);
      dispatch(appActions.deletePart(id));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '删除成功',
        message: '零件已删除',
      }));
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '删除失败',
        message: error instanceof Error ? error.message : '删除零件失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 上传零件图片
  const uploadPartImage = useCallback(async (id: number, file: File) => {
    try {
      const response = await api.parts.uploadPartImage(id, file);
      dispatch(appActions.updatePart(id, { image_url: response.data.imageUrl }));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '上传成功',
        message: '零件图片已上传',
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '上传失败',
        message: error instanceof Error ? error.message : '上传零件图片失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 初始化加载
  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  return {
    parts: state.parts,
    loading: state.partsLoading,
    error: state.partsError,
    currentPart: state.currentPart,
    searchParams,
    setSearchParams,
    fetchParts,
    createPart,
    updatePart,
    deletePart,
    uploadPartImage,
    setCurrentPart: (part: Part | null) => dispatch(appActions.setCurrentPart(part)),
  };
}

// 尺寸管理Hook
export function useDimensions(partId?: number, projectId?: number) {
  const { state, dispatch } = useAppContext();
  const [searchParams, setSearchParams] = useState<SearchParams>({ partId, projectId });

  // 获取尺寸列表
  const fetchDimensions = useCallback(async () => {
    dispatch(appActions.setDimensionsLoading(true));
    dispatch(appActions.setDimensionsError(null));
    
    try {
      const response = await api.dimensions.getDimensions(searchParams);
      dispatch(appActions.setDimensions(response.items));
    } catch (error) {
      dispatch(appActions.setDimensionsError(error instanceof Error ? error.message : '获取尺寸列表失败'));
    } finally {
      dispatch(appActions.setDimensionsLoading(false));
    }
  }, [dispatch, searchParams]);

  // 创建尺寸
  const createDimension = useCallback(async (dimension: Omit<Dimension, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.dimensions.createDimension(dimension);
      dispatch(appActions.addDimension(response.data));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '创建成功',
        message: `尺寸 "${dimension.name}" 已创建`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '创建尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 更新尺寸
  const updateDimension = useCallback(async (id: number, dimension: Partial<Dimension>) => {
    try {
      const response = await api.dimensions.updateDimension(id, dimension);
      dispatch(appActions.updateDimension(id, dimension));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '更新成功',
        message: `尺寸 "${dimension.name}" 已更新`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '更新失败',
        message: error instanceof Error ? error.message : '更新尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 删除尺寸
  const deleteDimension = useCallback(async (id: number) => {
    try {
      await api.dimensions.deleteDimension(id);
      dispatch(appActions.deleteDimension(id));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '删除成功',
        message: '尺寸已删除',
      }));
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '删除失败',
        message: error instanceof Error ? error.message : '删除尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 批量创建尺寸
  const createDimensions = useCallback(async (dimensions: Omit<Dimension, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const response = await api.dimensions.createDimensions(dimensions);
      response.data.forEach(dimension => dispatch(appActions.addDimension(dimension)));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '批量创建成功',
        message: `已创建 ${dimensions.length} 个尺寸`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '批量创建失败',
        message: error instanceof Error ? error.message : '批量创建尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 批量更新尺寸
  const updateDimensions = useCallback(async (updates: { id: number; data: Partial<Dimension> }[]) => {
    try {
      const response = await api.dimensions.updateDimensions(updates);
      response.data.forEach(dimension => {
        const update = updates.find(u => u.id === dimension.id);
        if (update) {
          dispatch(appActions.updateDimension(dimension.id, update.data));
        }
      });
      dispatch(appActions.addNotification({
        type: 'success',
        title: '批量更新成功',
        message: `已更新 ${updates.length} 个尺寸`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '批量更新失败',
        message: error instanceof Error ? error.message : '批量更新尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 批量删除尺寸
  const deleteDimensions = useCallback(async (ids: number[]) => {
    try {
      await api.dimensions.deleteDimensions(ids);
      ids.forEach(id => dispatch(appActions.deleteDimension(id)));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '批量删除成功',
        message: `已删除 ${ids.length} 个尺寸`,
      }));
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '批量删除失败',
        message: error instanceof Error ? error.message : '批量删除尺寸失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 生成尺寸图片
  const generateDimensionImage = useCallback(async (id: number) => {
    try {
      const response = await api.dimensions.generateDimensionImage(id);
      dispatch(appActions.updateDimension(id, { image_url: response.data.imageUrl }));
      dispatch(appActions.addNotification({
        type: 'success',
        title: '生成成功',
        message: '尺寸图片已生成',
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '生成失败',
        message: error instanceof Error ? error.message : '生成尺寸图片失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 批量生成尺寸图片
  const generateDimensionImages = useCallback(async (ids: number[]) => {
    try {
      const response = await api.dimensions.generateDimensionImages(ids);
      Object.entries(response.data).forEach(([id, imageUrl]) => {
        dispatch(appActions.updateDimension(Number(id), { image_url: imageUrl }));
      });
      dispatch(appActions.addNotification({
        type: 'success',
        title: '批量生成成功',
        message: `已生成 ${ids.length} 个尺寸图片`,
      }));
      return response.data;
    } catch (error) {
      dispatch(appActions.addNotification({
        type: 'error',
        title: '批量生成失败',
        message: error instanceof Error ? error.message : '批量生成尺寸图片失败',
      }));
      throw error;
    }
  }, [dispatch]);

  // 初始化加载
  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  return {
    dimensions: state.dimensions,
    loading: state.dimensionsLoading,
    error: state.dimensionsError,
    currentDimension: state.currentDimension,
    searchParams,
    setSearchParams,
    fetchDimensions,
    createDimension,
    updateDimension,
    deleteDimension,
    createDimensions,
    updateDimensions,
    deleteDimensions,
    generateDimensionImage,
    generateDimensionImages,
    setCurrentDimension: (dimension: Dimension | null) => dispatch(appActions.setCurrentDimension(dimension)),
  };
}

// 通知管理Hook
export function useNotifications() {
  const { state, dispatch } = useAppContext();

  const addNotification = useCallback((notification: Omit<any, 'id' | 'timestamp'>) => {
    dispatch(appActions.addNotification(notification));
  }, [dispatch]);

  const removeNotification = useCallback((id: string) => {
    dispatch(appActions.removeNotification(id));
  }, [dispatch]);

  const markNotificationRead = useCallback((id: string) => {
    dispatch(appActions.markNotificationRead(id));
  }, [dispatch]);

  const clearAllNotifications = useCallback(() => {
    state.notifications.forEach(notification => {
      dispatch(appActions.removeNotification(notification.id));
    });
  }, [dispatch, state.notifications]);

  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
  };
}

// 主题管理Hook
export function useTheme() {
  const { state, dispatch } = useAppContext();

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch(appActions.setTheme(theme));
    localStorage.setItem('bom-theme', theme);
    
    // 应用主题到DOM
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [dispatch]);

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('bom-theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (state.theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme, state.theme]);

  return {
    theme: state.theme,
    setTheme,
  };
}

// 侧边栏管理Hook
export function useSidebar() {
  const { state, dispatch } = useAppContext();

  const toggleSidebar = useCallback(() => {
    dispatch(appActions.toggleSidebar());
    localStorage.setItem('bom-sidebar-open', String(!state.sidebarOpen));
  }, [dispatch, state.sidebarOpen]);

  // 初始化侧边栏状态
  useEffect(() => {
    const savedSidebarOpen = localStorage.getItem('bom-sidebar-open') === 'true';
    if (savedSidebarOpen !== state.sidebarOpen) {
      dispatch(appActions.setSidebarOpen?.(savedSidebarOpen));
    }
  }, [dispatch, state.sidebarOpen]);

  return {
    sidebarOpen: state.sidebarOpen,
    toggleSidebar,
  };
}

// 缓存管理Hook
export function useCache() {
  const { state, dispatch } = useAppContext();

  const setCache = useCallback((key: string, data: any) => {
    dispatch(appActions.setCache(key, data));
  }, [dispatch]);

  const getCache = useCallback((key: string) => {
    return state.cache[key];
  }, [state.cache]);

  const clearCache = useCallback(() => {
    dispatch(appActions.clearCache());
  }, [dispatch]);

  return {
    cache: state.cache,
    setCache,
    getCache,
    clearCache,
  };
}