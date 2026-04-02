import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DimensionDrawingCanvas from '@/components/dimension-drawing-canvas';
import DimensionDrawingConfig from '@/components/dimension-drawing-config';
import DimensionDrawingPreview from '@/components/dimension-drawing-preview';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw } from 'lucide-react';

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

export const DimensionDrawingPage: React.FC = () => {
  // 初始尺寸数据
  const [dimensions, setDimensions] = useState<DimensionData[]>([
    {
      id: 1,
      type: 'diameter',
      nominalValue: '10',
      toleranceValue: '',
      upperTolerance: '0.05',
      lowerTolerance: '-0.05',
      datum: '',
    },
    {
      id: 2,
      type: 'position',
      nominalValue: '',
      toleranceValue: '0.2',
      upperTolerance: '',
      lowerTolerance: '',
      datum: 'A',
    },
    {
      id: 3,
      type: 'position',
      nominalValue: '',
      toleranceValue: '0.1',
      upperTolerance: '',
      lowerTolerance: '',
      datum: 'B',
    },
  ]);

  // 初始配置
  const [config, setConfig] = useState<DrawingConfig>({
    canvasWidth: 800,
    canvasHeight: 600,
    padding: 20,
    spacing: 10,
    backgroundColor: '#ffffff',
  });

  // 绘制结果
  const [imageData, setImageData] = useState<string>('');

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 处理尺寸数据变化
  const handleDimensionsChange = (newDimensions: DimensionData[]) => {
    setDimensions(newDimensions);
  };

  // 处理配置变化
  const handleConfigChange = (newConfig: DrawingConfig) => {
    setConfig(newConfig);
  };

  // 处理绘制完成
  const handleDrawingComplete = (data: string) => {
    setImageData(data);
  };

  // 保存绘制结果
  const handleSave = async () => {
    if (!imageData) return;

    setIsSaving(true);

    try {
      // 模拟保存到后端
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">尺寸绘制功能</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-8 text-gray-600">
            根据尺寸组合数量将画布分成相应部分，并在不同部分绘制不同类型的尺寸数据。
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：配置区域 */}
            <div className="lg:col-span-1">
              <DimensionDrawingConfig
                dimensions={dimensions}
                config={config}
                onDimensionsChange={handleDimensionsChange}
                onConfigChange={handleConfigChange}
              />
            </div>

            {/* 右侧：预览区域 */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* 绘制画布 */}
                <Card>
                  <CardHeader>
                    <CardTitle>绘制画布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DimensionDrawingCanvas
                      dimensions={dimensions}
                      config={config}
                      onDrawingComplete={handleDrawingComplete}
                    />
                  </CardContent>
                </Card>

                {/* 预览区域 */}
                <DimensionDrawingPreview imageData={imageData} />

                {/* 操作按钮 */}
                <div className="flex justify-end gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !imageData}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存到数据库
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DimensionDrawingPage;