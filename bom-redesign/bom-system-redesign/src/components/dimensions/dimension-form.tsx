// 尺寸表单组件 - 用于新增和编辑尺寸行
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Plus } from 'lucide-react';
import { DimRow, NewRowData, DIMENSION_TYPES } from '@/types/dimension';
import { isGeometricType } from '@/utils/dimension-validators';

export interface DimensionFormProps {
  mode: 'create' | 'edit';
  row: DimRow | NewRowData;
  onChange: (row: DimRow | NewRowData) => void;
  onSave: () => void;
  onCancel: () => void;
  hasImages?: boolean;
}

// 过滤掉图片类型的尺寸选项
const dimensionTypeOptions = DIMENSION_TYPES.filter((t) => !['image_dimension', 'image'].includes(t.value));

export function DimensionForm({ mode, row, onChange, onSave, onCancel, hasImages = false }: DimensionFormProps) {
  const isEdit = mode === 'edit';
  const isGeometric = isGeometricType(row.dimensionType);

  const handleChange = (field: keyof (DimRow | NewRowData), value: string) => {
    onChange({ ...row, [field]: value } as DimRow | NewRowData);
  };

  return (
    <tr className={`${isEdit ? 'bg-blue-50' : 'bg-blue-50 border-2 border-blue-200'}`}>
      {/* 选择列 */}
      <td className="p-1 border text-center">-</td>

      {/* 组号 */}
      <td className="p-2 border text-center">
        <div
          className={`w-8 h-8 ${isEdit ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto`}
        >
          {isEdit ? (
            <span className="text-xs">#{'groupNo' in row ? row.groupNo : row.groupNumber}</span>
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </div>
      </td>

      {/* 类型 */}
      <td className="p-1 border">
        <Select value={row.dimensionType} onValueChange={(value) => handleChange('dimensionType', value)}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dimensionTypeOptions.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* 公差值 */}
      <td className="p-1 border">
        <Input
          value={row.toleranceValue}
          onChange={(e) => handleChange('toleranceValue', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder={isGeometric ? '必须填写' : '公差值'}
        />
      </td>

      {/* 名义值 */}
      <td className="p-1 border">
        <Input
          value={row.nominalValue}
          onChange={(e) => handleChange('nominalValue', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder="名义值"
        />
      </td>

      {/* 上公差 */}
      <td className="p-1 border">
        <Input
          value={row.upperTolerance}
          onChange={(e) => handleChange('upperTolerance', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder="上公差"
        />
      </td>

      {/* 下公差 */}
      <td className="p-1 border">
        <Input
          value={row.lowerTolerance}
          onChange={(e) => handleChange('lowerTolerance', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder="下公差"
        />
      </td>

      {/* 单位 */}
      <td className="p-1 border">
        <Input
          value={row.unit || ''}
          onChange={(e) => handleChange('unit', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder="单位"
        />
      </td>

      {/* 基准 */}
      <td className="p-1 border">
        <Input
          value={row.datum}
          onChange={(e) => handleChange('datum', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder={row.dimensionType === 'position' ? '必须填写' : '基准'}
        />
      </td>

      {/* 特性 */}
      <td className="p-1 border">
        <Input
          value={row.characteristic}
          onChange={(e) => handleChange('characteristic', e.target.value)}
          className="w-full h-8 text-xs text-center"
          placeholder="特性"
        />
      </td>

      {/* 图片 */}
      {hasImages && <td className="p-1 border text-center">-</td>}

      {/* 操作 */}
      <td className="p-1 border text-center">
        <div className="flex gap-1 justify-center">
          <Button size="sm" onClick={onSave} className="h-7 w-7 p-0 bg-green-600">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="h-7 w-7 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default DimensionForm;
