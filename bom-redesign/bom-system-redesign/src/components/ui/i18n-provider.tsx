import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Globe, Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 语言定义接口
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  rtl?: boolean;
}

// 翻译键值对接口
export interface Translations {
  [key: string]: string | Translations;
}

// 国际化上下文接口
interface I18nContextType {
  currentLanguage: string;
  languages: Language[];
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLanguage: (languageCode: string) => void;
  addTranslations: (languageCode: string, translations: Translations) => void;
  setLanguages: (languages: Language[]) => void;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  isRTL: boolean;
}

// 默认语言配置
const defaultLanguages: Language[] = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

// 默认翻译
const defaultTranslations: Record<string, Translations> = {
  'zh-CN': {
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      submit: '提交',
      reset: '重置',
      close: '关闭',
      yes: '是',
      no: '否',
      ok: '确定',
      retry: '重试',
      refresh: '刷新',
      export: '导出',
      import: '导入',
      view: '查看',
      download: '下载',
      upload: '上传',
      copy: '复制',
      paste: '粘贴',
      cut: '剪切',
      select: '选择',
      clear: '清空',
      apply: '应用',
      filter: '筛选',
      sort: '排序',
      settings: '设置',
      profile: '个人资料',
      logout: '退出登录',
      login: '登录',
      register: '注册',
      dashboard: '仪表板',
      home: '首页',
      about: '关于',
      help: '帮助',
      contact: '联系',
    },
    navigation: {
      projects: '项目管理',
      parts: '零件管理',
      dimensions: '尺寸管理',
      import: '导入数据',
      reports: '报表',
      odsGenerator: 'ODS生成器',
      admin: '系统管理',
    },
    project: {
      title: '项目管理',
      create: '创建项目',
      edit: '编辑项目',
      delete: '删除项目',
      name: '项目名称',
      description: '项目描述',
      status: '状态',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      createdBy: '创建者',
      active: '进行中',
      completed: '已完成',
      archived: '已归档',
      noProjects: '暂无项目',
      projectDetails: '项目详情',
    },
    part: {
      title: '零件管理',
      create: '创建零件',
      edit: '编辑零件',
      delete: '删除零件',
      name: '零件名称',
      code: '零件编码',
      description: '零件描述',
      category: '分类',
      quantity: '数量',
      unit: '单位',
      price: '价格',
      supplier: '供应商',
      project: '所属项目',
      noParts: '暂无零件',
      partDetails: '零件详情',
    },
    dimension: {
      title: '尺寸管理',
      create: '创建尺寸',
      edit: '编辑尺寸',
      delete: '删除尺寸',
      name: '尺寸名称',
      value: '尺寸值',
      unit: '单位',
      tolerance: '公差',
      part: '所属零件',
      noDimensions: '暂无尺寸',
      dimensionDetails: '尺寸详情',
    },
    import: {
      title: '导入数据',
      selectFile: '选择文件',
      dragDrop: '拖放文件到此处',
      supportedFormats: '支持的格式: Excel, CSV',
      importSuccess: '导入成功',
      importError: '导入失败',
      processing: '正在处理...',
      preview: '预览',
      mapping: '字段映射',
      validation: '数据验证',
      results: '导入结果',
      totalRecords: '总记录数',
      successCount: '成功数量',
      errorCount: '错误数量',
      downloadTemplate: '下载模板',
    },
    error: {
      pageNotFound: '页面未找到',
      serverError: '服务器错误',
      networkError: '网络错误',
      validationError: '验证错误',
      unknownError: '未知错误',
      tryAgain: '请重试',
      contactSupport: '联系技术支持',
      errorDetails: '错误详情',
      errorId: '错误ID',
    },
    validation: {
      required: '此字段为必填项',
      minLength: '最少需要 {{min}} 个字符',
      maxLength: '最多允许 {{max}} 个字符',
      email: '请输入有效的邮箱地址',
      phone: '请输入有效的电话号码',
      number: '请输入有效的数字',
      url: '请输入有效的URL',
      date: '请输入有效的日期',
      positive: '请输入正数',
      integer: '请输入整数',
      range: '值应在 {{min}} 到 {{max}} 之间',
      pattern: '格式不正确',
      unique: '此值已存在',
      match: '两次输入不一致',
    },
  },
  'en-US': {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      retry: 'Retry',
      refresh: 'Refresh',
      export: 'Export',
      import: 'Import',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      copy: 'Copy',
      paste: 'Paste',
      cut: 'Cut',
      select: 'Select',
      clear: 'Clear',
      apply: 'Apply',
      filter: 'Filter',
      sort: 'Sort',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      home: 'Home',
      about: 'About',
      help: 'Help',
      contact: 'Contact',
    },
    navigation: {
      projects: 'Projects',
      parts: 'Parts',
      dimensions: 'Dimensions',
      import: 'Import',
      reports: 'Reports',
      odsGenerator: 'ODS Generator',
      admin: 'Admin',
    },
    project: {
      title: 'Project Management',
      create: 'Create Project',
      edit: 'Edit Project',
      delete: 'Delete Project',
      name: 'Project Name',
      description: 'Description',
      status: 'Status',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      createdBy: 'Created By',
      active: 'Active',
      completed: 'Completed',
      archived: 'Archived',
      noProjects: 'No projects found',
      projectDetails: 'Project Details',
    },
    part: {
      title: 'Part Management',
      create: 'Create Part',
      edit: 'Edit Part',
      delete: 'Delete Part',
      name: 'Part Name',
      code: 'Part Code',
      description: 'Description',
      category: 'Category',
      quantity: 'Quantity',
      unit: 'Unit',
      price: 'Price',
      supplier: 'Supplier',
      project: 'Project',
      noParts: 'No parts found',
      partDetails: 'Part Details',
    },
    dimension: {
      title: 'Dimension Management',
      create: 'Create Dimension',
      edit: 'Edit Dimension',
      delete: 'Delete Dimension',
      name: 'Dimension Name',
      value: 'Value',
      unit: 'Unit',
      tolerance: 'Tolerance',
      part: 'Part',
      noDimensions: 'No dimensions found',
      dimensionDetails: 'Dimension Details',
    },
    import: {
      title: 'Import Data',
      selectFile: 'Select File',
      dragDrop: 'Drag and drop file here',
      supportedFormats: 'Supported formats: Excel, CSV',
      importSuccess: 'Import successful',
      importError: 'Import failed',
      processing: 'Processing...',
      preview: 'Preview',
      mapping: 'Field Mapping',
      validation: 'Data Validation',
      results: 'Import Results',
      totalRecords: 'Total Records',
      successCount: 'Success Count',
      errorCount: 'Error Count',
      downloadTemplate: 'Download Template',
    },
    error: {
      pageNotFound: 'Page Not Found',
      serverError: 'Server Error',
      networkError: 'Network Error',
      validationError: 'Validation Error',
      unknownError: 'Unknown Error',
      tryAgain: 'Please try again',
      contactSupport: 'Contact Support',
      errorDetails: 'Error Details',
      errorId: 'Error ID',
    },
    validation: {
      required: 'This field is required',
      minLength: 'Must be at least {{min}} characters',
      maxLength: 'Must be at most {{max}} characters',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      number: 'Please enter a valid number',
      url: 'Please enter a valid URL',
      date: 'Please enter a valid date',
      positive: 'Please enter a positive number',
      integer: 'Please enter an integer',
      range: 'Value must be between {{min}} and {{max}}',
      pattern: 'Invalid format',
      unique: 'This value already exists',
      match: 'Values do not match',
    },
  },
  'ja-JP': {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
      search: '検索',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      warning: '警告',
      info: '情報',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      reset: 'リセット',
      close: '閉じる',
      yes: 'はい',
      no: 'いいえ',
      ok: 'OK',
      retry: '再試行',
      refresh: '更新',
      export: 'エクスポート',
      import: 'インポート',
      view: '表示',
      download: 'ダウンロード',
      upload: 'アップロード',
      copy: 'コピー',
      paste: '貼り付け',
      cut: '切り取り',
      select: '選択',
      clear: 'クリア',
      apply: '適用',
      filter: 'フィルター',
      sort: 'ソート',
      settings: '設定',
      profile: 'プロフィール',
      logout: 'ログアウト',
      login: 'ログイン',
      register: '登録',
      dashboard: 'ダッシュボード',
      home: 'ホーム',
      about: 'について',
      help: 'ヘルプ',
      contact: '連絡先',
    },
    navigation: {
      projects: 'プロジェクト',
      parts: '部品',
      dimensions: '寸法',
      import: 'インポート',
      reports: 'レポート',
      odsGenerator: 'ODSジェネレーター',
      admin: '管理',
    },
    project: {
      title: 'プロジェクト管理',
      create: 'プロジェクト作成',
      edit: 'プロジェクト編集',
      delete: 'プロジェクト削除',
      name: 'プロジェクト名',
      description: '説明',
      status: 'ステータス',
      createdAt: '作成日時',
      updatedAt: '更新日時',
      createdBy: '作成者',
      active: 'アクティブ',
      completed: '完了',
      archived: 'アーカイブ',
      noProjects: 'プロジェクトが見つかりません',
      projectDetails: 'プロジェクト詳細',
    },
    part: {
      title: '部品管理',
      create: '部品作成',
      edit: '部品編集',
      delete: '部品削除',
      name: '部品名',
      code: '部品コード',
      description: '説明',
      category: 'カテゴリ',
      quantity: '数量',
      unit: '単位',
      price: '価格',
      supplier: 'サプライヤー',
      project: 'プロジェクト',
      noParts: '部品が見つかりません',
      partDetails: '部品詳細',
    },
    dimension: {
      title: '寸法管理',
      create: '寸法作成',
      edit: '寸法編集',
      delete: '寸法削除',
      name: '寸法名',
      value: '値',
      unit: '単位',
      tolerance: '公差',
      part: '部品',
      noDimensions: '寸法が見つかりません',
      dimensionDetails: '寸法詳細',
    },
    import: {
      title: 'データインポート',
      selectFile: 'ファイル選択',
      dragDrop: 'ここにファイルをドラッグ＆ドロップ',
      supportedFormats: '対応フォーマット: Excel, CSV',
      importSuccess: 'インポート成功',
      importError: 'インポート失敗',
      processing: '処理中...',
      preview: 'プレビュー',
      mapping: 'フィールドマッピング',
      validation: 'データ検証',
      results: 'インポート結果',
      totalRecords: '総レコード数',
      successCount: '成功数',
      errorCount: 'エラー数',
      downloadTemplate: 'テンプレートダウンロード',
    },
    error: {
      pageNotFound: 'ページが見つかりません',
      serverError: 'サーバーエラー',
      networkError: 'ネットワークエラー',
      validationError: '検証エラー',
      unknownError: '不明なエラー',
      tryAgain: 'もう一度お試しください',
      contactSupport: 'サポートに連絡',
      errorDetails: 'エラー詳細',
      errorId: 'エラーID',
    },
    validation: {
      required: 'この項目は必須です',
      minLength: '最低{{min}}文字必要です',
      maxLength: '最大{{max}}文字までです',
      email: '有効なメールアドレスを入力してください',
      phone: '有効な電話番号を入力してください',
      number: '有効な数字を入力してください',
      url: '有効なURLを入力してください',
      date: '有効な日付を入力してください',
      positive: '正の数を入力してください',
      integer: '整数を入力してください',
      range: '値は{{min}}から{{max}}の間である必要があります',
      pattern: '形式が正しくありません',
      unique: 'この値は既に存在します',
      match: '値が一致しません',
    },
  },
};

// 国际化上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 国际化提供者组件
export function I18nProvider({ 
  children, 
  defaultLanguage = 'zh-CN',
  languages = defaultLanguages,
  translations = defaultTranslations 
}: {
  children: ReactNode;
  defaultLanguage?: string;
  languages?: Language[];
  translations?: Record<string, Translations>;
}) {
  // 状态
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [availableLanguages, setAvailableLanguages] = useState(languages);
  const [availableTranslations, setAvailableTranslations] = useState(translations);

  // 获取嵌套对象的值
  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((o, p) => o && o[p], obj) || path;
  };

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(availableTranslations[currentLanguage], key);
    
    if (!translation || translation === key) {
      // 如果当前语言没有翻译，尝试使用默认语言
      const fallbackTranslation = getNestedValue(availableTranslations[defaultLanguage], key);
      if (fallbackTranslation && fallbackTranslation !== key) {
        return replaceParams(fallbackTranslation, params);
      }
    }
    
    return replaceParams(translation, params);
  };

  // 替换翻译中的参数
  const replaceParams = (text: string, params?: Record<string, string | number>): string => {
    if (!params) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param]?.toString() || match;
    });
  };

  // 切换语言
  const changeLanguage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    
    // 保存到本地存储
    try {
      localStorage.setItem('language', languageCode);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
    
    // 更新HTML lang属性
    document.documentElement.lang = languageCode;
    
    // 更新HTML dir属性（RTL支持）
    const language = availableLanguages.find(lang => lang.code === languageCode);
    if (language?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  // 添加翻译
  const addTranslations = (languageCode: string, newTranslations: Translations) => {
    setAvailableTranslations(prev => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        ...newTranslations,
      },
    }));
  };

  // 设置可用语言
  const setLanguages = (newLanguages: Language[]) => {
    setAvailableLanguages(newLanguages);
  };

  // 格式化日期
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat(currentLanguage, { ...defaultOptions, ...options }).format(dateObj);
  };

  // 格式化数字
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  };

  // 格式化货币
  const formatCurrency = (amount: number, currency = 'CNY'): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // 检查是否为RTL语言
  const isRTL = availableLanguages.find(lang => lang.code === currentLanguage)?.rtl || false;

  // 初始化语言设置
  useEffect(() => {
    // 从本地存储获取语言偏好
    try {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
        changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  }, []);

  const value: I18nContextType = {
    currentLanguage,
    languages: availableLanguages,
    t,
    changeLanguage,
    addTranslations,
    setLanguages,
    formatDate,
    formatNumber,
    formatCurrency,
    isRTL,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// 使用国际化的Hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 语言选择器组件
export function LanguageSelector() {
  const { currentLanguage, languages, changeLanguage } = useI18n();
  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.nativeName}</span>
          <span className="sm:hidden">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center space-x-2"
          >
            <span>{language.flag}</span>
            <span>{language.nativeName}</span>
            {language.code === currentLanguage && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 翻译编辑器组件
export function TranslationEditor() {
  const { languages, t, addTranslations } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]?.code || '');
  const [translationKey, setTranslationKey] = useState('');
  const [translationValue, setTranslationValue] = useState('');

  const handleAddTranslation = () => {
    if (translationKey && translationValue && selectedLanguage) {
      // 将嵌套键转换为对象
      const keys = translationKey.split('.');
      const translation: any = {};
      
      let current = translation;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = translationValue;
      
      addTranslations(selectedLanguage, translation);
      
      // 重置表单
      setTranslationKey('');
      setTranslationValue('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">翻译编辑</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Languages className="h-5 w-5" />
            <span>翻译编辑器</span>
          </DialogTitle>
          <DialogDescription>
            添加或修改翻译内容
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">语言</Label>
            <select
              id="language"
              className="w-full p-2 border rounded-md"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="key">翻译键</Label>
            <Input
              id="key"
              placeholder="例如: common.save"
              value={translationKey}
              onChange={(e) => setTranslationKey(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">翻译值</Label>
            <Input
              id="value"
              placeholder="例如: 保存"
              value={translationValue}
              onChange={(e) => setTranslationValue(e.target.value)}
            />
          </div>
          
          <Button onClick={handleAddTranslation} className="w-full">
            添加翻译
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 翻译查看器组件
export function TranslationViewer() {
  const { languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]?.code || '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">翻译查看</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Languages className="h-5 w-5" />
            <span>翻译查看器</span>
          </DialogTitle>
          <DialogDescription>
            查看当前翻译内容
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="all">所有翻译</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language-select">选择语言</Label>
              <select
                id="language-select"
                className="w-full p-2 border rounded-md"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeName}
                  </option>
                ))}
              </select>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>常用翻译示例</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="font-medium">键</div>
                  <div className="font-medium">值</div>
                  
                  <div>common.save</div>
                  <div>{t('common.save')}</div>
                  
                  <div>common.cancel</div>
                  <div>{t('common.cancel')}</div>
                  
                  <div>project.title</div>
                  <div>{t('project.title')}</div>
                  
                  <div>part.title</div>
                  <div>{t('part.title')}</div>
                  
                  <div>error.pageNotFound</div>
                  <div>{t('error.pageNotFound')}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>所有翻译键</CardTitle>
                <CardDescription>
                  当前应用中可用的所有翻译键
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-mono space-y-1 max-h-60 overflow-auto">
                  <div>common.*</div>
                  <div>navigation.*</div>
                  <div>project.*</div>
                  <div>part.*</div>
                  <div>dimension.*</div>
                  <div>import.*</div>
                  <div>error.*</div>
                  <div>validation.*</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default I18nProvider;