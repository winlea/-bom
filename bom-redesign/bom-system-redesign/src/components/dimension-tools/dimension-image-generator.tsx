import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, Download } from 'lucide-react';

/**
 * 关键修复点
 * 1) 彻底改为“左对齐 + 内边距”绘制，避免居中导致的裁切
 * 2) 使用 TextMetrics 的 actualBoundingBoxAscent/Descent 精准计算高度，杜绝上下被截掉“只显示一半”
 * 3) 预览图片不再固定像素宽，改为 maxWidth: 100%，让内容在单元格内自适应缩放显示完整
 */

interface DimensionImageProps {
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
  onClick?: () => void;
  className?: string;
}

type TextMeasure = {
  width: number;
  ascent: number;
  descent: number;
  height: number;
};

const setFont = (ctx: CanvasRenderingContext2D, size: number, weight: 'normal' | 'bold' = 'normal') => {
  ctx.font = `${weight} ${size}px Arial`;
};

const measure = (
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  weight: 'normal' | 'bold' = 'normal'
): TextMeasure => {
  setFont(ctx, size, weight);
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent ?? size * 0.8;
  const descent = m.actualBoundingBoxDescent ?? size * 0.2;
  const width = m.width;
  return { width, ascent, descent, height: ascent + descent };
};

const isGeometric = (type: string) =>
  type === 'position' ||
  type === 'profile_surface' ||
  type === 'flatness' ||
  type === 'coplanarity' ||
  type === 'straightness' ||
  type === 'roundness' ||
  type === 'cylindricity' ||
  type === 'profile_line' ||
  type === 'parallelism' ||
  type === 'perpendicularity' ||
  type === 'angularity' ||
  type === 'concentricity' ||
  type === 'symmetry' ||
  type === 'circular_runout' ||
  type === 'total_runout';

const buildToleranceText = (upper: string, lower: string): string | '' => {
  if (!upper && !lower) return '';
  const up = parseFloat(upper || '0');
  const lo = parseFloat(lower || '0');

  if (upper && lower && Math.abs(up) === Math.abs(lo) && up > 0 && lo < 0) {
    return `±${Math.abs(up)}`;
  }

  if (upper && lower) {
    const upT = up >= 0 ? `+${up}` : `${up}`;
    const loT = lo >= 0 ? `+${lo}` : `${lo}`;
    return `${upT}/${loT}`;
  }

  if (upper) return up >= 0 ? `+${up}` : `${up}`;
  if (lower) return lo >= 0 ? `+${lo}` : `${lo}`;
  return '';
};

export const DimensionImageGenerator: React.FC<DimensionImageProps> = ({
  dimensionType,
  nominalValue,
  toleranceValue,
  upperTolerance,
  lowerTolerance,
  datum,
  onClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    generateDimensionImage();
  }, [dimensionType, nominalValue, toleranceValue, upperTolerance, lowerTolerance, datum]);

  const getDimensionSymbol = (type: string): string => {
    const symbols = {
      normal: '',
      diameter: '⌀',
      radius: 'R',
      spherical_diameter: 'S⌀',
      spherical_radius: 'SR',
      // 形状公差
      straightness: '⏤',
      flatness: '⏥',
      roundness: '○',
      cylindricity: '⌭',
      // 轮廓公差
      profile_line: '⌒',
      profile_surface: '⌓',
      // 方向公差
      parallelism: '⫽',
      perpendicularity: '⊥',
      angularity: '∠',
      // 位置公差
      position: '⌖',
      concentricity: '◎',
      symmetry: '⌯',
      // 跳动公差
      circular_runout: '↗',
      total_runout: '↗↗',
      // 其他
      coplanarity: '⏥⏥',
    };
    return symbols[type as keyof typeof symbols] || '';
  };

  // 生成缩略图
  const generateDimensionImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 先设置一个足够大的画布用于测量
    canvas.width = 400;
    canvas.height = 150;

    // 布局参数（缩略图）
    const paddingX = 20;
    const paddingY = 15;
    const gapX = 5;
    const mainFontSize = 13;
    const tolFontSize = 9;

    const symbol = getDimensionSymbol(dimensionType);

    let contentWidth = 0;
    let contentHeight = 0;

    // 计算几何公差的实际公差值
    const getActualToleranceValue = () => {
      if (toleranceValue) return toleranceValue;
      const tolText = buildToleranceText(upperTolerance, lowerTolerance);
      return tolText;
    };

    if (isGeometric(dimensionType)) {
      // 几何公差：固定框布局
      const actualToleranceValue = getActualToleranceValue();
      const { width, height } = calcGeoBoxSize(dimensionType, datum);
      contentWidth = width;
      contentHeight = height;
    } else {
      // 普通尺寸：基于文本测量
      const nominal = nominalValue || '12';
      const mainText = `${symbol}${nominal}`;

      const mMain = measure(ctx, mainText, mainFontSize, 'bold');

      const tolText = buildToleranceText(upperTolerance, lowerTolerance);
      let mTol: TextMeasure | null = null;
      if (tolText) {
        mTol = measure(ctx, tolText, tolFontSize, 'normal');
      }

      contentWidth = mMain.width + (mTol ? gapX + mTol.width : 0);
      const ascentMax = Math.max(mMain.ascent, mTol ? mTol.ascent : 0);
      const descentMax = Math.max(mMain.descent, mTol ? mTol.descent : 0);
      contentHeight = ascentMax + descentMax;
    }

    // 画布最终尺寸，保证最小可视区，添加额外的安全边距
    canvas.width = Math.max(Math.ceil(contentWidth + paddingX * 2 + 20), 180);
    canvas.height = Math.max(Math.ceil(contentHeight + paddingY * 2 + 10), 80);

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    const startX = paddingX;

    if (isGeometric(dimensionType)) {
      const actualToleranceValue = getActualToleranceValue();
      drawGeometricToleranceLeft(ctx, dimensionType, actualToleranceValue, datum, startX, paddingY);
    } else {
      // 普通尺寸：左对齐
      const nominal = nominalValue || '12';
      const mainText = `${symbol}${nominal}`;

      const mMain = measure(ctx, mainText, mainFontSize, 'bold');

      const tolText = buildToleranceText(upperTolerance, lowerTolerance);
      const mTol = tolText ? measure(ctx, tolText, tolFontSize) : null;

      const ascentMax = Math.max(mMain.ascent, mTol ? mTol.ascent : 0);
      const baselineY = paddingY + ascentMax;

      // 主文本
      setFont(ctx, mainFontSize, 'bold');
      ctx.fillText(mainText, startX, baselineY);

      // 公差
      if (tolText && mTol) {
        setFont(ctx, tolFontSize, 'normal');
        const tolX = startX + mMain.width + gapX;
        ctx.fillText(tolText, tolX, baselineY);
      }
    }

    setImageData(canvas.toDataURL('image/png'));
  };

  const calcGeoBoxSize = (type: string, datumRef: string | undefined) => {
    // 缩略图几何公差框尺寸
    const boxHeight = 30;
    const symbolBoxWidth = 30;
    const toleranceBoxWidth = 45;
    const datumBoxWidth = 26;
    const datums = datumRef ? datumRef.split('-').filter((d) => d.trim()) : [];
    const width = symbolBoxWidth + toleranceBoxWidth + datums.length * datumBoxWidth;
    const height = boxHeight;
    return { width, height, symbolBoxWidth, toleranceBoxWidth, datumBoxWidth, boxHeight };
  };

  const drawGeometricToleranceLeft = (
    ctx: CanvasRenderingContext2D,
    type: string,
    tolerance: string,
    datumRef: string,
    startX: number,
    startY: number
  ) => {
    const { symbolBoxWidth, toleranceBoxWidth, datumBoxWidth, boxHeight } = calcGeoBoxSize(type, datumRef);
    const symbol = getDimensionSymbol(type);
    const datums = datumRef ? datumRef.split('-').filter((d) => d.trim()) : [];

    let x = startX;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    // 符号框
    ctx.strokeRect(x, startY, symbolBoxWidth, boxHeight);
    setFont(ctx, 16, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x + symbolBoxWidth / 2, startY + boxHeight / 2);
    x += symbolBoxWidth;

    // 公差框
    ctx.strokeRect(x, startY, toleranceBoxWidth, boxHeight);
    setFont(ctx, 12, 'normal');
    ctx.fillText(tolerance || '', x + toleranceBoxWidth / 2, startY + boxHeight / 2);
    x += toleranceBoxWidth;

    // 基准框
    if (datums.length > 0) {
      setFont(ctx, 12, 'bold');
      datums.forEach((d) => {
        ctx.strokeRect(x, startY, datumBoxWidth, boxHeight);
        ctx.fillText(d, x + datumBoxWidth / 2, startY + boxHeight / 2);
        x += datumBoxWidth;
      });
    }
  };

  return (
    <div className={`relative group ${className}`} style={{ minWidth: '0px', minHeight: '60px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className="hidden" />
      {imageData && (
        <div
          className="cursor-pointer transition-transform hover:scale-105 flex items-center justify-center w-full h-full"
          onClick={onClick}
          style={{ minHeight: '60px', width: '100%' }}
        >
          <img
            src={imageData}
            alt="尺寸标注"
            className="border border-slate-200 rounded bg-white shadow-sm object-contain"
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '60px' }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

// 放大预览组件
interface DimensionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
}

export const DimensionPreviewModal: React.FC<DimensionPreviewModalProps> = ({
  isOpen,
  onClose,
  dimensionType,
  nominalValue,
  toleranceValue,
  upperTolerance,
  lowerTolerance,
  datum,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      generateLargeDimensionImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dimensionType, nominalValue, toleranceValue, upperTolerance, lowerTolerance, datum]);

  const getDimensionSymbol = (type: string): string => {
    const symbols = {
      normal: '',
      diameter: '⌀',
      radius: 'R',
      spherical_diameter: 'S⌀',
      spherical_radius: 'SR',
      // 形状公差
      straightness: '⏤',
      flatness: '⏥',
      roundness: '○',
      cylindricity: '⌭',
      // 轮廓公差
      profile_line: '⌒',
      profile_surface: '⌓',
      // 方向公差
      parallelism: '⫽',
      perpendicularity: '⊥',
      angularity: '∠',
      // 位置公差
      position: '⌖',
      concentricity: '◎',
      symmetry: '⌯',
      // 跳动公差
      circular_runout: '↗',
      total_runout: '↗↗',
      // 其他
      coplanarity: '⏥⏥',
    };
    return symbols[type as keyof typeof symbols] || '';
  };

  const generateLargeDimensionImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 布局参数（放大）
    const paddingX = 24;
    const paddingY = 20;
    const gapX = 10;
    const mainFontSize = 32;
    const tolFontSize = 24;

    const symbol = getDimensionSymbol(dimensionType);

    let contentWidth = 0;
    let contentHeight = 0;

    if (isGeometric(dimensionType)) {
      // 放大版本几何公差
      const boxHeight = 60;
      const symbolBoxWidth = 60;
      const toleranceBoxWidth = 100;
      const datumBoxWidth = 50;
      const datums = datum ? datum.split('-').filter((d) => d.trim()) : [];
      contentWidth = symbolBoxWidth + toleranceBoxWidth + datums.length * datumBoxWidth;
      contentHeight = boxHeight;

      canvas.width = Math.ceil(contentWidth + paddingX * 2);
      canvas.height = Math.ceil(contentHeight + paddingY * 2);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawLargeGeometricToleranceLeft(ctx, dimensionType, toleranceValue, datum, paddingX, paddingY);
    } else {
      // 放大版本普通尺寸
      const nominal = nominalValue || '12';
      const mainText = `${symbol}${nominal}`;

      const mMain = measure(ctx, mainText, mainFontSize, 'bold');

      const tolText = buildToleranceText(upperTolerance, lowerTolerance);
      const mTol2 = tolText ? measure(ctx, tolText, tolFontSize) : null;

      contentWidth = mMain.width + (mTol2 ? gapX + mTol2.width : 0);
      const ascentMax = Math.max(mMain.ascent, mTol2 ? mTol2.ascent : 0);
      const descentMax = Math.max(mMain.descent, mTol2 ? mTol2.descent : 0);
      contentHeight = ascentMax + descentMax;

      canvas.width = Math.ceil(contentWidth + paddingX * 2);
      canvas.height = Math.ceil(contentHeight + paddingY * 2);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e293b';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      const baselineY = paddingY + ascentMax;

      // 主文本
      setFont(ctx, mainFontSize, 'bold');
      ctx.fillText(mainText, paddingX, baselineY);

      // 公差
      if (tolText && mTol2) {
        setFont(ctx, tolFontSize, 'normal');
        const mainW = measure(ctx, mainText, mainFontSize, 'bold').width;
        const tolX = paddingX + mainW + gapX;
        ctx.fillText(tolText, tolX, baselineY);
      }
    }

    setImageData(canvas.toDataURL('image/png'));
  };

  const drawLargeGeometricToleranceLeft = (
    ctx: CanvasRenderingContext2D,
    type: string,
    tolerance: string,
    datumRef: string,
    startX: number,
    startY: number
  ) => {
    const symbol = getDimensionSymbol(type);
    const boxHeight = 60;
    const symbolBoxWidth = 60;
    const toleranceBoxWidth = 100;
    const datumBoxWidth = 50;

    const datums = datumRef ? datumRef.split('-').filter((d) => d.trim()) : [];
    let x = startX;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;

    // 符号框
    ctx.strokeRect(x, startY, symbolBoxWidth, boxHeight);
    setFont(ctx, 36, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x + symbolBoxWidth / 2, startY + boxHeight / 2);
    x += symbolBoxWidth;

    // 公差框
    ctx.strokeRect(x, startY, toleranceBoxWidth, boxHeight);
    setFont(ctx, 28, 'normal');
    ctx.fillText(tolerance || '', x + toleranceBoxWidth / 2, startY + boxHeight / 2);
    x += toleranceBoxWidth;

    // 基准框
    if (datums.length > 0) {
      setFont(ctx, 28, 'bold');
      datums.forEach((d) => {
        ctx.strokeRect(x, startY, datumBoxWidth, boxHeight);
        ctx.fillText(d, x + datumBoxWidth / 2, startY + boxHeight / 2);
        x += datumBoxWidth;
      });
    }
  };

  const downloadImage = () => {
    if (imageData) {
      const link = document.createElement('a');
      link.download = 'dimension.png';
      link.href = imageData;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white p-6 max-w-2xl max-h-[80vh] overflow-auto rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">尺寸标注预览</h3>
          <div className="flex gap-2">
            <button
              onClick={downloadImage}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
              关闭
            </button>
          </div>
        </div>
        {imageData && (
          <div className="text-center">
            <img
              src={imageData}
              alt="尺寸标注预览"
              className="border border-slate-200 rounded bg-white shadow-lg mx-auto"
              style={{ maxWidth: '100%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
