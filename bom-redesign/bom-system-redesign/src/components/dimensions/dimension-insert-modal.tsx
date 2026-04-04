// 插入尺寸模态框
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DIMENSION_TYPES } from '@/types/dimension';
import { isValidNumber, isGeometricType } from '@/utils/dimension-validators';

export interface InsertModalProps {
  isOpen: boolean;
  position: number;
  maxPosition: number;
  groupNumber: number;
  onClose: () => void;
  onInsert: (
    position: number,
    data: {
      groupNo: number;
      dimensionType: string;
      nominalValue: string;
      toleranceValue: string;
      upperTolerance: string;
      lowerTolerance: string;
      datum: string;
      characteristic: string;
    }
  ) => Promise<void>;
}

const dimensionTypeOptions = DIMENSION_TYPES.filter((t) => !['image_dimension', 'image'].includes(t.value));

export function DimensionInsertModal({
  isOpen,
  position,
  maxPosition,
  groupNumber,
  onClose,
  onInsert,
}: InsertModalProps) {
  const [insertPosition, setInsertPosition] = useState(position);
  const [dimensionType, setDimensionType] = useState('normal');
  const [nominalValue, setNominalValue] = useState('');
  const [toleranceValue, setToleranceValue] = useState('');
  const [upperTolerance, setUpperTolerance] = useState('');
  const [lowerTolerance, setLowerTolerance] = useState('');
  const [datum, setDatum] = useState('');
  const [characteristic, setCharacteristic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInsertPosition(position);
      // 重置表单
      setDimensionType('normal');
      setNominalValue('');
      setToleranceValue('');
      setUpperTolerance('');
      setLowerTolerance('');
      setDatum('');
      setCharacteristic('');
      setError('');
    }
  }, [isOpen, position]);

  const handleInsert = async () => {
    setError('');

    if (!nominalValue.trim()) {
      setError('请输入名义值');
      return;
    }

    if (!isValidNumber(nominalValue)) {
      setError('名义值必须是有效的数字');
      return;
    }

    if (isGeometricType(dimensionType) && !toleranceValue.trim()) {
      setError('几何公差类型必须输入公差值');
      return;
    }

    if (dimensionType === 'position' && !datum.trim()) {
      setError('位置度必须指定基准');
      return;
    }

    setLoading(true);
    try {
      await onInsert(insertPosition, {
        groupNo: groupNumber,
        dimensionType,
        nominalValue,
        toleranceValue,
        upperTolerance,
        lowerTolerance,
        datum,
        characteristic,
      });
      onClose();
    } catch (err) {
      setError('插入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isGeometric = isGeometricType(dimensionType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>插入尺寸</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 插入位置 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">插入位置（组内序号）</label>
            <Select value={String(insertPosition)} onValueChange={(v) => setInsertPosition(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxPosition + 1 }, (_, i) => i + 1).map((pos) => (
                  <SelectItem key={pos} value={String(pos)}>
                    位置 {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 尺寸类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">尺寸类型</label>
            <Select value={dimensionType} onValueChange={setDimensionType}>
              <SelectTrigger>
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
          </div>

          {/* 公差值 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              公差值 {isGeometric && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              placeholder={isGeometric ? '必须填写' : '可选'}
            />
          </div>

          {/* 名义值 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              名义值 <span className="text-red-500">*</span>
            </label>
            <Input value={nominalValue} onChange={(e) => setNominalValue(e.target.value)} placeholder="输入名义值" />
          </div>

          {/* 上下公差 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">上公差</label>
              <Input value={upperTolerance} onChange={(e) => setUpperTolerance(e.target.value)} placeholder="+0.05" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">下公差</label>
              <Input value={lowerTolerance} onChange={(e) => setLowerTolerance(e.target.value)} placeholder="-0.05" />
            </div>
          </div>

          {/* 基准 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              基准 {dimensionType === 'position' && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              placeholder={dimensionType === 'position' ? '必须填写' : '可选'}
            />
          </div>

          {/* 特性 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">特性</label>
            <Input value={characteristic} onChange={(e) => setCharacteristic(e.target.value)} placeholder="可选" />
          </div>

          {/* 错误提示 */}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleInsert} disabled={loading}>
            {loading ? '插入中...' : '插入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DimensionInsertModal;
