import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Image, Upload, Loader, Check, X, ChevronRight, Edit, Trash2, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DimensionData {
  id: string;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
  characteristic: string;
  notes: string;
  position?: { x: number; y: number };
}

interface DimensionImageRecognizerProps {
  onDimensionsRecognized: (dimensions: DimensionData[]) => void;
  onCancel: () => void;
}

export default function DimensionImageRecognizer({ onDimensionsRecognized, onCancel }: DimensionImageRecognizerProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recognizedDimensions, setRecognizedDimensions] = useState<DimensionData[]>([]);
  const [isRecognized, setIsRecognized] = useState(false);
  const [editingDimension, setEditingDimension] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DimensionData>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<{ [key: string]: { x: number; y: number } }>({});

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setIsRecognized(false);
      setRecognizedDimensions([]);
      setEditingDimension(null);
    }
  };

  // 模拟尺寸识别过程
  const simulateRecognition = async () => {
    if (!imageFile) {
      setError('请先上传图片');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    // 模拟识别过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // 模拟识别结果（基于提供的图片）
    const simulatedDimensions: DimensionData[] = [
      {
        id: '1',
        dimensionType: 'diameter',
        nominalValue: '8',
        toleranceValue: '',
        upperTolerance: '',
        lowerTolerance: '',
        datum: 'A1, A2, A3',
        characteristic: '',
        notes: '孔径',
        position: { x: 300, y: 150 }
      },
      {
        id: '2',
        dimensionType: 'linear',
        nominalValue: '6.8',
        toleranceValue: '',
        upperTolerance: '0.2',
        lowerTolerance: '0',
        datum: 'C',
        characteristic: 'critical',
        notes: '带三角标记',
        position: { x: 450, y: 300 }
      },
      {
        id: '3',
        dimensionType: 'linear',
        nominalValue: '7',
        toleranceValue: '',
        upperTolerance: '0.5',
        lowerTolerance: '0',
        datum: 'A, B, C',
        characteristic: 'critical',
        notes: '带三角标记',
        position: { x: 350, y: 350 }
      },
      {
        id: '4',
        dimensionType: 'linear',
        nominalValue: '28.9',
        toleranceValue: '',
        upperTolerance: '',
        lowerTolerance: '',
        datum: '',
        characteristic: '',
        notes: '',
        position: { x: 150, y: 200 }
      },
      {
        id: '5',
        dimensionType: 'linear',
        nominalValue: '68',
        toleranceValue: '',
        upperTolerance: '',
        lowerTolerance: '',
        datum: '',
        characteristic: '',
        notes: '',
        position: { x: 300, y: 400 }
      },
      {
        id: '6',
        dimensionType: 'diameter',
        nominalValue: '81',
        toleranceValue: '',
        upperTolerance: '',
        lowerTolerance: '',
        datum: '',
        characteristic: '',
        notes: '孔径',
        position: { x: 300, y: 250 }
      },
      {
        id: '7',
        dimensionType: 'angular',
        nominalValue: '130',
        toleranceValue: '',
        upperTolerance: '',
        lowerTolerance: '',
        datum: '',
        characteristic: '',
        notes: '角度',
        position: { x: 200, y: 100 }
      }
    ];

    setRecognizedDimensions(simulatedDimensions);
    setIsRecognized(true);
    setIsLoading(false);
  };

  // 渲染标注
  useEffect(() => {
    if (imagePreview && canvasRef.current && recognizedDimensions.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = document.createElement('img');
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 绘制尺寸标注
        recognizedDimensions.forEach((dim, index) => {
          if (dim.position) {
            const { x, y } = dim.position;
            
            // 绘制标注点
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
            
            // 绘制标注文本
            ctx.font = '12px Arial';
            ctx.fillStyle = '#000000';
            ctx.fillText(`${index + 1}. ${dim.nominalValue}`, x + 10, y - 10);
          }
        });
      };
      img.src = imagePreview;
    }
  }, [imagePreview, recognizedDimensions]);

  // 开始编辑尺寸
  const handleEdit = (dimension: DimensionData) => {
    setEditingDimension(dimension.id);
    setEditForm({ ...dimension });
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingDimension) return;

    setRecognizedDimensions(prev => 
      prev.map(dim => 
        dim.id === editingDimension 
          ? { ...dim, ...editForm } 
          : dim
      )
    );
    setEditingDimension(null);
    setEditForm({});
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingDimension(null);
    setEditForm({});
  };

  // 删除尺寸
  const handleDeleteDimension = (id: string) => {
    if (window.confirm('确定要删除这个尺寸吗？')) {
      setRecognizedDimensions(prev => prev.filter(dim => dim.id !== id));
    }
  };

  // 确认并返回识别结果
  const handleConfirm = () => {
    if (recognizedDimensions.length === 0) {
      setError('没有识别到尺寸，请重新上传图片或检查图片质量');
      return;
    }
    onDimensionsRecognized(recognizedDimensions);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            图片尺寸识别
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 图片上传 */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">上传零件图纸</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              {imagePreview && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setIsRecognized(false);
                    setRecognizedDimensions([]);
                    setEditingDimension(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  清除
                </Button>
              )}
            </div>
          </div>

          {/* 图片预览 */}
          {imagePreview && (
            <div className="border rounded-lg p-4">
              <div className="relative">
                <canvas ref={canvasRef} className="max-w-full h-auto" />
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>正在识别尺寸...</p>
                      <Progress value={progress} className="mt-2 w-64" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 识别按钮 */}
          {imagePreview && !isRecognized && (
            <Button
              onClick={simulateRecognition}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  识别中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  开始识别尺寸
                </>
              )}
            </Button>
          )}

          {/* 识别结果 */}
          {isRecognized && (
            <div className="space-y-4">
              <Alert variant="default">
                <Check className="h-4 w-4" />
                <AlertTitle>识别完成</AlertTitle>
                <AlertDescription>
                  成功识别到 {recognizedDimensions.length} 个尺寸
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">序号</th>
                      <th className="px-4 py-2 text-left">类型</th>
                      <th className="px-4 py-2 text-left">尺寸值</th>
                      <th className="px-4 py-2 text-left">公差</th>
                      <th className="px-4 py-2 text-left">基准</th>
                      <th className="px-4 py-2 text-left">特性</th>
                      <th className="px-4 py-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recognizedDimensions.map((dim, index) => (
                      <tr key={dim.id} className={index % 2 === 0 ? '' : 'bg-slate-50'}>
                        {editingDimension === dim.id ? (
                          // 编辑模式
                          <>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              <Select
                                value={editForm.dimensionType || dim.dimensionType}
                                onValueChange={(value) => setEditForm({ ...editForm, dimensionType: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="选择尺寸类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="linear">线性尺寸</SelectItem>
                                  <SelectItem value="diameter">孔径</SelectItem>
                                  <SelectItem value="angular">角度</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={editForm.nominalValue || dim.nominalValue}
                                onChange={(e) => setEditForm({ ...editForm, nominalValue: e.target.value })}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={editForm.upperTolerance || dim.upperTolerance}
                                onChange={(e) => setEditForm({ ...editForm, upperTolerance: e.target.value })}
                                placeholder="上公差"
                              />
                              <Input
                                value={editForm.lowerTolerance || dim.lowerTolerance}
                                onChange={(e) => setEditForm({ ...editForm, lowerTolerance: e.target.value })}
                                placeholder="下公差"
                                className="mt-1"
                              />
                              <Input
                                value={editForm.toleranceValue || dim.toleranceValue}
                                onChange={(e) => setEditForm({ ...editForm, toleranceValue: e.target.value })}
                                placeholder="公差值"
                                className="mt-1"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={editForm.datum || dim.datum}
                                onChange={(e) => setEditForm({ ...editForm, datum: e.target.value })}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={editForm.characteristic || dim.characteristic}
                                onValueChange={(value) => setEditForm({ ...editForm, characteristic: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="选择特性" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">无</SelectItem>
                                  <SelectItem value="critical">带三角标记</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  保存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  取消
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // 查看模式
                          <>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              {dim.dimensionType === 'diameter' && '孔径'}
                              {dim.dimensionType === 'linear' && '线性尺寸'}
                              {dim.dimensionType === 'angular' && '角度'}
                            </td>
                            <td className="px-4 py-2 font-medium">
                              {dim.dimensionType === 'diameter' && 'Φ'}
                              {dim.nominalValue}
                              {dim.dimensionType === 'angular' && '°'}
                            </td>
                            <td className="px-4 py-2">
                              {dim.upperTolerance && dim.lowerTolerance
                                ? `+${dim.upperTolerance}/-${dim.lowerTolerance}`
                                : dim.toleranceValue
                                ? `±${dim.toleranceValue}`
                                : '-'}
                            </td>
                            <td className="px-4 py-2">{dim.datum || '-'}</td>
                            <td className="px-4 py-2">
                              {dim.characteristic === 'critical' && '带三角标记'}
                              {!dim.characteristic && '-'}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEdit(dim)}
                                  variant="outline"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  编辑
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteDimension(dim.id)}
                                  variant="destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  删除
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  确认添加
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRecognized(false);
                    setRecognizedDimensions([]);
                    setEditingDimension(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  重新识别
                </Button>
              </div>
            </div>
          )}

          {/* 取消按钮 */}
          <Button variant="outline" onClick={onCancel} className="w-full">
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
