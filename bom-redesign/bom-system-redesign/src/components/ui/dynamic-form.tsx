import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, Plus, Trash2, Upload, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField, FormItem, FormControl, FormDescription, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormFieldConfig, FormTab } from '@/types';

interface DynamicFormProps<T> {
  // 表单配置
  fields: FormFieldConfig[];
  tabs?: FormTab[];
  
  // 数据
  initialValues?: Partial<T>;
  loading?: boolean;
  
  // 验证
  validationSchema?: z.ZodSchema<any>;
  
  // 回调
  onSubmit: (values: T) => void | Promise<void>;
  onCancel?: () => void;
  onChange?: (values: Partial<T>, changedField: string) => void;
  
  // 样式
  title?: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  
  // 功能
  resetOnSubmit?: boolean;
  confirmOnCancel?: boolean;
  confirmText?: string;
  
  // 模态框
  modal?: boolean;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function DynamicForm<T extends Record<string, any>>({
  fields,
  tabs,
  initialValues = {},
  loading = false,
  validationSchema,
  onSubmit,
  onCancel,
  onChange,
  title,
  description,
  submitText = '保存',
  cancelText = '取消',
  className = '',
  layout = 'vertical',
  columns = 1,
  resetOnSubmit = true,
  confirmOnCancel = false,
  confirmText = '确定要取消吗？未保存的更改将会丢失。',
  modal = false,
  modalSize = 'md',
}: DynamicFormProps<T>) {
  // 状态
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key || 'default');
  
  // 表单控制器
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
    setValue,
    watch,
    getValues,
  } = useForm<T>({
    defaultValues: initialValues as T,
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
  });

  // 监听表单值变化
  const watchedValues = watch();
  
  useEffect(() => {
    if (onChange) {
      const changedField = Object.keys(dirtyFields)[0];
      if (changedField) {
        onChange(watchedValues, changedField);
      }
    }
  }, [watchedValues, dirtyFields, onChange]);

  // 处理提交
  const handleFormSubmit = useCallback(async (values: T) => {
    try {
      await onSubmit(values);
      if (resetOnSubmit) {
        reset(values);
      }
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  }, [onSubmit, reset, resetOnSubmit]);

  // 处理取消
  const handleCancel = useCallback(() => {
    if (isDirty && confirmOnCancel) {
      setCancelDialogOpen(true);
    } else if (onCancel) {
      onCancel();
    }
  }, [isDirty, confirmOnCancel, onCancel]);

  const confirmCancel = useCallback(() => {
    setCancelDialogOpen(false);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // 切换密码显示
  const togglePasswordVisibility = useCallback((fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  }, []);

  // 渲染字段
  const renderField = useCallback((field: FormFieldConfig) => {
    const { name, label, type, placeholder, required, disabled, description, options, 
            accept, multiple, rows, min, max, step, validation, render } = field;
    
    const hasError = errors[name];
    const errorMessage = errors[name]?.message as string;
    
    // 自定义渲染
    if (render) {
      return (
        <Controller
          name={name as any}
          control={control}
          render={({ field: controllerField }) => render(controllerField, formState)}
        />
      );
    }

    // 根据类型渲染不同字段
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
      case 'number':
      case 'date':
      case 'datetime-local':
      case 'time':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Input
                    {...controllerField}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    max={max}
                    step={step}
                    className={hasError ? 'border-red-500' : ''}
                  />
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'password':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...controllerField}
                      type={showPassword[name] ? 'text' : 'password'}
                      placeholder={placeholder}
                      disabled={disabled}
                      className={hasError ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => togglePasswordVisibility(name)}
                    >
                      {showPassword[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Textarea
                    {...controllerField}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows || 4}
                    className={hasError ? 'border-red-500' : ''}
                  />
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <Select
                  value={controllerField.value}
                  onValueChange={controllerField.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                      <SelectValue placeholder={placeholder || '请选择'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'multiselect':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${name}-${option.value}`}
                          checked={Array.isArray(controllerField.value) && controllerField.value.includes(option.value)}
                          onCheckedChange={(checked) => {
                            const currentValue = Array.isArray(controllerField.value) ? controllerField.value : [];
                            if (checked) {
                              controllerField.onChange([...currentValue, option.value]);
                            } else {
                              controllerField.onChange(currentValue.filter((v: any) => v !== option.value));
                            }
                          }}
                          disabled={disabled}
                        />
                        <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`${name}-${option.value}`}
                          value={option.value}
                          checked={controllerField.value === option.value}
                          onChange={() => controllerField.onChange(option.value)}
                          disabled={disabled}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={!!controllerField.value}
                    onCheckedChange={controllerField.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{label}</FormLabel>
                  {description && <FormDescription>{description}</FormDescription>}
                </div>
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'file':
        return (
          <Controller
            name={name as any}
            control={control}
            render={({ field: controllerField }) => (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    disabled={disabled}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        controllerField.onChange(multiple ? Array.from(files) : files[0]);
                      }
                    }}
                    className={hasError ? 'border-red-500' : ''}
                  />
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage>{errorMessage}</FormMessage>
              </FormItem>
            )}
          />
        );

      case 'custom':
        // 自定义字段类型，通过render属性处理
        return null;

      default:
        return null;
    }
  }, [control, errors, showPassword, togglePasswordVisibility]);

  // 渲染表单内容
  const renderFormContent = () => {
    // 如果有标签页配置
    if (tabs && tabs.length > 0) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="space-y-4">
              {tab.fields.map((field) => (
                <div key={field.name} className={layout === 'grid' ? `col-span-${12 / columns}` : ''}>
                  {renderField(field)}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    // 普通表单布局
    const formFields = layout === 'grid' 
      ? Array.from({ length: Math.ceil(fields.length / columns) }, (_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-12 gap-4">
            {fields.slice(rowIndex * columns, (rowIndex + 1) * columns).map((field) => (
              <div key={field.name} className={`col-span-${12 / columns}`}>
                {renderField(field)}
              </div>
            ))}
          </div>
        ))
      : fields.map((field) => (
          <div key={field.name}>
            {renderField(field)}
          </div>
        ));

    return <div className="space-y-4">{formFields}</div>;
  };

  // 渲染表单
  const formElement = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>
      )}

      {renderFormContent()}

      <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            {cancelText}
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? '保存中...' : submitText}
        </Button>
      </div>
    </form>
  );

  // 如果是模态框形式
  if (modal) {
    const modalSizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    };

    return (
      <>
        <Dialog open={true} onOpenChange={handleCancel}>
          <DialogContent className={modalSizeClasses[modalSize]}>
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {formElement}
          </DialogContent>
        </Dialog>

        {/* 取消确认对话框 */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认取消</DialogTitle>
              <DialogDescription>
                {confirmText}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                继续编辑
              </Button>
              <Button variant="outline" onClick={confirmCancel}>
                确认取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 普通表单形式
  return (
    <>
      {formElement}

      {/* 取消确认对话框 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认取消</DialogTitle>
            <DialogDescription>
              {confirmText}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              继续编辑
            </Button>
            <Button variant="outline" onClick={confirmCancel}>
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DynamicForm;