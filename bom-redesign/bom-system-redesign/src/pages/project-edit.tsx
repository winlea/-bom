import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';
import Layout, { Breadcrumb } from '@/components/layout';

interface Project {
  id: number;
  name: string;
  description?: string;
  supplier_name?: string;
  address?: string;
  supplier_code?: string;
  customer_name?: string;
  customer_purchase?: string;
  quality_engineer?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  signaturePreview?: string;
  signatureFile?: File;
}

export default function ProjectEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project>({
    id: id ? parseInt(id) : 0,
    name: '',
    description: '',
    supplier_name: '',
    address: '',
    supplier_code: '',
    customer_name: '',
    customer_purchase: '',
    quality_engineer: '',
    phone: '',
    email: '',
    signaturePreview: '',
    signatureFile: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProject((prev) => ({
          ...prev,
          signaturePreview: event.target?.result as string,
          signatureFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  async function fetchProject() {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.details || errorData?.error || '获取项目详情失败');
      }
      const data = await response.json();
      const projectData = data.data || data;
      setProject({
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        supplier_name: projectData.supplier_name,
        address: projectData.address,
        supplier_code: projectData.supplier_code,
        customer_name: projectData.customer_name,
        customer_purchase: projectData.customer_purchase,
        quality_engineer: projectData.quality_engineer,
        phone: projectData.phone,
        email: projectData.email,
        created_at: projectData.created_at,
        signaturePreview: '',
        signatureFile: undefined,
      });
    } catch (e: any) {
      setError(e?.message || '获取项目详情失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = id ? `/api/projects/${id}` : '/api/projects';
      const method = id ? 'PUT' : 'POST';

      // 使用FormData来提交表单，支持文件上传
      const formData = new FormData();
      formData.append('name', project.name.trim());
      if (project.description) formData.append('description', project.description.trim());
      if (project.supplier_name) formData.append('supplier_name', project.supplier_name.trim());
      if (project.address) formData.append('address', project.address.trim());
      if (project.supplier_code) formData.append('supplier_code', project.supplier_code.trim());
      if (project.customer_name) formData.append('customer_name', project.customer_name.trim());
      if (project.customer_purchase) formData.append('customer_purchase', project.customer_purchase.trim());
      if (project.quality_engineer) formData.append('quality_engineer', project.quality_engineer.trim());
      if (project.phone) formData.append('phone', project.phone.trim());
      if (project.email) formData.append('email', project.email.trim());
      if (project.signatureFile) formData.append('quality_engineer_signature', project.signatureFile);

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.details || errorData?.error || '保存失败');
      }

      setSuccess(id ? '项目更新成功' : '项目创建成功');
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-slate-600">加载中...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: id ? '编辑项目' : '创建项目' },
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <Save className="mr-2 text-blue-600" size={24} />
              {id ? '编辑项目' : '创建项目'}
            </h1>
            <p className="text-slate-500 mt-1">{id ? '编辑项目信息' : '创建新项目'}</p>
          </div>

          <Button variant="outline" onClick={() => navigate('/projects')} className="flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            返回列表
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
          {/* 基本信息 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  项目名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  placeholder="请输入项目名称"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  项目描述
                </Label>
                <Textarea
                  id="description"
                  value={project.description || ''}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  placeholder="请输入项目描述"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 项目信息 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">项目信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name" className="text-sm font-medium">
                  供方名称
                </Label>
                <Input
                  id="supplier_name"
                  value={project.supplier_name || ''}
                  onChange={(e) => setProject({ ...project, supplier_name: e.target.value })}
                  placeholder="请输入供方名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  街道地址
                </Label>
                <Input
                  id="address"
                  value={project.address || ''}
                  onChange={(e) => setProject({ ...project, address: e.target.value })}
                  placeholder="请输入街道地址"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_code" className="text-sm font-medium">
                  供方代码
                </Label>
                <Input
                  id="supplier_code"
                  value={project.supplier_code || ''}
                  onChange={(e) => setProject({ ...project, supplier_code: e.target.value })}
                  placeholder="请输入供方代码"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-sm font-medium">
                  客户名称
                </Label>
                <Input
                  id="customer_name"
                  value={project.customer_name || ''}
                  onChange={(e) => setProject({ ...project, customer_name: e.target.value })}
                  placeholder="请输入客户名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_purchase" className="text-sm font-medium">
                  客户采购
                </Label>
                <Input
                  id="customer_purchase"
                  value={project.customer_purchase || ''}
                  onChange={(e) => setProject({ ...project, customer_purchase: e.target.value })}
                  placeholder="请输入客户采购"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality_engineer" className="text-sm font-medium">
                  质量工程师
                </Label>
                <Input
                  id="quality_engineer"
                  value={project.quality_engineer || ''}
                  onChange={(e) => setProject({ ...project, quality_engineer: e.target.value })}
                  placeholder="请输入质量工程师姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  电话
                </Label>
                <Input
                  id="phone"
                  value={project.phone || ''}
                  onChange={(e) => setProject({ ...project, phone: e.target.value })}
                  placeholder="请输入联系电话"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={project.email || ''}
                  onChange={(e) => setProject({ ...project, email: e.target.value })}
                  placeholder="请输入电子邮箱"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="signature" className="text-sm font-medium">
                  质量工程师签名图片
                </Label>
                <Input id="signature" type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e)} />
                {project.signaturePreview && (
                  <div className="mt-2">
                    <img src={project.signaturePreview} alt="签名预览" className="max-h-32 border rounded" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/projects')}>
              取消
            </Button>
            <Button type="submit" disabled={saving || !project.name?.trim()} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                '保存项目'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
