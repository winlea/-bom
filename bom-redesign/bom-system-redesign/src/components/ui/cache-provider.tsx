import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Cache, Database, HardDrive, RefreshCw, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// 缓存项接口
export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiry: number | null; // 过期时间，null表示永不过期
  tags: string[]; // 缓存标签，用于批量清除
  size: number; // 缓存项大小（字节）
  accessCount: number; // 访问次数
  lastAccessed: number; // 最后访问时间
}

// 缓存统计接口
export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestItem: number;
  newestItem: number;
  mostAccessed: { key: string; count: number } | null;
}

// 缓存配置接口
export interface CacheConfig {
  maxSize: number; // 最大缓存大小（字节）
  maxItems: number; // 最大缓存项数量
  defaultTTL: number; // 默认过期时间（毫秒）
  enableCompression: boolean; // 是否启用压缩
  enablePersistence: boolean; // 是否启用持久化
  persistenceKey: string; // 持久化存储键名
  cleanupInterval: number; // 清理间隔（毫秒）
  enableLRU: boolean; // 是否启用LRU淘汰策略
}

// 默认缓存配置
const defaultCacheConfig: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 1000,
  defaultTTL: 30 * 60 * 1000, // 30分钟
  enableCompression: false,
  enablePersistence: true,
  persistenceKey: 'bom-cache',
  cleanupInterval: 5 * 60 * 1000, // 5分钟
  enableLRU: true,
};

// 缓存上下文接口
interface CacheContextType {
  // 基本操作
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T, options?: CacheSetOptions) => void;
  remove: (key: string) => boolean;
  has: (key: string) => boolean;
  clear: () => void;
  
  // 批量操作
  getMultiple: <T>(keys: string[]) => Record<string, T>;
  setMultiple: <T>(items: Record<string, T>, options?: CacheSetOptions) => void;
  removeMultiple: (keys: string[]) => number;
  
  // 标签操作
  getByTag: <T>(tag: string) => Record<string, T>;
  removeByTag: (tag: string) => number;
  
  // 统计信息
  getStats: () => CacheStats;
  getKeys: (pattern?: string) => string[];
  getItem: <T>(key: string) => CacheItem<T> | null;
  
  // 配置
  updateConfig: (config: Partial<CacheConfig>) => void;
  getConfig: () => CacheConfig;
  
  // 工具方法
  estimateSize: (value: any) => number;
  exportCache: () => string;
  importCache: (data: string) => boolean;
}

// 缓存设置选项
interface CacheSetOptions {
  ttl?: number; // 过期时间（毫秒）
  tags?: string[]; // 缓存标签
  priority?: number; // 优先级（用于LRU）
}

// 缓存上下文
const CacheContext = createContext<CacheContextType | undefined>(undefined);

// 缓存提供者组件
export function CacheProvider({ 
  children, 
  config = defaultCacheConfig 
}: {
  children: ReactNode;
  config?: Partial<CacheConfig>;
}) {
  // 状态
  const [cacheItems, setCacheItems] = useState<Record<string, CacheItem>>({});
  const [cacheConfig, setCacheConfig] = useState<CacheConfig>({ ...defaultCacheConfig, ...config });
  const [stats, setStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    oldestItem: 0,
    newestItem: 0,
    mostAccessed: null,
  });

  // 引用
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hitCountRef = useRef(0);
  const missCountRef = useRef(0);

  // 估算对象大小（字节）
  const estimateSize = useCallback((value: any): number => {
    if (value === null || value === undefined) return 0;
    
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16编码，每个字符2字节
    }
    
    if (typeof value === 'number') {
      return 8; // 64位数字
    }
    
    if (typeof value === 'boolean') {
      return 4;
    }
    
    if (value instanceof Date) {
      return 24; // Date对象大小
    }
    
    if (Array.isArray(value)) {
      return value.reduce((size, item) => size + estimateSize(item), 0) + 24; // 数组开销
    }
    
    if (typeof value === 'object') {
      let size = 24; // 对象开销
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          size += key.length * 2; // 键名大小
          size += estimateSize(value[key]); // 值大小
        }
      }
      return size;
    }
    
    return 0;
  }, []);

  // 从本地存储加载缓存
  const loadFromPersistence = useCallback(() => {
    if (!cacheConfig.enablePersistence) return;
    
    try {
      const persistedData = localStorage.getItem(cacheConfig.persistenceKey);
      if (persistedData) {
        const data = JSON.parse(persistedData);
        
        // 检查过期项
        const now = Date.now();
        const validItems: Record<string, CacheItem> = {};
        
        for (const key in data) {
          const item = data[key] as CacheItem;
          if (!item.expiry || item.expiry > now) {
            validItems[key] = item;
          }
        }
        
        setCacheItems(validItems);
      }
    } catch (error) {
      console.error('Failed to load cache from persistence:', error);
    }
  }, [cacheConfig.enablePersistence, cacheConfig.persistenceKey]);

  // 保存缓存到本地存储
  const saveToPersistence = useCallback(() => {
    if (!cacheConfig.enablePersistence) return;
    
    try {
      localStorage.setItem(cacheConfig.persistenceKey, JSON.stringify(cacheItems));
    } catch (error) {
      console.error('Failed to save cache to persistence:', error);
    }
  }, [cacheConfig.enablePersistence, cacheConfig.persistenceKey, cacheItems]);

  // 清理过期项
  const cleanupExpiredItems = useCallback(() => {
    const now = Date.now();
    const newItems: Record<string, CacheItem> = {};
    
    for (const key in cacheItems) {
      const item = cacheItems[key];
      if (!item.expiry || item.expiry > now) {
        newItems[key] = item;
      }
    }
    
    if (Object.keys(newItems).length !== Object.keys(cacheItems).length) {
      setCacheItems(newItems);
    }
  }, [cacheItems]);

  // LRU淘汰策略
  const evictLRU = useCallback(() => {
    if (!cacheConfig.enableLRU) return;
    
    // 按最后访问时间排序
    const sortedItems = Object.entries(cacheItems).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );
    
    // 计算需要删除的项数
    const itemsToRemove = Math.max(
      0,
      Object.keys(cacheItems).length - cacheConfig.maxItems
    );
    
    if (itemsToRemove > 0) {
      const newItems: Record<string, CacheItem> = {};
      
      // 保留最新的项
      for (let i = itemsToRemove; i < sortedItems.length; i++) {
        const [key, item] = sortedItems[i];
        newItems[key] = item;
      }
      
      setCacheItems(newItems);
    }
  }, [cacheItems, cacheConfig.enableLRU, cacheConfig.maxItems]);

  // 大小淘汰策略
  const evictBySize = useCallback(() => {
    let totalSize = 0;
    for (const key in cacheItems) {
      totalSize += cacheItems[key].size;
    }
    
    if (totalSize <= cacheConfig.maxSize) return;
    
    // 按优先级和访问时间排序
    const sortedItems = Object.entries(cacheItems).sort(
      ([, a], [, b]) => {
        // 先按访问次数排序
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        // 再按最后访问时间排序
        return a.lastAccessed - b.lastAccessed;
      }
    );
    
    const newItems: Record<string, CacheItem> = {};
    let currentSize = 0;
    
    // 从最新到最旧添加项，直到达到大小限制
    for (let i = sortedItems.length - 1; i >= 0; i--) {
      const [key, item] = sortedItems[i];
      
      if (currentSize + item.size <= cacheConfig.maxSize) {
        newItems[key] = item;
        currentSize += item.size;
      }
    }
    
    setCacheItems(newItems);
  }, [cacheItems, cacheConfig.maxSize]);

  // 更新统计信息
  const updateStats = useCallback(() => {
    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;
    let mostAccessed: { key: string; count: number } | null = null;
    
    for (const key in cacheItems) {
      const item = cacheItems[key];
      totalSize += item.size;
      
      if (item.timestamp < oldestItem) {
        oldestItem = item.timestamp;
      }
      
      if (item.timestamp > newestItem) {
        newestItem = item.timestamp;
      }
      
      if (!mostAccessed || item.accessCount > mostAccessed.count) {
        mostAccessed = { key, count: item.accessCount };
      }
    }
    
    const totalHits = hitCountRef.current;
    const totalMisses = missCountRef.current;
    const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;
    
    setStats({
      totalItems: Object.keys(cacheItems).length,
      totalSize,
      hitCount: totalHits,
      missCount: totalMisses,
      hitRate,
      oldestItem,
      newestItem,
      mostAccessed,
    });
  }, [cacheItems]);

  // 获取缓存项
  const get = useCallback(<T,>(key: string): T | null => {
    const item = cacheItems[key];
    
    if (!item) {
      missCountRef.current++;
      updateStats();
      return null;
    }
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      delete cacheItems[key];
      setCacheItems({ ...cacheItems });
      missCountRef.current++;
      updateStats();
      return null;
    }
    
    // 更新访问信息
    item.accessCount++;
    item.lastAccessed = Date.now();
    setCacheItems({ ...cacheItems });
    
    hitCountRef.current++;
    updateStats();
    
    return item.value as T;
  }, [cacheItems, updateStats]);

  // 设置缓存项
  const set = useCallback(<T,>(key: string, value: T, options: CacheSetOptions = {}) => {
    const now = Date.now();
    const size = estimateSize(value);
    
    const item: CacheItem<T> = {
      key,
      value,
      timestamp: now,
      expiry: options.ttl ? now + options.ttl : null,
      tags: options.tags || [],
      size,
      accessCount: 0,
      lastAccessed: now,
    };
    
    const newItems = { ...cacheItems };
    newItems[key] = item;
    
    setCacheItems(newItems);
    
    // 触发淘汰策略
    setTimeout(() => {
      evictLRU();
      evictBySize();
    }, 0);
  }, [cacheItems, estimateSize, evictLRU, evictBySize]);

  // 删除缓存项
  const remove = useCallback((key: string): boolean => {
    if (!cacheItems[key]) return false;
    
    const newItems = { ...cacheItems };
    delete newItems[key];
    setCacheItems(newItems);
    
    return true;
  }, [cacheItems]);

  // 检查缓存项是否存在
  const has = useCallback((key: string): boolean => {
    const item = cacheItems[key];
    
    if (!item) return false;
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      delete cacheItems[key];
      setCacheItems({ ...cacheItems });
      return false;
    }
    
    return true;
  }, [cacheItems]);

  // 清空缓存
  const clear = useCallback(() => {
    setCacheItems({});
  }, []);

  // 批量获取
  const getMultiple = useCallback(<T,>(keys: string[]): Record<string, T> => {
    const result: Record<string, T> = {};
    
    for (const key of keys) {
      const value = get<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    }
    
    return result;
  }, [get]);

  // 批量设置
  const setMultiple = useCallback(<T,>(items: Record<string, T>, options: CacheSetOptions = {}) => {
    for (const key in items) {
      set(key, items[key], options);
    }
  }, [set]);

  // 批量删除
  const removeMultiple = useCallback((keys: string[]): number => {
    let removed = 0;
    
    for (const key of keys) {
      if (remove(key)) {
        removed++;
      }
    }
    
    return removed;
  }, [remove]);

  // 按标签获取
  const getByTag = useCallback(<T,>(tag: string): Record<string, T> => {
    const result: Record<string, T> = {};
    
    for (const key in cacheItems) {
      const item = cacheItems[key];
      
      if (item.tags.includes(tag)) {
        result[key] = item.value as T;
      }
    }
    
    return result;
  }, [cacheItems]);

  // 按标签删除
  const removeByTag = useCallback((tag: string): number => {
    let removed = 0;
    const newItems: Record<string, CacheItem> = {};
    
    for (const key in cacheItems) {
      const item = cacheItems[key];
      
      if (!item.tags.includes(tag)) {
        newItems[key] = item;
      } else {
        removed++;
      }
    }
    
    setCacheItems(newItems);
    
    return removed;
  }, [cacheItems]);

  // 获取所有键
  const getKeys = useCallback((pattern?: string): string[] => {
    const keys = Object.keys(cacheItems);
    
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }, [cacheItems]);

  // 获取缓存项详情
  const getItem = useCallback(<T,>(key: string): CacheItem<T> | null => {
    return cacheItems[key] as CacheItem<T> || null;
  }, [cacheItems]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<CacheConfig>) => {
    setCacheConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // 获取配置
  const getConfig = useCallback((): CacheConfig => {
    return { ...cacheConfig };
  }, [cacheConfig]);

  // 导出缓存
  const exportCache = useCallback((): string => {
    return JSON.stringify({
      items: cacheItems,
      config: cacheConfig,
      stats,
      timestamp: Date.now(),
    });
  }, [cacheItems, cacheConfig, stats]);

  // 导入缓存
  const importCache = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.items) {
        setCacheItems(parsed.items);
      }
      
      if (parsed.config) {
        setCacheConfig(parsed.config);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadFromPersistence();
    
    // 设置清理定时器
    if (cacheConfig.cleanupInterval > 0) {
      cleanupIntervalRef.current = setInterval(() => {
        cleanupExpiredItems();
      }, cacheConfig.cleanupInterval);
    }
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [loadFromPersistence, cleanupExpiredItems, cacheConfig.cleanupInterval]);

  // 保存到持久化存储
  useEffect(() => {
    saveToPersistence();
  }, [cacheItems, saveToPersistence]);

  // 更新统计信息
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  const value: CacheContextType = {
    get,
    set,
    remove,
    has,
    clear,
    getMultiple,
    setMultiple,
    removeMultiple,
    getByTag,
    removeByTag,
    getStats: () => stats,
    getKeys,
    getItem,
    updateConfig,
    getConfig,
    estimateSize,
    exportCache,
    importCache,
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
      <CacheMonitor />
    </CacheContext.Provider>
  );
}

// 使用缓存的Hook
export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}

// 缓存监控组件
function CacheMonitor() {
  const { getStats, getConfig, clear, exportCache, importCache, updateConfig } = useCache();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(getConfig());
  const [importData, setImportData] = useState('');
  
  const stats = getStats();
  const sizePercentage = config.maxSize > 0 ? (stats.totalSize / config.maxSize) * 100 : 0;
  const itemsPercentage = config.maxItems > 0 ? (stats.totalItems / config.maxItems) * 100 : 0;
  
  const handleImport = () => {
    if (importCache(importData)) {
      setImportData('');
      setOpen(false);
    }
  };
  
  const handleExport = () => {
    const data = exportCache();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleConfigUpdate = () => {
    updateConfig(config);
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">缓存</span>
            <Badge variant="outline" className="ml-1">
              {stats.totalItems}
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Cache className="h-5 w-5" />
              <span>缓存管理</span>
            </DialogTitle>
            <DialogDescription>
              查看和管理应用缓存数据
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">统计信息</TabsTrigger>
              <TabsTrigger value="config">配置</TabsTrigger>
              <TabsTrigger value="operations">操作</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <HardDrive className="h-4 w-4" />
                      <span>缓存大小</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-sm text-slate-500">
                          {(config.maxSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <Progress value={sizePercentage} className="h-2" />
                      <div className="text-xs text-slate-500 text-right">
                        {sizePercentage.toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>缓存项数</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          {stats.totalItems} 项
                        </span>
                        <span className="text-sm text-slate-500">
                          {config.maxItems} 项
                        </span>
                      </div>
                      <Progress value={itemsPercentage} className="h-2" />
                      <div className="text-xs text-slate-500 text-right">
                        {itemsPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>命中率</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(stats.hitRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-500">
                        {stats.hitCount} 次命中 / {stats.hitCount + stats.missCount} 次请求
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>缓存时间</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">最旧项</span>
                        <span className="text-sm font-medium">
                          {stats.oldestItem > 0 ? new Date(stats.oldestItem).toLocaleString() : '无'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">最新项</span>
                        <span className="text-sm font-medium">
                          {stats.newestItem > 0 ? new Date(stats.newestItem).toLocaleString() : '无'}
                        </span>
                      </div>
                      {stats.mostAccessed && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">最常访问</span>
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {stats.mostAccessed.key} ({stats.mostAccessed.count} 次)
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">缓存配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSize">最大缓存大小 (MB)</Label>
                      <Input
                        id="maxSize"
                        type="number"
                        value={(config.maxSize / 1024 / 1024).toFixed(2)}
                        onChange={(e) => setConfig({
                          ...config,
                          maxSize: parseFloat(e.target.value) * 1024 * 1024
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxItems">最大缓存项数</Label>
                      <Input
                        id="maxItems"
                        type="number"
                        value={config.maxItems}
                        onChange={(e) => setConfig({
                          ...config,
                          maxItems: parseInt(e.target.value, 10)
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultTTL">默认过期时间 (分钟)</Label>
                      <Input
                        id="defaultTTL"
                        type="number"
                        value={config.defaultTTL / 1000 / 60}
                        onChange={(e) => setConfig({
                          ...config,
                          defaultTTL: parseFloat(e.target.value) * 1000 * 60
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cleanupInterval">清理间隔 (分钟)</Label>
                      <Input
                        id="cleanupInterval"
                        type="number"
                        value={config.cleanupInterval / 1000 / 60}
                        onChange={(e) => setConfig({
                          ...config,
                          cleanupInterval: parseFloat(e.target.value) * 1000 * 60
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enablePersistence"
                        checked={config.enablePersistence}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          enablePersistence: checked
                        })}
                      />
                      <Label htmlFor="enablePersistence">启用持久化</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableLRU"
                        checked={config.enableLRU}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          enableLRU: checked
                        })}
                      />
                      <Label htmlFor="enableLRU">启用LRU淘汰</Label>
                    </div>
                  </div>
                  
                  <Button onClick={handleConfigUpdate} className="w-full">
                    更新配置
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">缓存操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={clear} className="flex items-center space-x-2">
                      <Trash2 className="h-4 w-4" />
                      <span>清空缓存</span>
                    </Button>
                    
                    <Button variant="outline" onClick={handleExport} className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4" />
                      <span>导出缓存</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="importData">导入缓存数据</Label>
                    <Textarea
                      id="importData"
                      placeholder="粘贴缓存数据JSON..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={5}
                    />
                    <Button onClick={handleImport} disabled={!importData.trim()}>
                      导入
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 缓存Hook，用于组件级别的缓存
export function useCacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { get, set } = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    ttl,
    tags,
    enabled = true,
    staleWhileRevalidate = true,
  } = options;
  
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      set(key, result, { ttl, tags });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, key, ttl, tags, set]);
  
  useEffect(() => {
    // 先尝试从缓存获取
    const cachedData = get<T>(key);
    
    if (cachedData !== null) {
      setData(cachedData);
      
      // 如果启用staleWhileRevalidate，则在后台更新数据
      if (staleWhileRevalidate) {
        fetchData();
      }
    } else {
      // 没有缓存数据，直接获取
      fetchData();
    }
  }, [key, get, staleWhileRevalidate, fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

export default CacheProvider;