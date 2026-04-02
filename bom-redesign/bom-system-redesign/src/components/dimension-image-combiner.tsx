import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Save, 
  Grid, 
  Image as ImageIcon, 
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DimensionData {
  id: number;
  groupNo: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
  characteristic: string;
  notes: string;
}

interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  gridCols: number;
  padding: number;
  spacing: number;
  backgroundColor: string;
  showBorder: boolean;
  showLabels: boolean;
}

interface DimensionImageCombinerProps {
  projectId: string;
  partId: string;
  dimensions: DimensionData[];
  onSaveSuccess?: (combinedImageUrl: string) => void;
  className?: string;
}

export const DimensionImageCombiner: React.FC<DimensionImageCombinerProps> = ({
  projectId,
  partId,
  dimensions,
  onSaveSuccess,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    canvasWidth: 1200,
    canvasHeight: 800,
    gridCols: 1, // 每个尺寸另起一行，固定为1
    padding: 30,
    spacing: 20,
    backgroundColor: '#ffffff',
    showBorder: true,
    showLabels: true
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [dimensionCanvases, setDimensionCanvases] = useState<Map<number, string>>(new Map());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 生成单个尺寸的Canvas图片
  const generateDimensionCanvas = (dimension: DimensionData): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // 设置画布尺寸
      canvas.width = 200;
      canvas.height = 80;

      // 绘制背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制边框
      if (layoutConfig.showBorder) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
      }

      // 绘制尺寸内容
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 主要尺寸文本
      const symbol = getDimensionSymbol(dimension.dimensionType);
      const mainText = `${symbol}${dimension.nominalValue || '0'}`;
      ctx.fillText(mainText, canvas.width / 2, canvas.height / 2 - 10);

      // 公差文本
      if (dimension.upperTolerance || dimension.lowerTolerance) {
        ctx.font = '12px Arial';
        const toleranceText = buildToleranceText(dimension.upperTolerance, dimension.lowerTolerance);
        ctx.fillText(toleranceText, canvas.width / 2, canvas.height / 2 + 10);
      }

      // 标签
      if (layoutConfig.showLabels && dimension.characteristic) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText(dimension.characteristic, canvas.width / 2, canvas.height - 10);
      }

      resolve(canvas.toDataURL('image/png'));
    });
  };

  // 获取尺寸符号
  const getDimensionSymbol = (type: string): string => {
    const symbols = {
      normal: '',
      diameter: '⌀',
      radius: 'R',
      position: '⌖',
      profile_surface: '⌓',
      flatness: '⏥',
      coplanarity: '⏥⏥',
    };
    return symbols[type as keyof typeof symbols] || '';
  };

  // 构建公差文本
  const buildToleranceText = (upper: string, lower: string): string => {
    if (!upper && !lower) return '';
    
    const up = parseFloat(upper || '0');
    const lo = parseFloat(lower || '0');

    if (upper && lower && Math.abs(up) === Math.abs(lo) && up > 0 && lo < 0) {
      return `±${Math.abs(up)}`;
    }

    if (upper && lower) {
      const upT = up >= 0 ? `+${up}` : `${up}`;
      const loT = lo >= 0 ? `+${lo}` : `${lo}`;
      return `${upT}/${loT}`;
    }

    if (upper) return up >= 0 ? `+${up}` : `${up}`;
    if (lower) return lo >= 0 ? `+${lo}` : `${lo}`;
    return '';
  };

  // 生成拼接预览
  const generateCombinedPreview = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 设置画布尺寸
      canvas.width = layoutConfig.canvasWidth;
      canvas.height = layoutConfig.canvasHeight;

      // 绘制背景
      ctx.fillStyle = layoutConfig.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 生成所有尺寸的Canvas图片
      const canvasMap = new Map<number, string>();
      
      for (const dimension of dimensions) {
        const canvasDataUrl = await generateDimensionCanvas(dimension);
        canvasMap.set(dimension.id, canvasDataUrl);
      }
      
      setDimensionCanvases(canvasMap);

      // 计算布局 - 水平拼接成一行
      const { padding, spacing } = layoutConfig;
      const totalItems = dimensions.length;
      const itemWidth = (canvas.width - 2 * padding - (totalItems - 1) * spacing) / totalItems;
      const itemHeight = canvas.height - 2 * padding;

      // 绘制每个尺寸图片
      for (let i = 0; i < dimensions.length; i++) {
        const dimension = dimensions[i];
        const canvasDataUrl = canvasMap.get(dimension.id);
        if (!canvasDataUrl) continue;

        // 创建图片对象
        const img = new Image();
        img.onload = () => {
          // 计算位置 - 水平排列
          const x = padding + i * (itemWidth + spacing);
          const y = padding;

          // 绘制图片
          ctx.drawImage(img, x, y, itemWidth, itemHeight);

          // 绘制编号
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`${dimension.groupNo}`, x + 5, y + 20);
        };
        img.src = canvasDataUrl;
      }

      // 生成预览URL
      setTimeout(() => {
        setPreviewUrl(canvas.toDataURL('image/png'));
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('生成预览失败:', error);
      setIsGenerating(false);
    }
  };

  // 保存拼接图片到数据库
  const saveCombinedImage = async () => {
    if (!previewUrl) {
      alert('请先生成预览图片');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 准备尺寸图片数据
      const dimensionImages = dimensions.map(dim => ({
        id: dim.id,
        canvas_data: dimensionCanvases.get(dim.id) || '',
        position: {
          group_no: dim.groupNo,
          characteristic: dim.characteristic
        }
      }));

      // 调用后端API保存拼接图片
      const response = await fetch('/api/dimensions/images/save-combined', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          partId,
          dimensionImages,
          layoutConfig
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('success');
        if (onSaveSuccess) {
          onSaveSuccess(result.data.combinedImageUrl);
        }
        alert('拼接图片保存成功！');
      } else {
        setSaveStatus('error');
        alert(`保存失败: ${result.message}`);
      }

    } catch (error) {
      console.error('保存拼接图片失败:', error);
      setSaveStatus('error');
      alert('保存失败，请检查网络连接');
    } finally {
      setIsSaving(false);
    }
  };

  // 下载预览图片
  const downloadPreview = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.download = `尺寸拼接图_${projectId}_${partId}_${new Date().getTime()}.png`;
    link.href = previewUrl;
    link.click();
  };

  // 初始化时生成预览
  useEffect(() => {
    if (dimensions.length > 0) {
      generateCombinedPreview();
    }
  }, [dimensions, layoutConfig]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 配置面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            拼接配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="canvasWidth">画布宽度</Label>
              <Input
                id="canvasWidth"
                type="number"
                value={layoutConfig.canvasWidth}
                onChange={(e) => setLayoutConfig(prev => ({
                  ...prev,
                  canvasWidth: parseInt(e.target.value) || 1200
                }))}
                min="400"
                max="2000"
              />
            </div>
            <div>
              <Label htmlFor="canvasHeight">画布高度</Label>
              <Input
                id="canvasHeight"
                type="number"
                value={layoutConfig.canvasHeight}
                onChange={(e) => setLayoutConfig(prev => ({
                  ...prev,
                  canvasHeight: parseInt(e.target.value) || 800
                }))}
                min="300"
                max="1500"
              />
            </div>
            <div>
              <Label htmlFor="padding">边距</Label>
              <Input
                id="padding"
                type="number"
                value={layoutConfig.padding}
                onChange={(e) => setLayoutConfig(prev => ({
                  ...prev,
                  padding: parseInt(e.target.value) || 30
                }))}
                min="10"
                max="100"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button
              onClick={generateCombinedPreview}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Grid className="h-4 w-4 mr-2" />
                  重新生成预览
                </>
              )}
            </Button>

            <Button
              onClick={saveCombinedImage}
              disabled={isSaving || !previewUrl}
              className="bg-green-600 hover:bg-green-700"
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

            <Button
              onClick={downloadPreview}
              disabled={!previewUrl}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              下载预览图
            </Button>

            {saveStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                保存成功
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                保存失败
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 预览区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            拼接预览
            <span className="text-sm font-normal text-gray-500">
              ({dimensions.length} 个尺寸)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-300 bg-white rounded shadow-sm"
              style={{ display: previewUrl ? 'block' : 'none' }}
            />
            
            {!previewUrl && !isGenerating && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>点击"生成预览"按钮创建拼接图片</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center justify-center h-64 text-blue-600">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>正在生成拼接预览...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 尺寸列表 */}
      <Card>
        <CardHeader>
          <CardTitle>包含的尺寸</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimensions.map((dimension) => (
              <div
                key={dimension.id}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-600">#{dimension.groupNo}</span>
                  <span className="text-sm text-gray-500">{dimension.dimensionType}</span>
                </div>
                <div className="text-sm">
                  <p><strong>名义值:</strong> {dimension.nominalValue}</p>
                  {dimension.characteristic && (
                    <p><strong>特性:</strong> {dimension.characteristic}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DimensionImageCombiner;