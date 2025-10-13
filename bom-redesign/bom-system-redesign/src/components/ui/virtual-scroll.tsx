import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  // 数据
  items: T[];
  itemHeight: number | ((index: number, data: T) => number);
  containerHeight: number;
  
  // 渲染
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  
  // 预加载
  overscan?: number;
  
  // 滚动行为
  scrollToIndex?: number;
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start';
  
  // 回调
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onItemsRendered?: (startIndex: number, stopIndex: number) => void;
  
  // 样式
  className?: string;
  style?: React.CSSProperties;
  
  // 其他
  estimatedItemSize?: number;
  keyExtractor?: (item: T, index: number) => string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  scrollToIndex,
  scrollToAlignment = 'auto',
  onScroll,
  onItemsRendered,
  className = '',
  style = {},
  estimatedItemSize = 50,
  keyExtractor = (item, index) => `item-${index}`,
}: VirtualScrollProps<T>) {
  // 状态
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'forward' | 'backward'>('forward');
  
  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 计算项目高度
  const getItemHeight = useCallback((index: number, item: T) => {
    return typeof itemHeight === 'function' ? itemHeight(index, item) : itemHeight;
  }, [itemHeight]);
  
  // 计算项目位置和大小
  const itemMetadata = useMemo(() => {
    const metadata = [];
    let offset = 0;
    
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i, items[i]);
      metadata.push({
        index: i,
        offset,
        size: height,
      });
      offset += height;
    }
    
    return metadata;
  }, [items, getItemHeight]);
  
  // 计算总高度
  const totalHeight = useMemo(() => {
    if (itemMetadata.length === 0) return 0;
    const lastItem = itemMetadata[itemMetadata.length - 1];
    return lastItem.offset + lastItem.size;
  }, [itemMetadata]);
  
  // 查找项目索引
  const findItemIndex = useCallback((offset: number) => {
    // 二分查找
    let low = 0;
    let high = itemMetadata.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const item = itemMetadata[mid];
      
      if (item.offset <= offset && offset < item.offset + item.size) {
        return mid;
      } else if (offset < item.offset) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    
    return Math.max(0, Math.min(low, itemMetadata.length - 1));
  }, [itemMetadata]);
  
  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = findItemIndex(scrollTop);
    const stopIndex = findItemIndex(scrollTop + containerHeight);
    
    // 添加预加载
    const overscanStartIndex = Math.max(0, startIndex - overscan);
    const overscanStopIndex = Math.min(items.length - 1, stopIndex + overscan);
    
    return {
      startIndex,
      stopIndex,
      overscanStartIndex,
      overscanStopIndex,
    };
  }, [scrollTop, containerHeight, findItemIndex, items.length, overscan]);
  
  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop: newScrollTop, scrollLeft } = e.currentTarget;
    
    // 更新滚动方向
    if (newScrollTop > scrollTop) {
      setScrollDirection('forward');
    } else if (newScrollTop < scrollTop) {
      setScrollDirection('backward');
    }
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 设置新的超时，在滚动停止后重置状态
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    // 触发回调
    onScroll?.(newScrollTop, scrollLeft);
  }, [scrollTop, onScroll]);
  
  // 滚动到指定索引
  const scrollToItem = useCallback((index: number, alignment: 'auto' | 'smart' | 'center' | 'end' | 'start' = 'auto') => {
    if (!containerRef.current || index < 0 || index >= items.length) return;
    
    const item = itemMetadata[index];
    if (!item) return;
    
    let scrollTop: number;
    
    switch (alignment) {
      case 'start':
        scrollTop = item.offset;
        break;
      case 'center':
        scrollTop = item.offset - containerHeight / 2 + item.size / 2;
        break;
      case 'end':
        scrollTop = item.offset - containerHeight + item.size;
        break;
      case 'smart':
        if (item.offset < scrollTop) {
          scrollTop = item.offset;
        } else if (item.offset + item.size > scrollTop + containerHeight) {
          scrollTop = item.offset - containerHeight + item.size;
        } else {
          scrollTop = scrollTop; // 不需要滚动
        }
        break;
      case 'auto':
      default:
        if (item.offset < scrollTop) {
          scrollTop = item.offset;
        } else if (item.offset + item.size > scrollTop + containerHeight) {
          scrollTop = item.offset - containerHeight + item.size;
        } else {
          scrollTop = scrollTop; // 不需要滚动
        }
        break;
    }
    
    containerRef.current.scrollTop = scrollTop;
  }, [containerRef, itemMetadata, items.length, containerHeight]);
  
  // 滚动到指定索引（当scrollToIndex变化时）
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      scrollToItem(scrollToIndex, scrollToAlignment);
    }
  }, [scrollToIndex, scrollToAlignment, scrollToItem]);
  
  // 触发onItemsRendered回调
  useEffect(() => {
    onItemsRendered?.(visibleRange.startIndex, visibleRange.stopIndex);
  }, [visibleRange, onItemsRendered]);
  
  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const items = [];
    
    for (let i = visibleRange.overscanStartIndex; i <= visibleRange.overscanStopIndex; i++) {
      if (i < 0 || i >= itemMetadata.length) continue;
      
      const item = itemMetadata[i];
      const style = {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: item.size,
        transform: `translateY(${item.offset}px)`,
      };
      
      items.push(
        <div key={keyExtractor(items[i], i)} style={style}>
          {renderItem(items[i], i, style)}
        </div>
      );
    }
    
    return items;
  }, [visibleRange, itemMetadata, keyExtractor, renderItem, items]);
  
  // 渲染滚动指示器
  const renderScrollIndicator = () => {
    if (items.length === 0) return null;
    
    const scrollPercentage = scrollTop / (totalHeight - containerHeight);
    const indicatorHeight = Math.max(20, (containerHeight * containerHeight) / totalHeight);
    const indicatorTop = scrollPercentage * (containerHeight - indicatorHeight);
    
    return (
      <div className="absolute right-0 top-0 w-2 bg-slate-200 rounded-full overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 w-full bg-blue-500 rounded-full transition-all duration-150"
          style={{
            height: `${indicatorHeight}px`,
            top: `${indicatorTop}px`,
          }}
        />
      </div>
    );
  };
  
  // 渲染快速滚动按钮
  const renderScrollButtons = () => {
    if (items.length === 0) return null;
    
    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md"
          onClick={() => {
            const currentIndex = findItemIndex(scrollTop);
            scrollToItem(Math.max(0, currentIndex - 10), 'start');
          }}
          disabled={scrollTop <= 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md"
          onClick={() => {
            const currentIndex = findItemIndex(scrollTop);
            scrollToItem(Math.min(items.length - 1, currentIndex + 10), 'start');
          }}
          disabled={scrollTop >= totalHeight - containerHeight}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{
        height: containerHeight,
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* 总高度占位符 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项目 */}
        {visibleItems}
      </div>
      
      {/* 滚动指示器 */}
      {renderScrollIndicator()}
      
      {/* 快速滚动按钮 */}
      {renderScrollButtons()}
    </div>
  );
}

export default VirtualScroll;