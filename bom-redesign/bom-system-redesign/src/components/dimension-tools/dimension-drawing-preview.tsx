import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface DimensionDrawingPreviewProps {
  imageData: string;
  className?: string;
}

export const DimensionDrawingPreview: React.FC<DimensionDrawingPreviewProps> = ({ imageData, className = '' }) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.download = `尺寸绘制_${new Date().getTime()}.png`;
    link.href = imageData;
    link.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>绘制预览</span>
            <div className="flex gap-2">
              <Button onClick={handleZoomIn} size="sm" variant="outline">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button onClick={handleZoomOut} size="sm" variant="outline">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button onClick={handleReset} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button onClick={handleDownload} size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {imageData ? (
              <div
                style={{
                  transform: `scale(${scale})`,
                  transition: 'transform 0.3s ease',
                }}
              >
                <img src={imageData} alt="尺寸绘制结果" className="border border-gray-300 rounded shadow-sm" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>请先生成绘制结果</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">缩放比例: {Math.round(scale * 100)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DimensionDrawingPreview;
