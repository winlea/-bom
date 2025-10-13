import { useState, useCallback, useRef, ReactNode } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, FileSpreadsheet, Database, FileJson, HelpCircle, Info, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// 导入导出配置
export interface ImportExportConfig {
  // 导入配置
  import: {
    supportedFormats: string[];
    maxFileSize: number; // MB
    requiredFields: string[];
    optionalFields: string[];
    fieldMapping: Record<string, string>; // 文件字段 -> 系统字段
    validationRules: Record<string, (value: any) => boolean | string>;
    preprocessData?: (data: any[]) => any[];
  };
  
  // 导出配置
  export: {
    supportedFormats: string[];
    defaultFormat: string;
    defaultFields: string[];
    allFields: string[];
    fieldLabels: Record<string, string>;
    transformData?: (data: any[]) => any[];
  };
}

// 导入结果
export interface ImportResult {
  success: boolean;
  total: number;
  processed: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
}

// 导入预览数据
export interface ImportPreview {
  data: any[];
  columns: string[];
  totalRows: number;
  sampleRows: number;
}

// 数据导入导出组件属性
interface DataImportExportProps {
  config: ImportExportConfig;
  onImport: (data: any[], options: ImportOptions) => Promise<ImportResult>;
  onExport: (format: string, fields: string[], filters?: Record<string, any>) => Promise<Blob>;
  onPreview?: (file: File) => Promise<ImportPreview>;
  className?: string;
  children?: ReactNode;
}

// 导入选项
interface ImportOptions {
  skipFirstRow: boolean;
  updateExisting: boolean;
  batchSize: number;
  fieldMapping: Record<string, string>;
}

// 默认导入导出配置
const DEFAULT_CONFIG: ImportExportConfig = {
  import: {
    supportedFormats: ['csv', 'xlsx', 'json'],
    maxFileSize: 10, // 10MB
    requiredFields: ['partNumber', 'partName'],
    optionalFields: ['description', 'category', 'material', 'supplier', 'quantity', 'unitPrice'],
    fieldMapping: {},
    validationRules: {},
  },
  export: {
    supportedFormats: ['csv', 'xlsx', 'json'],
    defaultFormat: 'xlsx',
    defaultFields: ['partNumber', 'partName', 'description', 'category', 'quantity'],
    allFields: [],
    fieldLabels: {},
  },
};

// 数据导入导出组件
export function DataImportExport({
  config = DEFAULT_CONFIG,
  onImport,
  onExport,
  onPreview,
  className,
  children,
}: DataImportExportProps) {
  // 状态
  const [activeTab, setActiveTab] = useState('import');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipFirstRow: true,
    updateExisting: false,
    batchSize: 100,
    fieldMapping: {},
  });
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(config.export.defaultFormat);
  const [exportFields, setExportFields] = useState(config.export.defaultFields);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查文件格式
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.import.supportedFormats.includes(fileExtension)) {
      alert(`不支持的文件格式。支持的格式: ${config.import.supportedFormats.join(', ')}`);
      return;
    }
    
    // 检查文件大小
    if (file.size > config.import.maxFileSize * 1024 * 1024) {
      alert(`文件大小超过限制。最大允许: ${config.import.maxFileSize}MB`);
      return;
    }
    
    setImportFile(file);
    setImportResult(null);
    
    // 生成预览
    if (onPreview) {
      onPreview(file).then(preview => {
        setImportPreview(preview);
        
        // 初始化字段映射
        const mapping: Record<string, string> = {};
        preview.columns.forEach(col => {
          const systemField = config.import.fieldMapping[col] || 
            config.import.requiredFields.find(field => field.toLowerCase() === col.toLowerCase()) ||
            config.import.optionalFields.find(field => field.toLowerCase() === col.toLowerCase());
          
          if (systemField) {
            mapping[col] = systemField;
          }
        });
        
        setImportOptions(prev => ({ ...prev, fieldMapping: mapping }));
      }).catch(error => {
        console.error('预览失败:', error);
      });
    }
  }, [config, onPreview]);
  
  // 执行导入
  const handleImport = useCallback(async () => {
    if (!importFile || !onImport) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      const result = await onImport(importPreview?.data || [], importOptions);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        total: 0,
        processed: 0,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, field: 'general', message: error instanceof Error ? error.message : '未知错误', value: null }],
        warnings: [],
      });
    } finally {
      setIsImporting(false);
    }
  }, [importFile, importPreview, importOptions, onImport]);
  
  // 执行导出
  const handleExport = useCallback(async () => {
    if (!onExport) return;
    
    setIsExporting(true);
    
    try {
      const blob = await onExport(exportFormat, exportFields);
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bom-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, exportFields, onExport]);
  
  // 更新字段映射
  const updateFieldMapping = useCallback((fileField: string, systemField: string) => {
    setImportOptions(prev => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [fileField]: systemField,
      }
    }));
  }, []);
  
  // 重置导入
  const resetImport = useCallback(() => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // 渲染导入预览
  const renderImportPreview = useCallback(() => {
    if (!importPreview) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>数据预览</span>
            <Badge variant="outline">{importPreview.totalRows} 行</Badge>
          </CardTitle>
          <CardDescription>
            显示前 {importPreview.sampleRows} 行数据
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  {importPreview.columns.map((col, index) => (
                    <TableHead key={index}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.data.slice(0, importPreview.sampleRows).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {importPreview.columns.map((col, colIndex) => (
                      <TableCell key={colIndex}>{row[col] || ''}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }, [importPreview]);
  
  // 渲染字段映射
  const renderFieldMapping = useCallback(() => {
    if (!importPreview) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>字段映射</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFieldMapping(!showFieldMapping)}
            >
              {showFieldMapping ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
          <CardDescription>
            将文件中的字段映射到系统中的字段
          </CardDescription>
        </CardHeader>
        
        {showFieldMapping && (
          <CardContent>
            <div className="space-y-4">
              {importPreview.columns.map((col, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>文件字段</Label>
                    <Input value={col} readOnly />
                  </div>
                  <div>
                    <Label>系统字段</Label>
                    <Select
                      value={importOptions.fieldMapping[col] || ''}
                      onValueChange={(value) => updateFieldMapping(col, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择系统字段" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">不导入</SelectItem>
                        {config.import.requiredFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field} *
                          </SelectItem>
                        ))}
                        {config.import.optionalFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }, [importPreview, showFieldMapping, importOptions.fieldMapping, updateFieldMapping, config.import]);
  
  // 渲染导入结果
  const renderImportResult = useCallback(() => {
    if (!importResult) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span>导入结果</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{importResult.total}</div>
              <div className="text-sm text-slate-500">总计</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{importResult.imported}</div>
              <div className="text-sm text-slate-500">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{importResult.failed}</div>
              <div className="text-sm text-slate-500">失败</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{importResult.warnings.length}</div>
              <div className="text-sm text-slate-500">警告</div>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">错误</h4>
              <ScrollArea className="h-32 w-full">
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>行 {error.row}, 字段 {error.field}</AlertTitle>
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {importResult.warnings.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">警告</h4>
              <ScrollArea className="h-32 w-full">
                <div className="space-y-2">
                  {importResult.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <HelpCircle className="h-4 w-4" />
                      <AlertTitle>行 {warning.row}, 字段 {warning.field}</AlertTitle>
                      <AlertDescription>{warning.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [importResult]);
  
  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>导入</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>导出</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>数据导入</span>
              </CardTitle>
              <CardDescription>
                从文件导入BOM数据。支持的格式: {config.import.supportedFormats.join(', ')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-input">选择文件</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept={config.import.supportedFormats.map(fmt => `.${fmt}`).join(',')}
                  />
                  {importFile && (
                    <Button variant="outline" size="sm" onClick={resetImport}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {importFile && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <FileText className="h-4 w-4" />
                    <span>{importFile.name}</span>
                    <span>({(importFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
              
              {importFile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>导入选项</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skip-first-row"
                          checked={importOptions.skipFirstRow}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, skipFirstRow: !!checked }))
                          }
                        />
                        <Label htmlFor="skip-first-row">跳过首行（标题行）</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="update-existing"
                          checked={importOptions.updateExisting}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, updateExisting: !!checked }))
                          }
                        />
                        <Label htmlFor="update-existing">更新已存在的记录</Label>
                      </div>
                    </div>
                  </div>
                  
                  {renderFieldMapping()}
                  {renderImportPreview()}
                  
                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>导入进度</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetImport}>
                      重置
                    </Button>
                    <Button onClick={handleImport} disabled={isImporting}>
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          导入中...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          开始导入
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {renderImportResult()}
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>数据导出</span>
              </CardTitle>
              <CardDescription>
                导出BOM数据到文件。支持的格式: {config.export.supportedFormats.join(', ')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">导出格式</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择导出格式" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.export.supportedFormats.map(format => (
                      <SelectItem key={format} value={format}>
                        {format.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>导出字段</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {config.export.allFields.map(field => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field}`}
                        checked={exportFields.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportFields(prev => [...prev, field]);
                          } else {
                            setExportFields(prev => prev.filter(f => f !== field));
                          }
                        }}
                      />
                      <Label htmlFor={`field-${field}`}>
                        {config.export.fieldLabels[field] || field}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleExport} disabled={isExporting || exportFields.length === 0}>
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      导出数据
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {children}
    </div>
  );
}

// BOM系统导入导出配置
export const BOM_IMPORT_EXPORT_CONFIG: ImportExportConfig = {
  import: {
    supportedFormats: ['csv', 'xlsx', 'json'],
    maxFileSize: 10,
    requiredFields: ['partNumber', 'partName'],
    optionalFields: [
      'description', 'category', 'material', 'supplier', 'quantity', 'unitPrice',
      'unit', 'weight', 'status', 'createdDate', 'updatedDate', 'tags'
    ],
    fieldMapping: {
      '零件号': 'partNumber',
      '零件名称': 'partName',
      '描述': 'description',
      '分类': 'category',
      '材料': 'material',
      '供应商': 'supplier',
      '数量': 'quantity',
      '单价': 'unitPrice',
      '单位': 'unit',
      '重量': 'weight',
      '状态': 'status',
    },
    validationRules: {
      partNumber: (value) => {
        if (!value || value.trim() === '') return '零件号不能为空';
        if (typeof value !== 'string') return '零件号必须是文本';
        return true;
      },
      partName: (value) => {
        if (!value || value.trim() === '') return '零件名称不能为空';
        if (typeof value !== 'string') return '零件名称必须是文本';
        return true;
      },
      quantity: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        if (isNaN(num)) return '数量必须是数字';
        if (num < 0) return '数量不能为负数';
        return true;
      },
      unitPrice: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        if (isNaN(num)) return '单价必须是数字';
        if (num < 0) return '单价不能为负数';
        return true;
      },
    },
  },
  export: {
    supportedFormats: ['csv', 'xlsx', 'json'],
    defaultFormat: 'xlsx',
    defaultFields: ['partNumber', 'partName', 'description', 'category', 'quantity', 'unitPrice'],
    allFields: [
      'partNumber', 'partName', 'description', 'category', 'material', 'supplier',
      'quantity', 'unit', 'unitPrice', 'weight', 'status', 'createdDate', 'updatedDate', 'tags'
    ],
    fieldLabels: {
      partNumber: '零件号',
      partName: '零件名称',
      description: '描述',
      category: '分类',
      material: '材料',
      supplier: '供应商',
      quantity: '数量',
      unit: '单位',
      unitPrice: '单价',
      weight: '重量',
      status: '状态',
      createdDate: '创建日期',
      updatedDate: '更新日期',
      tags: '标签',
    },
  },
};

export default DataImportExport;