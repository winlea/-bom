import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  TreePine,
  Package,
  Wrench,
  BarChart3,
} from 'lucide-react';

// 数据接口定义
interface Project {
  id: number;
  name: string;
}

interface PartResult {
  part_id: number;
  part_number: string;
  part_name: string;
  assembly_level: number;
  regular_dimensions_total: number;
  regular_dimensions_qualified: number;
  regular_qualification_rate: number;
  special_dimensions_total: number;
  special_dimensions_qualified: number;
  special_qualification_rate: number;
  total_dimensions: number;
  total_qualified: number;
  overall_qualification_rate: number;
  weight_in_parent: number;
}

interface AssemblyResult {
  part_id: number;
  part_number: string;
  part_name: string;
  assembly_level: number;
  total_dimensions: number;
  total_qualified: number;
  overall_qualification_rate: number;
  sub_parts_count: number;
  sub_parts: Array<{
    part_id: number;
    part_number: string;
    part_name: string;
    qualification_rate: number;
  }>;
}

interface QualificationSummary {
  project_id: number;
  project_name: string;
  summary: {
    total_parts: number;
    total_dimensions: number;
    total_qualified_dimensions: number;
    project_qualification_rate: number;
    data_integrity_check: boolean;
    validation_errors: string[];
    validation_warnings: string[];
  };
  part_level_results: PartResult[];
  assembly_level_results: AssemblyResult[];
}

interface HierarchicalNode {
  id: number;
  name: string;
  part_number?: string;
  type: 'project' | 'assembly' | 'part';
  qualification_rate: number;
  total_dimensions: number;
  qualified_dimensions: number;
  regular_rate?: number;
  special_rate?: number;
  children: HierarchicalNode[];
}

export default function AdvancedQualificationRatePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [qualificationData, setQualificationData] = useState<QualificationSummary | null>(null);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'hierarchical'>('table');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setProjects(data.items);
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
      setError('获取项目列表失败');
    }
  };

  // 获取高级合格率数据
  const fetchAdvancedQualificationData = async (projectId: string) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // 获取汇总数据
      const summaryResponse = await fetch(
        `http://localhost:5000/api/advanced-qualification/project/${projectId}/summary`
      );
      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        setQualificationData(summaryData.data);
      }

      // 获取分层数据
      const hierarchicalResponse = await fetch(
        `http://localhost:5000/api/advanced-qualification/project/${projectId}/hierarchical`
      );
      const hierarchicalData = await hierarchicalResponse.json();

      if (hierarchicalData.success) {
        setHierarchicalData(hierarchicalData.data);
      }
    } catch (err) {
      console.error('获取高级合格率数据失败:', err);
      setError('获取高级合格率数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 项目选择变化
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    fetchAdvancedQualificationData(value);
  };

  // 获取合格率状态
  const getQualificationStatus = (rate: number) => {
    if (rate >= 95) return { label: '优秀', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (rate >= 85) return { label: '良好', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
    if (rate >= 70) return { label: '合格', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: '不合格', color: 'bg-red-100 text-red-800', icon: XCircle };
  };

  // 切换节点展开状态
  const toggleNodeExpansion = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 渲染分层树形结构
  const renderHierarchicalNode = (node: HierarchicalNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const status = getQualificationStatus(node.qualification_rate);
    const StatusIcon = status.icon;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'project':
          return <TreePine className="h-4 w-4 text-blue-600" />;
        case 'assembly':
          return <Package className="h-4 w-4 text-purple-600" />;
        case 'part':
          return <Wrench className="h-4 w-4 text-green-600" />;
        default:
          return null;
      }
    };

    return (
      <div key={node.id} className="border-l-2 border-gray-200">
        <div
          className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${level > 0 ? 'ml-6' : ''}`}
          onClick={() => hasChildren && toggleNodeExpansion(node.id)}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <div className="mr-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            )}
            {!hasChildren && <div className="w-6" />}

            <div className="mr-3">{getNodeIcon()}</div>

            <div className="flex-1">
              <div className="font-medium">
                {node.part_number && <span className="text-sm text-gray-500 mr-2">[{node.part_number}]</span>}
                {node.name}
              </div>
              <div className="text-sm text-gray-500">
                {node.total_dimensions} 个尺寸 | {node.qualified_dimensions} 个合格
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Progress value={node.qualification_rate} className="w-20" />
              <span className="text-sm font-medium w-12">{node.qualification_rate.toFixed(1)}%</span>
              <StatusIcon
                className={`h-4 w-4 ${
                  status.color.includes('green')
                    ? 'text-green-600'
                    : status.color.includes('blue')
                      ? 'text-blue-600'
                      : status.color.includes('yellow')
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">{node.children.map((child) => renderHierarchicalNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  // 导出报告
  const handleExportReport = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/advanced-qualification/project/${selectedProject}/export`
      );
      const data = await response.json();

      if (data.success) {
        // 创建CSV内容
        const csvContent = [
          [
            '序号',
            '零件号',
            '零件名称',
            '常规尺寸总数',
            '常规尺寸合格数',
            '常规尺寸合格率(%)',
            '特殊特性总数',
            '特殊特性合格数',
            '特殊特性合格率(%)',
            '总合格率(%)',
            '状态',
          ],
          ...data.export_data.detailed_results.map((item: any) => [
            item.sequence,
            item.part_number,
            item.part_name,
            item.regular_dimensions_total,
            item.regular_dimensions_qualified,
            item.regular_qualification_rate.toFixed(1),
            item.special_dimensions_total,
            item.special_dimensions_qualified,
            item.special_qualification_rate.toFixed(1),
            item.overall_qualification_rate.toFixed(1),
            item.status,
          ]),
        ]
          .map((row) => row.join(','))
          .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `高级全尺寸合格率统计_项目${selectedProject}.csv`;
        link.click();
      }
    } catch (err) {
      console.error('导出报告失败:', err);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">高级全尺寸合格率统计系统</h1>
          <p className="text-slate-600">支持分层结构、递归装配等级、权重计算的完整合格率统计</p>
        </div>

        {/* 控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>项目选择与视图控制</CardTitle>
            <CardDescription>选择项目并切换不同的展示模式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 max-w-xs">
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择项目</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name} (ID: {project.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  表格视图
                </Button>
                <Button
                  onClick={() => setViewMode('hierarchical')}
                  variant={viewMode === 'hierarchical' ? 'default' : 'outline'}
                  size="sm"
                >
                  <TreePine className="mr-2 h-4 w-4" />
                  分层视图
                </Button>
              </div>

              <Button
                onClick={() => fetchAdvancedQualificationData(selectedProject)}
                disabled={!selectedProject || loading}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>

              <Button onClick={handleExportReport} disabled={!qualificationData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                导出报告
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        {qualificationData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {qualificationData.summary.project_qualification_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-500">项目总合格率</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{qualificationData.summary.total_parts}</div>
                <div className="text-sm text-slate-500">零件总数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{qualificationData.summary.total_dimensions}</div>
                <div className="text-sm text-slate-500">尺寸总数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {qualificationData.summary.total_qualified_dimensions}
                </div>
                <div className="text-sm text-slate-500">合格尺寸数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  {qualificationData.summary.data_integrity_check ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mr-2" />
                  )}
                  <div>
                    <div className="text-sm font-medium">
                      {qualificationData.summary.data_integrity_check ? '数据完整' : '数据异常'}
                    </div>
                    <div className="text-xs text-slate-500">验证状态</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据验证警告 */}
        {qualificationData &&
          (qualificationData.summary.validation_errors.length > 0 ||
            qualificationData.summary.validation_warnings.length > 0) && (
            <Card className="mb-6 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  数据验证提醒
                </CardTitle>
              </CardHeader>
              <CardContent>
                {qualificationData.summary.validation_errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-800 mb-2">
                      错误 ({qualificationData.summary.validation_errors.length})
                    </h4>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {qualificationData.summary.validation_errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {qualificationData.summary.validation_warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">
                      警告 ({qualificationData.summary.validation_warnings.length})
                    </h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {qualificationData.summary.validation_warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* 主要内容区域 */}
        {qualificationData && (
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === 'table' ? '详细统计表格' : '分层结构视图'}</CardTitle>
              <CardDescription>
                {viewMode === 'table'
                  ? '显示所有零件的详细合格率统计信息，包括常规尺寸和特殊特性'
                  : '以树形结构展示项目、装配和零件的层级关系及合格率'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">序号</TableHead>
                        <TableHead className="w-32">零件号</TableHead>
                        <TableHead className="min-w-40">零件名称</TableHead>
                        <TableHead className="w-24 text-center">装配等级</TableHead>
                        <TableHead className="w-24 text-center">常规尺寸总数</TableHead>
                        <TableHead className="w-24 text-center">常规尺寸合格数</TableHead>
                        <TableHead className="w-24 text-center">常规合格率</TableHead>
                        <TableHead className="w-24 text-center">特殊特性总数</TableHead>
                        <TableHead className="w-32 text-center">特殊特性合格数</TableHead>
                        <TableHead className="w-32 text-center">特殊特性合格率</TableHead>
                        <TableHead className="w-24 text-center">总合格率</TableHead>
                        <TableHead className="w-20 text-center">权重</TableHead>
                        <TableHead className="w-20 text-center">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualificationData.part_level_results.map((part, index) => {
                        const status = getQualificationStatus(part.overall_qualification_rate);
                        return (
                          <TableRow key={part.part_id} className="hover:bg-slate-50">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
                            <TableCell className="font-medium">{part.part_name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">等级 {part.assembly_level}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{part.regular_dimensions_total}</TableCell>
                            <TableCell className="text-center">{part.regular_dimensions_qualified}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  part.regular_qualification_rate >= 95
                                    ? 'bg-green-100 text-green-800'
                                    : part.regular_qualification_rate >= 85
                                      ? 'bg-blue-100 text-blue-800'
                                      : part.regular_qualification_rate >= 70
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {part.regular_qualification_rate.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{part.special_dimensions_total}</TableCell>
                            <TableCell className="text-center">{part.special_dimensions_qualified}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  part.special_qualification_rate >= 95
                                    ? 'bg-green-100 text-green-800'
                                    : part.special_qualification_rate >= 85
                                      ? 'bg-blue-100 text-blue-800'
                                      : part.special_qualification_rate >= 70
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {part.special_qualification_rate.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${status.color}`}>
                                {part.overall_qualification_rate.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{part.weight_in_parent.toFixed(1)}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={status.color}>{status.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-2">{hierarchicalData && renderHierarchicalNode(hierarchicalData)}</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 装配等级结果 */}
        {qualificationData && qualificationData.assembly_level_results.length > 0 && viewMode === 'table' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>装配等级统计</CardTitle>
              <CardDescription>装配等级1的递归合并计算结果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualificationData.assembly_level_results.map((assembly) => (
                  <Collapsible key={assembly.part_id}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-4">
                        <Package className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">
                            {assembly.part_name} [{assembly.part_number}]
                          </div>
                          <div className="text-sm text-gray-500">
                            包含 {assembly.sub_parts_count} 个子零件 | 总合格率:{' '}
                            {assembly.overall_qualification_rate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 border-l-2 border-purple-200 ml-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assembly.sub_parts.map((subPart) => (
                          <Card key={subPart.part_id} className="border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{subPart.part_name}</div>
                                  <div className="text-xs text-gray-500">{subPart.part_number}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{subPart.qualification_rate.toFixed(1)}%</div>
                                  <Progress value={subPart.qualification_rate} className="w-16 h-2" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 错误提示 */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 空状态 */}
        {!loading && !qualificationData && selectedProject && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-400 mb-4">
                <AlertTriangle className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">暂无数据</h3>
              <p className="text-slate-500">该项目暂无高级合格率统计数据</p>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目状态 */}
        {!selectedProject && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-400 mb-4">
                <TreePine className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">请选择项目</h3>
              <p className="text-slate-500">请在上方选择一个项目来查看高级合格率统计</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
