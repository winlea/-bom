import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Project, Part, Dimension, User } from '@/types';

// 定义状态类型
interface AppState {
  // 用户信息
  user: User | null;
  isAuthenticated: boolean;
  
  // 项目数据
  projects: Project[];
  currentProject: Project | null;
  projectsLoading: boolean;
  projectsError: string | null;
  
  // 零件数据
  parts: Part[];
  currentPart: Part | null;
  partsLoading: boolean;
  partsError: string | null;
  
  // 尺寸数据
  dimensions: Dimension[];
  currentDimension: Dimension | null;
  dimensionsLoading: boolean;
  dimensionsError: string | null;
  
  // UI状态
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  
  // 缓存
  cache: {
    [key: string]: any;
  };
}

// 定义通知类型
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// 定义动作类型
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_PROJECTS_LOADING'; payload: boolean }
  | { type: 'SET_PROJECTS_ERROR'; payload: string | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: number; project: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: number }
  | { type: 'SET_PARTS'; payload: Part[] }
  | { type: 'SET_CURRENT_PART'; payload: Part | null }
  | { type: 'SET_PARTS_LOADING'; payload: boolean }
  | { type: 'SET_PARTS_ERROR'; payload: string | null }
  | { type: 'ADD_PART'; payload: Part }
  | { type: 'UPDATE_PART'; payload: { id: number; part: Partial<Part> } }
  | { type: 'DELETE_PART'; payload: number }
  | { type: 'SET_DIMENSIONS'; payload: Dimension[] }
  | { type: 'SET_CURRENT_DIMENSION'; payload: Dimension | null }
  | { type: 'SET_DIMENSIONS_LOADING'; payload: boolean }
  | { type: 'SET_DIMENSIONS_ERROR'; payload: string | null }
  | { type: 'ADD_DIMENSION'; payload: Dimension }
  | { type: 'UPDATE_DIMENSION'; payload: { id: number; dimension: Partial<Dimension> } }
  | { type: 'DELETE_DIMENSION'; payload: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_CACHE'; payload: { key: string; data: any } }
  | { type: 'CLEAR_CACHE' };

// 初始状态
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  projects: [],
  currentProject: null,
  projectsLoading: false,
  projectsError: null,
  parts: [],
  currentPart: null,
  partsLoading: false,
  partsError: null,
  dimensions: [],
  currentDimension: null,
  dimensionsLoading: false,
  dimensionsError: null,
  sidebarOpen: true,
  theme: 'system',
  notifications: [],
  cache: {},
};

// Reducer函数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_PROJECTS_LOADING':
      return { ...state, projectsLoading: action.payload };
    case 'SET_PROJECTS_ERROR':
      return { ...state, projectsError: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.project }
            : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };
    case 'SET_PARTS':
      return { ...state, parts: action.payload };
    case 'SET_CURRENT_PART':
      return { ...state, currentPart: action.payload };
    case 'SET_PARTS_LOADING':
      return { ...state, partsLoading: action.payload };
    case 'SET_PARTS_ERROR':
      return { ...state, partsError: action.payload };
    case 'ADD_PART':
      return { ...state, parts: [...state.parts, action.payload] };
    case 'UPDATE_PART':
      return {
        ...state,
        parts: state.parts.map(part =>
          part.id === action.payload.id
            ? { ...part, ...action.payload.part }
            : part
        ),
      };
    case 'DELETE_PART':
      return {
        ...state,
        parts: state.parts.filter(part => part.id !== action.payload),
      };
    case 'SET_DIMENSIONS':
      return { ...state, dimensions: action.payload };
    case 'SET_CURRENT_DIMENSION':
      return { ...state, currentDimension: action.payload };
    case 'SET_DIMENSIONS_LOADING':
      return { ...state, dimensionsLoading: action.payload };
    case 'SET_DIMENSIONS_ERROR':
      return { ...state, dimensionsError: action.payload };
    case 'ADD_DIMENSION':
      return { ...state, dimensions: [...state.dimensions, action.payload] };
    case 'UPDATE_DIMENSION':
      return {
        ...state,
        dimensions: state.dimensions.map(dimension =>
          dimension.id === action.payload.id
            ? { ...dimension, ...action.payload.dimension }
            : dimension
        ),
      };
    case 'DELETE_DIMENSION':
      return {
        ...state,
        dimensions: state.dimensions.filter(dimension => dimension.id !== action.payload),
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.payload,
            id: Date.now().toString(),
            timestamp: Date.now(),
            read: false,
          },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      };
    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: action.payload.data,
        },
      };
    case 'CLEAR_CACHE':
      return { ...state, cache: {} };
    default:
      return state;
  }
}

// 创建Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// 自定义Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// 便捷的Action创建器
export const appActions = {
  // 用户相关
  setUser: (user: User | null) => ({ type: 'SET_USER' as const, payload: user }),
  setAuthenticated: (isAuthenticated: boolean) => ({ type: 'SET_AUTHENTICATED' as const, payload: isAuthenticated }),
  
  // 项目相关
  setProjects: (projects: Project[]) => ({ type: 'SET_PROJECTS' as const, payload: projects }),
  setCurrentProject: (project: Project | null) => ({ type: 'SET_CURRENT_PROJECT' as const, payload: project }),
  setProjectsLoading: (loading: boolean) => ({ type: 'SET_PROJECTS_LOADING' as const, payload: loading }),
  setProjectsError: (error: string | null) => ({ type: 'SET_PROJECTS_ERROR' as const, payload: error }),
  addProject: (project: Project) => ({ type: 'ADD_PROJECT' as const, payload: project }),
  updateProject: (id: number, project: Partial<Project>) => ({ type: 'UPDATE_PROJECT' as const, payload: { id, project } }),
  deleteProject: (id: number) => ({ type: 'DELETE_PROJECT' as const, payload: id }),
  
  // 零件相关
  setParts: (parts: Part[]) => ({ type: 'SET_PARTS' as const, payload: parts }),
  setCurrentPart: (part: Part | null) => ({ type: 'SET_CURRENT_PART' as const, payload: part }),
  setPartsLoading: (loading: boolean) => ({ type: 'SET_PARTS_LOADING' as const, payload: loading }),
  setPartsError: (error: string | null) => ({ type: 'SET_PARTS_ERROR' as const, payload: error }),
  addPart: (part: Part) => ({ type: 'ADD_PART' as const, payload: part }),
  updatePart: (id: number, part: Partial<Part>) => ({ type: 'UPDATE_PART' as const, payload: { id, part } }),
  deletePart: (id: number) => ({ type: 'DELETE_PART' as const, payload: id }),
  
  // 尺寸相关
  setDimensions: (dimensions: Dimension[]) => ({ type: 'SET_DIMENSIONS' as const, payload: dimensions }),
  setCurrentDimension: (dimension: Dimension | null) => ({ type: 'SET_CURRENT_DIMENSION' as const, payload: dimension }),
  setDimensionsLoading: (loading: boolean) => ({ type: 'SET_DIMENSIONS_LOADING' as const, payload: loading }),
  setDimensionsError: (error: string | null) => ({ type: 'SET_DIMENSIONS_ERROR' as const, payload: error }),
  addDimension: (dimension: Dimension) => ({ type: 'ADD_DIMENSION' as const, payload: dimension }),
  updateDimension: (id: number, dimension: Partial<Dimension>) => ({ type: 'UPDATE_DIMENSION' as const, payload: { id, dimension } }),
  deleteDimension: (id: number) => ({ type: 'DELETE_DIMENSION' as const, payload: id }),
  
  // UI相关
  toggleSidebar: () => ({ type: 'TOGGLE_SIDEBAR' as const }),
  setTheme: (theme: 'light' | 'dark' | 'system') => ({ type: 'SET_THEME' as const, payload: theme }),
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => ({ type: 'ADD_NOTIFICATION' as const, payload: notification }),
  removeNotification: (id: string) => ({ type: 'REMOVE_NOTIFICATION' as const, payload: id }),
  markNotificationRead: (id: string) => ({ type: 'MARK_NOTIFICATION_READ' as const, payload: id }),
  setCache: (key: string, data: any) => ({ type: 'SET_CACHE' as const, payload: { key, data } }),
  clearCache: () => ({ type: 'CLEAR_CACHE' as const }),
};