import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, Search, Filter, Download, RefreshCw, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { TableColumn, SearchParams } from '@/types';

interface DataTableProps<T> {
  // 数据
  data: T[];
  loading?: boolean;
  error?: string | null;
  
  // 列配置
  columns: TableColumn<T>[];
  
  // 分页
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  
  // 搜索和过滤
  searchable?: boolean;
  filterable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  
  // 选择
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  getRowKey?: (record: T) => string;
  
  // 操作
  actions?: {
    refresh?: () => void;
    export?: () => void;
    delete?: (selectedRows: T[]) => void;
    edit?: (record: T) => void;
    view?: (record: T) => void;
  };
  
  // 行操作
  rowActions?: (record: T) => {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  
  // 样式
  className?: string;
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  
  // 空状态
  emptyText?: string;
  
  // 其他
  scroll?: { x?: number; y?: number };
  rowClassName?: (record: T, index: number) => string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  loading = false,
  error = null,
  columns,
  pagination,
  searchable = true,
  filterable = false,
  searchPlaceholder = '搜索...',
  onSearch,
  onFilter,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  getRowKey = (record) => record.id || record.key,
  actions,
  rowActions,
  className = '',
  size = 'middle',
  bordered = false,
  striped = false,
  hoverable = true,
  emptyText = '暂无数据',
  scroll,
  rowClassName,
}: DataTableProps<T>) {
  // 状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<T | null>(null);

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch]);

  // 处理排序
  const handleSort = useCallback((field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  }, [sortField, sortOrder]);

  // 处理选择
  const handleSelectAll = useCallback((checked: boolean) => {
    if (onSelectionChange) {
      const keys = checked ? data.map(getRowKey) : [];
      const rows = checked ? [...data] : [];
      onSelectionChange(keys, rows);
    }
  }, [data, getRowKey, onSelectionChange]);

  const handleSelectRow = useCallback((checked: boolean, record: T) => {
    if (onSelectionChange) {
      const key = getRowKey(record);
      let newSelectedKeys: string[];
      let newSelectedRows: T[];
      
      if (checked) {
        newSelectedKeys = [...selectedRowKeys, key];
        newSelectedRows = [...data.filter(r => selectedRowKeys.includes(getRowKey(r))), record];
      } else {
        newSelectedKeys = selectedRowKeys.filter(k => k !== key);
        newSelectedRows = data.filter(r => newSelectedKeys.includes(getRowKey(r)));
      }
      
      onSelectionChange(newSelectedKeys, newSelectedRows);
    }
  }, [selectedRowKeys, data, getRowKey, onSelectionChange]);

  // 处理删除
  const handleDelete = useCallback((record?: T) => {
    if (record) {
      setRecordToDelete(record);
      setDeleteDialogOpen(true);
    } else if (actions?.delete && selectedRowKeys.length > 0) {
      const selectedRows = data.filter(r => selectedRowKeys.includes(getRowKey(r)));
      actions.delete(selectedRows);
    }
  }, [actions, selectedRowKeys, data, getRowKey]);

  const confirmDelete = useCallback(() => {
    if (recordToDelete && actions?.delete) {
      actions.delete([recordToDelete]);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  }, [recordToDelete, actions]);

  // 排序数据
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [data, sortField, sortOrder]);

  // 计算表格尺寸类
  const sizeClasses = {
    small: 'text-xs',
    middle: 'text-sm',
    large: 'text-base',
  };

  // 渲染表头
  const renderHeader = () => (
    <thead className="bg-slate-50">
      <tr>
        {selectable && (
          <th className="w-12 px-4 py-3 text-left">
            <Checkbox
              checked={selectedRowKeys.length > 0 && selectedRowKeys.length === data.length}
              onCheckedChange={handleSelectAll}
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-4 py-3 text-left font-medium text-slate-700 ${
              column.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
            }`}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.title}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <ChevronUp
                    className={`w-3 h-3 ${
                      sortField === column.key && sortOrder === 'asc'
                        ? 'text-blue-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <ChevronDown
                    className={`w-3 h-3 -mt-1 ${
                      sortField === column.key && sortOrder === 'desc'
                        ? 'text-blue-600'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
        {rowActions && <th className="w-12 px-4 py-3 text-center">操作</th>}
      </tr>
    </thead>
  );

  // 渲染表格行
  const renderRow = (record: T, index: number) => {
    const key = getRowKey(record);
    const isSelected = selectedRowKeys.includes(key);
    
    return (
      <tr
        key={key}
        className={`border-b border-slate-200 ${
          striped && index % 2 === 1 ? 'bg-slate-50' : ''
        } ${hoverable ? 'hover:bg-slate-50' : ''} ${
          isSelected ? 'bg-blue-50' : ''
        } ${rowClassName ? rowClassName(record, index) : ''}`}
      >
        {selectable && (
          <td className="w-12 px-4 py-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelectRow(checked as boolean, record)}
            />
          </td>
        )}
        {columns.map((column) => (
          <td key={column.key} className="px-4 py-3">
            {column.render ? column.render(record[column.dataIndex], record) : record[column.dataIndex]}
          </td>
        ))}
        {rowActions && (
          <td className="w-12 px-4 py-3 text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions?.view && (
                  <DropdownMenuItem onClick={() => actions.view!(record)}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看
                  </DropdownMenuItem>
                )}
                {actions?.edit && (
                  <DropdownMenuItem onClick={() => actions.edit!(record)}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                )}
                {rowActions(record).map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    className={action.danger ? 'text-red-600' : ''}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(record)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        )}
      </tr>
    );
  };

  // 渲染分页
  const renderPagination = () => {
    if (!pagination) return null;
    
    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
        <div className="text-sm text-slate-700">
          显示第 {(current - 1) * pageSize + 1} 至{' '}
          {Math.min(current * pageSize, total)} 项，共 {total} 项
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onChange(Math.max(1, current - 1), pageSize)}
                className={current === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (current <= 3) {
                page = i + 1;
              } else if (current >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = current - 2 + i;
              }
              
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onChange(page, pageSize)}
                    isActive={current === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => onChange(Math.min(totalPages, current + 1), pageSize)}
                className={current === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow ${bordered ? 'border border-slate-200' : ''} ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
          {filterable && (
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              过滤
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {actions?.refresh && (
            <Button variant="outline" size="sm" onClick={actions.refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          )}
          {actions?.export && (
            <Button variant="outline" size="sm" onClick={actions.export}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          )}
          {selectable && selectedRowKeys.length > 0 && actions?.delete && (
            <Button variant="outline" size="sm" onClick={() => handleDelete()}>
              <Trash2 className="mr-2 h-4 w-4" />
              删除 ({selectedRowKeys.length})
            </Button>
          )}
        </div>
      </div>

      {/* 表格内容 */}
      <div className="overflow-auto" style={scroll}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">加载中...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <span>加载失败: {error}</span>
            {actions?.refresh && (
              <Button variant="outline" size="sm" className="mt-2" onClick={actions.refresh}>
                重试
              </Button>
            )}
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <span>{emptyText}</span>
          </div>
        ) : (
          <table className={`w-full ${sizeClasses[size]}`}>
            {renderHeader()}
            <tbody>
              {sortedData.map((record, index) => renderRow(record, index))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {renderPagination()}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条记录吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DataTable;