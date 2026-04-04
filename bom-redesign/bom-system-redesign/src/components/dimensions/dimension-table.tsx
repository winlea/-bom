import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Plus, Edit, Trash2, Image, Grid } from 'lucide-react';
import { DimRow, DimensionGroup, NewRowData, DIMENSION_TYPES, DEFAULT_NEW_ROW } from '@/types/dimension';
import { DimensionImageGenerator } from './dimension-image-generator';
import { DimensionPreviewModal } from './dimension-image-generator';

export interface DimensionTableProps {
  groups: DimensionGroup[];
  editingRow: number | null;
  editData: DimRow | null;
  isAddingRow: boolean;
  addingToGroup: number | null;
  newRow: NewRowData;
  selectedDimensions: number[];
  groupCombinedImages: { [key: number]: string };
  onEdit: (row: DimRow) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
  onAddGroup: (groupNumber: number) => void;
  onCancelNewRow: () => void;
  onSaveNewRow: () => void;
  onNewRowChange: (row: Partial<NewRowData>) => void;
  onToggleDimension: (id: number) => void;
  onGenerateGroupImage: (groupNumber: number) => void;
  onImagePreview: (imageUrl: string, title: string) => void;
}

export function DimensionTable({
  groups,
  editingRow,
  editData,
  isAddingRow,
  addingToGroup,
  newRow,
  selectedDimensions,
  groupCombinedImages,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onAddGroup,
  onCancelNewRow,
  onSaveNewRow,
  onNewRowChange,
  onToggleDimension,
  onGenerateGroupImage,
  onImagePreview,
}: DimensionTableProps) {
  // 获取尺寸类型选项
  const dimensionTypeOptions = DIMENSION_TYPES.filter((t) => !['image_dimension', 'image'].includes(t.value));

  // 计算总列数（包括选择列）
  const hasImages = groups.some((g) => g.rows.some((r) => r.imageUrl));

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
            <th className="p-2 border text-center w-14">选择</th>
            <th className="p-2 border text-center w-14">组号</th>
            <th className="p-2 border text-center w-24">类型</th>
            <th className="p-2 border text-center w-24">公差值</th>
            <th className="p-2 border text-center w-24">名义值</th>
            <th className="p-2 border text-center w-20">上公差</th>
            <th className="p-2 border text-center w-20">下公差</th>
            <th className="p-2 border text-center w-16">单位</th>
            <th className="p-2 border text-center w-16">基准</th>
            <th className="p-2 border text-center w-20">特性</th>
            {hasImages && <th className="p-2 border text-center w-32">图片</th>}
            <th className="p-2 border text-center w-20">操作</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.groupNumber}>
              {group.rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`${editingRow === row.id ? 'bg-blue-50' : ''} ${
                    selectedDimensions.includes(row.id) ? 'bg-yellow-50' : ''
                  } hover:bg-slate-50`}
                >
                  {/* 选择列 */}
                  <td className="p-1 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedDimensions.includes(row.id)}
                      onChange={() => onToggleDimension(row.id)}
                      className="w-4 h-4"
                    />
                  </td>

                  {/* 组号 */}
                  <td className="p-2 border text-center">
                    {rowIndex === 0 && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm mx-auto">
                        {group.groupNumber}
                      </div>
                    )}
                  </td>

                  {/* 类型 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Select
                        value={editData?.dimensionType}
                        onValueChange={(value) => onEdit({ ...editData!, dimensionType: value } as DimRow)}
                      >
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
                    ) : (
                      <div className="text-center text-xs">
                        {DIMENSION_TYPES.find((t) => t.value === row.dimensionType)?.label || row.dimensionType}
                      </div>
                    )}
                  </td>

                  {/* 公差值 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.toleranceValue}
                        onChange={(e) => onEdit({ ...editData!, toleranceValue: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.toleranceValue}</div>
                    )}
                  </td>

                  {/* 名义值 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.nominalValue}
                        onChange={(e) => onEdit({ ...editData!, nominalValue: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.nominalValue}</div>
                    )}
                  </td>

                  {/* 上公差 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.upperTolerance}
                        onChange={(e) => onEdit({ ...editData!, upperTolerance: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.upperTolerance}</div>
                    )}
                  </td>

                  {/* 下公差 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.lowerTolerance}
                        onChange={(e) => onEdit({ ...editData!, lowerTolerance: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.lowerTolerance}</div>
                    )}
                  </td>

                  {/* 单位 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.unit}
                        onChange={(e) => onEdit({ ...editData!, unit: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.unit}</div>
                    )}
                  </td>

                  {/* 基准 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.datum}
                        onChange={(e) => onEdit({ ...editData!, datum: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.datum}</div>
                    )}
                  </td>

                  {/* 特性 */}
                  <td className="p-1 border">
                    {editingRow === row.id ? (
                      <Input
                        value={editData?.characteristic}
                        onChange={(e) => onEdit({ ...editData!, characteristic: e.target.value } as DimRow)}
                        className="w-full h-8 text-xs text-center"
                      />
                    ) : (
                      <div className="text-center text-xs">{row.characteristic}</div>
                    )}
                  </td>

                  {/* 图片 */}
                  {hasImages && (
                    <td className="p-1 border text-center">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt="尺寸图片"
                          className="h-8 w-auto mx-auto cursor-pointer hover:opacity-80"
                          onClick={() => onImagePreview(row.imageUrl!, `尺寸图片 - ${row.id}`)}
                        />
                      ) : (
                        <DimensionImageGenerator
                          dimensionType={row.dimensionType}
                          nominalValue={row.nominalValue}
                          toleranceValue={row.toleranceValue}
                          upperTolerance={row.upperTolerance}
                          lowerTolerance={row.lowerTolerance}
                          datum={row.datum}
                        />
                      )}
                    </td>
                  )}

                  {/* 操作 */}
                  <td className="p-1 border text-center">
                    {editingRow === row.id ? (
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" onClick={onSaveEdit} className="h-7 w-7 p-0 bg-green-600">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-7 w-7 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        {rowIndex === group.rows.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddGroup(group.groupNumber)}
                            className="h-7 w-7 p-0 text-green-600"
                            title="在组内添加行"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(row)}
                          className="h-7 w-7 p-0 text-blue-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(row.id)}
                          className="h-7 w-7 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {/* 新增行 */}
              {isAddingRow && addingToGroup === group.groupNumber && (
                <tr className="bg-blue-50 border-2 border-blue-200">
                  <td className="p-1 border text-center">-</td>
                  <td className="p-2 border text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto">
                      <Plus className="h-4 w-4" />
                    </div>
                  </td>
                  <td className="p-1 border">
                    <Select
                      value={newRow.dimensionType}
                      onValueChange={(value) => onNewRowChange({ dimensionType: value })}
                    >
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
                  <td className="p-1 border">
                    <Input
                      value={newRow.toleranceValue}
                      onChange={(e) => onNewRowChange({ toleranceValue: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="公差值"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.nominalValue}
                      onChange={(e) => onNewRowChange({ nominalValue: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="名义值"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.upperTolerance}
                      onChange={(e) => onNewRowChange({ upperTolerance: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="上公差"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.lowerTolerance}
                      onChange={(e) => onNewRowChange({ lowerTolerance: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="下公差"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.unit}
                      onChange={(e) => onNewRowChange({ unit: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="单位"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.datum}
                      onChange={(e) => onNewRowChange({ datum: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="基准"
                    />
                  </td>
                  <td className="p-1 border">
                    <Input
                      value={newRow.characteristic}
                      onChange={(e) => onNewRowChange({ characteristic: e.target.value })}
                      className="w-full h-8 text-xs text-center"
                      placeholder="特性"
                    />
                  </td>
                  {hasImages && <td className="p-1 border text-center">-</td>}
                  <td className="p-1 border text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" onClick={onSaveNewRow} className="h-7 w-7 p-0 bg-green-600">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={onCancelNewRow} className="h-7 w-7 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {/* 空状态 */}
          {groups.length === 0 && (
            <tr>
              <td colSpan={hasImages ? 13 : 12} className="p-8 text-center text-gray-500">
                暂无尺寸数据，点击"新增尺寸组"开始添加
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DimensionTable;
