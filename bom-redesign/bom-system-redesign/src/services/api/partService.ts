/**
 * Part Service - 零件相关 API 服务
 */
import { apiClient } from './client';
import { PARTS, PART_DETAIL, PART_IMAGE, UPLOAD_BASE64, UPLOAD_URL } from '@/constants/api';

export interface Part {
  id: number;
  part_number: string;
  part_name: string;
  sequence?: string;
  assembly_level?: number;
  original_material?: string;
  final_material_cn?: string;
  net_weight_kg?: number;
  drawing_2d?: string;
  drawing_3d?: string;
  image_url?: string;
  part_category?: string;
  project_id?: number;
  created_at?: string;
  has_image?: boolean;
}

export interface CreatePartDto {
  part_number: string;
  part_name: string;
  project_id: number;
  sequence?: string;
  assembly_level?: number;
  original_material?: string;
  final_material_cn?: string;
  net_weight_kg?: number;
  drawing_2d?: string;
  drawing_3d?: string;
  image_url?: string;
  part_category?: string;
}

export const partService = {
  /**
   * 获取零件列表
   */
  async list(params?: { project_id?: number; q?: string }): Promise<{ items: Part[] }> {
    const searchParams = new URLSearchParams();
    if (params?.project_id) searchParams.set('project_id', String(params.project_id));
    if (params?.q) searchParams.set('q', params.q);

    const query = searchParams.toString();
    return apiClient.get(`${PARTS}${query ? `?${query}` : ''}`);
  },

  /**
   * 获取单个零件
   */
  async get(id: number): Promise<Part> {
    return apiClient.get(PART_DETAIL(id));
  },

  /**
   * 创建零件
   */
  async create(data: CreatePartDto): Promise<Part> {
    return apiClient.post(PARTS, data);
  },

  /**
   * 更新零件
   */
  async update(id: number, data: Partial<CreatePartDto>): Promise<Part> {
    return apiClient.put(PART_DETAIL(id), data);
  },

  /**
   * 删除零件
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(PART_DETAIL(id));
  },

  /**
   * 获取零件图片URL
   */
  getImageUrl(id: number): string {
    return PART_IMAGE(id);
  },

  /**
   * 上传 Base64 图片
   */
  async uploadBase64(partNumber: string, imageData: string, partName?: string): Promise<{ id: number }> {
    return apiClient.post(UPLOAD_BASE64, {
      part_number: partNumber,
      image_data: imageData,
      part_name: partName,
    });
  },

  /**
   * 上传 URL 图片
   */
  async uploadUrl(partNumber: string, url: string, partName?: string): Promise<{ id: number }> {
    return apiClient.post(UPLOAD_URL, {
      part_number: partNumber,
      url,
      part_name: partName,
    });
  },
};
