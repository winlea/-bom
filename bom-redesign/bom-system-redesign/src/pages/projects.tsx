import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Layers,
  AlertCircle,
  Upload,
  FileUp,
  FileBarChart,
  Loader2,
} from 'lucide-react';
import ImportModal from '@/components/import-modal';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: number;
  name: string;
  description?: string;
  parts_count?: number;
  created_at?: string;
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const r = await fetch('/api/projects');
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      else if (j && j.data && Array.isArray(j.data.items)) items = j.data.items;
      else items = [];

      // 获取每个项目的零件数量（去重）
      const projectsWithPartsCount = await Promise.all(
        items.map(async (project) => {
          try {
            const partsResponse = await fetch(`/api/parts?project_id=${project.id}`);
            const partsData = await partsResponse.json().catch(() => null);
            let parts = [];

            if (Array.isArray(partsData)) {
              parts = partsData;
            } else if (partsData && Array.isArray(partsData.items)) {
              parts = partsData.items;
            } else if (partsData && Array.isArray(partsData.data)) {
              parts = partsData.data;
            } else if (partsData && partsData.data && Array.isArray(partsData.data.items)) {
              parts = partsData.data.items;
            }

            // 去重计算零件数量（根据part_number字段）
            const uniquePartNumbers = new Set<string>();
            (parts as any[]).forEach((part: any) => {
              if (part?.part_number) {
                uniquePartNumbers.add(String(part.part_number));
              }
            });

            return {
              ...project,
              parts_count: uniquePartNumbers.size,
            };
          } catch (e) {
            console.error(`获取项目 ${project.id} 的零件数量失败:`, e);
            return project;
          }
        })
      );

      console.log('获取到的项目数据:', projectsWithPartsCount);
      setProjects(projectsWithPartsCount);
    } catch (e) {
      console.error(e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || undefined,
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j && (j.id || j.project_id)) {
        const newId = j.id || j.project_id;
        setCreateDialogOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        // 刷新项目列表
        fetchProjects();
        // 跳转到零件列表页面
        navigate(`/parts?project_id=${newId}`);
      } else {
        alert('创建失败：' + (j?.details || j?.error || r.status));
      }
    } catch (e: any) {
      alert('创建失败：' + (e?.message || e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!projectToDelete) return;

    try {
      const r = await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        alert('删除失败：' + (j?.details || j?.error || r.status));
      }
    } catch (e: any) {
      alert('删除失败：' + (e?.message || e));
    }
  }

  const filtered = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout projectCount={projects.length}>
      <div className="p-6 max-w-7xl mx-auto w-full">
        <Breadcrumb items={[{ label: '首页', to: '/' }, { label: '项目列表' }]} />

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">项目管理</h1>
            <p className="text-sm text-slate-500 mt-1">管理您的所有BOM项目，点击项目卡片查看详情</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="搜索项目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-[200px] md:w-[300px]"
              />
            </div>
            <Button onClick={() => navigate('/project-edit')} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={18} className="mr-1" /> 新建项目
            </Button>
            <Button
              onClick={() => setImportModalOpen(true)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Upload size={18} className="mr-1" /> BOM导入
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-slate-600">加载中...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">暂无项目</h3>
            <p className="text-slate-500 mb-6">点击"新建项目"按钮创建您的第一个BOM项目</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={18} className="mr-1" /> 新建项目
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <Card 
              key={project.id} 
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:border-blue-300 group"
              onClick={() => navigate(`/parts?project_id=${project.id}`)}
            >
              <div className="h-3 bg-blue-600 group-hover:bg-blue-500 transition-colors" />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {project.name || `项目 ${project.id}`}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description || '无描述'}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ID: {project.id}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center text-sm text-slate-500">
                  <Layers size={16} className="mr-1" />
                  <span>{project.parts_count !== undefined ? project.parts_count : '加载中...'} 个零件</span>
                  {project.created_at && (
                    <>
                      <span className="mx-2">•</span>
                      <span>创建于 {new Date(project.created_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter className="bg-slate-50 border-t px-6 py-3">
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 pointer-events-none"
                  >
                    <Layers size={16} className="mr-1" />
                    查看零件
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 过程能力报告逻辑...
                      }}
                    >
                      <FileBarChart size={16} className="mr-1" />
                      过程能力报告
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project-edit/${project.id}`);
                      }}
                    >
                      <Edit size={16} className="mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} className="mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* 创建项目对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">项目名称</label>
              <Input
                placeholder="输入项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">项目描述 (可选)</label>
              <Input
                placeholder="输入项目描述"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newProjectName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? '创建中...' : '创建项目'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2" size={20} /> 确认删除项目
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-slate-700">
              您确定要删除项目 <span className="font-semibold">{projectToDelete?.name}</span> 吗？
            </p>
            <p className="text-sm text-slate-500 mt-2">此操作将删除该项目及其关联的所有零件数据，且无法恢复。</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BOM导入模态框 */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        projectId={undefined}
        onImported={fetchProjects}
      />
    </Layout>
  );
}
