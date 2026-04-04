import React, { useRef, useEffect, useState } from 'react';

interface DimensionData {
  id: number;
  type: string; // 尺寸类型，如 'diameter'（孔径）、'position'（位置度）等
  nominalValue: string; // 名义值
  toleranceValue: string; // 公差值
  upperTolerance: string; // 上公差
  lowerTolerance: string; // 下公差
  datum: string; // 基准，如 'A', 'B', 'C' 等
}

interface DrawingConfig {
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
  spacing: number;
  backgroundColor: string;
}

interface DimensionDrawingCanvasProps {
  dimensions: DimensionData[];
  config: DrawingConfig;
  onDrawingComplete?: (imageData: string) => void;
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

const calcGeoBoxSize = (type: string, datumRef: string | undefined) => {
  const boxHeight = 35;
  const symbolBoxWidth = 35;
  const toleranceBoxWidth = 55;
  const datumBoxWidth = 30;
  const datums = datumRef ? datumRef.split('').filter((d) => d.trim()) : [];
  const width = symbolBoxWidth + toleranceBoxWidth + datums.length * datumBoxWidth;
  const height = boxHeight;
  return { width, height, symbolBoxWidth, toleranceBoxWidth, datumBoxWidth, boxHeight };
};

export const DimensionDrawingCanvas: React.FC<DimensionDrawingCanvasProps> = ({
  dimensions,
  config,
  onDrawingComplete,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    generateDrawing();
  }, [dimensions, config]);

  const generateDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvasWidth, canvasHeight, padding, spacing, backgroundColor } = config;

    // 设置画布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 绘制背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 计算分区
    const partitionCount = dimensions.length;
    if (partitionCount === 0) {
      setImageData(canvas.toDataURL('image/png'));
      if (onDrawingComplete) {
        onDrawingComplete(canvas.toDataURL('image/png'));
      }
      return;
    }

    const partitionHeight = (canvasHeight - 2 * padding - (partitionCount - 1) * spacing) / partitionCount;

    // 存储第二个尺寸的绘制位置，用于第三个尺寸的对齐
    let secondDimensionX = padding;

    // 绘制每个尺寸
    dimensions.forEach((dimension, index) => {
      const y = padding + index * (partitionHeight + spacing);

      // 对于第三个尺寸，使用与第二个尺寸相同的x坐标，确保左对齐
      let drawX = padding;
      if (index === 2 && partitionCount >= 3) {
        drawX = secondDimensionX;
      }

      // 绘制尺寸
      const bounds = { x: drawX, y, width: canvasWidth - 2 * padding, height: partitionHeight };
      drawDimension(ctx, dimension, bounds);

      // 记录第二个尺寸的x坐标
      if (index === 1) {
        secondDimensionX = drawX;
      }
    });

    // 生成图片数据
    const dataUrl = canvas.toDataURL('image/png');
    setImageData(dataUrl);
    if (onDrawingComplete) {
      onDrawingComplete(dataUrl);
    }
  };

  const drawDimension = (
    ctx: CanvasRenderingContext2D,
    dimension: DimensionData,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    const { type, nominalValue, toleranceValue, upperTolerance, lowerTolerance, datum } = dimension;

    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    if (isGeometric(type)) {
      // 绘制几何公差（如位置度）
      drawGeometricTolerance(ctx, type, toleranceValue, datum, bounds);
    } else {
      // 绘制普通尺寸（如孔径）
      drawNormalDimension(ctx, type, nominalValue, upperTolerance, lowerTolerance, bounds);
    }
  };

  const drawNormalDimension = (
    ctx: CanvasRenderingContext2D,
    type: string,
    nominalValue: string,
    upperTolerance: string,
    lowerTolerance: string,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    const mainFontSize = 20;
    const tolFontSize = 16;
    const gapX = 6;

    const symbol = getDimensionSymbol(type);
    const mainText = `${symbol}${nominalValue || '0'}`;
    const tolText = buildToleranceText(upperTolerance, lowerTolerance);

    const mMain = measure(ctx, mainText, mainFontSize, 'bold');
    const mTol = tolText ? measure(ctx, tolText, tolFontSize) : null;

    const ascentMax = Math.max(mMain.ascent, mTol ? mTol.ascent : 0);
    const baselineY = bounds.y + bounds.height / 2 + ascentMax / 2;

    // 绘制主文本
    setFont(ctx, mainFontSize, 'bold');
    ctx.fillText(mainText, bounds.x, baselineY);

    // 绘制公差
    if (tolText && mTol) {
      setFont(ctx, tolFontSize, 'normal');
      const tolX = bounds.x + mMain.width + gapX;
      ctx.fillText(tolText, tolX, baselineY);
    }
  };

  const drawGeometricTolerance = (
    ctx: CanvasRenderingContext2D,
    type: string,
    toleranceValue: string,
    datum: string,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    const { symbolBoxWidth, toleranceBoxWidth, datumBoxWidth, boxHeight } = calcGeoBoxSize(type, datum);
    const symbol = getDimensionSymbol(type);
    const datums = datum ? datum.split('').filter((d) => d.trim()) : [];

    let x = bounds.x;
    const y = bounds.y + (bounds.height - boxHeight) / 2;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    // 绘制符号框
    ctx.strokeRect(x, y, symbolBoxWidth, boxHeight);
    setFont(ctx, 22, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x + symbolBoxWidth / 2, y + boxHeight / 2);
    x += symbolBoxWidth;

    // 绘制公差框
    ctx.strokeRect(x, y, toleranceBoxWidth, boxHeight);
    setFont(ctx, 18, 'normal');
    ctx.fillText(toleranceValue || '', x + toleranceBoxWidth / 2, y + boxHeight / 2);
    x += toleranceBoxWidth;

    // 绘制基准框
    if (datums.length > 0) {
      setFont(ctx, 18, 'bold');
      datums.forEach((d) => {
        ctx.strokeRect(x, y, datumBoxWidth, boxHeight);
        ctx.fillText(d, x + datumBoxWidth / 2, y + boxHeight / 2);
        x += datumBoxWidth;
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded bg-white shadow-sm"
        style={{
          width: config.canvasWidth,
          height: config.canvasHeight,
        }}
      />
    </div>
  );
};

export default DimensionDrawingCanvas;
