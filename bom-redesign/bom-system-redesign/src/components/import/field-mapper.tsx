import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BACKEND_FIELDS } from '@/types/import';

interface FieldMapperProps {
  headers: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

// 字段中文名称映射
const FIELD_LABELS: Record<string, string> = {
  part_number: '零件编号',
  part_name: '零件名称',
  image_url: '图片URL',
  image_base64: '图片Base64',
  original_material: '原材料',
  final_material_cn: '最终材料(中文)',
  net_weight_kg: '净重(kg)',
  sequence: '序号',
  drawing_2d: '2D图纸',
  drawing_3d: '3D图纸',
};

export function FieldMapper({ headers, mapping, onMappingChange }: FieldMapperProps) {
  const handleMappingChange = (field: string, value: string) => {
    const newMapping = { ...mapping };
    if (value) {
      newMapping[field] = value;
    } else {
      delete newMapping[field];
    }
    onMappingChange(newMapping);
  };

  // 获取已映射的字段
  const mappedFields = Object.keys(mapping);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">字段映射</h4>
        <p className="text-xs text-gray-500 mb-3">将左侧的Excel列映射到右侧的系统字段。空值表示该字段不导入。</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BACKEND_FIELDS.map((field) => (
          <div key={field} className="flex items-center gap-2">
            <div className="w-28 text-sm text-slate-600 truncate" title={FIELD_LABELS[field] || field}>
              {FIELD_LABELS[field] || field}
            </div>
            <div className="flex-1">
              <select
                value={mapping[field] || ''}
                onChange={(e) => handleMappingChange(field, e.target.value)}
                className="w-full h-8 px-2 text-sm border rounded bg-white"
              >
                <option value="">-- 不导入 --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            {mapping[field] && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                已映射
              </Badge>
            )}
          </div>
        ))}
      </div>

      {mappedFields.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            已映射 {mappedFields.length}/{BACKEND_FIELDS.length} 个字段
          </p>
        </div>
      )}
    </div>
  );
}

export default FieldMapper;
