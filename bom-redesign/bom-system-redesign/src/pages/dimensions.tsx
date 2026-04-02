import React, { useState, useEffect } from 'react';
import Layout, { Breadcrumb } from '../components/layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Check, X, Search, FileText, Ruler, Edit, Image, Grid, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  DimensionImageGenerator,
  DimensionPreviewModal,
} from '../components/dimension-image-generator';
import DimensionImageCombiner from '../components/dimension-image-combiner';
import DimensionImageRecognizer from '../components/dimension-image-recognizer';
import DimensionDrawingCanvas from '../components/dimension-drawing-canvas';

interface DimRow {
  id: number;
  groupNo: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit?: string;
  datum: string;
  characteristic: string;
  notes: string;
  imageUrl?: string; // 图片尺寸的图片URL
}

interface DimensionGroup {
  groupNumber: number;
  rows: DimRow[];
}

interface NewRowData {
  groupNumber: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit?: string;
  datum: string;
  characteristic: string;
  notes: string;
  imageUrl?: string; // 图片尺寸的图片URL
}

export default function Dimensions() {
  const [selectedProject, setSelectedProject] = useState('1');
  const location = useLocation();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState<string>('');
  const [partNumber, setPartNumber] = useState<string>('Y1392191');
  const [projects, setProjects] = useState<Array<{ id: number; name?: string }>>([]);
  const [parts, setParts] = useState<
    Array<{ id: number; part_number?: string; part_name?: string }>
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [addingToGroup, setAddingToGroup] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    row?: DimRow | NewRowData;
  }>({ isOpen: false });
  const [insertModal, setInsertModal] = useState<{
    isOpen: boolean;
    insertPosition: number;
  }>({ isOpen: false, insertPosition: 1 });
  const [newRow, setNewRow] = useState<NewRowData>({
    groupNumber: 1,
    dimensionType: 'normal',
    nominalValue: '',
    toleranceValue: '',
    upperTolerance: '',
    lowerTolerance: '',
    datum: '',
    characteristic: '',
    notes: '',
  });

  const [dimensionData, setDimensionData] = useState<DimRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [showImageCombiner, setShowImageCombiner] = useState(false);
  const [selectedDimensions, setSelectedDimensions] = useState<number[]>([]);
  const [editData, setEditData] = useState<DimRow | null>(null);
  const [combinedImageUrl, setCombinedImageUrl] = useState<string>('');
  const [groupCombinedImages, setGroupCombinedImages] = useState<{[key: number]: string}>({});
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    insertPosition: number;
  }>({
    isOpen: false,
    insertPosition: 1,
  });
  const [imageRecognizerModal, setImageRecognizerModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageCharacteristic, setImageCharacteristic] = useState<string>('');
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({ isOpen: false, imageUrl: '', title: '' });
  const [savingCanvasImages, setSavingCanvasImages] = useState(false);
  
  // 尺寸绘制功能状态
  const [dimensionDrawingModal, setDimensionDrawingModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });
  
  const [drawingDimensions, setDrawingDimensions] = useState<DimRow[]>([
    {
      id: 1,
      groupNo: 1,
      dimensionType: 'diameter',
      nominalValue: '10',
      toleranceValue: '',
      upperTolerance: '0.05',
      lowerTolerance: '-0.05',
      datum: '',
      characteristic: '',
      notes: '',
    },
    {
      id: 2,
      groupNo: 2,
      dimensionType: 'position',
      nominalValue: '',
      toleranceValue: '0.2',
      upperTolerance: '',
      lowerTolerance: '',
      datum: 'A',
      characteristic: '',
      notes: '',
    },
    {
      id: 3,
      groupNo: 3,
      dimensionType: 'position',
      nominalValue: '',
      toleranceValue: '0.1',
      upperTolerance: '',
      lowerTolerance: '',
      datum: 'B',
      characteristic: '',
      notes: '',
    },
  ]);
  
  const [drawingConfig] = useState({
    canvasWidth: 800,
    canvasHeight: 600,
    padding: 20,
    spacing: 10,
    backgroundColor: '#ffffff',
  });
  
  const [drawingImageData, setDrawingImageData] = useState<string>('');

  // 批量保存Canvas图片到数据库
  const saveAllCanvasImages = async () => {
    if (!dimensionData.length) {
      alert('没有尺寸数据需要保存');
      return;
    }

    const confirmSave = confirm(
      `确定要将所有 ${dimensionData.length} 个尺寸的预览图片保存到数据库吗？\n\n这将会：\n1. 生成每个尺寸的Canvas图片\n2. 保存到数据库中\n3. 可用于ODS文件生成`
    );

    if (!confirmSave) return;

    setSavingCanvasImages(true);
    try {
      // 收集所有尺寸的Canvas数据
      const canvasDataList = [];
      
      for (const dim of dimensionData) {
        // 跳过图片尺寸类型
        if (dim.dimensionType === 'image_dimension' || dim.dimensionType === 'image') {
          continue;
        }

        // 创建临时Canvas来生成图片数据
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 设置背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 绘制尺寸内容（简化版本）
          ctx.fillStyle = '#1f2937';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          
          const symbol = getDimensionSymbol(dim.dimensionType);
          const nominal = dim.nominalValue || '0';
          const upper = dim.upperTolerance;
          const lower = dim.lowerTolerance;
          
          let displayText = '';
          if (dim.dimensionType === 'diameter') {
            if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
              displayText = `⌀${nominal}±${upper}`;
            } else if (upper && lower) {
              displayText = `⌀${nominal}+${upper}/${lower}`;
            } else {
              displayText = `⌀${nominal}`;
            }
          } else {
            if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
              displayText = `${nominal}±${upper}`;
            } else if (upper && lower) {
              displayText = `${nominal}+${upper}/${lower}`;
            } else {
              displayText = nominal;
            }
          }
          
          ctx.fillText(displayText, canvas.width / 2, canvas.height / 2 + 4);
          
          // 转换为base64
          const canvasData = canvas.toDataURL('image/png');
          canvasDataList.push({
            dimensionId: dim.id,
            canvasData: canvasData
          });
        }
      }

      if (canvasDataList.length === 0) {
        alert('没有可保存的Canvas图片（图片尺寸类型会被跳过）');
        return;
      }

      // 调用后端API批量保存
      const canvasImages = canvasDataList.map(item => ({
        dimensionId: item.dimensionId,
        canvasDataUrl: item.canvasData,
        imageType: 'canvas'
      }));

      const response = await fetch('/api/dimensions/images/batch-save-canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canvasImages: canvasImages
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`✅ 批量保存成功！\n\n成功保存: ${result.data.successCount} 个\n失败: ${result.data.errorCount} 个\n\n现在可以在ODS文件中使用这些图片了！`);
          
          // 重新获取数据以更新界面
          await fetchDimensions();
        } else {
          alert(`保存失败: ${result.message}`);
        }
      } else {
        alert('保存失败，请检查网络连接');
      }
    } catch (error) {
      console.error('批量保存Canvas图片失败:', error);
      alert('保存失败，请检查网络连接');
    } finally {
      setSavingCanvasImages(false);
    }
  };

  // 从 URL 读取上级信息（项目、零件）
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const pid = sp.get('project_id');
    const pname = sp.get('project_name');
    const pnum = sp.get('part_number');
    if (pid) setSelectedProject(pid);
    setProjectName(pname || '');
    setPartNumber(pnum || '');
  }, [location.search]);

  // 加载项目列表（与零件列表页保持一致）
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/projects');
        const j = await r.json().catch(() => null);
        let items: any[] = [];
        if (Array.isArray(j)) items = j;
        else if (j && Array.isArray(j.items)) items = j.items;
        else if (j && Array.isArray(j.data)) items = j.data;
        else if (j && j.data && Array.isArray(j.data.items)) items = j.data.items;
        setProjects(items || []);
        console.log('获取到的项目列表:', items);
        if (!selectedProject && items.length > 0) {
          setSelectedProject(String(items[0].id));
        }
      } catch (e) {
        console.error('获取项目列表失败:', e);
        setProjects([]);
      }
    })();
  }, []);

  // 加载当前项目的零件列表
  const fetchParts = async (projectId: string) => {
    try {
      const r = await fetch(`/api/parts?project_id=${projectId}`);
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      else if (j && j.data && Array.isArray(j.data.items)) items = j.data.items;
      console.log('获取到的零件列表:', items);
      setParts(items);
      // 校验当前已选零件是否仍存在于此项目；不存在或为空则预选第一项
      const current = (partNumber || '').trim();
      const exists =
        Array.isArray(items) &&
        items.some((it: any) => {
          const v = String(it.part_number ?? it.产品编号 ?? it.part_name ?? it.零件名称 ?? '');
          return v === current;
        });
      if (!current || !exists) {
        const first: any = items[0] || {};
        const pn = String(
          first.part_number ?? first.产品编号 ?? first.part_name ?? first.零件名称 ?? ''
        );
        console.log('设置默认零件编号:', pn);
        if (pn) setPartNumber(pn);
      }
    } catch (e) {
      console.error('获取零件列表失败:', e);
      setParts([]);
    }
  };

  // 从后端获取尺寸数据
  const fetchDimensions = async (retryCount = 0) => {
    setLoading(true);
    try {
      // 从后端API获取实际数据
      console.log('🔧 从后端获取尺寸数据');
      console.log(`项目ID: ${selectedProject}, 零件号: ${partNumber}`);
      
      const response = await fetch(`/api/dimensions/projects/${selectedProject}?part_number=${encodeURIComponent(partNumber)}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('获取到的尺寸数据:', result);
        
        if (result.success && Array.isArray(result.data)) {
          setDimensionData(result.data);
          
          // 为获取的数据生成组合图片
          setTimeout(() => {
            // 获取所有唯一的组号
            const groups = [...new Set(result.data.map((dim: DimRow) => dim.groupNo))].map(Number);
            groups.forEach((groupNo) => {
              generateCombinedImageForGroup(groupNo);
            });
          }, 500);
        } else {
          console.log('没有获取到尺寸数据，使用空数组');
          setDimensionData([]);
        }
      } else {
        console.error('获取尺寸数据失败:', response.status);
        setDimensionData([]);
      }
    } catch (error) {
      console.error('获取尺寸数据时发生错误:', error);
      setDimensionData([]);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchParts(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    fetchDimensions();
  }, [selectedProject, partNumber]);

  // 键盘事件处理 - ESC键关闭图片预览
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imagePreviewModal.isOpen) {
        setImagePreviewModal({ isOpen: false, imageUrl: '', title: '' });
      }
    };

    if (imagePreviewModal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [imagePreviewModal.isOpen]);

  // 按组号分组数据
  const dimensionGroups: DimensionGroup[] = React.useMemo(() => {
    const groups: { [key: number]: DimRow[] } = {};

    dimensionData.forEach(row => {
      if (!groups[row.groupNo]) {
        groups[row.groupNo] = [];
      }
      groups[row.groupNo].push(row);
    });

    return Object.keys(groups)
      .map(groupNo => ({
        groupNumber: parseInt(groupNo),
        rows: groups[parseInt(groupNo)],
      }))
      .sort((a, b) => a.groupNumber - b.groupNumber);
  }, [dimensionData]);

  // 添加新尺寸（创建新编号组）
  const addNewDimension = () => {
    const newGroupNumber = Math.max(...dimensionGroups.map(g => g.groupNumber), 0) + 1;
    setNewRow({
      groupNumber: newGroupNumber,
      dimensionType: 'normal',
      nominalValue: '',
      toleranceValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      datum: '',
      characteristic: '',
      notes: '',
    });
    setAddingToGroup(newGroupNumber);
    setIsAddingRow(true);
  };

  // 在指定组内添加行
  const addRowToGroup = (groupNumber: number) => {
    setNewRow({
      groupNumber: groupNumber,
      dimensionType: 'normal',
      nominalValue: '',
      toleranceValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      datum: '',
      characteristic: '',
      notes: '',
    });
    setAddingToGroup(groupNumber);
    setIsAddingRow(true);
  };

  // 验证数字格式的辅助函数
  const isValidNumber = (value: string): boolean => {
    if (!value.trim()) return false;

    // 检查是否为有效的数字格式
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    // 检查字符串是否为完整的数字（不能以小数点结尾）
    const trimmed = value.trim();
    if (trimmed.endsWith('.') || trimmed.startsWith('.') || trimmed === '-' || trimmed === '+') {
      return false;
    }

    // 检查是否包含多个小数点
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 1) return false;

    // 检查是否为纯数字格式（允许负号和一个小数点）
    const validPattern = /^-?\d+(\.\d+)?$/;
    return validPattern.test(trimmed);
  };

  const saveNewRow = async () => {
    // 验证名义值
    if (!newRow.nominalValue.trim()) {
      alert('请输入名义值');
      return;
    }

    // 验证名义值是否为完整的有效数字
    if (!isValidNumber(newRow.nominalValue)) {
      alert('名义值必须是完整的有效数字（如：12、0.5、-1.2）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证上公差（如果有输入）
    if (newRow.upperTolerance.trim() && !isValidNumber(newRow.upperTolerance)) {
      alert('上公差必须是完整的有效数字（如：0.1、-0.5）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证下公差（如果有输入）
    if (newRow.lowerTolerance.trim() && !isValidNumber(newRow.lowerTolerance)) {
      alert('下公差必须是完整的有效数字（如：-0.5、0.1）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证公差值（如果有输入）
    if (newRow.toleranceValue.trim() && !isValidNumber(newRow.toleranceValue)) {
      alert('公差值必须是完整的有效数字（如：0.5、1.0）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 几何公差类型需要公差值
    if (['position', 'profile_surface', 'flatness', 'coplanarity'].includes(newRow.dimensionType)) {
      if (!newRow.toleranceValue.trim()) {
        alert('几何公差类型必须输入公差值');
        return;
      }
    }

    // 位置度特殊验证（符合ISO 1101/ASME Y14.5标准）
    if (newRow.dimensionType === 'position') {
      // 位置度必须有基准
      if (!newRow.datum || !newRow.datum.trim()) {
        alert('位置度必须指定基准（符合ISO 1101/ASME Y14.5标准）');
        return;
      }
    }

    // 验证基准符号格式
      if (newRow.datum) {
        const datum = newRow.datum.trim();
        // 基准符号可以是单个基准或基准体系（符合ISO 1101/ASME Y14.5和GB/T 1182标准）
        // 支持格式：A, B1, ABC, A-B-C, A1-B2-C3等
        const datumRegex = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
        if (!datumRegex.test(datum)) {
          alert('基准符号格式无效。支持单个基准（如 A, B1）、连续基准（如 ABC）或基准体系（如 A-B-C, A1-B2-C3）（符合ISO 1101/ASME Y14.5和GB/T 1182标准）');
          return;
        }
      }

    // 验证尺寸组合的合理性（符合工程实际）
    if (newRow.dimensionType === 'diameter') {
      // 检查当前组是否已有孔径尺寸
      const existingDiameterInGroup = dimensionData.some(dim => 
        dim.groupNo === newRow.groupNumber && dim.dimensionType === 'diameter'
      );
      if (existingDiameterInGroup) {
        alert('一个尺寸组合中只能有一个孔径大小（diameter）');
        return;
      }
    }



    setLoading(true);
    try {
      // 调用后端API保存数据
      const response = await fetch(
        `/api/dimensions/projects/${selectedProject}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partId: partNumber, // 传递当前选中的产品编号
            groupNo: newRow.groupNumber,
            dimensionType: newRow.dimensionType,
            nominalValue: newRow.nominalValue,
            toleranceValue: newRow.toleranceValue,
            upperTolerance: newRow.upperTolerance,
            lowerTolerance: newRow.lowerTolerance,
            unit: newRow.unit,
            datum: newRow.datum,
            characteristic: newRow.characteristic,
            notes: newRow.notes,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 保存成功后重新获取数据
          await fetchDimensions();
          cancelNewRow();
          // 为新创建的组生成组合图片
          setTimeout(() => {
            generateCombinedImageForGroup(newRow.groupNumber);
          }, 500);
          alert('尺寸保存成功！组合图片已自动生成');
        } else {
          alert(`保存失败: ${result.message}`);
        }
      } else {
        // 尝试获取错误响应
        try {
          const errorData = await response.json();
          alert(`保存失败: ${errorData.message || '未知错误'}`);
        } catch (e) {
          alert('保存失败，请检查网络连接');
        }
      }
    } catch (error) {
      console.error('保存尺寸失败:', error);
      alert('保存失败，请检查网络连接并重试');
    } finally {
      setLoading(false);
    }
  };

  const cancelNewRow = () => {
    setIsAddingRow(false);
    setAddingToGroup(null);
    setNewRow({
      groupNumber: 1,
      dimensionType: 'normal',
      nominalValue: '',
      toleranceValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      datum: '',
      characteristic: '',
      notes: '',
    });
  };

  const deleteRow = async (id: number) => {
    if (!confirm('确定要删除这个尺寸吗？删除后，后续编号会自动前移。')) {
      return;
    }

    console.log('开始删除尺寸，ID:', id);
    setLoading(true);
    try {
      // 使用删除重排序API
      const url = `/api/dimensions/${id}/delete-with-reorder`;
      console.log('删除尺寸的URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      console.log('删除尺寸的响应状态码:', response.status);
      console.log('删除尺寸的响应状态:', response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('删除尺寸的响应数据:', result);
        
        if (result.success) {
          // 删除成功后重新获取数据
          await fetchDimensions();
          // 重新生成所有组的组合图片
          setTimeout(() => {
            dimensionGroups.forEach(group => {
              generateCombinedImageForGroup(group.groupNumber);
            });
          }, 500);
          alert('尺寸删除成功，编号已重新排序！组合图片已自动更新');
        } else {
          alert(`删除失败: ${result.message}`);
        }
      } else {
        // 尝试获取错误响应的内容
        try {
          const errorData = await response.json();
          console.log('删除尺寸的错误响应:', errorData);
          alert(`删除失败: ${errorData.message || '网络错误'}`);
        } catch (e) {
          console.error('无法解析错误响应:', e);
          alert('删除失败，请检查网络连接');
        }
      }
    } catch (error) {
      console.error('删除尺寸失败:', error);
      alert('删除失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑行
  const handleEdit = (row: DimRow) => {
    setEditingRow(row.id);
    setEditData({ ...row });
  };



  // 取消编辑
  const cancelEdit = () => {
    setEditingRow(null);
    setEditData(null);
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

  // 检查是否为几何公差类型
  const isGeometric = (type: string) =>
    type === 'position' ||
    type === 'profile_surface' ||
    type === 'flatness' ||
    type === 'coplanarity' ||
    type === 'straightness' ||
    type === 'roundness' ||
    type === 'cylindricity' ||
    type === 'profile_line' ||
    type === 'parallelism' ||
    type === 'perpendicularity' ||
    type === 'angularity' ||
    type === 'concentricity' ||
    type === 'symmetry' ||
    type === 'circular_runout' ||
    type === 'total_runout';

  // 为指定组生成组合图片
  const generateCombinedImageForGroup = (groupNumber: number) => {
    // 获取该组的所有尺寸
    const groupDimensions = dimensionData.filter(dim => dim.groupNo === groupNumber);
    
    if (groupDimensions.length === 0) return;
    
    // 创建临时Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 计算画布尺寸 - 根据尺寸数量和类型动态调整
    const padding = 20;
    const sectionHeight = 40; // 每个尺寸部分的高度
    const canvasWidth = 300; // 增加宽度以容纳更多内容
    // 根据尺寸数量调整画布高度
    const canvasHeight = padding * 2 + sectionHeight * groupDimensions.length;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 初始化位置
    let currentSection = 0;
    const x = padding;
    
    // 遍历所有尺寸并绘制
    groupDimensions.forEach((dimension, index) => {
      const y = padding + currentSection * sectionHeight + sectionHeight / 2;
      
      if (dimension.dimensionType === 'diameter') {
        // 绘制孔径尺寸
        let mainText = `⌀${dimension.nominalValue || '0'}`;
        if (dimension.upperTolerance && dimension.lowerTolerance) {
          const upper = dimension.upperTolerance;
          const lower = dimension.lowerTolerance;
          if (Math.abs(parseFloat(upper)) === Math.abs(parseFloat(lower)) && parseFloat(upper) > 0 && parseFloat(lower) < 0) {
            mainText += ` ±${upper}`;
          } else {
            mainText += ` ${upper}/${lower}`;
          }
        } else if (dimension.upperTolerance) {
          mainText += ` +${dimension.upperTolerance}`;
        } else if (dimension.lowerTolerance) {
          mainText += ` ${dimension.lowerTolerance}`;
        }
        
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(mainText, x, y);
        
      } else if (isGeometric(dimension.dimensionType)) {
        // 绘制几何公差（位置度等）
        const boxHeight = 30;
        const symbolBoxWidth = 35;
        const toleranceBoxWidth = 50;
        const datumBoxWidth = 30;
        
        // 处理基准，按照ISO 1101/ASME Y14.5和GB/T 1182标准显示
        // 支持格式：A, B1, A-B-C, A1-B2-C3等
        const datumStr = dimension.datum ? dimension.datum.trim() : '';
        // 分割基准，保留原始格式（包括数字和连字符）
        const datums = datumStr.split('-').filter(d => d.trim());
        
        let startX = x;
        
        // 绘制符号框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y - boxHeight / 2, symbolBoxWidth, boxHeight);
        ctx.fillStyle = '#000000';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getDimensionSymbol(dimension.dimensionType), startX + symbolBoxWidth / 2, y);
        startX += symbolBoxWidth;
        
        // 绘制公差框
        ctx.strokeRect(startX, y - boxHeight / 2, toleranceBoxWidth, boxHeight);
        ctx.font = '16px Arial';
        ctx.fillText(dimension.toleranceValue || '0', startX + toleranceBoxWidth / 2, y);
        startX += toleranceBoxWidth;
        
        // 绘制基准框
        if (datums.length > 0) {
          ctx.font = '16px Arial';
          datums.forEach((d, index) => {
            // 为每个基准创建单独的框，紧密排列
            // 调整基准框宽度以适应包含数字的基准符号
            const adjustedDatumBoxWidth = Math.max(datumBoxWidth, ctx.measureText(d).width + 10);
            ctx.strokeRect(startX, y - boxHeight / 2, adjustedDatumBoxWidth, boxHeight);
            ctx.fillText(d, startX + adjustedDatumBoxWidth / 2, y);
            // 移除基准框之间的间距，让它们紧密排列
            startX += adjustedDatumBoxWidth;
          });
        }
        
      } else {
        // 绘制普通尺寸
        let mainText = dimension.nominalValue || '0';
        if (dimension.upperTolerance && dimension.lowerTolerance) {
          const upper = dimension.upperTolerance;
          const lower = dimension.lowerTolerance;
          if (Math.abs(parseFloat(upper)) === Math.abs(parseFloat(lower)) && parseFloat(upper) > 0 && parseFloat(lower) < 0) {
            mainText += ` ±${upper}`;
          } else {
            mainText += ` ${upper}/${lower}`;
          }
        } else if (dimension.upperTolerance) {
          mainText += ` +${dimension.upperTolerance}`;
        } else if (dimension.lowerTolerance) {
          mainText += ` ${dimension.lowerTolerance}`;
        }
        
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(mainText, x, y);
      }
      
      currentSection++;
    });
    
    // 生成图片URL
    const imageUrl = canvas.toDataURL('image/png');
    setGroupCombinedImages(prev => ({
      ...prev,
      [groupNumber]: imageUrl
    }));
    setCombinedImageUrl(imageUrl);
  };



  // 保存编辑
  const saveEdit = async () => {
    if (!editData) return;

    // 验证名义值
    if (!editData.nominalValue.trim()) {
      alert('请输入名义值');
      return;
    }

    // 验证名义值是否为完整的有效数字
    if (!isValidNumber(editData.nominalValue)) {
      alert('名义值必须是完整的有效数字（如：12、0.5、-1.2）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证上公差（如果有输入）
    if (editData.upperTolerance.trim() && !isValidNumber(editData.upperTolerance)) {
      alert('上公差必须是完整的有效数字（如：0.1、-0.5）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证下公差（如果有输入）
    if (editData.lowerTolerance.trim() && !isValidNumber(editData.lowerTolerance)) {
      alert('下公差必须是完整的有效数字（如：-0.5、0.1）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 验证公差值（如果有输入）
    if (editData.toleranceValue.trim() && !isValidNumber(editData.toleranceValue)) {
      alert('公差值必须是完整的有效数字（如：0.5、1.0）\n不能是：0.、.5、-、+等不完整格式');
      return;
    }

    // 几何公差类型需要公差值
    if (
      ['position', 'profile_surface', 'flatness', 'coplanarity'].includes(editData.dimensionType)
    ) {
      if (!editData.toleranceValue.trim()) {
        alert('几何公差类型必须输入公差值');
        return;
      }
    }

    // 位置度特殊验证（符合ISO 1101/ASME Y14.5标准）
    if (editData.dimensionType === 'position') {
      // 位置度必须有基准
      if (!editData.datum || !editData.datum.trim()) {
        alert('位置度必须指定基准（符合ISO 1101/ASME Y14.5标准）');
        return;
      }
    }

    // 验证基准符号格式
    if (editData.datum) {
      const datum = editData.datum.trim();
      // 基准符号可以是单个基准或基准体系（符合ISO 1101/ASME Y14.5和GB/T 1182标准）
      // 支持格式：A, B1, ABC, A-B-C, A1-B2-C3等
      const datumRegex = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
      if (!datumRegex.test(datum)) {
        alert('基准符号格式无效。支持单个基准（如 A, B1）、连续基准（如 ABC）或基准体系（如 A-B-C, A1-B2-C3）（符合ISO 1101/ASME Y14.5和GB/T 1182标准）');
        return;
      }
    }

    // 验证尺寸组合的合理性（符合工程实际）
    if (editData.dimensionType === 'diameter') {
      // 检查当前组是否已有其他孔径尺寸（排除当前正在编辑的尺寸）
      const existingDiameterInGroup = dimensionData.some(dim => 
        dim.groupNo === editData.groupNo && 
        dim.dimensionType === 'diameter' && 
        dim.id !== editData.id
      );
      if (existingDiameterInGroup) {
        alert('一个尺寸组合中只能有一个孔径大小（diameter）');
        return;
      }
    }



    setLoading(true);
    try {
      // 调用后端API更新数据
      const response = await fetch(`/api/dimensions/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dimensionType: editData.dimensionType,
            nominalValue: editData.nominalValue,
            toleranceValue: editData.toleranceValue,
            upperTolerance: editData.upperTolerance,
            lowerTolerance: editData.lowerTolerance,
            unit: editData.unit,
            datum: editData.datum,
            characteristic: editData.characteristic,
            notes: editData.notes,
          }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 保存成功后重新获取数据
          await fetchDimensions();
          // 为当前组重新生成组合图片
          setTimeout(() => {
            generateCombinedImageForGroup(editData!.groupNo);
          }, 500);
          cancelEdit();
          alert('尺寸更新成功！组合图片已自动生成');
        } else {
          alert(`更新失败: ${result.message}`);
        }
      } else {
        alert('更新失败，请检查网络连接');
      }
    } catch (error) {
      console.error('更新尺寸失败:', error);
      alert('更新失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 插入尺寸功能
  const insertDimensionAtPosition = async (insertPosition: number, dimensionData: any) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dimensions/projects/${selectedProject}/insert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partId: partNumber, // 传递当前选中的产品编号
            insertPosition: insertPosition,
            ...dimensionData,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 插入成功后重新获取数据
          await fetchDimensions();
          alert(`尺寸已插入到位置 ${insertPosition}，后续编号已自动顺延！`);
          return true;
        } else {
          alert(`插入失败: ${result.message}`);
          return false;
        }
      } else {
        alert('插入失败，请检查网络连接');
        return false;
      }
    } catch (error) {
      console.error('插入尺寸失败:', error);
      alert('插入失败，请检查网络连接');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 打开插入模态框
  const openInsertModal = () => {
    setInsertModal({ isOpen: true, insertPosition: 1 });
  };

  // 关闭插入模态框
  const closeInsertModal = () => {
    setInsertModal({ isOpen: false, insertPosition: 1 });
  };

  // 执行插入操作
  const handleInsertDimension = async () => {
    const insertPosition = insertModal.insertPosition;

    // 验证插入位置
    if (insertPosition < 1) {
      alert('插入位置必须大于0');
      return;
    }

    // 创建默认的尺寸数据
    const defaultDimensionData = {
      dimensionType: 'normal',
      nominalValue: '0',
      toleranceValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      datum: '',
      characteristic: '',
      notes: `插入到位置 ${insertPosition}`,
    };

    const success = await insertDimensionAtPosition(insertPosition, defaultDimensionData);
    if (success) {
      closeInsertModal();
    }
  };

  // 打开图片尺寸模态框
  const openImageModal = () => {
    setImageModal({ isOpen: true, insertPosition: 1 });
    setImageFile(null);
    setImagePreview('');
    setImageCharacteristic('');
  };

  // 关闭图片尺寸模态框
  const closeImageModal = () => {
    setImageModal({ isOpen: false, insertPosition: 1 });
    setImageFile(null);
    setImagePreview('');
    setImageCharacteristic('');
  };

  // 处理图片尺寸识别结果
  const handleDimensionsRecognized = async (dimensions: any[]) => {
    if (dimensions.length === 0) {
      alert('没有识别到尺寸，请重新尝试');
      return;
    }

    // 验证尺寸组合的合理性（符合工程实际）
    // 检查每个组中是否有多个孔径尺寸
    const groupDiameterCount: { [key: number]: number } = {};
    
    dimensions.forEach(dim => {
      const groupNo = dim.groupNumber || 1;
      if (dim.dimensionType === 'diameter') {
        groupDiameterCount[groupNo] = (groupDiameterCount[groupNo] || 0) + 1;
      }
    });

    // 检查是否有组包含多个孔径尺寸
    for (const [groupNo, count] of Object.entries(groupDiameterCount)) {
      if (count > 1) {
        alert(`组 ${groupNo} 包含 ${count} 个孔径尺寸，一个尺寸组合中只能有一个孔径大小`);
        return;
      }
    }

    setLoading(true);
    try {
      // 确保partNumber有值
      const currentPartNumber = partNumber || 'test';
      
      // 显示批量添加的进度提示
      console.log(`正在添加 ${dimensions.length} 个尺寸...`);
      console.log('使用的partNumber:', currentPartNumber);
      
      // 显示进度提示
      const progressInterval = setInterval(() => {
        console.log('添加中...');
      }, 1000);
      
      // 批量添加识别的尺寸
      const response = await fetch(
        `/api/dimensions/projects/${selectedProject}/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            dimensions.map(dim => ({
              partId: currentPartNumber,
              dimensionType: dim.dimensionType,
              nominalValue: dim.nominalValue,
              toleranceValue: dim.toleranceValue,
              upperTolerance: dim.upperTolerance,
              lowerTolerance: dim.lowerTolerance,
              datum: dim.datum,
              characteristic: dim.characteristic,
              notes: dim.notes,
            }))
          ),
        }
      );

      // 清除进度提示
      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新获取数据以更新界面
          await fetchDimensions();
          // 显示成功消息
          const successMessage = `✅ 成功添加 ${result.data.count} 个尺寸！`;
          console.log(successMessage);
          // 使用更友好的提示
          alert(successMessage);
          setImageRecognizerModal(false);
        } else {
          const errorMessage = `❌ 添加失败: ${result.message}`;
          console.error(errorMessage);
          alert(errorMessage);
        }
      } else {
        // 尝试获取错误响应
        try {
          const errorData = await response.json();
          const errorMessage = `❌ 添加失败: ${errorData.message || '未知错误'}`;
          console.error(errorMessage);
          alert(errorMessage);
        } catch (e) {
          const errorMessage = '❌ 添加失败，请检查网络连接';
          console.error(errorMessage);
          alert(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `❌ 添加尺寸失败，请重试: ${error}`;
      console.error('添加识别尺寸失败:', error);
      alert('添加尺寸失败，请检查网络连接并重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理图片文件选择
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
      }

      setImageFile(file);

      // 创建预览
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传图片并添加图片尺寸
  const handleAddImageDimension = async () => {
    if (!imageFile) {
      alert('请选择图片文件');
      return;
    }

    if (!imageCharacteristic.trim()) {
      alert('请输入特殊特性');
      return;
    }

    const insertPosition = imageModal.insertPosition;

    // 验证插入位置
    if (insertPosition < 1) {
      alert('插入位置必须大于0');
      return;
    }

    setLoading(true);
    try {
      // 创建FormData上传图片
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('insertPosition', insertPosition.toString());
      formData.append('characteristic', imageCharacteristic);
      formData.append('projectId', selectedProject);
      formData.append('partId', partNumber); // 传递当前选中的产品编号

      const response = await fetch(
        `/api/dimensions/projects/${selectedProject}/image-dimension`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 插入成功后重新获取数据
          await fetchDimensions();
          alert(`图片尺寸已插入到位置 ${insertPosition}，后续编号已自动顺延！`);
          closeImageModal();
        } else {
          alert(`添加失败: ${result.message}`);
        }
      } else {
        alert('添加失败，请检查网络连接');
      }
    } catch (error) {
      console.error('添加图片尺寸失败:', error);
      alert('添加失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const getDimensionSymbol = (type: string) => {
    const symbols = {
      normal: '-',
      diameter: '⌀',
      radius: 'R',
      spherical_diameter: 'S⌀',
      spherical_radius: 'SR',
      // 形状公差
      straightness: '⏤',
      flatness: '⏥',
      roundness: '○',
      cylindricity: '⌭',
      // 轮廓公差
      profile_line: '⌒',
      profile_surface: '⌓',
      // 方向公差
      parallelism: '⫽',
      perpendicularity: '⊥',
      angularity: '∠',
      // 位置公差
      position: '⌖',
      concentricity: '◎',
      symmetry: '⌯',
      // 跳动公差
      circular_runout: '↗',
      total_runout: '↗↗',
      // 其他
      coplanarity: '⏥⏥',
      // 图片尺寸
      image_dimension: '📷',
      image: '📷',
    };
    return symbols[type as keyof typeof symbols] || '-';
  };

  const formatDimensionPreview = (row: DimRow | NewRowData) => {
    const symbol = getDimensionSymbol(row.dimensionType);
    const nominal = row.nominalValue || '0';
    const upper = row.upperTolerance;
    const lower = row.lowerTolerance;

    if (row.dimensionType === 'position') {
      // 位置度特殊处理
      const tolerance = row.toleranceValue || '0';
      const datum = row.datum || '';
      return `⌖ ${tolerance} ${datum}`;
    } else if (row.dimensionType === 'diameter') {
      if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
        return `⌀${nominal}±${upper}`;
      } else if (upper && lower) {
        return `⌀${nominal}+${upper}/${lower}`;
      } else {
        return `⌀${nominal}`;
      }
    }

    if (upper && lower && upper === Math.abs(parseFloat(lower)).toString()) {
      return `${nominal}±${upper}`;
    } else if (upper && lower) {
      return `${nominal}+${upper}/${lower}`;
    } else {
      return nominal;
    }
  };

  const getCharacteristicBadge = (characteristic: string) => {
    if (!characteristic) return null;

    const colorMap: { [key: string]: string } = {
      CC01: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SC02: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SC03: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SC11: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SC12: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };

    return (
      <Badge
        className={`${colorMap[characteristic] || 'bg-gray-100 text-gray-800 border-gray-300'} border`}
      >
        {characteristic}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            {
              label: projectName || `项目 ${selectedProject}`,
              to: selectedProject ? `/parts?project_id=${selectedProject}` : undefined,
            },
            { label: partNumber || '尺寸列表' },
          ]}
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Ruler className="h-6 w-6" />
              尺寸列表
            </h1>
            <p className="text-slate-600 mt-1">管理项目中的尺寸数据</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name || `项目 ${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={partNumber} onValueChange={setPartNumber}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="选择零件（当前项目）" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((p, idx) => {
                  const label = String(
                    (p as any).part_number ??
                      (p as any).产品编号 ??
                      (p as any).part_name ??
                      (p as any).零件名称 ??
                      '-'
                  );
                  const val = String(
                    (p as any).part_number ??
                      (p as any).产品编号 ??
                      (p as any).part_name ??
                      (p as any).零件名称 ??
                      ''
                  );
                  const key = String((p as any).id ?? (p as any).ID ?? val ?? idx);
                  return (
                    <SelectItem key={key} value={val}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button onClick={addNewDimension} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              添加尺寸
            </Button>

            <Button onClick={openInsertModal} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" />
              插入尺寸
            </Button>

            <Button onClick={openImageModal} className="bg-purple-600 hover:bg-purple-700">
              <Image className="h-4 w-4 mr-1" />
              添加图片尺寸
            </Button>
            <Button onClick={() => setImageRecognizerModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Image className="h-4 w-4 mr-1" />
              图片尺寸识别
            </Button>

            <Button
              onClick={saveAllCanvasImages}
              className="bg-green-600 hover:bg-green-700"
              disabled={savingCanvasImages || !dimensionData.length}
            >
              {savingCanvasImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-1" />
                  保存预览图片
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowImageCombiner(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Image className="h-4 w-4 mr-1" />
              图片拼接
            </Button>

            <Button
              onClick={() =>
                navigate(
                  `/dimension-report?project_id=${selectedProject}&project_name=${encodeURIComponent(projectName || '')}&part_number=${encodeURIComponent(partNumber || '')}`
                )
              }
              className="bg-orange-600 hover:bg-orange-700"
            >
              <FileText className="h-4 w-4 mr-1" />
              尺寸报告
            </Button>

            <Button
              onClick={() => setDimensionDrawingModal({ isOpen: true })}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Ruler className="h-4 w-4 mr-1" />
              尺寸绘制
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const url = `/api/dimensions/export/excel?projectId=${selectedProject}&partId=${encodeURIComponent(partNumber || '')}`;
                  window.open(url, '_blank');
                } catch (error) {
                  console.error('导出数据失败:', error);
                  alert('导出数据失败，请检查网络连接');
                }
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              导出数据
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-slate-800">
                尺寸数据
                <span className="text-sm font-normal text-slate-500 ml-2">
                  共 {dimensionData.length} 条记录
                </span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="搜索尺寸..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">加载中...</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table
                className="border-collapse bg-white"
                style={{ minWidth: '1200px', width: '100%' }}
              >
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                    <th
                      className="text-center py-1 px-1 font-bold text-slate-800 border-r-2 border-slate-300 bg-blue-50"
                      style={{ minWidth: '60px', width: '60px' }}
                    >
                      编号
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '80px', width: '80px' }}
                    >
                      符号
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '100px', width: '100px' }}
                    >
                      公差值
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '100px', width: '100px' }}
                    >
                      名义值
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '90px', width: '90px' }}
                    >
                      上公差
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '90px', width: '90px' }}
                    >
                      下公差
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '80px', width: '80px' }}
                    >
                      基准
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '100px', width: '100px' }}
                    >
                      特性
                    </th>

                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '150px', width: '150px' }}
                    >
                      图纸尺寸
                    </th>
                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700 border-r border-slate-200"
                      style={{ minWidth: '150px', width: '150px' }}
                    >
                      组合图片
                    </th>

                    <th
                      className="text-center py-1 px-1 font-semibold text-slate-700"
                      style={{ minWidth: '100px', width: '100px' }}
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dimensionGroups.map((group, groupIndex) => (
                    <React.Fragment key={group.groupNumber}>
                      {/* 组分割线 */}
                      {groupIndex > 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            className="h-1 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 border-0"
                          ></td>
                        </tr>
                      )}

                      {group.rows.map((row, rowIndex) => (
                        <tr
                          key={row.id}
                          className={`
                          ${rowIndex === 0 ? 'border-t-2 border-blue-200' : 'border-t border-slate-100'} 
                          border-b border-slate-100 
                          hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 
                          transition-all duration-200 
                          ${rowIndex === group.rows.length - 1 ? 'border-b-2 border-blue-200' : ''}
                        `}
                          style={{ height: '80px', minHeight: '80px' }}
                        >
                          {rowIndex === 0 && (
                            <td
                              rowSpan={group.rows.length}
                              className="text-center p-1 border-r-2 border-blue-300 align-middle bg-gradient-to-b from-blue-50 to-blue-100 relative"
                            >
                              {/* 编号组背景装饰 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 rounded-l-lg"></div>

                              <div className="relative flex items-center justify-center h-full">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border border-white">
                                  {group.groupNumber}
                                </div>
                              </div>
                            </td>
                          )}
                          {/* 符号列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '80px', width: '80px' }}
                          >
                            {editingRow === row.id ? (
                              <Select
                                value={editData?.dimensionType || row.dimensionType}
                                onValueChange={value =>
                                  setEditData(prev =>
                                    prev ? { ...prev, dimensionType: value } : null
                                  )
                                }
                              >
                                <SelectTrigger className="w-20 h-8 text-xs border-blue-200 focus:border-blue-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">普通尺寸</SelectItem>
                                  <SelectItem value="diameter">直径 ⌀</SelectItem>
                                  <SelectItem value="position">位置度 ⌖</SelectItem>
                                  <SelectItem value="profile_surface">面轮廓 ⌓</SelectItem>
                                  <SelectItem value="profile_line">线轮廓 ⌒</SelectItem>
                                  <SelectItem value="flatness">平面度 ⏥</SelectItem>
                                  <SelectItem value="coplanarity">共面度 ⏥⏥</SelectItem>
                                  <SelectItem value="perpendicularity">垂直度 ⊥</SelectItem>
                                  <SelectItem value="angularity">倾斜度 ∠</SelectItem>
                                  <SelectItem value="concentricity">同心度 ◎</SelectItem>
                                  <SelectItem value="radius">半径 R</SelectItem>
                                  <SelectItem value="spherical_diameter">球直径 S⌀</SelectItem>
                                  <SelectItem value="spherical_radius">球半径 SR</SelectItem>
                                  <SelectItem value="straightness">直线度 ⏤</SelectItem>
                                  <SelectItem value="roundness">圆度 ○</SelectItem>
                                  <SelectItem value="cylindricity">圆柱度 ⌭</SelectItem>
                                  <SelectItem value="parallelism">平行度 ∥</SelectItem>
                                  <SelectItem value="symmetry">对称度 ⌯</SelectItem>
                                  <SelectItem value="circular_runout">圆跳动 ↗</SelectItem>
                                  <SelectItem value="total_runout">全跳动 ↗↗</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 via-blue-100 to-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 shadow-md mx-auto border border-slate-200 hover:shadow-lg transition-all duration-200">
                                <span className="text-lg">
                                  {getDimensionSymbol(row.dimensionType)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 公差值列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 font-mono text-slate-700 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            {row.dimensionType === 'image_dimension' ? (
                              <span className="text-gray-400 font-bold text-lg">—</span>
                            ) : editingRow === row.id ? (
                              <Input
                                value={editData?.toleranceValue || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, toleranceValue: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="公差值"
                              />
                            ) : (
                              <div className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-sm font-medium">
                                {row.toleranceValue || '—'}
                              </div>
                            )}
                          </td>

                          {/* 名义值列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 font-mono text-slate-700 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            {row.dimensionType === 'image_dimension' ? (
                              <span className="text-gray-400 font-bold text-lg">—</span>
                            ) : editingRow === row.id ? (
                              <Input
                                value={editData?.nominalValue || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, nominalValue: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="名义值"
                              />
                            ) : (
                              <div className="px-2 py-1 bg-blue-50 rounded-md border border-blue-200 text-sm font-bold text-blue-800">
                                {row.nominalValue || '—'}
                              </div>
                            )}
                          </td>

                          {/* 上公差列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 font-mono text-slate-700 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '90px', width: '90px' }}
                          >
                            {row.dimensionType === 'image_dimension' ? (
                              <span className="text-gray-400 font-bold text-lg">—</span>
                            ) : editingRow === row.id ? (
                              <Input
                                value={editData?.upperTolerance || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, upperTolerance: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="上公差"
                              />
                            ) : (
                              <div className="px-2 py-1 bg-green-50 rounded-md border border-green-200 text-sm font-medium text-green-700">
                                {row.upperTolerance || '—'}
                              </div>
                            )}
                          </td>

                          {/* 下公差列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 font-mono text-slate-700 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '90px', width: '90px' }}
                          >
                            {row.dimensionType === 'image_dimension' ? (
                              <span className="text-gray-400 font-bold text-lg">—</span>
                            ) : editingRow === row.id ? (
                              <Input
                                value={editData?.lowerTolerance || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, lowerTolerance: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="下公差"
                              />
                            ) : (
                              <div className="px-2 py-1 bg-red-50 rounded-md border border-red-200 text-sm font-medium text-red-700">
                                {row.lowerTolerance || '—'}
                              </div>
                            )}
                          </td>

                          {/* 基准列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 font-mono text-slate-700 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '80px', width: '80px' }}
                          >
                            {row.dimensionType === 'image_dimension' ? (
                              <span className="text-gray-400 font-bold text-lg">—</span>
                            ) : editingRow === row.id ? (
                              <Input
                                value={editData?.datum || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, datum: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="基准"
                              />
                            ) : (
                              <div className="px-2 py-1 bg-purple-50 rounded-md border border-purple-200 text-sm font-medium text-purple-700">
                                {row.datum || '—'}
                              </div>
                            )}
                          </td>

                          {/* 特性列 */}
                          <td
                            className="text-center p-1 border-r border-slate-200 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            {editingRow === row.id ? (
                              <Input
                                value={editData?.characteristic || ''}
                                onChange={e =>
                                  setEditData(prev =>
                                    prev ? { ...prev, characteristic: e.target.value } : null
                                  )
                                }
                                className="w-20 h-8 text-center text-xs border-blue-200 focus:border-blue-400"
                                placeholder="特性"
                              />
                            ) : (
                              <div className="flex justify-center">
                                {getCharacteristicBadge(row.characteristic)}
                              </div>
                            )}
                          </td>



                          {/* 图纸尺寸列 */}
                          <td
                            className="text-center border-r border-slate-200 bg-gradient-to-b from-white to-slate-50"
                            style={{
                              padding: '8px',
                              minHeight: '80px',
                              height: '80px',
                              verticalAlign: 'middle',
                              minWidth: '150px',
                              width: '150px',
                            }}
                          >
                            {(row.dimensionType === 'image_dimension' ||
                              row.dimensionType === 'image') &&
                            row.imageUrl ? (
                              <div className="flex justify-center">
                                <div
                                  className="flex justify-center items-center p-2"
                                  style={{ minHeight: '60px' }}
                                >
                                  <img
                                    src={row.imageUrl}
                                    alt="尺寸图片"
                                    className="object-contain cursor-pointer border border-gray-200 rounded hover:border-blue-400 transition-colors"
                                    style={{
                                      width: 'auto',
                                      height: 'auto',
                                      maxWidth: '100px',
                                      maxHeight: '50px',
                                      minWidth: '40px',
                                      minHeight: '30px',
                                    }}
                                    onClick={() =>
                                      setImagePreviewModal({
                                        isOpen: true,
                                        imageUrl: row.imageUrl,
                                        title: `尺寸图片 - ${row.characteristic || `编号${row.groupNo}`}`,
                                      })
                                    }
                                    onError={e => {
                                      console.error('图片加载失败:', row.imageUrl);
                                      e.currentTarget.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5LjUgMjYgMSAxNy41IDEgN0MxIDMuNSA0IDEgNyAxSDMzQzM2IDEgMzkgMy41IDM5IDdDMzkgMTcuNSAzMC41IDI2IDIwIDI2WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K';
                                    }}
                                  />
                                </div>
                              </div>
                            ) : row.dimensionType === 'image_dimension' ||
                              row.dimensionType === 'image' ? (
                              <div className="flex justify-center items-center">
                                <div className="w-12 h-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">无图片</span>
                                </div>
                              </div>
                            ) : (
                              <DimensionImageGenerator
                                dimensionType={
                                  editingRow === row.id
                                    ? editData?.dimensionType || row.dimensionType
                                    : row.dimensionType
                                }
                                nominalValue={
                                  editingRow === row.id
                                    ? editData?.nominalValue || row.nominalValue
                                    : row.nominalValue
                                }
                                toleranceValue={
                                  editingRow === row.id
                                    ? editData?.toleranceValue || row.toleranceValue
                                    : row.toleranceValue
                                }
                                upperTolerance={
                                  editingRow === row.id
                                    ? editData?.upperTolerance || row.upperTolerance
                                    : row.upperTolerance
                                }
                                lowerTolerance={
                                  editingRow === row.id
                                    ? editData?.lowerTolerance || row.lowerTolerance
                                    : row.lowerTolerance
                                }
                                datum={
                                  editingRow === row.id ? editData?.datum || row.datum : row.datum
                                }
                                onClick={() =>
                                  setPreviewModal({
                                    isOpen: true,
                                    row: editingRow === row.id ? editData || row : row,
                                  })
                                }
                                className="mx-auto"
                              />
                            )}
                          </td>

                          {/* 组合图片列 - 只在组的第一行显示 */}
                          {rowIndex === 0 && (
                            <td
                              rowSpan={group.rows.length}
                              className="text-center border-r border-slate-200 bg-gradient-to-b from-white to-slate-50"
                              style={{
                                padding: '8px',
                                minHeight: '80px',
                                verticalAlign: 'middle',
                                minWidth: '150px',
                                width: '150px',
                              }}
                            >
                              {group.rows.length > 1 ? (
                                groupCombinedImages[group.groupNumber] ? (
                                  <div className="flex justify-center items-center h-full">
                                    <img
                                      src={groupCombinedImages[group.groupNumber]}
                                      alt="组合图片"
                                      className="object-contain cursor-pointer border border-gray-200 rounded hover:border-blue-400 transition-colors"
                                      style={{
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: '130px',
                                        maxHeight: '60px',
                                        minWidth: '40px',
                                        minHeight: '30px',
                                      }}
                                      onClick={() =>
                                        setImagePreviewModal({
                                          isOpen: true,
                                          imageUrl: groupCombinedImages[group.groupNumber],
                                          title: `组合图片 - 编号${group.groupNumber}`,
                                        })
                                      }
                                    />
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateCombinedImageForGroup(group.groupNumber)}
                                    className="w-full h-full flex flex-col items-center justify-center"
                                  >
                                    <Grid className="h-4 w-4 mb-1 text-blue-600" />
                                    <span className="text-xs text-blue-600">生成组合图</span>
                                  </Button>
                                )
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">无组合</span>
                                </div>
                              )}
                            </td>
                          )}

                          {/* 操作列 */}
                          <td
                            className="text-center p-1 bg-gradient-to-b from-white to-slate-50"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            {editingRow === row.id ? (
                              <div className="flex gap-0.5 justify-center">
                                <Button
                                  size="sm"
                                  onClick={saveEdit}
                                  className="w-5 h-5 p-0 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-green-400 shadow-sm hover:shadow-md transition-all duration-200"
                                  disabled={loading}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  className="w-5 h-5 p-0 border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-0.5 justify-center">
                                {rowIndex === group.rows.length - 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addRowToGroup(group.groupNumber)}
                                    className="w-5 h-5 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-400 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                                    title={`在编号${group.groupNumber}组内添加行`}
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(row)}
                                  className="w-5 h-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                                >
                                  <Edit className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteRow(row.id)}
                                  className="w-5 h-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-400 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* 新增行显示在对应组内 */}
                      {isAddingRow && addingToGroup === group.groupNumber && (
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 h-5">
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '60px', width: '60px' }}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-sm mx-auto">
                              <Plus className="h-5 w-5" />
                            </div>
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '80px', width: '80px' }}
                          >
                            <Select
                              value={newRow.dimensionType}
                              onValueChange={value =>
                                setNewRow({ ...newRow, dimensionType: value })
                              }
                            >
                              <SelectTrigger className="w-20 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">普通尺寸</SelectItem>
                                <SelectItem value="diameter">直径 ⌀</SelectItem>
                                <SelectItem value="position">位置度 ⌖</SelectItem>
                                <SelectItem value="profile_surface">面轮廓 ⌓</SelectItem>
                                <SelectItem value="profile_line">线轮廓 ⌒</SelectItem>
                                <SelectItem value="flatness">平面度 ⏥</SelectItem>
                                <SelectItem value="coplanarity">共面度 ⏥⏥</SelectItem>
                                <SelectItem value="perpendicularity">垂直度 ⊥</SelectItem>
                                <SelectItem value="angularity">倾斜度 ∠</SelectItem>
                                <SelectItem value="concentricity">同心度 ◎</SelectItem>
                                <SelectItem value="radius">半径 R</SelectItem>
                                <SelectItem value="spherical_diameter">球直径 S⌀</SelectItem>
                                <SelectItem value="spherical_radius">球半径 SR</SelectItem>
                                <SelectItem value="straightness">直线度 ⏤</SelectItem>
                                <SelectItem value="roundness">圆度 ○</SelectItem>
                                <SelectItem value="cylindricity">圆柱度 ⌭</SelectItem>
                                <SelectItem value="parallelism">平行度 ∥</SelectItem>
                                <SelectItem value="symmetry">对称度 ⌯</SelectItem>
                                <SelectItem value="circular_runout">圆跳动 ↗</SelectItem>
                                <SelectItem value="total_runout">全跳动 ↗↗</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            <Input
                              value={newRow.toleranceValue}
                              onChange={e =>
                                setNewRow({ ...newRow, toleranceValue: e.target.value })
                              }
                              className="w-20 h-8 text-center text-xs"
                              placeholder="公差值"
                            />
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            <Input
                              value={newRow.nominalValue}
                              onChange={e => setNewRow({ ...newRow, nominalValue: e.target.value })}
                              className="w-20 h-8 text-center text-xs"
                              placeholder="名义值"
                            />
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '90px', width: '90px' }}
                          >
                            <Input
                              value={newRow.upperTolerance}
                              onChange={e =>
                                setNewRow({ ...newRow, upperTolerance: e.target.value })
                              }
                              className="w-20 h-8 text-center text-xs"
                              placeholder="上公差"
                            />
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '90px', width: '90px' }}
                          >
                            <Input
                              value={newRow.lowerTolerance}
                              onChange={e =>
                                setNewRow({ ...newRow, lowerTolerance: e.target.value })
                              }
                              className="w-20 h-8 text-center text-xs"
                              placeholder="下公差"
                            />
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '80px', width: '80px' }}
                          >
                            <Input
                              value={newRow.datum}
                              onChange={e => setNewRow({ ...newRow, datum: e.target.value })}
                              className="w-20 h-8 text-center text-xs"
                              placeholder="基准"
                            />
                          </td>
                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            <Input
                              value={newRow.characteristic}
                              onChange={e =>
                                setNewRow({ ...newRow, characteristic: e.target.value })
                              }
                              className="w-20 h-8 text-center text-xs"
                              placeholder="特性"
                            />
                          </td>

                          <td
                            className="text-center p-3 border-r border-blue-200"
                            style={{ minWidth: '150px', width: '150px' }}
                          >
                            <DimensionImageGenerator
                              dimensionType={newRow.dimensionType}
                              nominalValue={newRow.nominalValue}
                              toleranceValue={newRow.toleranceValue}
                              upperTolerance={newRow.upperTolerance}
                              lowerTolerance={newRow.lowerTolerance}
                              datum={newRow.datum}
                              onClick={() => setPreviewModal({ isOpen: true, row: newRow })}
                              className="mx-auto scale-75"
                            />
                          </td>
                          <td
                            className="text-center p-3"
                            style={{ minWidth: '100px', width: '100px' }}
                          >
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                onClick={saveNewRow}
                                className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 border border-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelNewRow}
                                className="w-8 h-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {/* 如果是新建组，在表格末尾显示新增行 */}
                  {isAddingRow &&
                    addingToGroup &&
                    !dimensionGroups.find(g => g.groupNumber === addingToGroup) && (
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 h-5">
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '60px', width: '60px' }}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm mx-auto">
                            {addingToGroup}
                          </div>
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '80px', width: '80px' }}
                        >
                          <Select
                            value={newRow.dimensionType}
                            onValueChange={value => setNewRow({ ...newRow, dimensionType: value })}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">普通</SelectItem>
                              <SelectItem value="diameter">孔径 ⌀</SelectItem>
                              <SelectItem value="position">位置度 ⌖</SelectItem>
                              <SelectItem value="profile_surface">面轮廓 ⌓</SelectItem>
                              <SelectItem value="profile_line">线轮廓 ⌒</SelectItem>
                              <SelectItem value="flatness">平面度 ⏥</SelectItem>
                              <SelectItem value="coplanarity">共面度 ⏥⏥</SelectItem>
                              <SelectItem value="perpendicularity">垂直度 ⊥</SelectItem>
                              <SelectItem value="angularity">倾斜度 ∠</SelectItem>
                              <SelectItem value="concentricity">同心度 ◎</SelectItem>
                              <SelectItem value="radius">半径 R</SelectItem>
                              <SelectItem value="spherical_diameter">球直径 S⌀</SelectItem>
                              <SelectItem value="spherical_radius">球半径 SR</SelectItem>
                              <SelectItem value="straightness">直线度 ⏤</SelectItem>
                              <SelectItem value="roundness">圆度 ○</SelectItem>
                              <SelectItem value="cylindricity">圆柱度 ⌭</SelectItem>
                              <SelectItem value="parallelism">平行度 ∥</SelectItem>
                              <SelectItem value="symmetry">对称度 ⌯</SelectItem>
                              <SelectItem value="circular_runout">圆跳动 ↗</SelectItem>
                              <SelectItem value="total_runout">全跳动 ↗↗</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '100px', width: '100px' }}
                        >
                          <Input
                            value={newRow.toleranceValue}
                            onChange={e => setNewRow({ ...newRow, toleranceValue: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="公差值"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '100px', width: '100px' }}
                        >
                          <Input
                            value={newRow.nominalValue}
                            onChange={e => setNewRow({ ...newRow, nominalValue: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="名义值"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '90px', width: '90px' }}
                        >
                          <Input
                            value={newRow.upperTolerance}
                            onChange={e => setNewRow({ ...newRow, upperTolerance: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="上公差"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '90px', width: '90px' }}
                        >
                          <Input
                            value={newRow.lowerTolerance}
                            onChange={e => setNewRow({ ...newRow, lowerTolerance: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="下公差"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '80px', width: '80px' }}
                        >
                          <Input
                            value={newRow.datum}
                            onChange={e => setNewRow({ ...newRow, datum: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="基准"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '100px', width: '100px' }}
                        >
                          <Input
                            value={newRow.characteristic}
                            onChange={e => setNewRow({ ...newRow, characteristic: e.target.value })}
                            className="w-20 h-8 text-center text-xs"
                            placeholder="特性"
                          />
                        </td>
                        <td
                          className="text-center p-3 border-r border-blue-200"
                          style={{ minWidth: '150px', width: '150px' }}
                        >
                          <DimensionImageGenerator
                            dimensionType={newRow.dimensionType}
                            nominalValue={newRow.nominalValue}
                            toleranceValue={newRow.toleranceValue}
                            upperTolerance={newRow.upperTolerance}
                            lowerTolerance={newRow.lowerTolerance}
                            datum={newRow.datum}
                            onClick={() => setPreviewModal({ isOpen: true, row: newRow })}
                            className="mx-auto scale-75"
                          />
                        </td>
                        <td
                          className="text-center p-3"
                          style={{ minWidth: '100px', width: '100px' }}
                        >
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              onClick={saveNewRow}
                              className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 border border-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelNewRow}
                              className="w-8 h-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 尺寸绘制模态框 */}
      {dimensionDrawingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">尺寸绘制</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDimensionDrawingModal({ isOpen: false })}
              >
                关闭
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：配置区域 */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>尺寸数据</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {drawingDimensions.map((dimension) => (
                      <div
                        key={dimension.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white mb-4"
                      >
                        <h4 className="font-semibold mb-2">尺寸 {dimension.id}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`draw-type-${dimension.id}`}>尺寸类型</Label>
                            <Select
                              value={dimension.dimensionType}
                              onValueChange={(value) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, dimensionType: value } : d
                                  )
                                )
                              }
                            >
                              <SelectTrigger id={`draw-type-${dimension.id}`}>
                                <SelectValue placeholder="选择尺寸类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">普通尺寸</SelectItem>
                                <SelectItem value="diameter">孔径</SelectItem>
                                <SelectItem value="position">位置度</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`draw-nominal-${dimension.id}`}>名义值</Label>
                            <Input
                              id={`draw-nominal-${dimension.id}`}
                              value={dimension.nominalValue}
                              onChange={(e) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, nominalValue: e.target.value } : d
                                  )
                                )
                              }
                              placeholder="输入名义值"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`draw-tolerance-${dimension.id}`}>公差值</Label>
                            <Input
                              id={`draw-tolerance-${dimension.id}`}
                              value={dimension.toleranceValue}
                              onChange={(e) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, toleranceValue: e.target.value } : d
                                  )
                                )
                              }
                              placeholder="输入公差值"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`draw-datum-${dimension.id}`}>基准</Label>
                            <Input
                              id={`draw-datum-${dimension.id}`}
                              value={dimension.datum}
                              onChange={(e) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, datum: e.target.value } : d
                                  )
                                )
                              }
                              placeholder="输入基准"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`draw-upper-${dimension.id}`}>上公差</Label>
                            <Input
                              id={`draw-upper-${dimension.id}`}
                              value={dimension.upperTolerance}
                              onChange={(e) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, upperTolerance: e.target.value } : d
                                  )
                                )
                              }
                              placeholder="输入上公差"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`draw-lower-${dimension.id}`}>下公差</Label>
                            <Input
                              id={`draw-lower-${dimension.id}`}
                              value={dimension.lowerTolerance}
                              onChange={(e) =>
                                setDrawingDimensions(
                                  drawingDimensions.map((d) =>
                                    d.id === dimension.id ? { ...d, lowerTolerance: e.target.value } : d
                                  )
                                )
                              }
                              placeholder="输入下公差"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：绘制区域 */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>绘制画布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DimensionDrawingCanvas
                      dimensions={drawingDimensions.map(d => ({
                        id: d.id,
                        type: d.dimensionType,
                        nominalValue: d.nominalValue,
                        toleranceValue: d.toleranceValue,
                        upperTolerance: d.upperTolerance,
                        lowerTolerance: d.lowerTolerance,
                        datum: d.datum
                      }))}
                      config={drawingConfig}
                      onDrawingComplete={setDrawingImageData}
                    />
                  </CardContent>
                </Card>

                {drawingImageData && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>绘制预览</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <img
                          src={drawingImageData}
                          alt="尺寸绘制结果"
                          className="border border-gray-200 rounded shadow-sm"
                        />
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `尺寸绘制_${new Date().getTime()}.png`;
                            link.href = drawingImageData;
                            link.click();
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          导出图片
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 插入尺寸模态框 */}
      {insertModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">插入尺寸</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                插入位置（编号）
              </label>
              <input
                type="number"
                min="1"
                value={insertModal.insertPosition}
                onChange={e =>
                  setInsertModal(prev => ({
                    ...prev,
                    insertPosition: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入要插入的位置编号"
              />
              <p className="text-sm text-gray-500 mt-1">
                在编号 {insertModal.insertPosition} 前插入新尺寸，原编号{' '}
                {insertModal.insertPosition} 及后续编号将自动顺延
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeInsertModal} className="px-4 py-2">
                取消
              </Button>
              <Button
                onClick={handleInsertDimension}
                className="px-4 py-2 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? '插入中...' : '确认插入'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 添加图片尺寸模态框 */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              添加图片尺寸
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                插入位置（编号）
              </label>
              <input
                type="number"
                min="1"
                value={imageModal.insertPosition}
                onChange={e =>
                  setImageModal(prev => ({
                    ...prev,
                    insertPosition: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="输入要插入的位置编号"
              />
              <p className="text-sm text-gray-500 mt-1">
                在编号 {imageModal.insertPosition} 前插入图片尺寸
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择图片文件</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                支持 JPG、PNG、GIF 等图片格式，文件大小不超过5MB
              </p>
            </div>

            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">图片预览</label>
                <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="max-w-full max-h-40 object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">特殊特性</label>
              <input
                type="text"
                value={imageCharacteristic}
                onChange={e => setImageCharacteristic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="输入特殊特性（如：IMG01、SPEC01等）"
              />
              <p className="text-sm text-gray-500 mt-1">用于标识这个图片尺寸的特殊特性</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeImageModal} className="px-4 py-2">
                取消
              </Button>
              <Button
                onClick={handleAddImageDimension}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700"
                disabled={loading || !imageFile || !imageCharacteristic.trim()}
              >
                {loading ? '添加中...' : '确认添加'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览模态框 */}
      {imagePreviewModal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImagePreviewModal({ isOpen: false, imageUrl: '', title: '' })}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{imagePreviewModal.title}</h3>
              <button
                onClick={() => setImagePreviewModal({ isOpen: false, imageUrl: '', title: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* 图片内容 */}
            <div className="p-4 flex justify-center items-center bg-gray-100">
              <img
                src={imagePreviewModal.imageUrl}
                alt={imagePreviewModal.title}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                onError={e => {
                  console.error('预览图片加载失败:', imagePreviewModal.imageUrl);
                }}
              />
            </div>

            {/* 底部操作栏 */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-600">点击图片外区域或按ESC键关闭预览</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(imagePreviewModal.imageUrl, '_blank')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  在新窗口打开
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImagePreviewModal({ isOpen: false, imageUrl: '', title: '' })}
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {/* 图片拼接模态框 */}
      {showImageCombiner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Grid className="h-6 w-6 text-indigo-600" />
                尺寸图片拼接
              </h3>
              <button
                onClick={() => setShowImageCombiner(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <DimensionImageCombiner
                projectId={selectedProject}
                partId={partNumber}
                dimensions={dimensionData
                  .filter(dim => selectedDimensions.includes(dim.id))
                  .map(dim => ({
                    id: dim.id,
                    groupNo: dim.groupNo,
                    dimensionType: dim.dimensionType,
                    nominalValue: dim.nominalValue,
                    toleranceValue: dim.toleranceValue,
                    upperTolerance: dim.upperTolerance,
                    lowerTolerance: dim.lowerTolerance,
                    datum: dim.datum,
                    characteristic: dim.characteristic,
                    notes: dim.notes
                  }))}
                onSaveSuccess={(combinedImageUrl) => {
                  alert('组合图片保存成功！');
                  setShowImageCombiner(false);
                  setSelectedDimensions([]);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {previewModal.row && (
        <DimensionPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false })}
          dimensionType={previewModal.row.dimensionType}
          nominalValue={previewModal.row.nominalValue}
          toleranceValue={previewModal.row.toleranceValue}
          upperTolerance={previewModal.row.upperTolerance}
          lowerTolerance={previewModal.row.lowerTolerance}
          datum={previewModal.row.datum}
        />
      )}

      {/* 图片尺寸识别模态框 */}
      {imageRecognizerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DimensionImageRecognizer
              onDimensionsRecognized={handleDimensionsRecognized}
              onCancel={() => setImageRecognizerModal(false)}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
