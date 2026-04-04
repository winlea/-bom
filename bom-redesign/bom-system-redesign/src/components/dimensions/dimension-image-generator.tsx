import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getDimensionSymbol } from '@/types/dimension';

interface DimensionImageGeneratorProps {
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum?: string;
  onClick?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

// 预览模态框组件 Props
interface DimensionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 图片预览模式
  imageUrl?: string;
  title?: string;
  // 尺寸详情预览模式
  dimensionType?: string;
  nominalValue?: string;
  toleranceValue?: string;
  upperTolerance?: string;
  lowerTolerance?: string;
  datum?: string;
}

export function DimensionPreviewModal({
  isOpen,
  imageUrl,
  title,
  onClose,
  dimensionType,
  nominalValue,
  toleranceValue,
  upperTolerance,
  lowerTolerance,
  datum,
}: DimensionPreviewModalProps) {
  if (!isOpen) return null;

  const isImageMode = !!imageUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{title || '尺寸预览'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
        {isImageMode ? (
          <img src={imageUrl} alt={title || '预览图片'} className="max-w-full max-h-[60vh] object-contain" />
        ) : (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">类型：</span>
              <span className="ml-2">{dimensionType || '-'}</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">公称值：</span>
              <span className="ml-2">{nominalValue || '-'}</span>
            </div>
            {toleranceValue && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">公差值：</span>
                <span className="ml-2">{toleranceValue}</span>
              </div>
            )}
            {(upperTolerance || lowerTolerance) && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">上下偏差：</span>
                <span className="ml-2">
                  {upperTolerance || '0'}/{lowerTolerance || '0'}
                </span>
              </div>
            )}
            {datum && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">基准：</span>
                <span className="ml-2">{datum}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 图片生成组件
export function DimensionImageGenerator({
  dimensionType,
  nominalValue,
  toleranceValue,
  upperTolerance,
  lowerTolerance,
  datum,
  onClick,
  className = '',
  width = 100,
  height = 40,
}: DimensionImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布
    canvas.width = width;
    canvas.height = height;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 绘制尺寸内容
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const symbol = getDimensionSymbol(dimensionType);
    const nominal = nominalValue || '0';
    const upper = upperTolerance;
    const lower = lowerTolerance;

    let displayText = '';
    if (dimensionType === 'diameter') {
      if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
        displayText = `⌀${nominal}±${upper}`;
      } else if (upper && lower) {
        displayText = `⌀${nominal}+${upper}/${lower}`;
      } else if (nominal) {
        displayText = `⌀${nominal}`;
      } else {
        displayText = `⌀0`;
      }
    } else if (dimensionType === 'position' || dimensionType === 'profile_surface') {
      displayText = toleranceValue ? `${symbol}${toleranceValue}` : `${symbol}0.1`;
    } else {
      if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
        displayText = `${nominal}±${upper}`;
      } else if (upper && lower) {
        displayText = `${nominal}+${upper}/${lower}`;
      } else if (nominal) {
        displayText = nominal;
      } else {
        displayText = '0';
      }
    }

    ctx.fillText(displayText, width / 2, height / 2);
  }, [dimensionType, nominalValue, toleranceValue, upperTolerance, lowerTolerance, width, height]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} onClick={onClick} className="cursor-pointer hover:opacity-80 transition-opacity" />
    </div>
  );
}

// 用于生成组合图片的组件
interface DimensionGroupImageProps {
  rows: Array<{
    dimensionType: string;
    nominalValue: string;
    toleranceValue: string;
    upperTolerance: string;
    lowerTolerance: string;
    datum?: string;
  }>;
  onGenerated?: (imageUrl: string) => void;
}

export function DimensionGroupImage({ rows, onGenerated }: DimensionGroupImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const itemWidth = 100;
    const itemHeight = 50;
    const spacing = 5;
    const padding = 10;

    const width = rows.length * itemWidth + (rows.length - 1) * spacing + padding * 2;
    const height = itemHeight + padding * 2;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    rows.forEach((row, index) => {
      const x = padding + index * (itemWidth + spacing);
      const y = padding;

      // 绘制分隔线
      if (index > 0) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.moveTo(x - spacing / 2, y);
        ctx.lineTo(x - spacing / 2, y + itemHeight);
        ctx.stroke();
      }

      // 绘制尺寸内容
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const symbol = getDimensionSymbol(row.dimensionType);
      const nominal = row.nominalValue || '0';
      const upper = row.upperTolerance;
      const lower = row.lowerTolerance;

      let displayText = '';
      if (row.dimensionType === 'diameter') {
        if (upper && lower) {
          displayText = `${symbol}${nominal}`;
        } else {
          displayText = `${symbol}${nominal}`;
        }
      } else {
        displayText = `${nominal}`;
      }

      ctx.fillText(displayText, x + itemWidth / 2, y + itemHeight / 2);
    });

    if (onGenerated && canvas) {
      onGenerated(canvas.toDataURL('image/png'));
    }
  }, [rows, onGenerated]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
}

export default DimensionImageGenerator;
