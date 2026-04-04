// 尺寸相关类型定义

export interface DimRow {
  id: number;
  groupNo: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit?: string;
  datum: string;
  characteristic: string;
  notes: string;
  imageUrl?: string; // 图片尺寸的图片URL
}

export interface DimensionGroup {
  groupNumber: number;
  rows: DimRow[];
}

export interface NewRowData {
  groupNumber: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit?: string;
  datum: string;
  characteristic: string;
  notes: string;
  imageUrl?: string;
}

export interface DimensionState {
  selectedProject: string;
  partNumber: string;
  projectName: string;
  dimensionData: DimRow[];
  loading: boolean;
  searchTerm: string;
  editingRow: number | null;
  editData: DimRow | null;
}

export interface DimensionActions {
  setDimensionData: (data: DimRow[]) => void;
  setLoading: (loading: boolean) => void;
  setEditingRow: (id: number | null) => void;
  setEditData: (data: DimRow | null) => void;
  fetchDimensions: () => Promise<void>;
  saveRow: (row: DimRow) => Promise<void>;
  deleteRow: (id: number) => Promise<void>;
}

// 尺寸类型选项
export const DIMENSION_TYPES = [
  { value: 'normal', label: '普通尺寸' },
  { value: 'diameter', label: '直径', symbol: '⌀' },
  { value: 'position', label: '位置度', symbol: '⌖' },
  { value: 'profile_surface', label: '面轮廓', symbol: '⌓' },
  { value: 'profile_line', label: '线轮廓', symbol: '⌒' },
  { value: 'flatness', label: '平面度', symbol: '⏥' },
  { value: 'coplanarity', label: '共面度' },
  { value: 'perpendicularity', label: '垂直度', symbol: '⊥' },
  { value: 'angularity', label: '倾斜度', symbol: '∠' },
  { value: 'concentricity', label: '同心度', symbol: '◎' },
  { value: 'radius', label: '半径', symbol: 'R' },
  { value: 'spherical_diameter', label: '球直径', symbol: 'S⌀' },
  { value: 'spherical_radius', label: '球半径', symbol: 'SR' },
  { value: 'straightness', label: '直线度', symbol: '⏤' },
  { value: 'roundness', label: '圆度', symbol: '○' },
  { value: 'cylindricity', label: '圆柱度', symbol: '⌭' },
  { value: 'parallelism', label: '平行度', symbol: '∥' },
  { value: 'symmetry', label: '对称度', symbol: '⌯' },
  { value: 'circular_runout', label: '圆跳动', symbol: '↗' },
  { value: 'total_runout', label: '全跳动', symbol: '↗↗' },
] as const;

// 获取尺寸符号
export function getDimensionSymbol(type: string): string {
  const found = DIMENSION_TYPES.find((d) => d.value === type);
  return (found as { symbol?: string })?.symbol || '';
}

// 获取尺寸显示文本
export function getDimensionDisplayText(row: DimRow): string {
  const symbol = getDimensionSymbol(row.dimensionType);
  const nominal = row.nominalValue || '0';
  const upper = row.upperTolerance;
  const lower = row.lowerTolerance;

  if (row.dimensionType === 'diameter') {
    if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
      return `⌀${nominal}±${upper}`;
    } else if (upper && lower) {
      return `⌀${nominal}+${upper}/${lower}`;
    } else {
      return `⌀${nominal}`;
    }
  } else {
    if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
      return `${nominal}±${upper}`;
    } else if (upper && lower) {
      return `${nominal}+${upper}/${lower}`;
    } else {
      return nominal;
    }
  }
}

// 默认新行数据
export const DEFAULT_NEW_ROW: NewRowData = {
  groupNumber: 1,
  dimensionType: 'normal',
  nominalValue: '',
  toleranceValue: '',
  upperTolerance: '',
  lowerTolerance: '',
  datum: '',
  characteristic: '',
  notes: '',
};
