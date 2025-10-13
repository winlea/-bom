import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Search, Filter, Plus, X, Save, RotateCcw, ChevronDown, ChevronUp, Calendar, FileText, User, Tag, Package, Settings, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 搜索条件类型
export interface SearchCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  label?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'boolean';
  options?: Array<{ label: string; value: any }>;
}

// 搜索字段定义
export interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'boolean';
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  operators?: string[];
}

// 保存的搜索
export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  conditions: SearchCondition[];
  createdAt: Date;
  updatedAt: Date;
}

// 高级搜索组件属性
interface AdvancedSearchProps {
  fields: SearchField[];
  onSearch: (conditions: SearchCondition[]) => void;
  onClear?: () => void;
  savedSearches?: SavedSearch[];
  onSaveSearch?: (name: string, description: string, conditions: SearchCondition[]) => void;
  onDeleteSearch?: (id: string) => void;
  onLoadSearch?: (id: string) => void;
  className?: string;
  children?: ReactNode;
}

// 默认操作符
const DEFAULT_OPERATORS = {
  text: [
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'starts_with', label: '开始于' },
    { value: 'ends_with', label: '结束于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
  number: [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'greater_than', label: '大于' },
    { value: 'less_than', label: '小于' },
    { value: 'greater_than_or_equal', label: '大于等于' },
    { value: 'less_than_or_equal', label: '小于等于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
  date: [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'after', label: '晚于' },
    { value: 'before', label: '早于' },
    { value: 'between', label: '介于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
  select: [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
  'multi-select': [
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
  boolean: [
    { value: 'equals', label: '等于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ],
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 高级搜索组件
export function AdvancedSearch({
  fields,
  onSearch,
  onClear,
  savedSearches = [],
  onSaveSearch,
  onDeleteSearch,
  onLoadSearch,
  className,
  children,
}: AdvancedSearchProps) {
  // 状态
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [savedSearchDescription, setSavedSearchDescription] = useState('');
  const [activeTab, setActiveTab] = useState('builder');

  // 添加搜索条件
  const addCondition = useCallback(() => {
    if (fields.length === 0) return;
    
    const field = fields[0];
    const operators = field.operators || DEFAULT_OPERATORS[field.type] || [];
    const operator = operators.length > 0 ? operators[0].value : 'equals';
    
    const newCondition: SearchCondition = {
      id: generateId(),
      field: field.key,
      operator,
      value: field.type === 'boolean' ? false : '',
      label: field.label,
      type: field.type,
      options: field.options,
    };
    
    setConditions(prev => [...prev, newCondition]);
  }, [fields]);

  // 更新搜索条件
  const updateCondition = useCallback((id: string, updates: Partial<SearchCondition>) => {
    setConditions(prev => prev.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  }, []);

  // 删除搜索条件
  const removeCondition = useCallback((id: string) => {
    setConditions(prev => prev.filter(condition => condition.id !== id));
  }, []);

  // 清空所有条件
  const clearConditions = useCallback(() => {
    setConditions([]);
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // 执行搜索
  const handleSearch = useCallback(() => {
    onSearch(conditions);
  }, [conditions, onSearch]);

  // 保存搜索
  const handleSaveSearch = useCallback(() => {
    if (!savedSearchName.trim() || !onSaveSearch) return;
    
    onSaveSearch(savedSearchName, savedSearchDescription, conditions);
    setSaveDialogOpen(false);
    setSavedSearchName('');
    setSavedSearchDescription('');
  }, [savedSearchName, savedSearchDescription, conditions, onSaveSearch]);

  // 加载保存的搜索
  const handleLoadSearch = useCallback((id: string) => {
    const search = savedSearches.find(s => s.id === id);
    if (search && onLoadSearch) {
      onLoadSearch(id);
      setConditions(search.conditions);
    }
  }, [savedSearches, onLoadSearch]);

  // 删除保存的搜索
  const handleDeleteSearch = useCallback((id: string) => {
    if (onDeleteSearch) {
      onDeleteSearch(id);
    }
  }, [onDeleteSearch]);

  // 获取字段信息
  const getFieldInfo = useCallback((fieldKey: string) => {
    return fields.find(field => field.key === fieldKey);
  }, [fields]);

  // 获取操作符选项
  const getOperatorOptions = useCallback((fieldType: string, fieldKey: string) => {
    const field = getFieldInfo(fieldKey);
    if (field && field.operators) {
      return field.operators.map(op => typeof op === 'string' ? { value: op, label: op } : op);
    }
    return DEFAULT_OPERATORS[fieldType as keyof typeof DEFAULT_OPERATORS] || [];
  }, [getFieldInfo]);

  // 渲染条件值输入
  const renderConditionValue = useCallback((condition: SearchCondition) => {
    const { type, operator, value, options } = condition;
    
    // 对于不需要值的操作符
    if (['is_empty', 'is_not_empty'].includes(operator)) {
      return null;
    }
    
    switch (type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            placeholder="输入搜索值"
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateCondition(condition.id, { value: Number(e.target.value) })}
            placeholder="输入数字"
          />
        );
        
      case 'date':
        if (operator === 'between') {
          return (
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {value?.start ? format(new Date(value.start), 'yyyy-MM-dd', { locale: zhCN }) : '开始日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={value?.start ? new Date(value.start) : undefined}
                    onSelect={(date) => updateCondition(condition.id, {
                      value: { ...value, start: date?.toISOString() }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {value?.end ? format(new Date(value.end), 'yyyy-MM-dd', { locale: zhCN }) : '结束日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={value?.end ? new Date(value.end) : undefined}
                    onSelect={(date) => updateCondition(condition.id, {
                      value: { ...value, end: date?.toISOString() }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        }
        
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {value ? format(new Date(value), 'yyyy-MM-dd', { locale: zhCN }) : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => updateCondition(condition.id, { value: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
        
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => updateCondition(condition.id, { value: newValue })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择选项" />
            </SelectTrigger>
            <SelectContent>
              {options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'multi-select':
        return (
          <div className="space-y-2">
            {options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${condition.id}-${option.value}`}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = checked
                      ? [...currentValue, option.value]
                      : currentValue.filter(v => v !== option.value);
                    updateCondition(condition.id, { value: newValue });
                  }}
                />
                <Label htmlFor={`${condition.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
        
      case 'boolean':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(newValue) => updateCondition(condition.id, { value: newValue === 'true' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">是</SelectItem>
              <SelectItem value="false">否</SelectItem>
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            placeholder="输入搜索值"
          />
        );
    }
  }, [updateCondition]);

  // 渲染搜索条件
  const renderConditions = useMemo(() => {
    return conditions.map((condition, index) => {
      const fieldInfo = getFieldInfo(condition.field);
      const operatorOptions = getOperatorOptions(condition.type, condition.field);
      
      return (
        <Card key={condition.id} className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {index > 0 && (
                <div className="md:col-span-12">
                  <Select defaultValue="and">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">并且</SelectItem>
                      <SelectItem value="or">或者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="md:col-span-3">
                <Label>字段</Label>
                <Select
                  value={condition.field}
                  onValueChange={(fieldKey) => {
                    const field = getFieldInfo(fieldKey);
                    if (field) {
                      const operators = field.operators || DEFAULT_OPERATORS[field.type] || [];
                      const operator = operators.length > 0 ? operators[0].value : 'equals';
                      
                      updateCondition(condition.id, {
                        field: fieldKey,
                        operator,
                        label: field.label,
                        type: field.type,
                        options: field.options,
                        value: field.type === 'boolean' ? false : '',
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(field => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-3">
                <Label>操作符</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(operator) => updateCondition(condition.id, { operator })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作符" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-4">
                <Label>值</Label>
                {renderConditionValue(condition)}
              </div>
              
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                  className="w-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  }, [conditions, fields, getFieldInfo, getOperatorOptions, removeCondition, renderConditionValue, updateCondition]);

  return (
    <div className={cn("w-full", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between mb-4">
            <span className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>高级搜索</span>
              {conditions.length > 0 && (
                <Badge variant="secondary">{conditions.length}</Badge>
              )}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>搜索条件</span>
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加条件
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearConditions}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重置
                  </Button>
                  {onSaveSearch && (
                    <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                构建复杂的搜索条件来精确查找数据
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {conditions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无搜索条件</p>
                  <p className="text-sm">点击"添加条件"开始构建搜索</p>
                </div>
              ) : (
                <div>{renderConditions}</div>
              )}
              
              {conditions.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    搜索
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {savedSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>保存的搜索</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedSearches.map(search => (
                    <Card key={search.id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{search.name}</CardTitle>
                        {search.description && (
                          <CardDescription>{search.description}</CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">
                            {search.conditions.length} 个条件
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadSearch(search.id)}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            {onDeleteSearch && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSearch(search.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
      
      {/* 保存搜索对话框 */}
      {onSaveSearch && (
        <div className={cn("fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center", !saveDialogOpen && "hidden")}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>保存搜索</CardTitle>
              <CardDescription>
                保存当前搜索条件以便以后使用
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-name">名称</Label>
                <Input
                  id="search-name"
                  value={savedSearchName}
                  onChange={(e) => setSavedSearchName(e.target.value)}
                  placeholder="输入搜索名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-description">描述（可选）</Label>
                <Input
                  id="search-description"
                  value={savedSearchDescription}
                  onChange={(e) => setSavedSearchDescription(e.target.value)}
                  placeholder="输入搜索描述"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveSearch} disabled={!savedSearchName.trim()}>
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {children}
    </div>
  );
}

// BOM系统预设的搜索字段
export const BOM_SEARCH_FIELDS: SearchField[] = [
  {
    key: 'partNumber',
    label: '零件号',
    type: 'text',
    placeholder: '输入零件号',
  },
  {
    key: 'partName',
    label: '零件名称',
    type: 'text',
    placeholder: '输入零件名称',
  },
  {
    key: 'category',
    label: '分类',
    type: 'select',
    options: [
      { label: '标准件', value: 'standard' },
      { label: '非标准件', value: 'non-standard' },
      { label: '外购件', value: 'purchased' },
      { label: '自制件', value: 'in-house' },
    ],
  },
  {
    key: 'material',
    label: '材料',
    type: 'select',
    options: [
      { label: '钢材', value: 'steel' },
      { label: '铝材', value: 'aluminum' },
      { label: '塑料', value: 'plastic' },
      { label: '复合材料', value: 'composite' },
    ],
  },
  {
    key: 'supplier',
    label: '供应商',
    type: 'text',
    placeholder: '输入供应商名称',
  },
  {
    key: 'quantity',
    label: '数量',
    type: 'number',
  },
  {
    key: 'unitPrice',
    label: '单价',
    type: 'number',
  },
  {
    key: 'createdDate',
    label: '创建日期',
    type: 'date',
  },
  {
    key: 'updatedDate',
    label: '更新日期',
    type: 'date',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '草稿', value: 'draft' },
      { label: '已审核', value: 'approved' },
      { label: '已发布', value: 'published' },
      { label: '已归档', value: 'archived' },
    ],
  },
  {
    key: 'tags',
    label: '标签',
    type: 'multi-select',
    options: [
      { label: '重要', value: 'important' },
      { label: '紧急', value: 'urgent' },
      { label: '待确认', value: 'pending' },
      { label: '已确认', value: 'confirmed' },
    ],
  },
  {
    key: 'isCritical',
    label: '关键零件',
    type: 'boolean',
  },
  {
    key: 'hasDrawing',
    label: '有图纸',
    type: 'boolean',
  },
];

export default AdvancedSearch;