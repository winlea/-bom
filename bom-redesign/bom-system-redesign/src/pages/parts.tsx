import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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

// 解析图片地址（优先 base64，其次相对/绝对路径，最后回退占位）
const PLACEHOLDER_IMG = '/static/placeholder.svg';
function resolveImageSrc(pt: Part): string | null {
  if ((pt as any).has_image === true && typeof pt.id === 'number') {
    return `/api/parts/${pt.id}/image`;
  }
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
          onError={e => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all rounded-md">
          <Eye
            size={16}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            <img
              src={src}
              alt={(part as any).零件名称 || part.part_name || part.part_number || '零件图片'}
              className="w-full h-auto rounded-md"
              onError={e => {
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
            {part.part_name || part.part_number ? (
              <p>零件名称: {part.part_name || part.part_number}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PartsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  async function loadProjects() {
    try {
      const r = await fetch('/api/projects');
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      setProjects(items);
      
      // 获取URL中的project_id
      const urlProjectId = getQueryParam('project_id');
      
      // 如果URL中有project_id，使用它
      if (urlProjectId && /^\d+$/.test(urlProjectId)) {
        setSelectedProject(urlProjectId);
      } 
      // 如果URL中没有project_id但也没有选中项目，选择第一个项目
      else if (!selectedProject && items.length > 0) {
        setSelectedProject(String(items[0].id));
      }
    } catch (e) {
      console.error('Error loading projects:', e);
      setProjects([]);
    }
  }

  useEffect(() => {
    // 首先处理URL参数
    const q = getQueryParam('project_id');
    if (q && /^\d+$/.test(q)) {
      setSelectedProject(q);
    }
    // 然后加载项目列表
    loadProjects();
  }, []);

  useEffect(() => {
    // 当URL参数变化时更新选中的项目
    const q = getQueryParam('project_id');
    if (q && /^\d+$/.test(q)) {
      setSelectedProject(q);
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedProject) {
      console.log('Fetching parts for project:', selectedProject);
      fetchParts(selectedProject);
    }
  }, [selectedProject]);

  async function fetchParts(projectId: string) {
    setLoading(true);
    try {
      console.log('Making request to:', `/api/parts?project_id=${projectId}`);
      const r = await fetch(`/api/parts?project_id=${projectId}`);
      const j = await r.json().catch(() => null);
      console.log('Response:', j);
      
      // 后端API返回格式是 {"items": [...]}
      let items: any[] = [];
      if (j && Array.isArray(j.items)) {
        items = j.items;
      } else if (Array.isArray(j)) {
        items = j;
      } else if (j && Array.isArray(j.data)) {
        items = j.data;
      }
      
      console.log('Setting parts:', items);
      setParts(items);
    } catch (e) {
      console.error('Error fetching parts:', e);
      setParts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleProjectChange(v: string) {
    console.log('Changing project to:', v);
    setSelectedProject(v);
    navigate(`/parts?project_id=${v}`, { replace: true });
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
      { key: 'seq', label: '序号', render: (pt: Part) => (pt as any).generatedSequence ?? pt.sequence ?? (pt as any).序号 ?? '-' },
      {
        key: 'assembly_level',
        label: '装配等级',
        render: (pt: Part) =>
          (pt as any).assembly_level ?? (pt as any).装配等级 ?? (pt as any).level ?? '-',
      },
      {
        key: 'part_number',
        label: '产品编号',
        render: (pt: Part) => {
          const pn = pt.part_number ?? (pt as any).产品编号 ?? '-';
          const pnStr = String(pn || '-');
          const go = () => {
            const projName = projects.find(p => String(p.id) === selectedProject)?.name || '';
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
      { 
        key: 'image', 
        label: '图片', 
        render: (pt: Part) => {
          const partId = pt.id;
          const imageUrl = pt.image_url;
          const hasImage = pt.has_image;
          
          if (!partId) return <div className="text-gray-400">无图片</div>;
          
          // 如果有图片URL，直接显示
          if (imageUrl) {
            return (
              <div className="w-12 h-12">
                <img 
                  src={imageUrl} 
                  alt="零件图片" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMxOS41ODE3IDMyIDE2IDI4LjQxODMgMTYgMjRDMTYgMTkuNTgxNyAxOS41ODE3IDE2IDI0IDE2QzI4LjQxODMgMTYgMzIgMTkuNTgxNyAzMiAyNEMzMiAyOC40MTgzIDI4LjQxODMgMzIgMjQgMzJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
            );
          }
          
          // 如果没有图片URL但有has_image标记，尝试通过API获取
          if (hasImage) {
            const apiImageUrl = `/api/parts/${partId}/image`;
            return (
              <div className="w-12 h-12">
                <img 
                  src={apiImageUrl} 
                  alt="零件图片" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMxOS41ODE3IDMyIDE2IDI4LjQxODMgMTYgMjRDMTYgMTkuNTgxNyAxOS41ODE3IDE2IDI0IDE2QzI4LjQxODMgMTYgMzIgMTkuNTgxNyAzMiAyNEMzMiAyOC40MTgzIDI4LjQxODMgMzIgMjQgMzJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
            );
          }
          
          // 没有图片
          return <div className="text-gray-400">无图片</div>;
        } 
      },
      {
        key: 'part_name',
        label: '零件名称',
        render: (pt: Part) => {
          const name = pt.part_name ?? (pt as any).零件名称 ?? '-';
          const pn = pt.part_number ?? (pt as any).产品编号 ?? '';
          const go = () => {
            const projName = projects.find(p => String(p.id) === selectedProject)?.name || '';
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
        render: (pt: Part) =>
          pt.original_material ?? (pt as any).原图材料 ?? (pt as any).原始材质 ?? '-',
      },
      {
        key: 'final_material_cn',
        label: '终审拟代材料',
        render: (pt: Part) => {
          // 添加调试信息
          console.log('=== 终审拟代材料调试信息 ===');
          console.log('Part data for final_material_cn:', pt);
          console.log('final_material_cn value:', (pt as any).final_material_cn);
          console.log('终审拟代材料（中国标准） value:', (pt as any)['终审拟代材料（中国标准）']);
          
          const value = 
            (pt as any).final_material_cn ??
            (pt as any)['终审拟代材料（中国标准）'] ??
            (pt as any)['终审拟代材料'] ??
            (pt as any)['中国标准'] ??
            '-';
          
          console.log('Final value:', value);
          console.log('=== 调试信息结束 ===');
          return value;
        },
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
        render: (pt: Part) =>
          pt.net_weight_kg ?? (pt as any)['产品净重(KG/PCS)'] ?? (pt as any).net_weight ?? '-',
      },
    ],
    [navigate, selectedProject, projects]
  );

  // 处理零件数据：去重、生成序号、排序
  const processedParts = useMemo(() => {
    // 1. 去重：根据序号和零件号组合去重，保留第一个出现的项
    const uniqueParts = parts.filter((part, index, self) => {
      const partNumber = String(part.part_number || (part as any).产品编号 || '').trim();
      const sequence = String(part.sequence || (part as any).序号 || '').trim();
      
      // 检查是否有相同序号和零件号组合的项已经在列表中
      const firstIndex = self.findIndex(p => {
        const pNumber = String(p.part_number || (p as any).产品编号 || '').trim();
        const pSequence = String(p.sequence || (p as any).序号 || '').trim();
        return pNumber === partNumber && pSequence === sequence;
      });
      
      // 只保留第一次出现的项
      return firstIndex === index;
    });

    // 2. 按照BOM表中的行列顺序严格排序：先按assembly_level，再按bom_sort
    const sortedParts = [...uniqueParts].sort((a, b) => {
      // 首先按序号排序（如果有序号的话）
      const seqA = a.sequence || (a as any).序号 || '';
      const seqB = b.sequence || (b as any).序号 || '';
      
      // 如果两个都有序号，按序号排序
      if (seqA && seqB) {
        // 将序号转换为数字数组进行比较，例如 "1.2.3" -> [1, 2, 3]
        const partsA = seqA.split('.').map(Number);
        const partsB = seqB.split('.').map(Number);
        
        // 逐级比较
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const partA = partsA[i] || 0;
          const partB = partsB[i] || 0;
          if (partA !== partB) {
            return partA - partB;
          }
        }
        // 如果序号完全相同，则按part_number排序
        const partA = a.part_number || (a as any).产品编号 || '';
        const partB = b.part_number || (b as any).产品编号 || '';
        return partA.localeCompare(partB);
      }
      
      // 如果只有一个有序号，有序号的排在前面
      if (seqA) return -1;
      if (seqB) return 1;
      
      // 如果都没有序号，按照assembly_level和bom_sort排序
      // 首先按装配等级排序
      const levelA = a.assembly_level ?? (a as any).装配等级 ?? (a as any).level ?? 1;
      const levelB = b.assembly_level ?? (b as any).装配等级 ?? (b as any).level ?? 1;
      
      if (levelA !== levelB) {
        return levelA - levelB;
      }
      
      // 然后严格按照bom_sort排序，这是BOM表中的行列顺序
      const sortA = a.bom_sort ?? 0;
      const sortB = b.bom_sort ?? 0;
      
      if (sortA !== sortB) {
        return sortA - sortB;
      }
      
      // 如果assembly_level和bom_sort都相同，则按part_number排序
      const partA = a.part_number || (a as any).产品编号 || '';
      const partB = b.part_number || (b as any).产品编号 || '';
      
      return partA.localeCompare(partB);
    });

    // 3. 生成序号（只对序号为空的项）
    const levelCounters: { [key: number]: number } = {};
    const parentMap: { [key: number]: string } = {};
    
    const partsWithSequence = sortedParts.map(part => {
      const level = part.assembly_level ?? (part as any).装配等级 ?? (part as any).level ?? 1;
      const existingSequence = part.sequence || (part as any).序号 || '';
      
      // 如果已有序号，直接使用
      if (existingSequence.trim() !== '') {
        return {
          ...part,
          generatedSequence: existingSequence
        };
      }
      
      // 没有序号，需要生成
      // 初始化当前层级的计数器
      if (!levelCounters[level]) {
        levelCounters[level] = 0;
      }
      
      // 增加当前层级的计数器
      levelCounters[level]++;
      
      // 生成序号
      let sequence = '';
      if (level === 1) {
        sequence = String(levelCounters[level]);
      } else {
        // 找到父级序号
        const parentLevel = level - 1;
        const parentSequence = parentMap[parentLevel] || '1';
        sequence = `${parentSequence}.${levelCounters[level]}`;
      }
      
      // 保存当前序号作为下一级的父级
      parentMap[level] = sequence;
      
      // 更新零件的序号
      return {
        ...part,
        generatedSequence: sequence
      };
    });

    return partsWithSequence;
  }, [parts]);

  const filtered = useMemo(() => {
    if (!search) return processedParts;
    const s = search.toLowerCase();
    return processedParts.filter(pt => {
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
      ].map(x => String(x || '').toLowerCase());
      return values.some(f => f.includes(s));
    });
  }, [processedParts, search]);

  const sorted = useMemo(() => {
    // 如果没有指定排序字段，直接返回过滤后的数据（已经按BOM层级排序）
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let valueA, valueB;

      // 根据字段获取值
      switch (sortField) {
        case 'seq':
          // 使用生成的序号进行排序
          valueA = (a as any).generatedSequence ?? a.sequence ?? (a as any).序号 ?? '';
          valueB = (b as any).generatedSequence ?? b.sequence ?? (b as any).序号 ?? '';
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
            (a as any).final_material_cn ??
            (a as any)['终审拟代材料（中国标准）'] ??
            (a as any)['终审拟代材料'] ??
            '';
          valueB =
            (b as any).final_material_cn ??
            (b as any)['终审拟代材料（中国标准）'] ??
            (b as any)['终审拟代材料'] ??
            '';
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

  const currentProject = projects.find(p => String(p.id) === selectedProject);

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
              <p className="text-sm text-slate-500 mt-1">
                查看和管理当前项目下的所有零件，可切换项目或导入新BOM
              </p>
            </div>

            <div className="flex items-end gap-3 flex-wrap">
              <div className="w-56">
                <label className="text-sm text-slate-500 block mb-1">选择项目</label>
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
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
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    placeholder="编号/名称/材质/序列号..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
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
                  {columns.map(c => (
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
                  sorted.map(pt => (
                    <tr
                      key={pt.id}
                      className="border-b last:border-b-0 hover:bg-blue-50/30 transition-colors"
                    >
                      {columns.map(c => (
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
