import { useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Search, Filter, Download, Calendar, User, FileText, Settings, Activity, Eye, ChevronDown, ChevronUp, RefreshCw, AlertCircle, CheckCircle, XCircle, Info, Clock, File, Database, Trash2, Edit, Plus, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 审计日志类型
export type AuditLog = {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

// 审计日志过滤器
export type AuditLogFilter = {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  action?: string;
  resource?: string;
  module?: string;
  success?: boolean;
  severity?: string;
  search?: string;
};

// 审计日志组件属性
interface AuditLogViewerProps {
  logs: AuditLog[];
  users: Array<{ id: string; username: string; fullName: string }>;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onExport?: (logs: AuditLog[], format: 'csv' | 'xlsx' | 'json') => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  className?: string;
  children?: ReactNode;
}

// 默认日志
const DEFAULT_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date('2023-11-01T10:30:00'),
    userId: 'user1',
    username: 'admin',
    action: 'create',
    resource: 'project',
    resourceId: 'proj1',
    resourceName: '汽车BOM项目',
    details: { name: '汽车BOM项目', description: '汽车零部件BOM管理系统' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    module: 'project',
    severity: 'medium',
  },
  {
    id: '2',
    timestamp: new Date('2023-11-01T11:15:00'),
    userId: 'user2',
    username: 'engineer1',
    action: 'update',
    resource: 'part',
    resourceId: 'part1',
    resourceName: '发动机零件',
    details: { name: '发动机零件', category: '发动机', material: '铝合金' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    module: 'part',
    severity: 'low',
  },
  {
    id: '3',
    timestamp: new Date('2023-11-01T12:00:00'),
    userId: 'user1',
    username: 'admin',
    action: 'delete',
    resource: 'dimension',
    resourceId: 'dim1',
    resourceName: '发动机尺寸',
    details: { length: 100, width: 80, height: 60 },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    module: 'dimension',
    severity: 'high',
  },
  {
    id: '4',
    timestamp: new Date('2023-11-01T14:30:00'),
    userId: 'user3',
    username: 'viewer1',
    action: 'export',
    resource: 'part',
    resourceId: '',
    resourceName: '零件数据导出',
    details: { format: 'xlsx', count: 150 },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    success: true,
    module: 'part',
    severity: 'low',
  },
  {
    id: '5',
    timestamp: new Date('2023-11-01T16:45:00'),
    userId: 'user2',
    username: 'engineer1',
    action: 'import',
    resource: 'part',
    resourceId: '',
    resourceName: '零件数据导入',
    details: { format: 'csv', count: 200, errors: 5 },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: false,
    errorMessage: '导入过程中有5条记录失败',
    module: 'part',
    severity: 'medium',
  },
];

// 操作类型
const ACTION_TYPES = [
  { value: 'create', label: '创建' },
  { value: 'read', label: '查看' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出' },
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
  { value: 'assign', label: '分配' },
  { value: 'revoke', label: '撤销' },
];

// 资源类型
const RESOURCE_TYPES = [
  { value: 'project', label: '项目' },
  { value: 'part', label: '零件' },
  { value: 'dimension', label: '尺寸' },
  { value: 'user', label: '用户' },
  { value: 'role', label: '角色' },
  { value: 'permission', label: '权限' },
  { value: 'system', label: '系统' },
];

// 模块类型
const MODULE_TYPES = [
  { value: 'project', label: '项目管理' },
  { value: 'part', label: '零件管理' },
  { value: 'dimension', label: '尺寸管理' },
  { value: 'user', label: '用户管理' },
  { value: 'role', label: '角色管理' },
  { value: 'system', label: '系统管理' },
];

// 严重程度
const SEVERITY_TYPES = [
  { value: 'low', label: '低', color: 'bg-green-500' },
  { value: 'medium', label: '中', color: 'bg-yellow-500' },
  { value: 'high', label: '高', color: 'bg-orange-500' },
  { value: 'critical', label: '严重', color: 'bg-red-500' },
];

// 审计日志查看器组件
export function AuditLogViewer({
  logs = DEFAULT_LOGS,
  users = [],
  isLoading = false,
  onRefresh,
  onExport,
  onLoadMore,
  hasMore = false,
  className,
  children,
}: AuditLogViewerProps) {
  // 状态
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(logs);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  
  // 过滤日志
  useEffect(() => {
    let filtered = [...logs];
    
    // 日期范围过滤
    if (filter.dateRange) {
      filtered = filtered.filter(log => 
        log.timestamp >= filter.dateRange!.start && 
        log.timestamp <= filter.dateRange!.end
      );
    }
    
    // 用户过滤
    if (filter.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }
    
    // 操作过滤
    if (filter.action) {
      filtered = filtered.filter(log => log.action === filter.action);
    }
    
    // 资源过滤
    if (filter.resource) {
      filtered = filtered.filter(log => log.resource === filter.resource);
    }
    
    // 模块过滤
    if (filter.module) {
      filtered = filtered.filter(log => log.module === filter.module);
    }
    
    // 成功状态过滤
    if (filter.success !== undefined) {
      filtered = filtered.filter(log => log.success === filter.success);
    }
    
    // 严重程度过滤
    if (filter.severity) {
      filtered = filtered.filter(log => log.severity === filter.severity);
    }
    
    // 搜索过滤
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.username.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.resourceName.toLowerCase().includes(searchLower) ||
        log.module.toLowerCase().includes(searchLower)
      );
    }
    
    // 按时间倒序排序
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setFilteredLogs(filtered);
  }, [logs, filter]);
  
  // 获取操作标签
  const getActionLabel = useCallback((action: string) => {
    const actionType = ACTION_TYPES.find(type => type.value === action);
    return actionType ? actionType.label : action;
  }, []);
  
  // 获取资源标签
  const getResourceLabel = useCallback((resource: string) => {
    const resourceType = RESOURCE_TYPES.find(type => type.value === resource);
    return resourceType ? resourceType.label : resource;
  }, []);
  
  // 获取模块标签
  const getModuleLabel = useCallback((module: string) => {
    const moduleType = MODULE_TYPES.find(type => type.value === module);
    return moduleType ? moduleType.label : module;
  }, []);
  
  // 获取严重程度标签
  const getSeverityLabel = useCallback((severity: string) => {
    const severityType = SEVERITY_TYPES.find(type => type.value === severity);
    return severityType ? severityType.label : severity;
  }, []);
  
  // 获取严重程度颜色
  const getSeverityColor = useCallback((severity: string) => {
    const severityType = SEVERITY_TYPES.find(type => type.value === severity);
    return severityType ? severityType.color : 'bg-gray-500';
  }, []);
  
  // 获取操作图标
  const getActionIcon = useCallback((action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4" />;
      case 'read': return <Eye className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'import': return <Upload className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'login': return <User className="h-4 w-4" />;
      case 'logout': return <User className="h-4 w-4" />;
      case 'assign': return <CheckCircle className="h-4 w-4" />;
      case 'revoke': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  }, []);
  
  // 切换日志展开状态
  const toggleLogExpansion = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);
  
  // 查看日志详情
  const viewLogDetails = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  }, []);
  
  // 应用过滤器
  const applyFilter = useCallback(() => {
    const newFilter: AuditLogFilter = {};
    
    if (dateRange.from && dateRange.to) {
      newFilter.dateRange = {
        start: dateRange.from,
        end: dateRange.to,
      };
    }
    
    if (filter.userId) newFilter.userId = filter.userId;
    if (filter.action) newFilter.action = filter.action;
    if (filter.resource) newFilter.resource = filter.resource;
    if (filter.module) newFilter.module = filter.module;
    if (filter.success !== undefined) newFilter.success = filter.success;
    if (filter.severity) newFilter.severity = filter.severity;
    if (filter.search) newFilter.search = filter.search;
    
    setFilter(newFilter);
    setFilterDialogOpen(false);
  }, [dateRange, filter]);
  
  // 清除过滤器
  const clearFilter = useCallback(() => {
    setFilter({});
    setDateRange({});
    setFilterDialogOpen(false);
  }, []);
  
  // 导出日志
  const handleExport = useCallback(async (format: 'csv' | 'xlsx' | 'json') => {
    if (!onExport) return;
    
    try {
      await onExport(filteredLogs, format);
    } catch (error) {
      console.error('导出日志失败:', error);
    }
  }, [onExport, filteredLogs]);
  
  // 刷新日志
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('刷新日志失败:', error);
    }
  }, [onRefresh]);
  
  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore) return;
    
    try {
      await onLoadMore();
    } catch (error) {
      console.error('加载更多日志失败:', error);
    }
  }, [onLoadMore]);
  
  // 渲染日志列表
  const renderLogs = useCallback(() => {
    if (filteredLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">暂无日志</h3>
          <p className="text-slate-500 text-center max-w-md">
            没有找到符合条件的审计日志，请尝试调整筛选条件或刷新页面。
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {filteredLogs.map(log => (
          <Card key={log.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{log.username}</span>
                      <span className="text-slate-500">
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-slate-500">
                        {getResourceLabel(log.resource)}
                      </span>
                      {log.resourceName && (
                        <span className="text-slate-700">
                          {log.resourceName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Settings className="h-3 w-3" />
                        <span>{getModuleLabel(log.module)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={cn("w-2 h-2 rounded-full", getSeverityColor(log.severity))} />
                        <span>{getSeverityLabel(log.severity)}</span>
                      </div>
                      {log.success ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>成功</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          <span>失败</span>
                        </div>
                      )}
                    </div>
                    {log.errorMessage && (
                      <div className="mt-2 text-sm text-red-600">
                        {log.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLogExpansion(log.id)}
                  >
                    {expandedLogs.has(log.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewLogDetails(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {expandedLogs.has(log.id) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">详细信息</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">IP地址:</span>
                          <span>{log.ipAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">用户代理:</span>
                          <span className="truncate max-w-xs">{log.userAgent}</span>
                        </div>
                        {log.resourceId && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">资源ID:</span>
                            <span>{log.resourceId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">操作数据</h4>
                      <div className="bg-slate-50 p-2 rounded text-sm max-h-32 overflow-y-auto">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={handleLoadMore}>
              加载更多
            </Button>
          </div>
        )}
      </div>
    );
  }, [
    filteredLogs,
    expandedLogs,
    hasMore,
    getActionIcon,
    getActionLabel,
    getResourceLabel,
    getModuleLabel,
    getSeverityLabel,
    getSeverityColor,
    toggleLogExpansion,
    viewLogDetails,
    handleLoadMore,
  ]);
  
  return (
    <div className={cn("w-full space-y-4", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>审计日志</span>
              </CardTitle>
              <CardDescription>
                查看系统操作历史和审计记录
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDialogOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索用户、操作、资源或模块..."
                value={filter.search || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            renderLogs()
          )}
        </CardContent>
      </Card>
      
      {/* 筛选对话框 */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>筛选日志</DialogTitle>
            <DialogDescription>
              设置筛选条件来查找特定的审计日志
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>日期范围</Label>
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy-MM-dd", { locale: zhCN })} -{" "}
                          {format(dateRange.to, "yyyy-MM-dd", { locale: zhCN })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy-MM-dd", { locale: zhCN })
                      )
                    ) : (
                      <span>选择日期范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                      dateRangeOpen && setDateRangeOpen(false);
                    }}
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>用户</Label>
              <Select value={filter.userId || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, userId: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部用户</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>操作</Label>
              <Select value={filter.action || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, action: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部操作</SelectItem>
                  {ACTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>资源</Label>
              <Select value={filter.resource || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, resource: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择资源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部资源</SelectItem>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>模块</Label>
              <Select value={filter.module || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, module: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部模块</SelectItem>
                  {MODULE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>严重程度</Label>
              <Select value={filter.severity || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, severity: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择严重程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部严重程度</SelectItem>
                  {SEVERITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="success-only"
                checked={filter.success === true}
                onCheckedChange={(checked) => setFilter(prev => ({ ...prev, success: checked === true ? true : undefined }))}
              />
              <Label htmlFor="success-only">仅显示成功的操作</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="failed-only"
                checked={filter.success === false}
                onCheckedChange={(checked) => setFilter(prev => ({ ...prev, success: checked === true ? false : undefined }))}
              />
              <Label htmlFor="failed-only">仅显示失败的操作</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={clearFilter}>
              清除
            </Button>
            <Button onClick={applyFilter}>
              应用筛选
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 详情对话框 */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>
              查看审计日志的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>用户</Label>
                    <div className="font-medium">{selectedLog.username}</div>
                  </div>
                  <div>
                    <Label>时间</Label>
                    <div className="font-medium">
                      {format(selectedLog.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                  </div>
                  <div>
                    <Label>操作</Label>
                    <div className="font-medium">{getActionLabel(selectedLog.action)}</div>
                  </div>
                  <div>
                    <Label>资源</Label>
                    <div className="font-medium">{getResourceLabel(selectedLog.resource)}</div>
                  </div>
                  <div>
                    <Label>资源名称</Label>
                    <div className="font-medium">{selectedLog.resourceName}</div>
                  </div>
                  <div>
                    <Label>模块</Label>
                    <div className="font-medium">{getModuleLabel(selectedLog.module)}</div>
                  </div>
                  <div>
                    <Label>IP地址</Label>
                    <div className="font-medium">{selectedLog.ipAddress}</div>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <div className="flex items-center space-x-2">
                      {selectedLog.success ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">成功</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-600">失败</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>严重程度</Label>
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-3 h-3 rounded-full", getSeverityColor(selectedLog.severity))} />
                      <span className="font-medium">{getSeverityLabel(selectedLog.severity)}</span>
                    </div>
                  </div>
                  {selectedLog.resourceId && (
                    <div>
                      <Label>资源ID</Label>
                      <div className="font-medium">{selectedLog.resourceId}</div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <Label>用户代理</Label>
                  <div className="bg-slate-50 p-2 rounded text-sm mt-1">
                    {selectedLog.userAgent}
                  </div>
                </div>
                
                {selectedLog.errorMessage && (
                  <div>
                    <Label>错误信息</Label>
                    <div className="bg-red-50 p-2 rounded text-sm text-red-600 mt-1">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>操作数据</Label>
                  <div className="bg-slate-50 p-2 rounded text-sm mt-1 max-h-64 overflow-y-auto">
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
      
      {children}
    </div>
  );
}

export default AuditLogViewer;