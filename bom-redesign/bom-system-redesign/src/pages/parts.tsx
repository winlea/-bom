import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  Layers,
  FileBarChart,
  Loader2,
} from 'lucide-react';
import ImportModal from '@/components/import-modal';

/**
 * 零件列表页（parts）
 * - 通过 ?project_id= 初始化（numeric id）
 * - 顶部项目下拉切换（/api/projects）
 * - 显示 /api/parts?project_id={id}
 * - "导入 BOM"入口（打开 ImportModal）
 * - 列表字段：ID、零件编号、零件名称、序列号、原始材质、最终材质(中文)、净重KG、2D、3D、图片URL(缩略图)
 */

interface Project {
  id: number;
  name: string;
}

interface Part {
  id: number;
  project_id?: number;
  // 常见字段（做可空兼容）
  part_number?: string;
  part_name?: string;
  sequence?: string | number;
  original_material?: string;
  final_material_cn?: string;
  net_weight_kg?: string | number;
  drawing_2d?: string;
  drawing_3d?: string;
  image_url?: string;
  image_base64?: string;
  has_image?: boolean;
  // 任意其他
  [key: string]: any;
}

function getQueryParam(key: string) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

// 解析图片地址（优先使用后端返回的image_url，其次构建URL，最后回退占位）
const PLACEHOLDER_IMG = '/static/placeholder.svg';
function resolveImageSrc(pt: Part): string | null {
  // 优先使用后端返回的image_url
  if (pt.image_url) {
    return pt.image_url;
  }
  // 其次构建URL
  if (typeof pt.id === 'number') {
    return `/api/parts/${pt.id}/image`;
  }
  return null;
}

// 缩略图组件（点击放大预览）
function ImageThumb({ part }: { part: Part }) {
  const [open, setOpen] = React.useState(false);
  const src = resolveImageSrc(part);
  if (!src) return <span className="text-slate-400">-</span>;
  return (
    <>
      <div className="relative group">
        <img
          src={src}
          alt={(part as any).零件名称 || part.part_name || part.part_number || '零件图片'}
          className="h-12 w-12 object-cover rounded-md border border-slate-200 cursor-zoom-in transition-all group-hover:shadow-md"
          onClick={() => setOpen(true)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all rounded-md">
          <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            <img
              src={src}
              alt={(part as any).零件名称 || part.part_name || part.part_number || '零件图片'}
              className="w-full h-auto rounded-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => window.open(src, '_blank')}
            >
              <Download size={16} className="mr-1" /> 下载
            </Button>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {part.part_name || part.part_number ? <p>零件名称: {part.part_name || part.part_number}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PartsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 从 URL searchParams 解析 project_id
  const urlProjectId = useMemo(() => searchParams.get('project_id'), [searchParams]);

  useEffect(() => {
    loadProjects();
  }, []);

  // 当 urlProjectId 变化时，直接设置 selectedProject
  useEffect(() => {
    if (urlProjectId && /^\d+$/.test(urlProjectId)) {
      setSelectedProject(urlProjectId);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (selectedProject) {
      fetchParts(selectedProject);
    }
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const r = await fetch('/api/projects');
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      else if (j && j.data && Array.isArray(j.data.items)) items = j.data.items;
      setProjects(items);
      
      // 只在 URL 有 project_id 时设置，否则保持空（让用户手动选择）
      const currentUrlProjectId = new URL(window.location.href).searchParams.get('project_id');
      if (currentUrlProjectId && /^\d+$/.test(currentUrlProjectId)) {
        setSelectedProject(currentUrlProjectId);
      }
      // 不自动选择第一个项目
    } catch (e: any) {
      setProjects([]);
      alert('加载项目列表失败：' + (e?.message || e));
    }
  }

  async function fetchParts(projectId: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/parts?project_id=${projectId}`);
      if (!r.ok) {
        try {
          const errorData = await r.json();
          alert('加载零件列表失败：' + (errorData?.details || errorData?.error || r.status));
        } catch (e) {
          alert('加载零件列表失败：' + r.status);
        }
        setParts([]);
        return;
      }
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      else if (j && j.data && Array.isArray(j.data.items)) items = j.data.items;
      setParts(items);
    } catch (e: any) {
      setParts([]);
      alert('加载零件列表失败：' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function handleProjectChange(v: string) {
    if (v) {
      setSelectedProject(v);
      navigate(`/parts?project_id=${v}`, { replace: true });
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const columns = useMemo(
    () => [
      { key: 'seq', label: '序号', render: (pt: Part) => pt.sequence ?? (pt as any).序号 ?? '-' },
      {
        key: 'assembly_level',
        label: '装配等级',
        render: (pt: Part) => (pt as any).assembly_level ?? (pt as any).装配等级 ?? (pt as any).level ?? '-',
      },
      {
        key: 'part_number',
        label: '产品编号',
        render: (pt: Part) => {
          const pn = pt.part_number ?? (pt as any).产品编号 ?? '-';
          const pnStr = String(pn || '-');
          const go = () => {
            const projName = projects.find((p) => String(p.id) === selectedProject)?.name || '';
            const qProjectName = encodeURIComponent(projName);
            const qPartNumber = encodeURIComponent(pnStr);
            navigate(
              `/dimensions?project_id=${selectedProject || ''}&project_name=${qProjectName}&part_number=${qPartNumber}`
            );
          };
          return pnStr && pnStr !== '-' ? (
            <button
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={go}
              title="查看该零件的尺寸列表"
            >
              {pnStr}
            </button>
          ) : (
            '-'
          );
        },
      },
      {
        key: 'drawing_2d',
        label: '2D图号',
        render: (pt: Part) => {
          const v = (pt.drawing_2d ?? (pt as any).图号2D ?? (pt as any)['2D图号'] ?? '-') as any;
          const s = String(v || '');
          if (s.startsWith('http://') || s.startsWith('https://')) {
            return (
              <a
                className="text-blue-600 hover:text-blue-800 underline flex items-center"
                href={s}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={14} className="mr-1" /> 查看
              </a>
            );
          }
          return s || '-';
        },
      },
      {
        key: 'drawing_3d',
        label: '3D图号',
        render: (pt: Part) => {
          const v = (pt.drawing_3d ?? (pt as any).图号3D ?? (pt as any)['3D图号'] ?? '-') as any;
          const s = String(v || '');
          if (s.startsWith('http://') || s.startsWith('https://')) {
            return (
              <a
                className="text-blue-600 hover:text-blue-800 underline flex items-center"
                href={s}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={14} className="mr-1" /> 查看
              </a>
            );
          }
          return s || '-';
        },
      },
      { key: 'image', label: '零件简图', render: (pt: Part) => <ImageThumb part={pt} /> },
      {
        key: 'part_name',
        label: '零件名称',
        render: (pt: Part) => {
          const name = pt.part_name ?? (pt as any).零件名称 ?? '-';
          const pn = pt.part_number ?? (pt as any).产品编号 ?? '';
          const go = () => {
            const projName = projects.find((p) => String(p.id) === selectedProject)?.name || '';
            const qProjectName = encodeURIComponent(projName);
            const qPartNumber = encodeURIComponent(String(pn || name || ''));
            navigate(
              `/dimensions?project_id=${selectedProject || ''}&project_name=${qProjectName}&part_number=${qPartNumber}`
            );
          };
          return name && name !== '-' ? (
            <button
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={go}
              title="查看该零件的尺寸列表"
            >
              {name}
            </button>
          ) : (
            '-'
          );
        },
      },
      {
        key: 'original_material',
        label: '原图材料',
        render: (pt: Part) => pt.original_material ?? (pt as any).原图材料 ?? (pt as any).原始材质 ?? '-',
      },
      {
        key: 'final_material_cn',
        label: '终审拟代材料',
        render: (pt: Part) =>
          (pt as any).final_material_cn ??
          (pt as any)['终审拟代材料（中国标准）'] ??
          (pt as any)['终审拟代材料'] ??
          (pt as any)['中国标准'] ??
          '-',
      },
      {
        key: 'category',
        label: '零件分类',
        render: (pt: Part) =>
          (pt as any).category ??
          (pt as any).零件分类 ??
          (pt as any).part_category ??
          (pt as any).classification ??
          '-',
      },
      {
        key: 'net_weight_kg',
        label: '产品净重(KG)',
        render: (pt: Part) => pt.net_weight_kg ?? (pt as any)['产品净重(KG/PCS)'] ?? (pt as any).net_weight ?? '-',
      },
      {
        key: 'process_capability',
        label: '初始过程能力',
        render: (pt: Part) => {
          const handleGenerate = async (e: React.MouseEvent<HTMLButtonElement>) => {
            const button = e.currentTarget;
            const originalContent = button.innerHTML;

            // 设置加载状态
            button.innerHTML =
              '<div class="flex items-center"><svg class="mr-1 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>生成中</div>';
            button.disabled = true;

            try {
              console.log('开始生成报告，零件ID：', pt.id);
              console.log('零件信息：', pt);

              const apiUrl = '/api/process-capability/generate';
              console.log('API URL：', apiUrl);

              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ part_id: pt.id }),
              });

              console.log('API响应状态：', response.status);
              console.log('API响应头：', response.headers);

              if (response.ok) {
                // 处理文件下载
                const blob = await response.blob();
                console.log('文件大小：', blob.size);

                // 检查响应头中的文件名
                const contentDisposition = response.headers.get('content-disposition');
                console.log('Content-Disposition：', contentDisposition);

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `初始过程能力分析报告_${pt.part_number || pt.part_name}.xls`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log('报告生成成功');
              } else {
                console.log('API响应错误：', response);
                try {
                  const errorData = await response.json();
                  console.log('错误数据：', errorData);
                  alert('生成报告失败：' + (errorData?.details || errorData?.error || '未知错误'));
                } catch (e) {
                  console.log('解析错误数据失败：', e);
                  alert('生成报告失败：' + response.statusText);
                }
              }
            } catch (error) {
              console.log('网络错误：', error);
              alert('生成报告失败：' + (error as any)?.message || '网络错误');
            } finally {
              // 恢复按钮状态
              button.innerHTML = originalContent;
              button.disabled = false;
            }
          };

          return (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={handleGenerate}
            >
              <FileBarChart size={14} className="mr-1" />
              生成报告
            </Button>
          );
        },
      },
    ],
    [navigate, selectedProject, projects]
  );

  const filtered = useMemo(() => {
    if (!search) return parts;
    const s = search.toLowerCase();
    return parts.filter((pt) => {
      const values = [
        pt.part_number,
        pt.part_name,
        String(pt.sequence ?? ''),
        pt.original_material,
        (pt as any).assembly_level,
        (pt as any).category,
        pt.drawing_2d,
        pt.drawing_3d,
        String(pt.net_weight_kg ?? ''),
        // 新增：终审拟代材料（中国标准）
        (pt as any).final_material_cn,
        (pt as any)['终审拟代材料（中国标准）'],
        (pt as any)['终审拟代材料'],
        (pt as any)['中国标准'],
        // 中文/别名字段兼容
        (pt as any).装配等级,
        (pt as any).产品编号,
        (pt as any)['2D图号'],
        (pt as any)['3D图号'],
        (pt as any).零件名称,
        (pt as any).原图材料,
        (pt as any).零件分类,
        (pt as any)['产品净重(KG/PCS)'],
      ].map((x) => String(x || '').toLowerCase());
      return values.some((f) => f.includes(s));
    });
  }, [parts, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let valueA, valueB;

      // 根据字段获取值
      switch (sortField) {
        case 'seq':
          valueA = a.sequence ?? (a as any).序号 ?? '';
          valueB = b.sequence ?? (b as any).序号 ?? '';
          break;
        case 'assembly_level':
          valueA = (a as any).assembly_level ?? (a as any).装配等级 ?? (a as any).level ?? '';
          valueB = (b as any).assembly_level ?? (b as any).装配等级 ?? (b as any).level ?? '';
          break;
        case 'part_number':
          valueA = a.part_number ?? (a as any).产品编号 ?? '';
          valueB = b.part_number ?? (b as any).产品编号 ?? '';
          break;
        case 'part_name':
          valueA = a.part_name ?? (a as any).零件名称 ?? '';
          valueB = b.part_name ?? (b as any).零件名称 ?? '';
          break;
        case 'original_material':
          valueA = a.original_material ?? (a as any).原图材料 ?? (a as any).原始材质 ?? '';
          valueB = b.original_material ?? (b as any).原图材料 ?? (b as any).原始材质 ?? '';
          break;
        case 'final_material_cn':
          valueA =
            (a as any).final_material_cn ?? (a as any)['终审拟代材料（中国标准）'] ?? (a as any)['终审拟代材料'] ?? '';
          valueB =
            (b as any).final_material_cn ?? (b as any)['终审拟代材料（中国标准）'] ?? (b as any)['终审拟代材料'] ?? '';
          break;
        case 'category':
          valueA = (a as any).category ?? (a as any).零件分类 ?? '';
          valueB = (b as any).category ?? (b as any).零件分类 ?? '';
          break;
        case 'net_weight_kg':
          valueA = a.net_weight_kg ?? (a as any)['产品净重(KG/PCS)'] ?? (a as any).net_weight ?? 0;
          valueB = b.net_weight_kg ?? (b as any)['产品净重(KG/PCS)'] ?? (b as any).net_weight ?? 0;
          break;
        default:
          valueA = (a as any)[sortField] ?? '';
          valueB = (b as any)[sortField] ?? '';
      }

      // 转换为数字比较（如果可能）
      if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        valueA = Number(valueA);
        valueB = Number(valueB);
      } else {
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
      }

      // 排序方向
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }, [filtered, sortField, sortDirection]);

  const currentProject = projects.find((p) => String(p.id) === selectedProject);

  return (
    <Layout projectCount={projects.length} partsCount={parts.length}>
      <div className="p-6 max-w-full mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: currentProject?.name || '零件列表' },
          ]}
        />

        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <Layers className="mr-2 text-blue-600" size={24} />
                零件列表
              </h1>
              <p className="text-sm text-slate-500 mt-1">查看和管理当前项目下的所有零件，可切换项目或导入新BOM</p>
            </div>

            <div className="flex items-end gap-3 flex-wrap">
              <div className="w-56">
                <label className="text-sm text-slate-500 block mb-1">选择项目</label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name || `项目 ${p.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-64 relative">
                <label className="text-sm text-slate-500 block mb-1">搜索零件</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="编号/名称/材质/序列号..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1" />

              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Download size={16} className="mr-1" /> 导出数据
              </Button>

              <Button
                onClick={() => setImportOpen(true)}
                disabled={!selectedProject}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload size={16} className="mr-1" /> 导入 BOM
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              当前项目: {currentProject?.name || '-'}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 border-slate-200">
              ID: {selectedProject ?? '-'}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 border-slate-200">
              零件数量: {filtered.length}
            </Badge>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="py-3 px-4 text-left whitespace-nowrap font-medium text-slate-700"
                      onClick={() => handleSort(c.key)}
                    >
                      <div className="flex items-center cursor-pointer hover:text-blue-700">
                        {c.label}
                        {sortField === c.key &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp size={16} className="ml-1" />
                          ) : (
                            <ChevronDown size={16} className="ml-1" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-2"></div>
                        <span className="text-slate-500">正在加载零件数据...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Layers size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">无零件数据</h3>
                        <p className="text-slate-500 mb-4">当前项目下没有零件数据，请尝试导入BOM</p>
                        <Button
                          onClick={() => setImportOpen(true)}
                          disabled={!selectedProject}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload size={16} className="mr-1" /> 导入 BOM
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  sorted.map((pt) => (
                    <tr key={pt.id} className="border-b last:border-b-0 hover:bg-blue-50/30 transition-colors">
                      {columns.map((c) => (
                        <td key={c.key} className="py-3 px-4 align-middle">
                          {c.render(pt) as any}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {sorted.length > 0 && (
            <div className="mt-4 text-sm text-slate-500 flex justify-between items-center">
              <div>
                显示 {sorted.length} 个零件（共 {parts.length} 个）
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  <Filter size={14} className="mr-1" /> 筛选
                </Button>
                <Select defaultValue="10">
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="每页行数" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 行</SelectItem>
                    <SelectItem value="20">20 行</SelectItem>
                    <SelectItem value="50">50 行</SelectItem>
                    <SelectItem value="100">100 行</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <ImportModal
        projectId={selectedProject}
        open={importOpen}
        onOpenChange={(v: boolean) => setImportOpen(v)}
        onImported={() => {
          if (selectedProject) fetchParts(selectedProject);
        }}
      />
    </Layout>
  );
}
