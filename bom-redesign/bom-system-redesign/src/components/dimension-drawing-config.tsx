import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface DimensionData {
  id: number;
  type: string; // 尺寸类型，如 'diameter'（孔径）、'position'（位置度）等
  nominalValue: string; // 名义值
  toleranceValue: string; // 公差值
  upperTolerance: string; // 上公差
  lowerTolerance: string; // 下公差
  datum: string; // 基准，如 'A', 'B', 'C' 等
}

interface DrawingConfig {
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
  spacing: number;
  backgroundColor: string;
}

interface DimensionDrawingConfigProps {
  dimensions: DimensionData[];
  config: DrawingConfig;
  onDimensionsChange: (dimensions: DimensionData[]) => void;
  onConfigChange: (config: DrawingConfig) => void;
  className?: string;
}

const dimensionTypes = [
  { value: 'normal', label: '普通尺寸' },
  { value: 'diameter', label: '孔径' },
  { value: 'radius', label: '半径' },
  { value: 'position', label: '位置度' },
  { value: 'flatness', label: '平面度' },
  { value: 'straightness', label: '直线度' },
  { value: 'roundness', label: '圆度' },
  { value: 'cylindricity', label: '圆柱度' },
  { value: 'parallelism', label: '平行度' },
  { value: 'perpendicularity', label: '垂直度' },
  { value: 'angularity', label: '倾斜度' },
  { value: 'concentricity', label: '同心度' },
  { value: 'symmetry', label: '对称度' },
  { value: 'profile_surface', label: '面轮廓度' },
  { value: 'profile_line', label: '线轮廓度' },
  { value: 'circular_runout', label: '圆跳动' },
  { value: 'total_runout', label: '全跳动' },
  { value: 'coplanarity', label: '共面度' },
];

export const DimensionDrawingConfig: React.FC<DimensionDrawingConfigProps> = ({
  dimensions,
  config,
  onDimensionsChange,
  onConfigChange,
  className = '',
}) => {
  const [nextId, setNextId] = useState(4);

  const handleAddDimension = () => {
    const newDimension: DimensionData = {
      id: nextId,
      type: 'normal',
      nominalValue: '',
      toleranceValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      datum: '',
    };
    onDimensionsChange([...dimensions, newDimension]);
    setNextId(nextId + 1);
  };

  const handleRemoveDimension = (id: number) => {
    onDimensionsChange(dimensions.filter(d => d.id !== id));
  };

  const handleDimensionChange = (id: number, field: keyof DimensionData, value: string) => {
    onDimensionsChange(
      dimensions.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      )
    );
  };

  const handleConfigChange = (field: keyof DrawingConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 尺寸数据输入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>尺寸数据</span>
            <Button
              onClick={handleAddDimension}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加尺寸
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dimensions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>请点击“添加尺寸”按钮添加尺寸数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dimensions.map((dimension) => (
                <div
                  key={dimension.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">尺寸 {dimension.id}</h3>
                    <Button
                      onClick={() => handleRemoveDimension(dimension.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`type-${dimension.id}`}>尺寸类型</Label>
                      <Select
                        value={dimension.type}
                        onValueChange={(value) =>
                          handleDimensionChange(dimension.id, 'type', value)
                        }
                      >
                        <SelectTrigger id={`type-${dimension.id}`}>
                          <SelectValue placeholder="选择尺寸类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {dimensionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`nominalValue-${dimension.id}`}>名义值</Label>
                      <Input
                        id={`nominalValue-${dimension.id}`}
                        value={dimension.nominalValue}
                        onChange={(e) =>
                          handleDimensionChange(dimension.id, 'nominalValue', e.target.value)
                        }
                        placeholder="输入名义值"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`toleranceValue-${dimension.id}`}>公差值</Label>
                      <Input
                        id={`toleranceValue-${dimension.id}`}
                        value={dimension.toleranceValue}
                        onChange={(e) =>
                          handleDimensionChange(dimension.id, 'toleranceValue', e.target.value)
                        }
                        placeholder="输入公差值"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`datum-${dimension.id}`}>基准</Label>
                      <Input
                        id={`datum-${dimension.id}`}
                        value={dimension.datum}
                        onChange={(e) =>
                          handleDimensionChange(dimension.id, 'datum', e.target.value)
                        }
                        placeholder="输入基准（如 A、B、C）"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`upperTolerance-${dimension.id}`}>上公差</Label>
                      <Input
                        id={`upperTolerance-${dimension.id}`}
                        value={dimension.upperTolerance}
                        onChange={(e) =>
                          handleDimensionChange(dimension.id, 'upperTolerance', e.target.value)
                        }
                        placeholder="输入上公差"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lowerTolerance-${dimension.id}`}>下公差</Label>
                      <Input
                        id={`lowerTolerance-${dimension.id}`}
                        value={dimension.lowerTolerance}
                        onChange={(e) =>
                          handleDimensionChange(dimension.id, 'lowerTolerance', e.target.value)
                        }
                        placeholder="输入下公差"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置参数 */}
      <Card>
        <CardHeader>
          <CardTitle>绘制配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="canvasWidth">画布宽度</Label>
              <Input
                id="canvasWidth"
                type="number"
                value={config.canvasWidth}
                onChange={(e) =>
                  handleConfigChange('canvasWidth', parseInt(e.target.value) || 800)
                }
                min="400"
                max="2000"
              />
            </div>
            <div>
              <Label htmlFor="canvasHeight">画布高度</Label>
              <Input
                id="canvasHeight"
                type="number"
                value={config.canvasHeight}
                onChange={(e) =>
                  handleConfigChange('canvasHeight', parseInt(e.target.value) || 600)
                }
                min="300"
                max="1500"
              />
            </div>
            <div>
              <Label htmlFor="padding">边距</Label>
              <Input
                id="padding"
                type="number"
                value={config.padding}
                onChange={(e) =>
                  handleConfigChange('padding', parseInt(e.target.value) || 20)
                }
                min="10"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="spacing">间距</Label>
              <Input
                id="spacing"
                type="number"
                value={config.spacing}
                onChange={(e) =>
                  handleConfigChange('spacing', parseInt(e.target.value) || 10)
                }
                min="0"
                max="50"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="backgroundColor">背景颜色</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={config.backgroundColor}
                onChange={(e) =>
                  handleConfigChange('backgroundColor', e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DimensionDrawingConfig;