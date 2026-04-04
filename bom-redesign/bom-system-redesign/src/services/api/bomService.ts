import axiosInstance from './axiosInstance';

// BOM零件类型定义
export interface BomPart {
  id: number;
  part_number: string;
  part_name?: string;
  sequence?: string;
  assembly_level?: number;
  bom_sort?: number;
  drawing_2d?: string;
  drawing_3d?: string;
  image_url?: string;
  original_material?: string;
  final_material_cn?: string;
  part_category?: string;
  net_weight_kg?: number;
  created_at?: string;
}

// BOM服务类
class BomService {
  /**
   * 获取零件列表
   * @param q 搜索关键词
   * @param limit 限制数量
   * @returns 零件列表
   */
  async getParts(q?: string, limit: number = 20): Promise<BomPart[]> {
    const params = { q, limit };
    const response = await axiosInstance.get('/items', { params });
    return response.data?.items || [];
  }

  /**
   * 导入BOM
   * @param file 文件
   * @param projectId 项目ID
   * @returns 导入结果
   * @throws 包含详细错误信息的错误对象
   */
  async importBOM(file: File, projectId?: number): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('project_id', projectId.toString());
    }
    try {
      const response = await axiosInstance.post('/import/bom', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data || response;
    } catch (error: any) {
      // 构建包含详细错误信息的错误对象
      const errorMessage = error.errorMessage || error.message || '导入BOM失败';
      const errorDetails = error.errorDetails || error.response?.data?.details || error.response?.data?.errors;

      const enhancedError = new Error(errorMessage);
      (enhancedError as any).errorDetails = errorDetails;
      (enhancedError as any).originalError = error;

      throw enhancedError;
    }
  }

  /**
   * 上传图片（Base64）
   * @param part_number 零件编号
   * @param image_data 图片数据（Base64）
   * @param part_name 零件名称
   * @returns 上传结果
   */
  async uploadBase64Image(part_number: string, image_data: string, part_name?: string): Promise<any> {
    const data = {
      part_number,
      image_data,
      part_name,
    };
    const response = await axiosInstance.post('/upload/base64', data);
    return response.data || response;
  }

  /**
   * 上传图片（URL）
   * @param part_number 零件编号
   * @param url 图片URL
   * @param part_name 零件名称
   * @returns 上传结果
   */
  async uploadUrlImage(part_number: string, url: string, part_name?: string): Promise<any> {
    const data = {
      part_number,
      url,
      part_name,
    };
    const response = await axiosInstance.post('/upload/url', data);
    return response.data || response;
  }

  /**
   * 获取图片
   * @param recordId 记录ID
   * @returns 图片URL
   */
  getImageUrl(recordId: number): string {
    return `/download/${recordId}`;
  }
}

// 导出BOM服务实例
export default new BomService();
