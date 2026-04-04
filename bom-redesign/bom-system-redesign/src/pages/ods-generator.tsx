import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Download, Eye, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import inspectionInstructionHtml from './templates/inspection-instruction.html?raw';

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

interface HeaderData {
  program: string;
  partName: string;
  partNo: string;
  customer: string;
  material: string;
  qbobStandard: string;
  drawingNo: string;
  drawingDate: string;
  version: string;
  stationName: string;
}

interface DimensionItem {
  number: string;
  drawing: string;
  method?: string;
  special?: string;
  frequency?: string;
  imageUrl?: string;
}

interface PreviewType {
  name: string;
  type: string;
  description: string;
  recommended: boolean;
  features: string[];
}

export default function ODSGeneratorPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [headerData, setHeaderData] = useState<HeaderData>({
    program: '131231',
    partName: '左侧侧板',
    partNo: 'Y0704612',
    customer: '德吉亚（武汉）',
    material: 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
    qbobStandard: 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
    drawingNo: '',
    drawingDate: '4266005/01',
    version: '',
    stationName: '冲压',
  });
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionItem[]>([]);
  const [previewTypes, setPreviewTypes] = useState<PreviewType[]>([]);
  const [selectedPreviewType, setSelectedPreviewType] = useState<string>('enhanced_wz1d');

  // 预览HTML处理
  const processedHtml = useMemo(() => {
    const po: any = (Array.isArray(parts) ? parts : []).find((p: any) => String(p.id) === String(selectedPart)) || {};
    const partImg =
      po?.image_url || po?.imageUrl || po?.thumbnail_url || (selectedPart ? `/api/parts/${selectedPart}/image` : '');

    const renderRows = (items: DimensionItem[]) => {
      return items
        .map((it) => {
          const num = it.number ?? '';
          const drawing = it.drawing ?? '';
          const method = it.method ?? '';
          const special = it.special ?? '';
          const freq = it.frequency ?? '首/巡/末检';
          const imageUrl = it.imageUrl ?? '';

          const drawingContent =
            imageUrl && imageUrl.trim() !== ''
              ? `<div style="text-align:center;"><img src="http://localhost:5000${imageUrl}" alt="尺寸图片" style="max-width:60px;max-height:30px;border:1px solid #ddd;border-radius:3px;" /></div>`
              : drawing;

          return `<tr><td>${num}</td><td>${drawingContent}</td><td>${method}</td><td>${special}</td><td>${freq}</td></tr>`;
        })
        .join('');
    };

    const commonMap: Record<string, string> = {
      '{{PROGRAM}}': headerData.program || '',
      '{{CUSTOMER}}': headerData.customer || '',
      '{{PART_NAME}}': headerData.partName || '',
      '{{STATION_NAME}}': headerData.stationName || '',
      '{{DRAWING_DATE}}': headerData.drawingDate || '',
      '{{PART_NO}}': headerData.partNo || '',
      '{{QBQB_STANDARD}}': headerData.qbobStandard || '',
      '{{PART_IMG_LEFT}}': partImg || '',
    };

    const pageSize = 10;
    const pages: DimensionItem[][] = [];
    for (let i = 0; i < (dimensions?.length || 0); i += pageSize) {
      pages.push(dimensions.slice(i, i + pageSize));
    }
    if (pages.length === 0) pages.push([]);

    const pageHtmls = pages.map((pageItems) => {
      let html = inspectionInstructionHtml;
      for (const [k, v] of Object.entries(commonMap)) {
        const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        html = html.replace(re, v ?? '');
      }
      const rows = pageItems.length
        ? renderRows(pageItems)
        : '<tr><td colspan="5" style="text-align:center;color:#888;">暂无尺寸数据</td></tr>';
      html = html.replace(/\{\{DIMENSION_ROWS\}\}/g, rows);
      return html;
    });

    return pageHtmls.join('<div style="page-break-after: always;"></div>');
  }, [headerData, parts, selectedPart, inspectionInstructionHtml, dimensions]);

  // 预览缩放
  const sheetWidth = 1100;
  const sheetHeightFallback = 780;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    let mounted = true;
    let ro: ResizeObserver | null = null;

    const measureAndResize = () => {
      if (!mounted) return;
      const el = wrapperRef.current;
      if (!el || !document.contains(el)) return;
      try {
        const rect = el.getBoundingClientRect();
        const availableH = Math.max(300, window.innerHeight - rect.top - 24);
        setContainerHeight(availableH);
        const w = el.clientWidth || sheetWidth;
        const sheetEl = contentRef.current?.querySelector('.instruction-sheet') as HTMLElement | null;
        const sw = sheetEl?.offsetWidth || sheetWidth;
        const sh = sheetEl?.offsetHeight || sheetHeightFallback;
        const s = Math.min(1, w / sw, availableH / sh);
        setPreviewScale(s);
      } catch {
        // Element may be detached from DOM
      }
    };

    measureAndResize();
    ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureAndResize) : null;
    if (ro && wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', measureAndResize);
    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measureAndResize);
    };
  }, []);

  // 获取预览类型列表
  useEffect(() => {
    const fetchPreviewTypes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dynamic_preview/types');
        if (response.ok) {
          const data = await response.json();
          setPreviewTypes(data.preview_types || []);
        }
      } catch (error) {
        console.error('获取预览类型失败:', error);
        setPreviewTypes([
          {
            name: '增强版WZ1D模板',
            type: 'enhanced_wz1d',
            description: '完整的WZ1D模板，包含215个字段映射和智能工作簿分割',
            recommended: true,
            features: ['完整字段映射', '智能分割', '图片嵌入', '样式保持'],
          },
        ]);
      }
    };
    fetchPreviewTypes();
  }, []);

  // 获取项目数据
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.items || data || []);
        } else {
          console.error('获取项目列表失败');
        }
      } catch (error) {
        console.error('获取项目列表错误:', error);
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
            setParts(data.items || data || []);
          } else {
            console.error('获取零件列表失败');
          }
        } catch (error) {
          console.error('获取零件列表错误:', error);
        }
      };
      fetchParts();
    } else {
      setParts([]);
    }
  }, [selectedProject]);

  // 填充表头数据和尺寸数据
  useEffect(() => {
    if (selectedPart && selectedProject) {
      const part = parts.find((p) => p.id === selectedPart);
      const project = projects.find((p) => p.id === selectedProject);

      if (part && project) {
        // 获取项目详情，包括客户信息
        const fetchProjectDetails = async () => {
          try {
            const response = await fetch(`/api/projects/${selectedProject}`);
            if (response.ok) {
              const projectDetails = await response.json();
              setHeaderData({
                program: projectDetails.name || '131231',
                partName: part.part_name || '左侧侧板',
                partNo: part.part_number || 'Y0704612',
                customer: projectDetails.customer_name || '德吉亚（武汉）',
                material: part.final_material_cn || part.original_material || 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
                qbobStandard:
                  part.material_specification || part.original_material || 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
                drawingNo: part.drawing_2d || '',
                drawingDate: '4266005/01',
                version: '',
                stationName: '冲压',
              });
            }
          } catch (error) {
            console.error('获取项目详情失败:', error);
            // 失败时使用默认值
            setHeaderData({
              program: project.name || '131231',
              partName: part.part_name || '左侧侧板',
              partNo: part.part_number || 'Y0704612',
              customer: '德吉亚（武汉）',
              material: part.final_material_cn || part.original_material || 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
              qbobStandard:
                part.material_specification || part.original_material || 'CR980T/700Y-MP T=0.8±0.05 GMW3399M-ST-S',
              drawingNo: part.drawing_2d || '',
              drawingDate: '4266005/01',
              version: '',
              stationName: '冲压',
            });
          }
        };

        const fetchDimensions = async () => {
          try {
            const response = await fetch(`http://localhost:5000/api/ods/preview/${selectedPart}`);
            if (response.ok) {
              const apiData = await response.json();
              const dimensionsData = apiData.dimensions.map((dim: any) => ({
                number: dim.sequence_no || '1',
                drawing: dim.technical_note || '',
                method: dim.measurement_method || '卡尺/游标卡尺',
                special: dim.characteristic_code || '',
                frequency: dim.frequency || '首/巡/末检',
                imageUrl: dim.imageUrl || dim.image_url || '',
              }));
              setDimensions(dimensionsData);
              console.log('已获取真实尺寸数据（包含图片URL）:', dimensionsData);
            } else {
              console.error('获取尺寸数据失败，使用默认数据');
              setDimensions([
                {
                  number: '1',
                  drawing: '暂无尺寸数据',
                  method: '卡尺/游标卡尺',
                  special: '',
                  frequency: '首/巡/末检',
                  imageUrl: '',
                },
              ]);
            }
          } catch (error) {
            console.error('获取尺寸数据错误:', error);
            setDimensions([
              {
                number: '1',
                drawing: '暂无尺寸数据',
                method: '卡尺/游标卡尺',
                special: '',
                frequency: '首/巡/末检',
              },
            ]);
          }
        };

        fetchProjectDetails();
        fetchDimensions();
      }
    }
  }, [selectedPart, selectedProject, parts, projects]);

  // 生成ODS
  const handleGenerateODS = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/ods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: selectedPart, header_data: headerData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ODS_${headerData.partName}_${headerData.partNo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('生成ODS文档失败');
      }
    } catch (error) {
      console.error('生成ODS错误:', error);
      alert('生成ODS文档时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 生成增强版Excel
  const handleGenerateEnhancedExcel = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/enhanced_wz1d_ods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: selectedPart,
          customer: headerData.customer,
          drawing_date: headerData.drawingDate,
          revision: headerData.version || 'A',
          supplier: '永利汽车零部件（武汉）有限公司',
          inspector: '质检员',
          shift: '白班',
          machine: '设备001',
          mold: '模具001',
          cavity: '1',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const partInfo = result.part_info || {};
        const genInfo = result.generation_info || {};
        const files = result.files || [];

        alert(
          `✅ 增强版WZ1D Excel生成成功！\n\n📋 零件信息:\n- 名称: ${partInfo.part_name}\n- 编号: ${partInfo.part_number}\n\n📊 生成统计:\n- 总尺寸: ${genInfo.total_dimensions}个\n- 工作簿: ${genInfo.workbooks_count}个\n- 文件数: ${genInfo.files_generated}个\n\n📄 生成的文件:\n${files.map((f: any, i: number) => `${i + 1}. ${f.filename} (${f.dimensions_count}个尺寸)`).join('\n')}\n\n💡 文件已自动下载到浏览器默认下载目录`
        );

        if (result.download_urls && result.download_urls.length > 0) {
          const firstFileUrl = result.download_urls[0];
          window.open(firstFileUrl, '_blank');
        }
      } else {
        const errorData = await response.json();
        alert(`生成增强版Excel失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('生成增强版Excel错误:', error);
      alert('生成增强版Excel时发生错误，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    navigate(`/ods/preview?part_id=${selectedPart}`);
  };

  // 动态预览 - 生成真实的Excel预览文件
  const handleTemplatePreview = async () => {
    if (!selectedPart) {
      alert('请先选择零件');
      return;
    }

    try {
      setLoading(true);

      // 根据选择的预览类型调用对应的API
      let apiUrl = '';
      let requestData = {};

      if (selectedPreviewType === 'enhanced_wz1d') {
        // 使用增强版WZ1D API生成预览
        apiUrl = 'http://localhost:5000/api/enhanced_wz1d_ods/generate';
        requestData = {
          part_id: selectedPart,
          customer: headerData.customer,
          drawing_date: headerData.drawingDate,
          revision: headerData.version || 'A',
          supplier: '永利汽车零部件（武汉）有限公司',
          inspector: '质检员',
          shift: '白班',
          machine: '设备001',
          mold: '模具001',
          cavity: '1',
          preview_mode: true, // 标记为预览模式
        };
      } else {
        // 使用基础ODS API生成预览
        apiUrl = 'http://localhost:5000/api/ods/generate';
        requestData = {
          part_id: selectedPart,
          header_data: headerData,
          preview_mode: true, // 标记为预览模式
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`预览生成失败: ${response.status}`);
      }

      if (selectedPreviewType === 'enhanced_wz1d') {
        // 增强版WZ1D返回JSON格式
        const result = await response.json();
        console.log('增强版WZ1D预览生成结果:', result);

        const partInfo = result.part_info || {};
        const genInfo = result.generation_info || {};
        const files = result.files || [];

        alert(
          `✅ WZ1D模板预览生成成功！\n\n📋 零件信息:\n- 名称: ${partInfo.part_name}\n- 编号: ${partInfo.part_number}\n\n📊 预览统计:\n- 总尺寸: ${genInfo.total_dimensions}个\n- 工作簿: ${genInfo.workbooks_count}个\n- 文件数: ${genInfo.files_generated}个\n\n📄 预览文件:\n${files.map((f: any, i: number) => `${i + 1}. ${f.filename} (${f.dimensions_count}个尺寸)`).join('\n')}\n\n💡 这就是最终生成的Excel文件格式！`
        );

        // 打开预览文件
        if (result.download_urls && result.download_urls.length > 0) {
          const firstFileUrl = result.download_urls[0];
          window.open(firstFileUrl, '_blank');
        }
      } else {
        // 基础ODS返回文件流
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `预览_ODS_${headerData.partName}_${headerData.partNo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(`✅ ODS模板预览生成成功！\n\n📄 预览文件已下载\n💡 这就是最终生成的Excel文件格式！`);
      }
    } catch (error) {
      console.error('预览生成错误:', error);
      alert(
        `❌ 预览生成失败\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请确保:\n1. 已选择零件\n2. 后端服务正常运行\n3. 选择了正确的预览类型`
      );
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
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ODS作业指导书生成器</h1>
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

              {/* 预览类型选择 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">预览类型</Label>
                <Select value={selectedPreviewType} onValueChange={setSelectedPreviewType}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择预览类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.name}</span>
                          {type.recommended && <span className="text-xs text-green-600">推荐</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 补充信息 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">补充信息</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">图纸日期</Label>
                    <Input
                      value={headerData.drawingDate}
                      onChange={(e) => setHeaderData((prev) => ({ ...prev, drawingDate: e.target.value }))}
                      placeholder="如：4266005/01"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">版本</Label>
                    <Input
                      value={headerData.version}
                      onChange={(e) => setHeaderData((prev) => ({ ...prev, version: e.target.value }))}
                      placeholder="如：A0"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">工位名称</Label>
                    <Select
                      value={headerData.stationName}
                      onValueChange={(value) => setHeaderData((prev) => ({ ...prev, stationName: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="请选择工位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="冲压">冲压</SelectItem>
                        <SelectItem value="焊接">焊接</SelectItem>
                        <SelectItem value="装配">装配</SelectItem>
                        <SelectItem value="检验">检验</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2 pt-4">
                <Button onClick={handlePreview} variant="outline" className="w-full h-9" disabled={!selectedPart}>
                  <Eye className="w-4 h-4 mr-2" />
                  简易预览
                </Button>
                <Button
                  onClick={handleTemplatePreview}
                  variant="outline"
                  className="w-full h-9"
                  disabled={!selectedPart || loading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? '生成预览中...' : '动态预览'}
                </Button>
                <Button
                  onClick={handleGenerateODS}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedPart || loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? '生成中...' : '生成Excel(模板版)'}
                </Button>
                <Button
                  onClick={handleGenerateEnhancedExcel}
                  className="w-full h-9 bg-green-600 hover:bg-green-700"
                  disabled={!selectedPart || loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? '生成中...' : '生成增强版WZ1D'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：预览说明和数据展示 */}
          <Card className="col-span-4">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                预览说明与数据展示
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
                        <strong>当前显示</strong>：简化的HTML预览（仅供参考）
                      </p>
                      <p>
                        <strong>实际生成</strong>：复杂的WZ1D Excel模板（与预览不同）
                      </p>
                      <p>
                        <strong>获取真实预览</strong>：请点击左侧"动态预览"按钮下载实际的Excel文件
                      </p>
                    </div>
                  </div>

                  {/* 零件信息展示 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">零件信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">零件名称:</span>
                          <span className="font-medium">{headerData.partName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">零件编号:</span>
                          <span className="font-medium">{headerData.partNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">客户:</span>
                          <span className="font-medium">{headerData.customer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">工位:</span>
                          <span className="font-medium">{headerData.stationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">技术信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">图纸日期:</span>
                          <span className="font-medium">{headerData.drawingDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">版本:</span>
                          <span className="font-medium">{headerData.version || 'A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">尺寸数量:</span>
                          <span className="font-medium">{dimensions.length}个</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">预览类型:</span>
                          <span className="font-medium">
                            {previewTypes.find((t) => t.type === selectedPreviewType)?.name || '增强版WZ1D'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 尺寸数据表格 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">尺寸数据预览</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left border-b">序号</th>
                              <th className="px-3 py-2 text-left border-b">特征描述</th>
                              <th className="px-3 py-2 text-left border-b">检测方法</th>
                              <th className="px-3 py-2 text-left border-b">特性号码</th>
                              <th className="px-3 py-2 text-left border-b">频率</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dimensions.length > 0 ? (
                              dimensions.map((dim, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 border-b">{dim.number}</td>
                                  <td className="px-3 py-2 border-b">{dim.drawing}</td>
                                  <td className="px-3 py-2 border-b">{dim.method}</td>
                                  <td className="px-3 py-2 border-b">{dim.special}</td>
                                  <td className="px-3 py-2 border-b">{dim.frequency}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                                  暂无尺寸数据
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 操作提示 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">📋 操作指南</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>
                        1. <strong>简易预览</strong>：查看基本的HTML格式预览
                      </p>
                      <p>
                        2. <strong>动态预览</strong>：生成真实的Excel文件预览（推荐）
                      </p>
                      <p>
                        3. <strong>生成Excel(模板版)</strong>：生成基础版本的ODS文档
                      </p>
                      <p>
                        4. <strong>生成增强版WZ1D</strong>：生成完整的215字段WZ1D文档
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileSpreadsheet className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">请选择项目和零件</h3>
                  <p className="text-sm text-center max-w-md">
                    在左侧选择项目和零件后，这里将显示零件信息和尺寸数据。 要查看真实的Excel格式，请使用"动态预览"功能。
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
