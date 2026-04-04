// useDimensions Hook - 尺寸数据管理
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DimRow, NewRowData } from '@/types/dimension';
import * as dimensionService from '@/services/api/dimensionService';

// 查询键
export const dimensionKeys = {
  all: ['dimensions'] as const,
  lists: () => [...dimensionKeys.all, 'list'] as const,
  list: (projectId: string | number, partNumber: string) => [...dimensionKeys.lists(), { projectId: String(projectId), partNumber }] as const,
  details: () => [...dimensionKeys.all, 'detail'] as const,
  detail: (id: number) => [...dimensionKeys.details(), id] as const,
};

// 获取尺寸列表
export function useDimensions(projectId: string, partNumber: string) {
  return useQuery({
    queryKey: dimensionKeys.list(projectId, partNumber),
    queryFn: async () => {
      const response = await dimensionService.fetchDimensions(projectId, partNumber);
      if (!response.success) {
        throw new Error(response.message || '获取尺寸数据失败');
      }
      return response.data || [];
    },
    enabled: !!projectId && !!partNumber,
  });
}

// 创建尺寸
export function useCreateDimension(options?: { onSuccess?: (data: DimRow) => void; onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      partNumber,
      data,
    }: {
      projectId: string;
      partNumber: string;
      data: NewRowData;
    }) => {
      const response = await dimensionService.createDimension(projectId, partNumber, data);
      if (!response.success) {
        throw new Error(response.message || '创建尺寸失败');
      }
      // 转换 groupNumber -> groupNo 以匹配 DimRow
      const row: DimRow = {
        id: response.data?.id || 0,
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
        imageUrl: data.imageUrl,
      };
      return row;
    },
    onSuccess: (data, variables) => {
      // 乐观更新：立即添加到列表
      queryClient.setQueryData<DimRow[]>(dimensionKeys.list(variables.projectId, variables.partNumber), (old) => {
        if (!old) return [data];
        return [...old, data];
      });
      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      // 回滚：重新获取数据
      queryClient.invalidateQueries({
        queryKey: dimensionKeys.list(variables.projectId, variables.partNumber),
      });
      options?.onError?.(error as Error);
    },
  });
}

// 更新尺寸
export function useUpdateDimension(options?: { onSuccess?: () => void; onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      context,
    }: {
      id: number;
      data: Partial<DimRow>;
      context?: { projectId: string; partNumber: string };
    }) => {
      const response = await dimensionService.updateDimension(id, data);
      if (!response.success) {
        throw new Error(response.message || '更新尺寸失败');
      }
      return { id, ...data };
    },
    onSuccess: (data, variables) => {
      if (variables.context) {
        // 乐观更新
        queryClient.setQueryData<DimRow[]>(
          dimensionKeys.list(variables.context.projectId, variables.context.partNumber),
          (old) => {
            if (!old) return old;
            return old.map((dim) => (dim.id === data.id ? { ...dim, ...data } : dim));
          }
        );
      }
      options?.onSuccess?.();
    },
    onError: (error, variables) => {
      if (variables.context) {
        queryClient.invalidateQueries({
          queryKey: dimensionKeys.list(variables.context.projectId, variables.context.partNumber),
        });
      }
      options?.onError?.(error as Error);
    },
  });
}

// 删除尺寸
export function useDeleteDimension(options?: { onSuccess?: () => void; onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, context }: { id: number; context?: { projectId: string; partNumber: string } }) => {
      const response = await dimensionService.deleteDimension(id);
      if (!response.success) {
        throw new Error(response.message || '删除尺寸失败');
      }
      return { id };
    },
    onSuccess: (_, variables) => {
      if (variables.context) {
        // 乐观更新：从列表中移除
        queryClient.setQueryData<DimRow[]>(
          dimensionKeys.list(variables.context.projectId, variables.context.partNumber),
          (old) => {
            if (!old) return old;
            return old.filter((dim) => dim.id !== variables.id);
          }
        );
      }
      options?.onSuccess?.();
    },
    onError: (error, variables) => {
      if (variables.context) {
        // 回滚：重新获取数据
        queryClient.invalidateQueries({
          queryKey: dimensionKeys.list(variables.context.projectId, variables.context.partNumber),
        });
      }
      options?.onError?.(error as Error);
    },
  });
}

// 批量保存 Canvas 图片
export function useBatchSaveCanvasImages(options?: { onSuccess?: () => void; onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dimensionService.batchSaveCanvasImages,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dimensionKeys.list(variables.projectId, variables.partNumber),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error as Error);
    },
  });
}
