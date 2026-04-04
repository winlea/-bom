import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import Layout, { Breadcrumb } from '@/components/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
}

interface Part {
  id: string;
  part_name: string;
  part_number: string;
  drawing_2d: string;
}

interface DrawingChange {
  id?: number;
  project_id: string;
  part_id: string;
  part_name: string;
  part_number: string;
  drawing_number: string;
  engineering_change_level: string;
  drawing_change_version: string;
  cr_number: string;
  change_count: number;
  change_date: string;
}

export default function DrawingChangePage() {
  const navigate = useNavigate();
  const [drawingChange, setDrawingChange] = useState<DrawingChange>({
    project_id: '',
    part_id: '',
    part_name: '',
    part_number: '',
    drawing_number: '',
    engineering_change_level: '',
    drawing_change_version: '',
    cr_number: '',
    change_count: 1,
    change_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.items || []);
        } else {
          console.error('获取项目列表失败');
        }
      } catch (error) {
        console.error('获取项目列表错误:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // 根据项目获取零件列表
  useEffect(() => {
    if (drawingChange.project_id) {
      const fetchParts = async () => {
        setLoadingParts(true);
        try {
          const response = await fetch(`/api/parts?project_id=${drawingChange.project_id}`);
          if (response.ok) {
            const data = await response.json();
            setParts(data || []);
          } else {
            console.error('获取零件列表失败');
          }
        } catch (error) {
          console.error('获取零件列表错误:', error);
        } finally {
          setLoadingParts(false);
        }
      };
      fetchParts();
    } else {
      setParts([]);
    }
  }, [drawingChange.project_id]);

  // 选择零件时自动填充零件信息
  useEffect(() => {
    if (drawingChange.part_id) {
      const selectedPart = parts.find((p) => p.id === drawingChange.part_id);
      if (selectedPart) {
        setDrawingChange((prev) => ({
          ...prev,
          part_name: selectedPart.part_name,
          part_number: selectedPart.part_number,
          drawing_number: selectedPart.drawing_2d || '',
        }));
      }
    }
  }, [drawingChange.part_id, parts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 保存到后端API
      const response = await fetch('/api/drawing-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawingChange),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('保存图纸变更成功:', data);
        setSuccess('图纸变更保存成功');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.details || errorData?.error || '保存失败');
      }
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '图纸变更', to: '/drawing-change' },
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <FileText className="mr-2 text-blue-600" size={24} />
              图纸变更编辑
            </h1>
            <p className="text-slate-500 mt-1">编辑图纸变更信息</p>
          </div>

          <Button variant="outline" onClick={() => navigate('/')} className="flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            返回首页
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">错误</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">成功</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">图纸变更信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id" className="text-sm font-medium">
                  项目 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={drawingChange.project_id}
                  onValueChange={(value) => setDrawingChange({ ...drawingChange, project_id: value, part_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProjects ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="part_id" className="text-sm font-medium">
                  零件 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={drawingChange.part_id}
                  onValueChange={(value) => setDrawingChange({ ...drawingChange, part_id: value })}
                  disabled={!drawingChange.project_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={drawingChange.project_id ? '请选择零件' : '请先选择项目'} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingParts ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{part.part_name}</span>
                            <span className="text-xs text-gray-500">编号: {part.part_number}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="part_name" className="text-sm font-medium">
                  零件名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="part_name"
                  value={drawingChange.part_name}
                  onChange={(e) => setDrawingChange({ ...drawingChange, part_name: e.target.value })}
                  placeholder="请输入零件名称"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="part_number" className="text-sm font-medium">
                  零件号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="part_number"
                  value={drawingChange.part_number}
                  onChange={(e) => setDrawingChange({ ...drawingChange, part_number: e.target.value })}
                  placeholder="请输入零件号"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawing_number" className="text-sm font-medium">
                  图纸编号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="drawing_number"
                  value={drawingChange.drawing_number}
                  onChange={(e) => setDrawingChange({ ...drawingChange, drawing_number: e.target.value })}
                  placeholder="请输入图纸编号"
                  required
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineering_change_level" className="text-sm font-medium">
                  工程变更等级 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={drawingChange.engineering_change_level}
                  onValueChange={(value) => setDrawingChange({ ...drawingChange, engineering_change_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择工程变更等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level 1">Level 1</SelectItem>
                    <SelectItem value="Level 2">Level 2</SelectItem>
                    <SelectItem value="Level 3">Level 3</SelectItem>
                    <SelectItem value="Level 4">Level 4</SelectItem>
                    <SelectItem value="Level 5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawing_change_version" className="text-sm font-medium">
                  工程图纸变更版本 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="drawing_change_version"
                  value={drawingChange.drawing_change_version}
                  onChange={(e) => setDrawingChange({ ...drawingChange, drawing_change_version: e.target.value })}
                  placeholder="请输入变更版本"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cr_number" className="text-sm font-medium">
                  CR号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cr_number"
                  value={drawingChange.cr_number}
                  onChange={(e) => setDrawingChange({ ...drawingChange, cr_number: e.target.value })}
                  placeholder="请输入CR号"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="change_count" className="text-sm font-medium">
                  第几次变更 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="change_count"
                  type="number"
                  min="1"
                  value={drawingChange.change_count}
                  onChange={(e) => setDrawingChange({ ...drawingChange, change_count: parseInt(e.target.value) || 1 })}
                  placeholder="请输入变更次数"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="change_date" className="text-sm font-medium">
                  变更日期 <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="change_date">
                      {drawingChange.change_date || '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(drawingChange.change_date)}
                      onSelect={(date) => {
                        if (date) {
                          setDrawingChange({ ...drawingChange, change_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !drawingChange.project_id ||
                !drawingChange.part_id ||
                !drawingChange.part_name ||
                !drawingChange.part_number ||
                !drawingChange.drawing_number
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存变更
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
