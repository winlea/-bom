// 尺寸数据 API 服务层
import { DimRow, NewRowData } from '@/types/dimension';

const API_BASE = '/api/dimensions';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface BatchSaveCanvasRequest {
  images: Array<{
    dimensionId: number;
    groupNo: number;
    imageData: string;
  }>;
  projectId: number;
  partNumber: string;
}

// 获取尺寸列表
export async function fetchDimensions(projectId: string, partNumber: string): Promise<ApiResponse<DimRow[]>> {
  const response = await fetch(`${API_BASE}/projects/${projectId}?part_number=${encodeURIComponent(partNumber)}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 创建新尺寸
export async function createDimension(
  projectId: string,
  partNumber: string,
  data: NewRowData
): Promise<ApiResponse<{ id: number }>> {
  const response = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partId: partNumber,
      groupNo: data.groupNumber,
      dimensionType: data.dimensionType,
      nominalValue: data.nominalValue,
      toleranceValue: data.toleranceValue,
      upperTolerance: data.upperTolerance,
      lowerTolerance: data.lowerTolerance,
      unit: data.unit,
      datum: data.datum,
      characteristic: data.characteristic,
      notes: data.notes,
    }),
  });

  return response.json();
}

// 更新尺寸
export async function updateDimension(id: number, data: Partial<DimRow>): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

// 删除尺寸（带重排序）
export async function deleteDimension(id: number): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/${id}/delete-with-reorder`, {
    method: 'DELETE',
  });

  return response.json();
}

// 批量保存 Canvas 图片
export async function batchSaveCanvasImages(request: BatchSaveCanvasRequest): Promise<ApiResponse<{ count: number }>> {
  const response = await fetch(`${API_BASE}/images/batch-save-canvas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}

// 插入尺寸
export async function insertDimension(
  projectId: string,
  partNumber: string,
  position: number,
  data: Partial<NewRowData>
): Promise<ApiResponse<{ id: number }>> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/insert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partId: partNumber,
      position,
      ...data,
    }),
  });

  return response.json();
}

// 导出尺寸为 Excel
export async function exportDimensionsExcel(projectId: string, partNumber: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/projects/${projectId}/export?part_number=${encodeURIComponent(partNumber)}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.blob();
}

// 导出尺寸报告
export async function exportDimensionReport(projectId: string, partNumber: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/projects/${projectId}/report?part_number=${encodeURIComponent(partNumber)}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.blob();
}

export default {
  fetchDimensions,
  createDimension,
  updateDimension,
  deleteDimension,
  batchSaveCanvasImages,
  insertDimension,
  exportDimensionsExcel,
  exportDimensionReport,
};
