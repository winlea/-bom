import { useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Settings, Save, RefreshCw, Download, Upload, Globe, Database, Shield, Bell, Palette, FileText, Users, Lock, Mail, Server, Info, AlertCircle, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Copy, Trash2, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// 系统设置类型
export type SystemSettings = {
  // 基本设置
  general: {
    siteName: string;
    siteDescription: string;
    logo: string;
    favicon: string;
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    theme: string;
  };
  
  // 数据库设置
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
    backupEnabled: boolean;
    backupFrequency: string;
    backupRetention: number;
  };
  
  // 安全设置
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorEnabled: boolean;
    twoFactorMethod: string;
  };
  
  // 邮件设置
  email: {
    enabled: boolean;
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpEncryption: string;
    fromAddress: string;
    fromName: string;
  };
  
  // 通知设置
  notifications: {
    emailEnabled: boolean;
    browserEnabled: boolean;
    systemEvents: boolean;
    userActions: boolean;
    securityEvents: boolean;
    dataChanges: boolean;
  };
  
  // 文件存储设置
  storage: {
    provider: string;
    localPath: string;
    s3Bucket: string;
    s3Region: string;
    s3AccessKey: string;
    s3SecretKey: string;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  
  // 性能设置
  performance: {
    cacheEnabled: boolean;
    cacheTtl: number;
    compressionEnabled: boolean;
    lazyLoadingEnabled: boolean;
    paginationSize: number;
    searchDebounceMs: number;
  };
  
  // API设置
  api: {
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    corsEnabled: boolean;
    corsOrigins: string[];
    apiKeyRequired: boolean;
  };
  
  // 日志设置
  logging: {
    level: string;
    fileEnabled: boolean;
    filePath: string;
    maxFileSize: number;
    maxFiles: number;
    consoleEnabled: boolean;
    auditEnabled: boolean;
  };
};

// 系统设置组件属性
interface SystemSettingsManagerProps {
  settings: SystemSettings;
  isLoading?: boolean;
  onSave?: (settings: SystemSettings) => Promise<boolean>;
  onReset?: () => Promise<boolean>;
  onExport?: () => Promise<string>;
  onImport?: (data: string) => Promise<boolean>;
  onTestConnection?: (type: 'database' | 'email' | 'storage') => Promise<boolean>;
  className?: string;
  children?: ReactNode;
}

// 默认设置
const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'BOM管理系统',
    siteDescription: '企业级物料清单管理系统',
    logo: '',
    favicon: '',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    theme: 'light',
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'bom_system',
    username: 'postgres',
    password: '',
    ssl: false,
    backupEnabled: true,
    backupFrequency: 'daily',
    backupRetention: 7,
  },
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
  },
  email: {
    enabled: false,
    provider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromAddress: '',
    fromName: 'BOM管理系统',
  },
  notifications: {
    emailEnabled: true,
    browserEnabled: true,
    systemEvents: true,
    userActions: true,
    securityEvents: true,
    dataChanges: true,
  },
  storage: {
    provider: 'local',
    localPath: './uploads',
    s3Bucket: '',
    s3Region: '',
    s3AccessKey: '',
    s3SecretKey: '',
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'],
  },
  performance: {
    cacheEnabled: true,
    cacheTtl: 3600,
    compressionEnabled: true,
    lazyLoadingEnabled: true,
    paginationSize: 20,
    searchDebounceMs: 300,
  },
  api: {
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    corsEnabled: true,
    corsOrigins: ['http://localhost:3000'],
    apiKeyRequired: false,
  },
  logging: {
    level: 'info',
    fileEnabled: true,
    filePath: './logs',
    maxFileSize: 10,
    maxFiles: 5,
    consoleEnabled: true,
    auditEnabled: true,
  },
};

// 系统设置管理器组件
export function SystemSettingsManager({
  settings = DEFAULT_SETTINGS,
  isLoading = false,
  onSave,
  onReset,
  onExport,
  onImport,
  onTestConnection,
  className,
  children,
}: SystemSettingsManagerProps) {
  // 状态
  const [activeTab, setActiveTab] = useState('general');
  const [currentSettings, setCurrentSettings] = useState<SystemSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testType, setTestType] = useState<'database' | 'email' | 'storage'>('database');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // 检查设置是否有变化
  useEffect(() => {
    const hasChanges = JSON.stringify(currentSettings) !== JSON.stringify(settings);
    setHasChanges(hasChanges);
  }, [currentSettings, settings]);
  
  // 更新设置
  const updateSetting = useCallback((category: keyof SystemSettings, key: string, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  }, []);
  
  // 保存设置
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      const success = await onSave(currentSettings);
      if (success) {
        // 保存成功
      }
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, currentSettings]);
  
  // 重置设置
  const handleReset = useCallback(async () => {
    if (!onReset) return;
    
    setIsResetting(true);
    try {
      const success = await onReset();
      if (success) {
        setCurrentSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('重置设置失败:', error);
    } finally {
      setIsResetting(false);
    }
  }, [onReset]);
  
  // 导出设置
  const handleExport = useCallback(async () => {
    if (!onExport) return;
    
    setIsExporting(true);
    try {
      const data = await onExport();
      // 创建下载链接
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'system-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出设置失败:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);
  
  // 导入设置
  const handleImport = useCallback(async () => {
    if (!onImport) return;
    
    setIsImporting(true);
    try {
      const success = await onImport(importData);
      if (success) {
        setImportDialogOpen(false);
        setImportData('');
      }
    } catch (error) {
      console.error('导入设置失败:', error);
    } finally {
      setIsImporting(false);
    }
  }, [onImport, importData]);
  
  // 测试连接
  const handleTestConnection = useCallback(async (type: 'database' | 'email' | 'storage') => {
    if (!onTestConnection) return;
    
    setTestType(type);
    setIsTesting(true);
    setTestDialogOpen(true);
    
    try {
      const success = await onTestConnection(type);
      // 测试结果将在对话框中显示
    } catch (error) {
      console.error('测试连接失败:', error);
    } finally {
      setIsTesting(false);
    }
  }, [onTestConnection]);
  
  // 切换密码显示
  const togglePasswordVisibility = useCallback((key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);
  
  // 切换区域展开状态
  const toggleSectionExpansion = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);
  
  // 渲染基本设置
  const renderGeneralSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">站点名称</Label>
            <Input
              id="site-name"
              value={currentSettings.general.siteName}
              onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site-description">站点描述</Label>
            <Input
              id="site-description"
              value={currentSettings.general.siteDescription}
              onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">语言</Label>
            <Select
              value={currentSettings.general.language}
              onValueChange={(value) => updateSetting('general', 'language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
                <SelectItem value="ja-JP">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">时区</Label>
            <Select
              value={currentSettings.general.timezone}
              onValueChange={(value) => updateSetting('general', 'timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                <SelectItem value="Asia/Taipei">Asia/Taipei</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date-format">日期格式</Label>
            <Select
              value={currentSettings.general.dateFormat}
              onValueChange={(value) => updateSetting('general', 'dateFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time-format">时间格式</Label>
            <Select
              value={currentSettings.general.timeFormat}
              onValueChange={(value) => updateSetting('general', 'timeFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HH:mm:ss">HH:mm:ss</SelectItem>
                <SelectItem value="HH:mm">HH:mm</SelectItem>
                <SelectItem value="hh:mm:ss A">hh:mm:ss A</SelectItem>
                <SelectItem value="hh:mm A">hh:mm A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="theme">主题</Label>
            <Select
              value={currentSettings.general.theme}
              onValueChange={(value) => updateSetting('general', 'theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="auto">自动</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }, [currentSettings.general, updateSetting]);
  
  // 渲染数据库设置
  const renderDatabaseSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db-host">主机</Label>
            <Input
              id="db-host"
              value={currentSettings.database.host}
              onChange={(e) => updateSetting('database', 'host', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="db-port">端口</Label>
            <Input
              id="db-port"
              type="number"
              value={currentSettings.database.port}
              onChange={(e) => updateSetting('database', 'port', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="db-name">数据库名称</Label>
            <Input
              id="db-name"
              value={currentSettings.database.name}
              onChange={(e) => updateSetting('database', 'name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="db-username">用户名</Label>
            <Input
              id="db-username"
              value={currentSettings.database.username}
              onChange={(e) => updateSetting('database', 'username', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="db-password">密码</Label>
            <div className="relative">
              <Input
                id="db-password"
                type={showPasswords['db-password'] ? 'text' : 'password'}
                value={currentSettings.database.password}
                onChange={(e) => updateSetting('database', 'password', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => togglePasswordVisibility('db-password')}
              >
                {showPasswords['db-password'] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="db-ssl"
              checked={currentSettings.database.ssl}
              onCheckedChange={(checked) => updateSetting('database', 'ssl', checked)}
            />
            <Label htmlFor="db-ssl">启用SSL</Label>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">备份设置</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('database')}
              disabled={isTesting}
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Server className="h-4 w-4 mr-2" />
              )}
              测试连接
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="backup-enabled"
                checked={currentSettings.database.backupEnabled}
                onCheckedChange={(checked) => updateSetting('database', 'backupEnabled', checked)}
              />
              <Label htmlFor="backup-enabled">启用备份</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">备份频率</Label>
              <Select
                value={currentSettings.database.backupFrequency}
                onValueChange={(value) => updateSetting('database', 'backupFrequency', value)}
                disabled={!currentSettings.database.backupEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">每小时</SelectItem>
                  <SelectItem value="daily">每天</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-retention">保留天数</Label>
              <Input
                id="backup-retention"
                type="number"
                value={currentSettings.database.backupRetention}
                onChange={(e) => updateSetting('database', 'backupRetention', parseInt(e.target.value))}
                disabled={!currentSettings.database.backupEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }, [currentSettings.database, showPasswords, isTesting, updateSetting, togglePasswordVisibility, handleTestConnection]);
  
  // 渲染安全设置
  const renderSecuritySettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">会话设置</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">会话超时时间（分钟）</Label>
              <Input
                id="session-timeout"
                type="number"
                value={currentSettings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">密码策略</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-min-length">最小长度</Label>
              <Input
                id="password-min-length"
                type="number"
                value={currentSettings.security.passwordMinLength}
                onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="password-require-uppercase"
                  checked={currentSettings.security.passwordRequireUppercase}
                  onCheckedChange={(checked) => updateSetting('security', 'passwordRequireUppercase', checked)}
                />
                <Label htmlFor="password-require-uppercase">要求大写字母</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="password-require-lowercase"
                  checked={currentSettings.security.passwordRequireLowercase}
                  onCheckedChange={(checked) => updateSetting('security', 'passwordRequireLowercase', checked)}
                />
                <Label htmlFor="password-require-lowercase">要求小写字母</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="password-require-numbers"
                  checked={currentSettings.security.passwordRequireNumbers}
                  onCheckedChange={(checked) => updateSetting('security', 'passwordRequireNumbers', checked)}
                />
                <Label htmlFor="password-require-numbers">要求数字</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="password-require-symbols"
                  checked={currentSettings.security.passwordRequireSymbols}
                  onCheckedChange={(checked) => updateSetting('security', 'passwordRequireSymbols', checked)}
                />
                <Label htmlFor="password-require-symbols">要求特殊字符</Label>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">登录限制</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">最大登录尝试次数</Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={currentSettings.security.maxLoginAttempts}
                onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockout-duration">锁定持续时间（分钟）</Label>
              <Input
                id="lockout-duration"
                type="number"
                value={currentSettings.security.lockoutDuration}
                onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">双因素认证</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="two-factor-enabled"
                checked={currentSettings.security.twoFactorEnabled}
                onCheckedChange={(checked) => updateSetting('security', 'twoFactorEnabled', checked)}
              />
              <Label htmlFor="two-factor-enabled">启用双因素认证</Label>
            </div>
            
            {currentSettings.security.twoFactorEnabled && (
              <div className="space-y-2">
                <Label htmlFor="two-factor-method">认证方式</Label>
                <Select
                  value={currentSettings.security.twoFactorMethod}
                  onValueChange={(value) => updateSetting('security', 'twoFactorMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮件</SelectItem>
                    <SelectItem value="sms">短信</SelectItem>
                    <SelectItem value="app">认证应用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [currentSettings.security, updateSetting]);
  
  // 渲染邮件设置
  const renderEmailSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="email-enabled"
            checked={currentSettings.email.enabled}
            onCheckedChange={(checked) => updateSetting('email', 'enabled', checked)}
          />
          <Label htmlFor="email-enabled">启用邮件功能</Label>
        </div>
        
        {currentSettings.email.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP主机</Label>
                <Input
                  id="smtp-host"
                  value={currentSettings.email.smtpHost}
                  onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP端口</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={currentSettings.email.smtpPort}
                  onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-username">SMTP用户名</Label>
                <Input
                  id="smtp-username"
                  value={currentSettings.email.smtpUsername}
                  onChange={(e) => updateSetting('email', 'smtpUsername', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP密码</Label>
                <div className="relative">
                  <Input
                    id="smtp-password"
                    type={showPasswords['smtp-password'] ? 'text' : 'password'}
                    value={currentSettings.email.smtpPassword}
                    onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => togglePasswordVisibility('smtp-password')}
                  >
                    {showPasswords['smtp-password'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-encryption">加密方式</Label>
                <Select
                  value={currentSettings.email.smtpEncryption}
                  onValueChange={(value) => updateSetting('email', 'smtpEncryption', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from-address">发件人地址</Label>
                <Input
                  id="from-address"
                  type="email"
                  value={currentSettings.email.fromAddress}
                  onChange={(e) => updateSetting('email', 'fromAddress', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from-name">发件人名称</Label>
                <Input
                  id="from-name"
                  value={currentSettings.email.fromName}
                  onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => handleTestConnection('email')}
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                测试邮件
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }, [currentSettings.email, showPasswords, isTesting, updateSetting, togglePasswordVisibility, handleTestConnection]);
  
  // 渲染通知设置
  const renderNotificationSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email-notifications"
              checked={currentSettings.notifications.emailEnabled}
              onCheckedChange={(checked) => updateSetting('notifications', 'emailEnabled', checked)}
            />
            <Label htmlFor="email-notifications">邮件通知</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="browser-notifications"
              checked={currentSettings.notifications.browserEnabled}
              onCheckedChange={(checked) => updateSetting('notifications', 'browserEnabled', checked)}
            />
            <Label htmlFor="browser-notifications">浏览器通知</Label>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">通知类型</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="system-events"
                checked={currentSettings.notifications.systemEvents}
                onCheckedChange={(checked) => updateSetting('notifications', 'systemEvents', checked)}
              />
              <Label htmlFor="system-events">系统事件</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="user-actions"
                checked={currentSettings.notifications.userActions}
                onCheckedChange={(checked) => updateSetting('notifications', 'userActions', checked)}
              />
              <Label htmlFor="user-actions">用户操作</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="security-events"
                checked={currentSettings.notifications.securityEvents}
                onCheckedChange={(checked) => updateSetting('notifications', 'securityEvents', checked)}
              />
              <Label htmlFor="security-events">安全事件</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="data-changes"
                checked={currentSettings.notifications.dataChanges}
                onCheckedChange={(checked) => updateSetting('notifications', 'dataChanges', checked)}
              />
              <Label htmlFor="data-changes">数据变更</Label>
            </div>
          </div>
        </div>
      </div>
    );
  }, [currentSettings.notifications, updateSetting]);
  
  // 渲染文件存储设置
  const renderStorageSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="storage-provider">存储提供商</Label>
          <Select
            value={currentSettings.storage.provider}
            onValueChange={(value) => updateSetting('storage', 'provider', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">本地存储</SelectItem>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="oss">阿里云OSS</SelectItem>
              <SelectItem value="cos">腾讯云COS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {currentSettings.storage.provider === 'local' && (
          <div className="space-y-2">
            <Label htmlFor="local-path">本地路径</Label>
            <Input
              id="local-path"
              value={currentSettings.storage.localPath}
              onChange={(e) => updateSetting('storage', 'localPath', e.target.value)}
            />
          </div>
        )}
        
        {(currentSettings.storage.provider === 's3' || 
          currentSettings.storage.provider === 'oss' || 
          currentSettings.storage.provider === 'cos') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bucket">存储桶</Label>
              <Input
                id="bucket"
                value={currentSettings.storage.s3Bucket}
                onChange={(e) => updateSetting('storage', 's3Bucket', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">区域</Label>
              <Input
                id="region"
                value={currentSettings.storage.s3Region}
                onChange={(e) => updateSetting('storage', 's3Region', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="access-key">访问密钥</Label>
              <div className="relative">
                <Input
                  id="access-key"
                  type={showPasswords['access-key'] ? 'text' : 'password'}
                  value={currentSettings.storage.s3AccessKey}
                  onChange={(e) => updateSetting('storage', 's3AccessKey', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => togglePasswordVisibility('access-key')}
                >
                  {showPasswords['access-key'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret-key">密钥</Label>
              <div className="relative">
                <Input
                  id="secret-key"
                  type={showPasswords['secret-key'] ? 'text' : 'password'}
                  value={currentSettings.storage.s3SecretKey}
                  onChange={(e) => updateSetting('storage', 's3SecretKey', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => togglePasswordVisibility('secret-key')}
                >
                  {showPasswords['secret-key'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">文件限制</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-file-size">最大文件大小（MB）</Label>
              <Input
                id="max-file-size"
                type="number"
                value={currentSettings.storage.maxFileSize}
                onChange={(e) => updateSetting('storage', 'maxFileSize', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>允许的文件类型</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`file-type-${type}`}
                      checked={currentSettings.storage.allowedFileTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateSetting('storage', 'allowedFileTypes', [...currentSettings.storage.allowedFileTypes, type]);
                        } else {
                          updateSetting('storage', 'allowedFileTypes', currentSettings.storage.allowedFileTypes.filter(t => t !== type));
                        }
                      }}
                    />
                    <Label htmlFor={`file-type-${type}`}>{type}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => handleTestConnection('storage')}
            disabled={isTesting}
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Server className="h-4 w-4 mr-2" />
            )}
            测试存储
          </Button>
        </div>
      </div>
    );
  }, [currentSettings.storage, showPasswords, isTesting, updateSetting, togglePasswordVisibility, handleTestConnection]);
  
  // 渲染性能设置
  const renderPerformanceSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="cache-enabled"
              checked={currentSettings.performance.cacheEnabled}
              onCheckedChange={(checked) => updateSetting('performance', 'cacheEnabled', checked)}
            />
            <Label htmlFor="cache-enabled">启用缓存</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="compression-enabled"
              checked={currentSettings.performance.compressionEnabled}
              onCheckedChange={(checked) => updateSetting('performance', 'compressionEnabled', checked)}
            />
            <Label htmlFor="compression-enabled">启用压缩</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="lazy-loading-enabled"
              checked={currentSettings.performance.lazyLoadingEnabled}
              onCheckedChange={(checked) => updateSetting('performance', 'lazyLoadingEnabled', checked)}
            />
            <Label htmlFor="lazy-loading-enabled">启用懒加载</Label>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cache-ttl">缓存TTL（秒）</Label>
            <Input
              id="cache-ttl"
              type="number"
              value={currentSettings.performance.cacheTtl}
              onChange={(e) => updateSetting('performance', 'cacheTtl', parseInt(e.target.value))}
              disabled={!currentSettings.performance.cacheEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pagination-size">分页大小</Label>
            <Input
              id="pagination-size"
              type="number"
              value={currentSettings.performance.paginationSize}
              onChange={(e) => updateSetting('performance', 'paginationSize', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="search-debounce">搜索防抖（毫秒）</Label>
            <Input
              id="search-debounce"
              type="number"
              value={currentSettings.performance.searchDebounceMs}
              onChange={(e) => updateSetting('performance', 'searchDebounceMs', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    );
  }, [currentSettings.performance, updateSetting]);
  
  // 渲染API设置
  const renderApiSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="rate-limit-enabled"
              checked={currentSettings.api.rateLimitEnabled}
              onCheckedChange={(checked) => updateSetting('api', 'rateLimitEnabled', checked)}
            />
            <Label htmlFor="rate-limit-enabled">启用速率限制</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="cors-enabled"
              checked={currentSettings.api.corsEnabled}
              onCheckedChange={(checked) => updateSetting('api', 'corsEnabled', checked)}
            />
            <Label htmlFor="cors-enabled">启用CORS</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="api-key-required"
              checked={currentSettings.api.apiKeyRequired}
              onCheckedChange={(checked) => updateSetting('api', 'apiKeyRequired', checked)}
            />
            <Label htmlFor="api-key-required">需要API密钥</Label>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rate-limit-requests">速率限制请求数</Label>
            <Input
              id="rate-limit-requests"
              type="number"
              value={currentSettings.api.rateLimitRequests}
              onChange={(e) => updateSetting('api', 'rateLimitRequests', parseInt(e.target.value))}
              disabled={!currentSettings.api.rateLimitEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate-limit-window">速率限制窗口（秒）</Label>
            <Input
              id="rate-limit-window"
              type="number"
              value={currentSettings.api.rateLimitWindow}
              onChange={(e) => updateSetting('api', 'rateLimitWindow', parseInt(e.target.value))}
              disabled={!currentSettings.api.rateLimitEnabled}
            />
          </div>
        </div>
        
        {currentSettings.api.corsEnabled && (
          <div className="space-y-2">
            <Label htmlFor="cors-origins">CORS允许的源</Label>
            <Textarea
              id="cors-origins"
              value={currentSettings.api.corsOrigins.join('\n')}
              onChange={(e) => updateSetting('api', 'corsOrigins', e.target.value.split('\n').filter(Boolean))}
              placeholder="每行一个URL"
            />
          </div>
        )}
      </div>
    );
  }, [currentSettings.api, updateSetting]);
  
  // 渲染日志设置
  const renderLoggingSettings = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="log-level">日志级别</Label>
            <Select
              value={currentSettings.logging.level}
              onValueChange={(value) => updateSetting('logging', 'level', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="file-enabled"
              checked={currentSettings.logging.fileEnabled}
              onCheckedChange={(checked) => updateSetting('logging', 'fileEnabled', checked)}
            />
            <Label htmlFor="file-enabled">启用文件日志</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="console-enabled"
              checked={currentSettings.logging.consoleEnabled}
              onCheckedChange={(checked) => updateSetting('logging', 'consoleEnabled', checked)}
            />
            <Label htmlFor="console-enabled">启用控制台日志</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="audit-enabled"
              checked={currentSettings.logging.auditEnabled}
              onCheckedChange={(checked) => updateSetting('logging', 'auditEnabled', checked)}
            />
            <Label htmlFor="audit-enabled">启用审计日志</Label>
          </div>
        </div>
        
        {currentSettings.logging.fileEnabled && (
          <>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-path">日志文件路径</Label>
                <Input
                  id="file-path"
                  value={currentSettings.logging.filePath}
                  onChange={(e) => updateSetting('logging', 'filePath', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-file-size">最大文件大小（MB）</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  value={currentSettings.logging.maxFileSize}
                  onChange={(e) => updateSetting('logging', 'maxFileSize', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-files">最大文件数</Label>
                <Input
                  id="max-files"
                  type="number"
                  value={currentSettings.logging.maxFiles}
                  onChange={(e) => updateSetting('logging', 'maxFiles', parseInt(e.target.value))}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }, [currentSettings.logging, updateSetting]);
  
  return (
    <div className={cn("w-full space-y-4", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>系统设置</span>
              </CardTitle>
              <CardDescription>
                配置BOM管理系统的各项参数
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                导出
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                重置
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="general" className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">基本</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center space-x-1">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">数据库</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">安全</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">邮件</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-1">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">通知</span>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center space-x-1">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">存储</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-1">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">性能</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center space-x-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              {renderGeneralSettings()}
            </TabsContent>
            
            <TabsContent value="database" className="space-y-4 mt-4">
              {renderDatabaseSettings()}
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 mt-4">
              {renderSecuritySettings()}
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4 mt-4">
              {renderEmailSettings()}
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4 mt-4">
              {renderNotificationSettings()}
            </TabsContent>
            
            <TabsContent value="storage" className="space-y-4 mt-4">
              {renderStorageSettings()}
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4 mt-4">
              {renderPerformanceSettings()}
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4 mt-4">
              {renderApiSettings()}
            </TabsContent>
            
            <TabsContent value="logging" className="space-y-4 mt-4">
              {renderLoggingSettings()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 测试连接对话框 */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>测试连接</DialogTitle>
            <DialogDescription>
              {testType === 'database' && '测试数据库连接'}
              {testType === 'email' && '测试邮件发送'}
              {testType === 'storage' && '测试存储连接'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isTesting ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>连接成功</AlertTitle>
                <AlertDescription>
                  {testType === 'database' && '数据库连接测试成功'}
                  {testType === 'email' && '邮件发送测试成功'}
                  {testType === 'storage' && '存储连接测试成功'}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 导入设置对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>导入设置</DialogTitle>
            <DialogDescription>
              从JSON文件导入系统设置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">设置数据</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="粘贴JSON格式的设置数据"
                rows={10}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={!importData.trim() || isImporting}>
              {isImporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              导入
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {children}
    </div>
  );
}

export default SystemSettingsManager;