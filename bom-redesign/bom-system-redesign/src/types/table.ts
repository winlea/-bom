// 表格编辑器相关类型定义

export interface Cell {
  id: string;
  content: string;
  rowSpan: number;
  colSpan: number;
  selected: boolean;
  backgroundColor: string;
  textColor: string;
  fontWeight: string;
  textAlign: string;
  verticalAlign: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
}

export interface TableData extends Cell {}

export interface CellPosition {
  row: number;
  col: number;
}

export interface TableBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

// 表格配置
export interface TableConfig {
  initialRows: number;
  initialCols: number;
  editable?: boolean;
  showHeaders?: boolean;
}

// 默认单元格样式
export const DEFAULT_CELL_STYLE = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontWeight: 'normal',
  textAlign: 'center',
  verticalAlign: 'middle',
  borderTop: '1px solid #ccc',
  borderRight: '1px solid #ccc',
  borderBottom: '1px solid #ccc',
  borderLeft: '1px solid #ccc',
} as const;

// 创建空单元格
export function createEmptyCell(rowIndex: number, colIndex: number): Cell {
  return {
    id: `${rowIndex}-${colIndex}`,
    content: '',
    rowSpan: 1,
    colSpan: 1,
    selected: false,
    ...DEFAULT_CELL_STYLE,
  };
}

// 创建空表格数据
export function createEmptyTable(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => createEmptyCell(rowIndex, colIndex))
  );
}

// 获取列标题 (A-Z)
export function getColumnHeaders(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}
