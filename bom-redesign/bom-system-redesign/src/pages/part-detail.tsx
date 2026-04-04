import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Edit,
  Trash2,
  ArrowLeft,
  Ruler,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Part {
  id: number;
  project_id: number;
  project_name: string;
  part_number: string;
  part_name: string;
  image_url?: string;
  original_material?: string;
  final_material_cn?: string;
  net_weight_kg?: number;
  sequence?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Dimension {
  id: number;
  part_id: number;
  name: string;
  value: number;
  tolerance_plus?: number;
  tolerance_minus?: number;
  unit: string;
}

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [part, setPart] = useState<Part | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 加载零件数据
  useEffect(() => {
    async function fetchPartDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/parts/${id}`);
        if (!response.ok) {
          throw new Error('获取零件详情失败');
        }

        const data = await response.json();
        setPart(data);

        // 加载尺寸数据
        const dimensionsResponse = await fetch(`/api/parts/${id}/dimensions`);
        if (dimensionsResponse.ok) {
          const dimensionsData = await dimensionsResponse.json();
          setDimensions(Array.isArray(dimensionsData) ? dimensionsData : dimensionsData.items || []);
        }
      } catch (error) {
        console.error('加载零件详情时出错:', error);
        setError('无法加载零件详情，请重试');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPartDetails();
  }, [id]);

  // 处理删除零件
  async function handleDeletePart() {
    if (!part) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/parts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 删除成功，返回零件列表
        navigate(`/parts?project_id=${part.project_id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除零件失败');
      }
    } catch (error) {
      console.error('删除零件时出错:', error);
      setError('删除零件失败，请重试');
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </Layout>
    );
  }

  if (error || !part) {
    return (
      <Layout>
        <div className="p-6 max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error || '无法加载零件详情'}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate('/parts')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回零件列表
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: '零件列表', to: `/parts?project_id=${part.project_id}` },
            { label: `${part.part_number}` },
          ]}
        />

        <div className="flex flex-col md:flex-row items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-slate-800">
              <Package className="mr-2 text-blue-600" size={24} />
              {part.part_name}
            </h1>
            <div className="flex items-center mt-1 text-slate-500">
              <span className="mr-2">零件号: {part.part_number}</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                {part.project_name}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => navigate(`/parts?project_id=${part.project_id}`)}>
              <ArrowLeft size={16} className="mr-1" /> 返回列表
            </Button>
            <Button variant="outline" onClick={() => navigate(`/parts/${id}/edit`)}>
              <Edit size={16} className="mr-1" /> 编辑
            </Button>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 size={16} className="mr-1" /> 删除
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认删除</DialogTitle>
                  <DialogDescription>
                    您确定要删除零件 "{part.part_number} - {part.part_name}" 吗？此操作无法撤销。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                    取消
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePart} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        删除中...
                      </>
                    ) : (
                      <>删除</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧图片和基本信息 */}
          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>零件图片</CardTitle>
              </CardHeader>
              <CardContent>
                {part.image_url ? (
                  <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-100">
                    <img
                      src={`/api/parts/${part.id}/image`}
                      alt={part.part_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-md bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={48} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">暂无图片</p>
                    </div>
                  </div>
                )}
              </CardContent>
              {part.image_url && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/api/parts/${part.id}/image/download`, '_blank')}
                  >
                    <Download size={16} className="mr-1" /> 下载图片
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">所属项目</p>
                  <p className="font-medium">{part.project_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">零件号</p>
                  <p className="font-medium">{part.part_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">零件名称</p>
                  <p className="font-medium">{part.part_name}</p>
                </div>
                {part.original_material && (
                  <div>
                    <p className="text-sm text-slate-500">原始材料</p>
                    <p className="font-medium">{part.original_material}</p>
                  </div>
                )}
                {part.final_material_cn && (
                  <div>
                    <p className="text-sm text-slate-500">最终材料</p>
                    <p className="font-medium">{part.final_material_cn}</p>
                  </div>
                )}
                {part.net_weight_kg !== undefined && (
                  <div>
                    <p className="text-sm text-slate-500">净重</p>
                    <p className="font-medium">{part.net_weight_kg} kg</p>
                  </div>
                )}
                {part.sequence !== undefined && (
                  <div>
                    <p className="text-sm text-slate-500">序号</p>
                    <p className="font-medium">{part.sequence}</p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p className="font-medium">{new Date(part.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">更新时间</p>
                  <p className="font-medium">{new Date(part.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧详细信息和尺寸 */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="dimensions">尺寸数据</TabsTrigger>
                    <TabsTrigger value="notes">备注</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">零件描述</h3>
                      {part.description ? (
                        <p className="text-slate-700 whitespace-pre-wrap">{part.description}</p>
                      ) : (
                        <p className="text-slate-500 italic">暂无描述</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">尺寸概览</h3>
                      {dimensions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dimensions.slice(0, 4).map((dimension) => (
                            <Card key={dimension.id} className="bg-slate-50">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium">{dimension.name}</p>
                                  <Badge variant="outline" className="bg-white">
                                    {dimension.unit}
                                  </Badge>
                                </div>
                                <p className="text-xl font-bold text-blue-700 mt-1">
                                  {dimension.value}
                                  {dimension.tolerance_plus !== undefined &&
                                    dimension.tolerance_minus !== undefined && (
                                      <span className="text-sm text-slate-500 ml-1">
                                        +{dimension.tolerance_plus}/-{dimension.tolerance_minus}
                                      </span>
                                    )}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">暂无尺寸数据</p>
                      )}

                      {dimensions.length > 4 && (
                        <Button variant="link" className="mt-2 p-0" onClick={() => setActiveTab('dimensions')}>
                          查看全部 {dimensions.length} 个尺寸 →
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dimensions" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">尺寸数据</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dimensions/new?part_id=${part.id}`)}
                      >
                        <Ruler size={16} className="mr-1" /> 添加尺寸
                      </Button>
                    </div>

                    {dimensions.length > 0 ? (
                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b">
                              <th className="text-left p-3 text-slate-700">名称</th>
                              <th className="text-left p-3 text-slate-700">数值</th>
                              <th className="text-left p-3 text-slate-700">公差</th>
                              <th className="text-left p-3 text-slate-700">单位</th>
                              <th className="text-right p-3 text-slate-700">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dimensions.map((dimension, index) => (
                              <tr key={dimension.id} className={index % 2 === 0 ? '' : 'bg-slate-50'}>
                                <td className="p-3">{dimension.name}</td>
                                <td className="p-3 font-medium">{dimension.value}</td>
                                <td className="p-3">
                                  {dimension.tolerance_plus !== undefined && dimension.tolerance_minus !== undefined ? (
                                    <>
                                      +{dimension.tolerance_plus}/-{dimension.tolerance_minus}
                                    </>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="p-3">{dimension.unit}</td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/dimensions/${dimension.id}/edit`)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-md">
                        <Ruler className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 mb-4">该零件暂无尺寸数据</p>
                        <Button onClick={() => navigate(`/dimensions/new?part_id=${part.id}`)}>添加尺寸数据</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div>
                    <h3 className="text-lg font-medium mb-2">备注</h3>
                    {part.notes ? (
                      <div className="bg-slate-50 p-4 rounded-md whitespace-pre-wrap">{part.notes}</div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-md">
                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 mb-4">暂无备注信息</p>
                        <Button onClick={() => navigate(`/parts/${id}/edit`)}>添加备注</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
