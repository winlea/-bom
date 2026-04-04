import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Download, ArrowLeft, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
}

interface Part {
  id: string;
  part_name: string;
  part_number: string;
  drawing_2d: string;
  customer_name?: string;
  original_material: string;
  final_material_cn?: string;
  material_specification?: string;
  project_id?: string;
}

export default function ProcessCapabilityGeneratorPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 获取项目数据
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data?.data?.items) ? data.data.items : []);
        } else {
          try {
            const errorData = await response.json();
            alert('获取项目列表失败：' + (errorData?.details || errorData?.error || response.status));
          } catch (e) {
            alert('获取项目列表失败：' + response.status);
          }
        }
      } catch (error: any) {
        alert('获取项目列表错误：' + (error?.message || error));
      }
    };
    fetchProjects();
  }, []);

  // 获取零件数据
  useEffect(() => {
    if (selectedProject) {
      const fetchParts = async () => {
        try {
          const response = await fetch(`/api/parts?project_id=${selectedProject}`);
          if (response.ok) {
            const data = await response.json();
            setParts(Array.isArray(data?.data?.items) ? data.data.items : []);
          } else {
            try {
              const errorData = await response.json();
              alert('获取零件列表失败：' + (errorData?.details || errorData?.error || response.status));
            } catch (e) {
              alert('获取零件列表失败：' + response.status);
            }
          }
        } catch (error: any) {
          alert('获取零件列表错误：' + (error?.message || error));
        }
      };
      fetchParts();
    } else {
      setParts([]);
    }
  }, [selectedProject]);

  // 生成初始过程能力分析报告
  const handleGenerateProcessCapability = async () => {
    setLoading(true);
    try {
      console.log('开始生成初始过程能力分析报告');
      console.log('选中的零件ID:', selectedPart);

      const response = await fetch('/api/process-capability/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: parseInt(selectedPart) }),
      });

      console.log('API响应状态:', response.status);
      console.log('API响应头:', response.headers);

      if (response.ok) {
        const blob = await response.blob();
        console.log('获取到的文件大小:', blob.size);
        console.log('文件类型:', blob.type);

        const url = window.URL.createObjectURL(blob);
        const part = parts.find((p) => p.id === selectedPart);
        // 根据Content-Type判断文件类型
        const contentType = response.headers.get('content-type');
        const isZip = contentType === 'application/zip';
        const fileName = isZip
          ? `Process_Capability_${part?.part_name || '零件'}_${part?.part_number || '编号'}.zip`
          : `Process_Capability_${part?.part_name || '零件'}_${part?.part_number || '编号'}.xlsx`;

        console.log('准备下载文件:', fileName);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('文件下载成功');
        alert('初始过程能力分析报告生成成功！');
      } else {
        try {
          const errorData = await response.json();
          console.error('API错误响应:', errorData);
          alert('生成初始过程能力分析报告失败：' + (errorData?.details || errorData?.error || response.status));
        } catch (e) {
          console.error('无法解析错误响应:', e);
          alert('生成初始过程能力分析报告失败：' + response.status);
        }
      }
    } catch (error: any) {
      console.error('生成初始过程能力分析报告错误:', error);
      alert('生成初始过程能力分析报告时发生错误：' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">初始过程能力分析生成器</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* 左侧：项目和零件选择 */}
          <Card className="col-span-1">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">项目与零件选择</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* 项目选择 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">选择项目</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="请选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 零件选择 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">选择零件</Label>
                <Select value={selectedPart} onValueChange={setSelectedPart} disabled={!selectedProject}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={selectedProject ? '请选择零件' : '请先选择项目'} />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{part.part_name}</span>
                          <span className="text-xs text-gray-500">编号: {part.part_number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              {/* 操作按钮 */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleGenerateProcessCapability}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedPart || loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? '生成中...' : '生成分析报告'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：说明和信息展示 */}
          <Card className="col-span-4">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                功能说明与零件信息
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedPart ? (
                <div className="space-y-6">
                  {/* 重要说明 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">⚠️ 重要说明</h3>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>
                        <strong>功能说明</strong>：根据选择的零件信息生成初始过程能力分析报告
                      </p>
                      <p>
                        <strong>生成内容</strong>：包含零件基本信息、尺寸数据等
                      </p>
                      <p>
                        <strong>文件格式</strong>：Excel文件，保持与模板一致的格式
                      </p>
                    </div>
                  </div>

                  {/* 零件信息展示 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">零件信息</h4>
                      <div className="space-y-2 text-sm">
                        {parts.find((p) => p.id === selectedPart) && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">零件名称:</span>
                              <span className="font-medium">{parts.find((p) => p.id === selectedPart)?.part_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">零件编号:</span>
                              <span className="font-medium">
                                {parts.find((p) => p.id === selectedPart)?.part_number}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">客户:</span>
                              <span className="font-medium">
                                {parts.find((p) => p.id === selectedPart)?.customer_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">材料:</span>
                              <span className="font-medium">
                                {parts.find((p) => p.id === selectedPart)?.original_material}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">项目信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">项目名称:</span>
                          <span className="font-medium">{projects.find((p) => p.id === selectedProject)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">零件数量:</span>
                          <span className="font-medium">{parts.length}个</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作提示 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">📋 操作指南</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>
                        1. <strong>选择项目</strong>：从下拉列表中选择要生成分析报告的项目
                      </p>
                      <p>
                        2. <strong>选择零件</strong>：从项目对应的零件列表中选择具体零件
                      </p>
                      <p>
                        3. <strong>生成报告</strong>：点击生成按钮，系统会根据模板生成对应的初始过程能力分析报告
                      </p>
                      <p>
                        4. <strong>下载文件</strong>：生成完成后，文件会自动下载到浏览器默认下载目录
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Activity className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">请选择项目和零件</h3>
                  <p className="text-sm text-center max-w-md">
                    在左侧选择项目和零件后，这里将显示零件信息。 点击生成按钮即可创建对应的初始过程能力分析报告。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
