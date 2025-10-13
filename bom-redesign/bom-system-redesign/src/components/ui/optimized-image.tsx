import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  // 基本属性
  src: string;
  alt: string;
  className?: string;
  
  // 尺寸
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  // 加载状态
  placeholder?: string;
  fallback?: string;
  loadingText?: string;
  errorText?: string;
  
  // 交互功能
  zoomable?: boolean;
  downloadable?: boolean;
  rotatable?: boolean;
  
  // 懒加载
  lazy?: boolean;
  threshold?: number;
  
  // 性能优化
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  
  // 回调
  onLoad?: () => void;
  onError?: (error: Event) => void;
  onClick?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  maxWidth,
  maxHeight,
  placeholder = '/placeholder.svg',
  fallback = '/image-error.svg',
  loadingText = '加载中...',
  errorText = '图片加载失败',
  zoomable = false,
  downloadable = false,
  rotatable = false,
  lazy = true,
  threshold = 0.1,
  quality = 80,
  format = 'webp',
  onLoad,
  onError,
  onClick,
}: OptimizedImageProps) {
  // 状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isInView, setIsInView] = useState(!lazy);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // 引用
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 优化图片URL
  const optimizedSrc = useCallback(() => {
    if (!src) return placeholder;
    
    // 如果是外部URL，直接返回
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    
    // 如果是本地图片，尝试转换为优化格式
    try {
      const url = new URL(src, window.location.origin);
      
      // 添加质量参数
      url.searchParams.set('quality', quality.toString());
      
      // 添加格式参数
      if (format && format !== 'jpg') {
        url.searchParams.set('format', format);
      }
      
      // 添加尺寸参数（如果提供了尺寸）
      if (width) {
        url.searchParams.set('w', width.toString());
      }
      if (height) {
        url.searchParams.set('h', height.toString());
      }
      
      return url.toString();
    } catch (e) {
      // 如果URL解析失败，返回原始URL
      return src;
    }
  }, [src, quality, format, width, height, placeholder]);
  
  // 处理图片加载
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);
  
  // 处理图片加载错误
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoading(false);
    setError(true);
    onError?.(e.nativeEvent);
  }, [onError]);
  
  // 设置交叉观察器用于懒加载
  useEffect(() => {
    if (!lazy || !imgRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold }
    );
    
    observerRef.current.observe(imgRef.current);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, threshold]);
  
  // 处理缩放
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
    setIsZoomed(true);
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
    if (zoom - 0.25 <= 1) {
      setIsZoomed(false);
    }
  }, [zoom]);
  
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setIsZoomed(false);
  }, []);
  
  // 处理旋转
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);
  
  // 处理下载
  const handleDownload = useCallback(() => {
    if (!imgRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imgRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // 应用旋转
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    
    // 转换为Blob并下载
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, `image/${format}`);
  }, [alt, format, rotation]);
  
  // 处理点击图片
  const handleImageClick = useCallback(() => {
    if (zoomable && !isZoomed) {
      handleZoomIn();
    } else if (isZoomed) {
      handleResetZoom();
    }
    onClick?.();
  }, [zoomable, isZoomed, handleZoomIn, handleResetZoom, onClick]);
  
  // 计算容器样式
  const containerStyle = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
  };
  
  // 计算图片样式
  const imageStyle = {
    transform: `scale(${zoom}) rotate(${rotation}deg)`,
    transition: 'transform 0.3s ease',
    cursor: zoomable ? 'pointer' : 'default',
  };
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-slate-100 rounded-md',
        className
      )}
      style={containerStyle}
    >
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-2" />
          <span className="text-sm text-slate-500">{loadingText}</span>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm text-slate-500">{errorText}</span>
          {fallback && (
            <img
              src={fallback}
              alt="Fallback"
              className="mt-2 max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
      
      {/* 图片 */}
      {isInView && !error && (
        <img
          ref={imgRef}
          src={optimizedSrc()}
          alt={alt}
          className={cn(
            'w-full h-full object-contain',
            loading && 'opacity-0',
            !loading && 'opacity-100'
          )}
          style={imageStyle}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
        />
      )}
      
      {/* 控制按钮 */}
      {(zoomable || downloadable || rotatable) && !loading && !error && (
        <div className="absolute bottom-2 right-2 flex space-x-1 bg-white/90 backdrop-blur-sm rounded-md p-1 shadow-md">
          {zoomable && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {rotatable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
          
          {downloadable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* 缩放指示器 */}
      {zoomable && isZoomed && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;