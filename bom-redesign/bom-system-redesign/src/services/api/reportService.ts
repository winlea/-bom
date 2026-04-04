/**
 * Report Service - 报表生成相关 API 服务
 */
import { apiClient } from './client';
import { ODS_GENERATE, ODS_PREVIEW, PSW_GENERATE, PROCESS_CAPABILITY_GENERATE } from '@/constants/api';

export interface ODSPreview {
  dimensions: Dimension[];
  part_id: number;
}

export interface Dimension {
  sequence_no: number;
  technical_note: string;
  measurement_method: string;
  characteristic_code: string;
  frequency: string;
  image_url?: string;
}

export const reportService = {
  /**
   * 获取 ODS 预览数据
   */
  async getODSPreview(partId: number): Promise<ODSPreview> {
    return apiClient.get(ODS_PREVIEW(partId));
  },

  /**
   * 生成 ODS 文档
   */
  async generateODS(partId: number): Promise<Blob> {
    return apiClient.post(ODS_GENERATE, { part_id: partId });
  },

  /**
   * 生成 PSW 文档
   */
  async generatePSW(partId: number): Promise<Blob> {
    return apiClient.post(PSW_GENERATE, { part_id: partId });
  },

  /**
   * 生成过程能力分析报告
   */
  async generateProcessCapability(params: { part_id?: number; project_id?: number }): Promise<Blob> {
    return apiClient.post(PROCESS_CAPABILITY_GENERATE, params);
  },

  /**
   * 下载文件
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
