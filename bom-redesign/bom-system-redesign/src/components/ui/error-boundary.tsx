import React, { Component, ReactNode, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Bug, Send, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 错误信息接口
interface ErrorInfo {
  error: Error;
  errorInfo: React.ErrorInfo;
  timestamp: number;
  userAgent: string;
  url: string;
  componentStack: string;
  additionalData?: Record<string, any>;
}

// 错误报告服务接口
interface ErrorReportService {
  reportError: (errorInfo: ErrorInfo) => Promise<boolean>;
}

// 默认错误报告服务（发送到控制台）
const DefaultErrorReportService: ErrorReportService = {
  reportError: async (errorInfo: ErrorInfo) => {
    console.error('React Error Boundary caught an error:', errorInfo);
    return true;
  },
};

// 错误边界组件属性
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  errorReportService?: ErrorReportService;
  showRetry?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
  enableErrorReporting?: boolean;
  customMessage?: string;
  className?: string;
}

// 错误边界组件状态
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

// 类组件错误边界
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReportService: ErrorReportService;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
    };
    
    this.errorReportService = props.errorReportService || DefaultErrorReportService;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告
    if (this.props.enableErrorReporting !== false) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    const errorInfoData: ErrorInfo = {
      error,
      errorInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo.componentStack || '',
    };

    try {
      await this.errorReportService.reportError(errorInfoData);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, errorInfo, retryCount, errorId } = this.state;
    const {
      children,
      fallback,
      showRetry = true,
      showDetails = true,
      maxRetries = 3,
      customMessage,
      className,
    } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorBoundaryUI
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          showRetry={showRetry}
          showDetails={showDetails}
          customMessage={customMessage}
          className={className}
        />
      );
    }

    return children;
  }
}

// 错误边界UI组件
function ErrorBoundaryUI({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showRetry = true,
  showDetails = true,
  customMessage,
  className,
}: {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
  showRetry: boolean;
  showDetails: boolean;
  customMessage?: string;
  className?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportSent, setReportSent] = useState(false);

  // 复制错误信息到剪贴板
  const copyErrorDetails = useCallback(() => {
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy error details:', err);
      });
  }, [error, errorInfo, errorId]);

  // 发送错误报告
  const sendErrorReport = useCallback(() => {
    // 这里可以实现发送错误报告到服务器的逻辑
    console.log('Error report:', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userMessage: reportMessage,
    });

    setReportSent(true);
    setTimeout(() => {
      setReportSent(false);
      setReportOpen(false);
      setReportMessage('');
    }, 2000);
  }, [error, errorInfo, errorId, reportMessage]);

  const canRetry = retryCount < maxRetries;

  return (
    <div className={cn("flex items-center justify-center min-h-[400px] p-4", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">出现错误</CardTitle>
          <CardDescription>
            {customMessage || "应用遇到了意外错误，请尝试刷新页面或联系技术支持。"}
          </CardDescription>
          <div className="flex justify-center mt-2">
            <Badge variant="outline" className="text-xs">
              错误ID: {errorId}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>错误信息</AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {error.message}
            </AlertDescription>
          </Alert>

          {showDetails && (
            <div className="flex justify-center">
              <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Bug className="h-4 w-4" />
                    <span>查看详情</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Bug className="h-5 w-5" />
                      <span>错误详情</span>
                    </DialogTitle>
                    <DialogDescription>
                      以下信息可以帮助开发者诊断问题
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="error" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="error">错误信息</TabsTrigger>
                      <TabsTrigger value="stack">调用栈</TabsTrigger>
                      <TabsTrigger value="component">组件栈</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="error" className="space-y-2">
                      <div className="p-3 bg-slate-50 rounded-md">
                        <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                          {error.message}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stack" className="space-y-2">
                      <div className="p-3 bg-slate-50 rounded-md">
                        <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="component" className="space-y-2">
                      <div className="p-3 bg-slate-50 rounded-md">
                        <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                          {errorInfo?.componentStack}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button variant="outline" onClick={copyErrorDetails} className="flex items-center space-x-2">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? "已复制" : "复制"}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Separator />

          <div className="flex flex-col space-y-2">
            {showRetry && (
              <Button 
                onClick={onRetry} 
                disabled={!canRetry}
                className="flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>
                  {canRetry ? "重试" : `已达最大重试次数 (${maxRetries})`}
                </span>
              </Button>
            )}
            
            <Button variant="outline" onClick={onReset} className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>重置</span>
            </Button>
            
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>报告问题</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>报告问题</span>
                  </DialogTitle>
                  <DialogDescription>
                    请描述您遇到的问题，这将帮助我们改进应用
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-md">
                    <div className="text-sm font-medium mb-1">错误信息</div>
                    <div className="text-xs text-slate-600">{error.message}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="report-message" className="text-sm font-medium">
                      问题描述
                    </label>
                    <Textarea
                      id="report-message"
                      placeholder="请描述您在做什么时遇到了这个问题..."
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReportOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={sendErrorReport} disabled={reportSent}>
                    {reportSent ? "已发送" : "发送报告"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 函数组件错误边界Hook
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    console.error('Caught error in hook:', error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
}

// 函数组件错误边界包装器
export function ErrorBoundary({
  children,
  fallback,
  onError,
  errorReportService,
  showRetry = true,
  showDetails = true,
  maxRetries = 3,
  enableErrorReporting = true,
  customMessage,
  className,
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass
      fallback={fallback}
      onError={onError}
      errorReportService={errorReportService}
      showRetry={showRetry}
      showDetails={showDetails}
      maxRetries={maxRetries}
      enableErrorReporting={enableErrorReporting}
      customMessage={customMessage}
      className={className}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

// 高阶组件：为组件添加错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// 异步错误捕获Hook
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureAsyncError = useCallback((error: Error) => {
    setError(error);
  }, []);

  // 抛出错误，让ErrorBoundary捕获
  if (error) {
    throw error;
  }

  return { captureAsyncError, resetError };
}

export default ErrorBoundary;