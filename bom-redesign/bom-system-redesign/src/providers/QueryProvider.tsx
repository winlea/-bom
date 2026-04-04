// React Query Provider - 全局数据获取管理
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// 创建 QueryClient 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 全局默认配置
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000, // 10分钟缓存
      retry: 2, // 失败重试2次
      refetchOnWindowFocus: false, // 窗口获取焦点时不自动刷新
    },
    mutations: {
      // 突变操作默认配置
      retry: 1,
    },
  },
});

// Query Provider 组件
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// 导出 QueryClient 实例供外部使用
export { QueryClient };
