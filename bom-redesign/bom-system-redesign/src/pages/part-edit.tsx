import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Part {
  id?: number;
  project_id: number;
  part_number: string;
  part_name: string;
  image_url?: string;
  original_material?: string;
  final_material_cn?: string;
  net_weight_kg?: number;
  sequence?: number;
  description?: string;
  notes?: string;
}

interface Project {
  id: number;
  name: string;
}

export default function PartEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectIdParam = searchParams.get('project_id');

  const [part, setPart] = useState<Part>({
    project_id: Number(projectIdParam) || 0,
    part_number: '',
    part_name: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const isNewPart = !id;

  // 加载项目列表
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          const projectsList = Array.isArray(data) ? data : data.items || [];
          setProjects(projectsList);
        }
      } catch (error) {
        console.error('加载项目列表失败:', error);
      }
    }

    fetchProjects();
  }, []);

  // 加载零件数据（如果是编辑模式）
  useEffect(() => {
    if (isNewPart) return;

    async function fetchPartDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/parts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPart(data);

          // 如果有图片，设置预览
          if (data.image_url) {
            setImagePreview(`/api/parts/${data.id}/image`);
          }
        } else {
          console.error('获取零件详情失败');
        }
      } catch (error) {
        console.error('加载零件详情时出错:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPartDetails();
  }, [id, isNewPart]);

  // 处理表单字段变化
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setPart(prev => ({ ...prev, [name]: value }));

    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  // 处理数字字段变化
  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : Number(value);
    setPart(prev => ({ ...prev, [name]: numValue }));

    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  // 处理项目选择变化
  function handleProjectChange(value: string) {
    setPart(prev => ({ ...prev, project_id: Number(value) }));

    // 清除项目ID错误
    if (errors.project_id) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.project_id;
        return newErrors;
      });
    }
  }

  // 处理图片上传
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // 移除图片
  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);

    // 如果是编辑模式，需要标记图片为已删除
    if (!isNewPart && part.image_url) {
      setPart(prev => ({ ...prev, image_url: undefined }));
    }
  }

  // 验证表单
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!part.project_id) {
      newErrors.project_id = '请选择项目';
    }

    if (!part.part_number.trim()) {
      newErrors.part_number = '请输入零件号';
    }

    if (!part.part_name.trim()) {
      newErrors.part_name = '请输入零件名称';
    }

    if (part.net_weight_kg !== undefined && part.net_weight_kg < 0) {
      newErrors.net_weight_kg = '重量不能为负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // 保存零件
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      // 准备表单数据
      const formData = new FormData();

      // 添加零件数据
      Object.entries(part).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // 添加图片（如果有）
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // 发送请求
      const url = isNewPart ? '/api/parts' : `/api/parts/${id}`;
      const method = isNewPart ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // 导航到零件详情页或零件列表
        if (isNewPart) {
          navigate(`/parts/${data.id}`);
        } else {
          navigate(`/parts/${id}`);
        }
      } else {
        const errorData = await response.json();
        console.error('保存零件失败:', errorData);

        // 显示错误信息
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ general: errorData.message || '保存失败，请重试' });
        }
      }
    } catch (error) {
      console.error('保存零件时出错:', error);
      setErrors({ general: '发生错误，请重试' });
    } finally {
      setIsSaving(false);
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

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: '零件列表', to: `/parts?project_id=${part.project_id}` },
            { label: isNewPart ? '新增零件' : `编辑: ${part.part_number}` },
          ]}
        />

        <div className="flex flex-col md:flex-row items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-slate-800">
              <Package className="mr-2 text-blue-600" size={24} />
              {isNewPart ? '新增零件' : `编辑零件: ${part.part_number}`}
            </h1>
            <p className="text-slate-500 mt-1">
              {isNewPart ? '创建新的零件记录' : '修改现有零件信息'}
            </p>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => {
                if (isNewPart) {
                  navigate(`/parts?project_id=${part.project_id}`);
                } else {
                  navigate(`/parts/${id}`);
                }
              }}
            >
              <ArrowLeft size={16} className="mr-1" /> 取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" /> 保存零件
                </>
              )}
            </Button>
          </div>
        </div>

        {errors.general && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 左侧图片上传 */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>零件图片</CardTitle>
                  <CardDescription>上传零件的图片或示意图</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {imagePreview ? (
                      <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-100 flex items-center justify-center mb-4">
                        <img
                          src={imagePreview}
                          alt="零件预览"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-md bg-slate-100 flex items-center justify-center mb-4">
                        <div className="text-center">
                          <ImageIcon size={48} className="text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">暂无图片</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col w-full gap-2">
                      <Label
                        htmlFor="image-upload"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-md text-center cursor-pointer flex items-center justify-center"
                      >
                        <Upload size={16} className="mr-1" /> 上传图片
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 size={16} className="mr-1" /> 移除图片
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧表单 */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>零件信息</CardTitle>
                  <CardDescription>填写零件的详细信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="basic">基本信息</TabsTrigger>
                      <TabsTrigger value="details">详细说明</TabsTrigger>
                      <TabsTrigger value="notes">备注</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="project_id"
                            className={errors.project_id ? 'text-red-500' : ''}
                          >
                            所属项目 <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={String(part.project_id) || ''}
                            onValueChange={handleProjectChange}
                            disabled={!isNewPart}
                          >
                            <SelectTrigger
                              id="project_id"
                              className={errors.project_id ? 'border-red-500' : ''}
                            >
                              <SelectValue placeholder="选择项目" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={String(project.id)}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.project_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="part_number"
                            className={errors.part_number ? 'text-red-500' : ''}
                          >
                            零件号 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="part_number"
                            name="part_number"
                            value={part.part_number}
                            onChange={handleChange}
                            className={errors.part_number ? 'border-red-500' : ''}
                          />
                          {errors.part_number && (
                            <p className="text-red-500 text-sm mt-1">{errors.part_number}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="part_name"
                          className={errors.part_name ? 'text-red-500' : ''}
                        >
                          零件名称 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="part_name"
                          name="part_name"
                          value={part.part_name}
                          onChange={handleChange}
                          className={errors.part_name ? 'border-red-500' : ''}
                        />
                        {errors.part_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.part_name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="original_material">原始材料</Label>
                          <Input
                            id="original_material"
                            name="original_material"
                            value={part.original_material || ''}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label htmlFor="final_material_cn">最终材料</Label>
                          <Input
                            id="final_material_cn"
                            name="final_material_cn"
                            value={part.final_material_cn || ''}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="net_weight_kg"
                            className={errors.net_weight_kg ? 'text-red-500' : ''}
                          >
                            净重(kg)
                          </Label>
                          <Input
                            id="net_weight_kg"
                            name="net_weight_kg"
                            type="number"
                            step="0.001"
                            value={part.net_weight_kg === undefined ? '' : part.net_weight_kg}
                            onChange={handleNumberChange}
                            className={errors.net_weight_kg ? 'border-red-500' : ''}
                          />
                          {errors.net_weight_kg && (
                            <p className="text-red-500 text-sm mt-1">{errors.net_weight_kg}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="sequence">序号</Label>
                          <Input
                            id="sequence"
                            name="sequence"
                            type="number"
                            value={part.sequence === undefined ? '' : part.sequence}
                            onChange={handleNumberChange}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                      <div>
                        <Label htmlFor="description">详细说明</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={part.description || ''}
                          onChange={handleChange}
                          placeholder="输入零件的详细说明..."
                          className="min-h-[200px]"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0">
                      <div>
                        <Label htmlFor="notes">备注</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={part.notes || ''}
                          onChange={handleChange}
                          placeholder="输入备注信息..."
                          className="min-h-[200px]"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <p className="text-sm text-slate-500">
                    <span className="text-red-500">*</span> 表示必填字段
                  </p>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存零件'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
