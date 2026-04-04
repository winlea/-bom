// 尺寸数据验证工具

import { NewRowData, DimRow } from '@/types/dimension';

// 验证数字格式
export function isValidNumber(value: string): boolean {
  if (!value.trim()) return false;

  const num = parseFloat(value);
  if (isNaN(num)) return false;

  const trimmed = value.trim();
  if (trimmed.endsWith('.') || trimmed.startsWith('.') || trimmed === '-' || trimmed === '+') {
    return false;
  }

  const dotCount = (trimmed.match(/\./g) || []).length;
  if (dotCount > 1) return false;

  const validPattern = /^-?\d+(\.\d+)?$/;
  return validPattern.test(trimmed);
}

// 几何公差类型列表
export const GEOMETRIC_TYPES = [
  'position',
  'profile_surface',
  'flatness',
  'coplanarity',
  'straightness',
  'roundness',
  'cylindricity',
  'profile_line',
  'parallelism',
  'perpendicularity',
  'angularity',
  'concentricity',
  'symmetry',
  'circular_runout',
  'total_runout',
];

// 检查是否为几何公差类型
export function isGeometricType(type: string): boolean {
  return GEOMETRIC_TYPES.includes(type);
}

// 验证基准符号格式
export function isValidDatum(datum: string): boolean {
  if (!datum) return true; // 基准可选
  const datumRegex = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
  return datumRegex.test(datum.trim());
}

// 验证新建行数据
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNewRow(data: NewRowData, existingData: DimRow[]): ValidationResult {
  const errors: string[] = [];

  // 验证名义值
  if (!data.nominalValue.trim()) {
    errors.push('请输入名义值');
    return { valid: false, errors };
  }

  if (!isValidNumber(data.nominalValue)) {
    errors.push('名义值必须是完整的有效数字（如：12、0.5、-1.2）');
    return { valid: false, errors };
  }

  // 验证上公差
  if (data.upperTolerance.trim() && !isValidNumber(data.upperTolerance)) {
    errors.push('上公差必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 验证下公差
  if (data.lowerTolerance.trim() && !isValidNumber(data.lowerTolerance)) {
    errors.push('下公差必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 验证公差值
  if (data.toleranceValue.trim() && !isValidNumber(data.toleranceValue)) {
    errors.push('公差值必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 几何公差类型需要公差值
  if (isGeometricType(data.dimensionType) && !data.toleranceValue.trim()) {
    errors.push('几何公差类型必须输入公差值');
    return { valid: false, errors };
  }

  // 位置度必须指定基准
  if (data.dimensionType === 'position' && !data.datum.trim()) {
    errors.push('位置度必须指定基准');
    return { valid: false, errors };
  }

  // 验证基准符号格式
  if (!isValidDatum(data.datum)) {
    errors.push('基准符号格式无效');
    return { valid: false, errors };
  }

  // 直径类型验证
  if (data.dimensionType === 'diameter') {
    const existingDiameter = existingData.some(
      (dim) => dim.groupNo === data.groupNumber && dim.dimensionType === 'diameter'
    );
    if (existingDiameter) {
      errors.push('一个尺寸组合中只能有一个孔径大小');
      return { valid: false, errors };
    }
  }

  return { valid: true, errors: [] };
}

// 验证编辑行数据
export function validateEditRow(data: DimRow): ValidationResult {
  const errors: string[] = [];

  // 验证名义值
  if (!data.nominalValue.trim()) {
    errors.push('请输入名义值');
    return { valid: false, errors };
  }

  if (!isValidNumber(data.nominalValue)) {
    errors.push('名义值必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 验证上公差
  if (data.upperTolerance.trim() && !isValidNumber(data.upperTolerance)) {
    errors.push('上公差必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 验证下公差
  if (data.lowerTolerance.trim() && !isValidNumber(data.lowerTolerance)) {
    errors.push('下公差必须是完整的有效数字');
    return { valid: false, errors };
  }

  // 几何公差类型需要公差值
  if (isGeometricType(data.dimensionType) && !data.toleranceValue.trim()) {
    errors.push('几何公差类型必须输入公差值');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

export default {
  isValidNumber,
  isGeometricType,
  isValidDatum,
  validateNewRow,
  validateEditRow,
};
