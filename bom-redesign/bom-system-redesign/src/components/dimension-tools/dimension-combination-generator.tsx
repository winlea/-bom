import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, Download } from 'lucide-react';

interface DimensionItem {
  type: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
}

interface DimensionCombinationProps {
  dimensions: DimensionItem[];
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
  const datumWidth = datums.length * datumBoxWidth;
  return {
    width: symbolBoxWidth + toleranceBoxWidth + datumWidth,
    height: boxHeight,
  };
};
