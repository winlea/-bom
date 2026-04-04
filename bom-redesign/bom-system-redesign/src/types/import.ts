// 导入相关类型定义

export interface ProjectOption {
  id: string;
  name: string;
}

export interface ImportLog {
  id: number;
  project_id?: number | null;
  filename?: string | null;
  created_count?: number;
  errors_count?: number;
  created_at?: string;
  status?: string;
  errors_preview?: string[];
}

export interface ImportState {
  open: boolean;
  projects: ProjectOption[];
  selectedProject: string | undefined;
  createNewProject: boolean;
  newProjectName: string;
  newProjectDesc: string;
  file: File | null;
  headers: string[];
  previewRows: string[][];
  mapping: Record<string, string>;
  loading: boolean;
  resultMessage: string | null;
  error: string | null;
  importLog: ImportLog | null;
}

// 后端支持的标准字段
export const BACKEND_FIELDS = [
  'part_number',
  'part_name',
  'image_url',
  'image_base64',
  'original_material',
  'final_material_cn',
  'net_weight_kg',
  'sequence',
  'drawing_2d',
  'drawing_3d',
] as const;

// 解析 CSV 文本
export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === '') idx++;
  if (idx >= lines.length) return { headers: [], rows: [] };

  const first = lines[idx];
  const hdrs = first.split(',').map((h) => h.trim());
  const rows = lines.slice(idx + 1, idx + 6).map((ln) => ln.split(',').map((c) => c.trim()));

  return { headers: hdrs, rows };
}

// 默认字段映射
export function createDefaultMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  BACKEND_FIELDS.forEach((field) => {
    const idx = lowerHeaders.findIndex(
      (h) => h === field.toLowerCase() || h.includes(field.replace('_', '')) || field.includes(h.replace(/\s/g, '_'))
    );
    if (idx !== -1) {
      mapping[field] = headers[idx];
    }
  });

  return mapping;
}
