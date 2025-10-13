import { useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, RefreshCw, Filter, Calendar, Settings, Info, ChevronDown, ChevronUp, Eye, EyeOff, Maximize2, Minimize2, Copy, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// 图表数据类型
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// 统计卡片数据类型
export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  description?: string;
}

// 图表配置类型
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'treemap' | 'scatter';
  title?: string;
  description?: string;
  data: ChartData[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  width?: number;
  responsive?: boolean;
  animation?: boolean;
  [key: string]: any;
}

// 数据可视化组件属性
interface DataVisualizationProps {
  statCards?: StatCardData[];
  charts?: ChartConfig[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onExport?: (format: 'png' | 'svg' | 'pdf' | 'csv') => Promise<void>;
  onFilter?: (filters: Record<string, any>) => void;
  onShare?: (chartId: string) => Promise<void>;
  onPrint?: (chartId: string) => void;
  className?: string;
  children?: ReactNode;
}

// 默认颜色
const DEFAULT_COLORS = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 黄色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#14b8a6', // 青色
  '#f97316', // 橙色
];

// 格式化数字
const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('zh-CN', options).format(num);
};

// 格式化百分比
const formatPercentage = (num: number): string => {
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

// 生成随机数据
const generateRandomData = (count: number, min: number, max: number): ChartData[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `项目 ${i + 1}`,
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }));
};

// 数据可视化组件
export function DataVisualization({
  statCards = [],
  charts = [],
  isLoading = false,
  onRefresh,
  onExport,
  onFilter,
  onShare,
  onPrint,
  className,
  children,
}: DataVisualizationProps) {
  // 状态
  const [activeChartTab, setActiveChartTab] = useState('0');
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const [chartFilters, setChartFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState('7d');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'pdf' | 'csv'>('png');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareChartId, setShareChartId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chartRefs = useRef<Record<string, HTMLDivElement>>({});
  
  // 刷新数据
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);
  
  // 导出图表
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    if (!onExport) return;
    
    setIsExporting(true);
    try {
      await onExport(format);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);
  
  // 分享图表
  const handleShare = useCallback(async (chartId: string) => {
    if (!onShare) return;
    
    setShareChartId(chartId);
    setShareDialogOpen(true);
    
    try {
      await onShare(chartId);
    } catch (error) {
      console.error('分享失败:', error);
    }
  }, [onShare]);
  
  // 打印图表
  const handlePrint = useCallback((chartId: string) => {
    if (!onPrint) return;
    
    onPrint(chartId);
  }, [onPrint]);
  
  // 切换图表展开状态
  const toggleChartExpansion = useCallback((chartId: string) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  }, []);
  
  // 更新图表过滤器
  const updateChartFilter = useCallback((chartId: string, filter: Record<string, any>) => {
    setChartFilters(prev => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        ...filter,
      },
    }));
    
    if (onFilter) {
      onFilter({
        ...chartFilters,
        [chartId]: {
          ...chartFilters[chartId],
          ...filter,
        },
      });
    }
  }, [chartFilters, onFilter]);
  
  // 渲染统计卡片
  const renderStatCards = useCallback(() => {
    if (statCards.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change !== undefined && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {card.changeType === 'increase' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
                  {card.changeType === 'decrease' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
                  <span className={cn(
                    card.changeType === 'increase' && 'text-green-500',
                    card.changeType === 'decrease' && 'text-red-500',
                    card.changeType === 'neutral' && 'text-muted-foreground'
                  )}>
                    {formatPercentage(card.change)}
                  </span>
                  <span className="ml-1">较上期</span>
                </div>
              )}
              {card.description && (
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [statCards]);
  
  // 渲染柱状图
  const renderBarChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      xAxisKey = 'name',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showGrid = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} {...rest}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          <Bar dataKey={dataKey} fill={colors[0]} animationDuration={animation ? 1000 : 0} />
        </BarChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染折线图
  const renderLineChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      xAxisKey = 'name',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showGrid = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} {...rest}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={colors[0]} 
            strokeWidth={2}
            animationDuration={animation ? 1000 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染饼图
  const renderPieChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      nameKey = 'name',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart {...rest}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            animationDuration={animation ? 1000 : 0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染面积图
  const renderAreaChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      xAxisKey = 'name',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showGrid = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} {...rest}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={colors[0]} 
            fill={colors[0]} 
            fillOpacity={0.6}
            animationDuration={animation ? 1000 : 0}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染雷达图
  const renderRadarChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showGrid = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} {...rest}>
          {showGrid && <PolarGrid />}
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          <Radar 
            name="数据" 
            dataKey={dataKey} 
            stroke={colors[0]} 
            fill={colors[0]} 
            fillOpacity={0.6}
            animationDuration={animation ? 1000 : 0}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染树状图
  const renderTreemap = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      dataKey = 'value',
      colors = DEFAULT_COLORS,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data}
          dataKey={dataKey}
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          animationDuration={animation ? 1000 : 0}
          {...rest}
        >
          {showTooltip && <Tooltip />}
        </Treemap>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染散点图
  const renderScatterChart = useCallback((config: ChartConfig, chartId: string) => {
    const {
      data,
      xAxisKey = 'x',
      yAxisKey = 'y',
      colors = DEFAULT_COLORS,
      showLegend = true,
      showGrid = true,
      showTooltip = true,
      height = 300,
      responsive = true,
      animation = true,
      ...rest
    } = config;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart {...rest}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis dataKey={yAxisKey} />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          <Scatter 
            name="数据点" 
            data={data} 
            fill={colors[0]}
            animationDuration={animation ? 1000 : 0}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }, []);
  
  // 渲染图表
  const renderChart = useCallback((config: ChartConfig, index: number) => {
    const chartId = `chart-${index}`;
    const {
      type,
      title,
      description,
    } = config;
    
    const isExpanded = expandedCharts[chartId];
    
    let chartElement;
    
    switch (type) {
      case 'bar':
        chartElement = renderBarChart(config, chartId);
        break;
      case 'line':
        chartElement = renderLineChart(config, chartId);
        break;
      case 'pie':
        chartElement = renderPieChart(config, chartId);
        break;
      case 'area':
        chartElement = renderAreaChart(config, chartId);
        break;
      case 'radar':
        chartElement = renderRadarChart(config, chartId);
        break;
      case 'treemap':
        chartElement = renderTreemap(config, chartId);
        break;
      case 'scatter':
        chartElement = renderScatterChart(config, chartId);
        break;
      default:
        chartElement = <div>不支持的图表类型</div>;
    }
    
    return (
      <Card key={index} className={cn(isExpanded && "col-span-full")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChartExpansion(chartId)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare(chartId)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePrint(chartId)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={el => chartRefs.current[chartId] = el!}>
            {chartElement}
          </div>
        </CardContent>
      </Card>
    );
  }, [expandedCharts, renderBarChart, renderLineChart, renderPieChart, renderAreaChart, renderRadarChart, renderTreemap, renderScatterChart, toggleChartExpansion, handleShare, handlePrint]);
  
  // 渲染图表列表
  const renderCharts = useCallback(() => {
    if (charts.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">数据图表</h2>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">今天</SelectItem>
                <SelectItem value="7d">最近7天</SelectItem>
                <SelectItem value="30d">最近30天</SelectItem>
                <SelectItem value="90d">最近90天</SelectItem>
                <SelectItem value="1y">最近一年</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              刷新
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle>筛选条件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chart-type">图表类型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择图表类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="bar">柱状图</SelectItem>
                      <SelectItem value="line">折线图</SelectItem>
                      <SelectItem value="pie">饼图</SelectItem>
                      <SelectItem value="area">面积图</SelectItem>
                      <SelectItem value="radar">雷达图</SelectItem>
                      <SelectItem value="treemap">树状图</SelectItem>
                      <SelectItem value="scatter">散点图</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-source">数据源</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择数据源" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="projects">项目</SelectItem>
                      <SelectItem value="parts">零件</SelectItem>
                      <SelectItem value="dimensions">尺寸</SelectItem>
                      <SelectItem value="users">用户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="rd">研发部</SelectItem>
                      <SelectItem value="production">生产部</SelectItem>
                      <SelectItem value="quality">质量部</SelectItem>
                      <SelectItem value="purchase">采购部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map((chart, index) => renderChart(chart, index))}
        </div>
      </div>
    );
  }, [charts, dateRange, showFilters, isRefreshing, renderChart, handleRefresh]);
  
  return (
    <div className={cn("w-full space-y-4", className)}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {renderStatCards()}
          {renderCharts()}
        </>
      )}
      
      {/* 导出对话框 */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>导出图表</DialogTitle>
            <DialogDescription>
              选择导出格式和选项
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>导出格式</Label>
              <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png">PNG 图片</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="svg" id="svg" />
                  <Label htmlFor="svg">SVG 矢量图</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF 文档</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV 数据</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => handleExport(exportFormat)} disabled={isExporting}>
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              导出
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 分享对话框 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>分享图表</DialogTitle>
            <DialogDescription>
              生成分享链接或嵌入代码
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">分享链接</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-link"
                  value={`https://bom-system.example.com/share/${shareChartId}`}
                  readOnly
                />
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="embed-code">嵌入代码</Label>
              <div className="flex items-center space-x-2">
                <Textarea
                  id="embed-code"
                  value={`<iframe src="https://bom-system.example.com/embed/${shareChartId}" width="800" height="600"></iframe>`}
                  readOnly
                  rows={3}
                />
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {children}
    </div>
  );
}

export default DataVisualization;