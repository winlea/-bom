import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// 类型定义
type ProjectOption = { id: string; name: string };

type ImportLog = {
  id: number;
  project_id?: number | null;
  filename?: string | null;
  created_count?: number;
  errors_count?: number;
  created_at?: string;
  status?: string;
  errors_preview?: any[];
};

// 辅助函数
function parseCsvText(text: string) {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === '') idx++;
  if (idx >= lines.length) return { headers: [], rows: [] };
  const first = lines[idx];
  const hdrs = first.split(',').map(h => h.trim());
  const rows = lines.slice(idx + 1, idx + 6).map(ln => ln.split(',').map(c => c.trim()));
  return { headers: hdrs, rows };
}

export default function ImportModal({
  projectId,
  open: controlledOpen,
  onOpenChange,
  onImported,
}: {
  projectId?: string | number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onImported?: () => void;
}) {
  // 基本状态
  const [open, setOpen] = useState<boolean>(!!controlledOpen);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    projectId ? String(projectId) : undefined
  );
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importLog, setImportLog] = useState<ImportLog | null>(null);
  const [activeTab, setActiveTab] = useState('import');

  // 同步控制状态
  useEffect(() => {
    if (typeof controlledOpen === 'boolean') setOpen(controlledOpen);
  }, [controlledOpen]);

  useEffect(() => {
    if (projectId) setSelectedProject(String(projectId));
  }, [projectId]);

  // 加载项目列表
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : data && Array.isArray(data.items)
            ? data.items
            : [];
        const opts = list.map((p: any) => ({ id: String(p.id), name: p.name || `项目 ${p.id}` }));
        setProjects(opts);
        if (!selectedProject && opts.length > 0) setSelectedProject(opts[0].id);
      } catch (e) {
        setProjects([]);
      }
    }
    loadProjects();
  }, [selectedProject]);

  // 后端字段列表
  const backendFields = useMemo(
    () => [
      'part_number',
      'part_name',
      'image_url',
      'image_base64',
      'original_material',
      'final_material_cn',
      'net_weight_kg',
      'sequence',
      'drawing_2d',
      'drawing_3d',
    ],
    []
  );

  // 处理文件选择
  async function handleFileChange(f?: File) {
    setResultMessage(null);
    setError(null);
    setFile(f || null);
    setHeaders([]);
    setPreviewRows([]);
    setMapping({});
    if (!f) return;
    const name = f.name.toLowerCase();
    if (name.endsWith('.csv')) {
      try {
        const text = await f.text();
        const { headers, rows } = parseCsvText(text);
        setHeaders(headers);
        setPreviewRows(rows);
        const defaultMap: Record<string, string> = {};
        headers.forEach(h => {
          const key = h.toLowerCase();
          if (key.includes('part') && key.includes('number')) defaultMap[h] = 'part_number';
          else if (key.includes('part') && key.includes('name')) defaultMap[h] = 'part_name';
          else if (key.includes('image')) defaultMap[h] = 'image_url';
          else if (key.includes('material')) defaultMap[h] = 'original_material';
          else if (key.includes('weight')) defaultMap[h] = 'net_weight_kg';
        });
        setMapping(defaultMap);
      } catch (e) {
        setError('解析 CSV 失败');
      }
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      setError('XLSX 文件会直接上传到后端处理；客户端仅支持 CSV 预览');
    } else {
      setError('仅支持 CSV / XLSX 文件');
    }
  }

  // 获取导入日志
  async function fetchImportLog(id: number) {
    try {
      const response = await fetch(`/api/imports/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  }

  // 刷新导入日志
  async function handleRefreshImportLog() {
    if (!importLog || !importLog.id) return;
    setLoading(true);
    try {
      const log = await fetchImportLog(importLog.id);
      if (log) setImportLog(log);
    } finally {
      setLoading(false);
    }
  }

  // 重新处理导入
  async function handleReprocessImportLog() {
    if (!importLog || !importLog.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/imports/${importLog.id}/process`, { method: 'POST' });
      if (response.ok) {
        const refreshed = await fetchImportLog(importLog.id);
        if (refreshed) setImportLog(refreshed);
        if (refreshed && (refreshed.created_count || 0) > 0) {
          try {
            onImported && onImported();
          } catch {}
          setOpen(false);
          window.location.href = `/parts?project_id=${refreshed.project_id ?? selectedProject}`;
        }
      } else {
        setError(`重新处理失败：HTTP ${response.status}`);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // 提交导入
  async function handleSubmit() {
    setError(null);
    setResultMessage(null);
    setImportLog(null);

    if (!file) {
      setError('请选择要导入的文件');
      return;
    }

    let projectIdToUse = selectedProject;

    // 如果选择创建新项目
    if (createNewProject) {
      if (!newProjectName.trim()) {
        setError('请输入新项目名称');
        return;
      }

      setLoading(true);
      try {
        // 创建新项目
        console.log('开始创建项目:', {
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || undefined
        });
        
        // 使用相对路径，通过vite代理访问
        const createProjectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProjectName.trim(),
            description: newProjectDesc.trim() || undefined,
          }),
        });

        console.log('创建项目响应状态:', createProjectResponse.status);
        
        if (!createProjectResponse.ok) {
          try {
            // 读取响应体一次
            const responseText = await createProjectResponse.text();
            console.log('创建项目错误响应:', responseText);
            
            // 尝试解析为JSON
            try {
              const errorData = JSON.parse(responseText);
              console.log('创建项目错误数据:', errorData);
              const errorMessage = errorData?.message || errorData?.error || '创建新项目失败';
              const errorDetails = errorData?.details || errorData?.errors;
              const errorText = errorDetails ? `${errorMessage}: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}` : errorMessage;
              console.log('创建项目错误:', errorText);
              setError(errorText);
            } catch (parseErr) {
              // 如果不是JSON，直接使用文本
              setError(`创建新项目失败: ${responseText}`);
            }
          } catch (err) {
            setError(`创建新项目失败: ${err.message || String(err)}`);
          }
          setLoading(false);
          return;
        }

        const projectData = await createProjectResponse.json();
        console.log('创建项目成功响应:', projectData);
        if (!projectData || (!projectData.id && !projectData.project_id)) {
          setError('创建新项目失败：无法获取项目ID');
          setLoading(false);
          return;
        }

        projectIdToUse = String(projectData.id || projectData.project_id);
        console.log('获取到项目ID:', projectIdToUse);
      } catch (e: any) {
        console.log('创建项目异常:', e);
        setError(`创建新项目失败: ${e.message || String(e)}`);
        setLoading(false);
        return;
      }
    } else {
      // 使用现有项目
      if (!selectedProject) {
        setError('请选择目标项目');
        return;
      }

      if (!/^\d+$/.test(String(selectedProject))) {
        setError('目标项目 id 格式不正确');
        return;
      }
    }

    if (!projectIdToUse) {
      setError('无法确定目标项目');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mapping', JSON.stringify(mapping || {}));

      const response = await fetch(`/api/projects/${projectIdToUse}/import`, {
        method: 'POST',
        body: fd,
      });

      if (response.ok) {
        const data = await response.json();
        const importLogId =
          data && (data.import_log_id || data.id) ? data.import_log_id || data.id : null;
        const createdCount =
          data && typeof data.created_count === 'number'
            ? data.created_count
            : data && data.result && typeof data.result.created_count === 'number'
              ? data.result.created_count
              : 0;

        if (createdCount > 0) {
          setResultMessage(`导入完成：新增 ${createdCount} 条记录`);
          try {
            onImported && onImported();
          } catch {}
          setTimeout(() => {
            setOpen(false);
            window.location.href = `/parts?project_id=${projectIdToUse}`;
          }, 300);
          return;
        }

        if (importLogId) {
          const ilid = Number(importLogId);
          const initial = await fetchImportLog(ilid);
          if (initial) setImportLog(initial);

          // 自动触发处理
          try {
            await fetch(`/api/imports/${ilid}/process`, { method: 'POST' });
            const refreshed = await fetchImportLog(ilid);
            if (refreshed) {
              setImportLog(refreshed);
              if ((refreshed.created_count || 0) > 0) {
                try {
                  onImported && onImported();
                } catch {}
                setOpen(false);
                window.location.href = `/parts?project_id=${projectIdToUse}`;
                return;
              }
            }
          } catch (e) {
            // 静默失败
          }

          setResultMessage(`导入任务已提交，后台处理中（任务 ${importLogId}）`);
        } else {
          setResultMessage('导入已提交，后台可能仍在处理');
        }
      } else if (!response.ok) {
          try {
            // 读取响应体一次
            const responseText = await response.text();
            
            // 尝试解析为JSON
            try {
              const errorData = JSON.parse(responseText);
              const errorMessage = errorData?.message || errorData?.error || `导入失败：HTTP ${response.status}`;
              const errorDetails = errorData?.details || errorData?.errors;
              setError(errorDetails ? `${errorMessage}: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}` : errorMessage);
            } catch {
              setError(`导入失败：HTTP ${response.status} ${responseText}`);
            }
          } catch (err) {
            setError(`导入失败：${err.message || String(err)}`);
          }
        }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // 处理模态框打开/关闭
  function handleOpenChange(v: boolean) {
    setOpen(v);
    try {
      onOpenChange && onOpenChange(v);
    } catch {}
    if (!v) {
      setFile(null);
      setHeaders([]);
      setPreviewRows([]);
      setMapping({});
      setResultMessage(null);
      setError(null);
      setImportLog(null);
      setCreateNewProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Upload className="mr-2 text-blue-600" size={20} /> 导入 BOM 数据
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-1 mb-4">
            <TabsTrigger value="import">导入设置</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="text-sm font-medium text-slate-700 mr-4">导入到：</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existing-project"
                      name="project-type"
                      checked={!createNewProject}
                      onChange={() => setCreateNewProject(false)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="existing-project" className="text-sm text-slate-700">
                      现有项目
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="new-project"
                      name="project-type"
                      checked={createNewProject}
                      onChange={() => setCreateNewProject(true)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="new-project" className="text-sm text-slate-700">
                      创建新项目
                    </label>
                  </div>
                </div>
              </div>

              {!createNewProject ? (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    选择现有项目
                  </label>
                  <Select onValueChange={v => setSelectedProject(v)} value={selectedProject}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      新项目名称
                    </label>
                    <Input
                      placeholder="输入项目名称"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      项目描述 (可选)
                    </label>
                    <Input
                      placeholder="输入项目描述"
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">上传文件</label>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={e => handleFileChange(e.target.files ? e.target.files[0] : undefined)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>导入错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resultMessage && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>导入状态</AlertTitle>
                <AlertDescription>{resultMessage}</AlertDescription>
              </Alert>
            )}

            {importLog && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center">
                      <FileText size={16} className="mr-2 text-blue-600" />
                      {importLog.filename || `导入任务 ${importLog.id}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      <Badge
                        variant="outline"
                        className="mr-2 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        ID: {importLog.id}
                      </Badge>
                      <Badge variant="outline" className="mr-2">
                        时间: {importLog.created_at || '-'}
                      </Badge>
                      <Badge variant="outline" className="mr-2">
                        状态: {importLog.status || '-'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center">
                        <CheckCircle2 size={14} className="text-green-600 mr-1" />
                        <span className="text-sm">
                          已创建:{' '}
                          <span className="font-medium">{importLog.created_count ?? 0}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle size={14} className="text-red-600 mr-1" />
                        <span className="text-sm">
                          错误: <span className="font-medium">{importLog.errors_count ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshImportLog}
                      className="flex items-center"
                    >
                      <RefreshCw size={14} className="mr-1" /> 检查状态
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReprocessImportLog}
                      className="flex items-center"
                    >
                      <Upload size={14} className="mr-1" /> 重新处理
                    </Button>
                  </div>
                </div>

                {importLog.errors_preview && importLog.errors_preview.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                    <div className="font-medium text-red-800 mb-1">错误预览（最多 10 条）</div>
                    <ul className="list-disc ml-5 text-xs text-red-700">
                      {importLog.errors_preview.slice(0, 10).map((err: any, i: number) => (
                        <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {headers.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4">
                <div className="text-sm font-medium flex items-center">
                  <Info size={16} className="mr-2 text-blue-600" /> 字段映射（自动匹配，可调整）
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {headers.map(h => (
                    <div key={h} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                      <div className="flex-1 text-sm font-medium">{h}</div>
                      <Select
                        value={mapping[h] || ''}
                        onValueChange={v => setMapping(m => ({ ...m, [h]: v }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="请选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">不导入</SelectItem>
                          {backendFields.map(bf => (
                            <SelectItem key={bf} value={bf}>
                              {bf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-2 flex items-center">
                  <FileText size={16} className="mr-2 text-blue-600" /> 数据预览（前 5 行）
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        {headers.map(h => (
                          <th key={h} className="py-2 px-3 text-left font-medium text-slate-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          {row.map((c, i) => (
                            <td key={i} className="py-2 px-3 border-t">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (!selectedProject && !createNewProject) || !file}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  上传中...
                </>
              ) : (
                '提交导入'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
