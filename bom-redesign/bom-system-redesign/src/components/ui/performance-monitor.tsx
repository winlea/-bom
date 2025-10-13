import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Clock, Cpu, HardDrive, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// 性能指标接口
interface PerformanceMetrics {
  // 基本指标
  fps: number;
  memoryUsage: number;
  memoryLimit: number;
  
  // 网络指标
  networkRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  
  // 渲染指标
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  
  // 用户交互指标
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  
  // 自定义指标
  customMetrics: Record<string, number>;
  
  // 时间戳
  timestamp: number;
}

// 性能监控上下文
interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  addCustomMetric: (name: string, value: number) => void;
  getMetricHistory: (metricName: string, duration?: number) => number[];
  exportMetrics: () => string;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// 性能监控提供者组件
export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  // 状态
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    networkRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    renderTime: 0,
    componentCount: 0,
    reRenderCount: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    customMetrics: {},
    timestamp: Date.now(),
  });
  
  // 引用
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalFetchRef = useRef<typeof fetch | null>(null);
  const renderStartTimeRef = useRef<number>(0);
  const componentRenderCountRef = useRef<Record<string, number>>({});
  
  // 计算FPS
  const calculateFPS = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
      return fps;
    }
    
    return null;
  }, []);
  
  // 获取内存使用情况
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        total: memory.totalJSHeapSize,
      };
    }
    return { used: 0, limit: 0, total: 0 };
  }, []);
  
  // 获取Web Vitals指标
  const getWebVitals = useCallback(() => {
    const vitals = {
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
    };
    
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      vitals.firstContentfulPaint = fcpEntry.startTime;
    }
    
    // Largest Contentful Paint
    if ('LargestContentfulPaint' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
    
    // First Input Delay
    if ('PerformanceEventTiming' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if ((entry as any).processingStart) {
            vitals.firstInputDelay = (entry as any).processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
    
    // Cumulative Layout Shift
    if ('LayoutShift' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        vitals.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
    
    return vitals;
  }, []);
  
  // 监控网络请求
  const setupNetworkMonitoring = useCallback(() => {
    if (!originalFetchRef.current) {
      originalFetchRef.current = window.fetch;
    }
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      let response: Response;
      let failed = false;
      
      try {
        response = await originalFetchRef.current!(...args);
      } catch (error) {
        failed = true;
        throw error;
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        networkRequests: prev.networkRequests + 1,
        failedRequests: failed ? prev.failedRequests + 1 : prev.failedRequests,
        avgResponseTime: (prev.avgResponseTime * prev.networkRequests + responseTime) / (prev.networkRequests + 1),
      }));
      
      return response;
    };
  }, []);
  
  // 清理网络监控
  const cleanupNetworkMonitoring = useCallback(() => {
    if (originalFetchRef.current) {
      window.fetch = originalFetchRef.current;
      originalFetchRef.current = null;
    }
  }, []);
  
  // 更新指标
  const updateMetrics = useCallback(() => {
    const fps = calculateFPS();
    if (fps === null) return;
    
    const memory = getMemoryUsage();
    const vitals = getWebVitals();
    
    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        fps,
        memoryUsage: memory.used,
        memoryLimit: memory.limit,
        firstContentfulPaint: vitals.firstContentfulPaint || prev.firstContentfulPaint,
        largestContentfulPaint: vitals.largestContentfulPaint || prev.largestContentfulPaint,
        firstInputDelay: vitals.firstInputDelay || prev.firstInputDelay,
        cumulativeLayoutShift: vitals.cumulativeLayoutShift || prev.cumulativeLayoutShift,
        timestamp: Date.now(),
      };
      
      // 保存到历史记录
      metricsHistoryRef.current.push(newMetrics);
      
      // 限制历史记录长度
      if (metricsHistoryRef.current.length > 100) {
        metricsHistoryRef.current.shift();
      }
      
      return newMetrics;
    });
  }, [calculateFPS, getMemoryUsage, getWebVitals]);
  
  // 动画循环
  const animationLoop = useCallback(() => {
    updateMetrics();
    animationFrameIdRef.current = requestAnimationFrame(animationLoop);
  }, [updateMetrics]);
  
  // 开始监控
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    setupNetworkMonitoring();
    animationFrameIdRef.current = requestAnimationFrame(animationLoop);
    
    // 设置定时更新
    monitoringIntervalRef.current = setInterval(() => {
      updateMetrics();
    }, 1000);
  }, [isMonitoring, setupNetworkMonitoring, animationLoop, updateMetrics]);
  
  // 停止监控
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    cleanupNetworkMonitoring();
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [isMonitoring, cleanupNetworkMonitoring]);
  
  // 重置指标
  const resetMetrics = useCallback(() => {
    setMetrics({
      fps: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      networkRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      renderTime: 0,
      componentCount: 0,
      reRenderCount: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      customMetrics: {},
      timestamp: Date.now(),
    });
    
    metricsHistoryRef.current = [];
    componentRenderCountRef.current = {};
  }, []);
  
  // 添加自定义指标
  const addCustomMetric = useCallback((name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      customMetrics: {
        ...prev.customMetrics,
        [name]: value,
      },
    }));
  }, []);
  
  // 获取指标历史
  const getMetricHistory = useCallback((metricName: string, duration = 10000) => {
    const now = Date.now();
    return metricsHistoryRef.current
      .filter(metric => now - metric.timestamp <= duration)
      .map(metric => {
        if (metricName in metric) {
          return (metric as any)[metricName];
        } else if (metricName in metric.customMetrics) {
          return metric.customMetrics[metricName];
        }
        return 0;
      });
  }, []);
  
  // 导出指标
  const exportMetrics = useCallback(() => {
    return JSON.stringify({
      current: metrics,
      history: metricsHistoryRef.current,
      timestamp: Date.now(),
    }, null, 2);
  }, [metrics]);
  
  // 清理
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);
  
  const value: PerformanceContextType = {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    addCustomMetric,
    getMetricHistory,
    exportMetrics,
  };
  
  return (
    <PerformanceContext.Provider value={value}>
      {children}
      <PerformanceMonitor />
    </PerformanceContext.Provider>
  );
}

// 使用性能监控的Hook
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// 性能监控组件
function PerformanceMonitor() {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring, resetMetrics, exportMetrics } = usePerformance();
  const [open, setOpen] = useState(false);
  
  // 计算内存使用百分比
  const memoryUsagePercentage = metrics.memoryLimit > 0 
    ? (metrics.memoryUsage / metrics.memoryLimit) * 100 
    : 0;
  
  // 获取FPS状态
  const getFpsStatus = () => {
    if (metrics.fps >= 55) return { status: 'good', color: 'bg-green-500', text: '良好' };
    if (metrics.fps >= 30) return { status: 'ok', color: 'bg-yellow-500', text: '一般' };
    return { status: 'poor', color: 'bg-red-500', text: '较差' };
  };
  
  const fpsStatus = getFpsStatus();
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center space-x-2 rounded-full shadow-md",
              isMonitoring ? "bg-green-50 border-green-200 text-green-700" : ""
            )}
          >
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium">{metrics.fps} FPS</span>
            <div className={cn("w-2 h-2 rounded-full", fpsStatus.color)} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>性能监控</span>
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? "监控中" : "已停止"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              实时监控应用性能指标，帮助识别性能瓶颈
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 控制按钮 */}
            <div className="flex space-x-2">
              {!isMonitoring ? (
                <Button onClick={startMonitoring} className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>开始监控</span>
                </Button>
              ) : (
                <Button variant="outline" onClick={stopMonitoring} className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>停止监控</span>
                </Button>
              )}
              <Button variant="outline" onClick={resetMetrics} className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>重置指标</span>
              </Button>
              <Button variant="outline" onClick={() => {
                const data = exportMetrics();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-metrics-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <span>导出数据</span>
              </Button>
            </div>
            
            {/* 性能指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FPS卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>帧率 (FPS)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{metrics.fps}</span>
                    <Badge variant={fpsStatus.status === 'good' ? 'default' : fpsStatus.status === 'ok' ? 'secondary' : 'destructive'}>
                      {fpsStatus.text}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* 内存使用卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Cpu className="h-4 w-4" />
                    <span>内存使用</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="text-sm text-slate-500">
                        {(metrics.memoryLimit / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Progress value={memoryUsagePercentage} className="h-2" />
                    <div className="text-xs text-slate-500 text-right">
                      {memoryUsagePercentage.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 网络请求卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <HardDrive className="h-4 w-4" />
                    <span>网络请求</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">总请求数</span>
                      <span className="text-sm font-medium">{metrics.networkRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">失败数</span>
                      <span className="text-sm font-medium text-red-500">{metrics.failedRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">平均响应时间</span>
                      <span className="text-sm font-medium">{metrics.avgResponseTime.toFixed(2)} ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Web Vitals卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Web Vitals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">FCP</span>
                      <span className="text-sm font-medium">{metrics.firstContentfulPaint.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">LCP</span>
                      <span className="text-sm font-medium">{metrics.largestContentfulPaint.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">FID</span>
                      <span className="text-sm font-medium">{metrics.firstInputDelay.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">CLS</span>
                      <span className="text-sm font-medium">{metrics.cumulativeLayoutShift.toFixed(4)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 自定义指标 */}
            {Object.keys(metrics.customMetrics).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">自定义指标</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(metrics.customMetrics).map(([name, value]) => (
                      <div key={name} className="text-center">
                        <div className="text-sm text-slate-500">{name}</div>
                        <div className="text-lg font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 性能监控Hook
export function usePerformanceMonitor() {
  const { addCustomMetric, getMetricHistory } = usePerformance();
  
  // 记录函数执行时间
  const measureFunction = useCallback((name: string, fn: () => void | Promise<void>) => {
    const startTime = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        addCustomMetric(`${name}_duration`, endTime - startTime);
      });
    } else {
      const endTime = performance.now();
      addCustomMetric(`${name}_duration`, endTime - startTime);
      return result;
    }
  }, [addCustomMetric]);
  
  // 记录组件渲染时间
  const useRenderTime = useCallback((componentName: string) => {
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        addCustomMetric(`${componentName}_render_time`, endTime - startTime);
      };
    }, [componentName, addCustomMetric]);
  }, [addCustomMetric]);
  
  // 记录自定义事件
  const recordEvent = useCallback((eventName: string, value = 1) => {
    addCustomMetric(`event_${eventName}`, value);
  }, [addCustomMetric]);
  
  return {
    measureFunction,
    useRenderTime,
    recordEvent,
    getMetricHistory,
  };
}

export default PerformanceProvider;