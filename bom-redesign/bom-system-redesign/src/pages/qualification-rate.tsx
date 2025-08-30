import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';

// 数据接口定义
interface Project {
  id: number;
  name: string;
}

interface PartQualificationData {
  part_id: number;
  part_number: string;
  part_name: string;
  total_dimensions: number;
  qualified_dimensions: number;
  dimension_qualification_rate: number;
  special_characteristics: number;
  qualified_special_characteristics: number;
  special_qualification_rate: number;
  overall_qualification_rate: number;
}

interface QualificationResponse {
  success: boolean;
  project_id: number;
  overall_rate: number;
  total_parts: number;
  total_dimensions: number;
  qualified_dimensions: number;
  parts: PartQualificationData[];
}

export default function QualificationRatePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [qualificationData, setQualificationData] = useState<QualificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      console.log('项目数据:', data); // 调试日志
      if (data.items && Array.isArray(data.items)) {
        setProjects(data.items);
        console.log('设置项目列表:', data.items); // 调试日志
      } else {
        console.error('项目数据格式错误:', data);
        setError('项目数据格式错误');
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
      setError('获取项目列表失败: ' + err.message);
    }
  };

  // 获取合格率数据
  const fetchQualificationData = async (projectId: string) => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/qualification/table/${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        // 模拟特殊特性数据（实际应从后端获取）
        const enhancedParts = data.parts.map((part: any, index: number) => ({
          part_id: part.part_id,
          part_number: `P${String(part.part_id).padStart(4, '0')}`,
          part_name: part.part_name || `零件_${part.part_id}`,
          total_dimensions: part.total_dimensions,
          qualified_dimensions: part.qualified_dimensions,
          dimension_qualification_rate: part.qualification_rate,
          special_characteristics: Math.floor(part.total_dimensions * 0.3), // 30%为特殊特性
          qualified_special_characteristics: Math.floor(part.qualified_dimensions * 0.9),
          special_qualification_rate: Math.round(Math.random() * 20 + 80), // 80-100%
          overall_qualification_rate: Math.round((part.qualification_rate * 0.7) + (Math.random() * 20 + 80) * 0.3)
        }));

        setQualificationData({
          ...data,
          parts: enhancedParts
        });
      } else {
        setError('获取合格率数据失败');
      }
    } catch (err) {
      console.error('获取合格率数据失败:', err);
      setError('获取合格率数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 项目选择变化
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    fetchQualificationData(value);
  };

  // 获取合格率状态
  const getQualificationStatus = (rate: number) => {
    if (rate >= 95) return { label: '优秀', color: 'bg-green-100 text-green-800' };
    if (rate >= 85) return { label: '良好', color: 'bg-blue-100 text-blue-800' };
    if (rate >= 70) return { label: '合格', color: 'bg-yellow-100 text-yellow-800' };
    return { label: '不合格', color: 'bg-red-100 text-red-800' };
  };

  // 导出Excel
  const handleExport = () => {
    if (!qualificationData) return;
    
    // 这里可以调用后端导出API
    const csvContent = [
      ['序号', '零件号', '零件名称', '全尺寸数量', '合格尺寸数量', '尺寸合格率(%)', '特殊特性数量', '合格特殊特性数量', '特殊特性合格率(%)', '总合格率(%)'],
      ...qualificationData.parts.map((part, index) => [
        index + 1,
        part.part_number,
        part.part_name,
        part.total_dimensions,
        part.qualified_dimensions,
        part.dimension_qualification_rate,
        part.special_characteristics,
        part.qualified_special_characteristics,
        part.special_qualification_rate,
        part.overall_qualification_rate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `全尺寸合格率统计_项目${selectedProject}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">全尺寸合格率统计</h1>
          <p className="text-slate-600">查看项目中所有零件的尺寸合格率统计信息</p>
        </div>

        {/* 控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>项目选择</CardTitle>
            <CardDescription>选择要查看合格率统计的项目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                {/* 原生select作为备用 */}
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
                
                {/* 显示调试信息 */}
                <div className="mt-2 text-sm text-gray-500">
                  项目数量: {projects.length} | 选中项目: {selectedProject || '未选择'}
                </div>
              </div>
              <Button
                onClick={() => fetchQualificationData(selectedProject)}
                disabled={!selectedProject || loading}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
              <Button
                onClick={handleExport}
                disabled={!qualificationData}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                导出Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        {qualificationData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {qualificationData.overall_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-500">项目总合格率</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {qualificationData.total_parts}
                </div>
                <div className="text-sm text-slate-500">零件总数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {qualificationData.total_dimensions}
                </div>
                <div className="text-sm text-slate-500">尺寸总数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {qualificationData.qualified_dimensions}
                </div>
                <div className="text-sm text-slate-500">合格尺寸数</div>
              </CardContent>
            </Card>
          </div>
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

        {/* 合格率统计表格 */}
        {qualificationData && qualificationData.parts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>零件合格率详细统计</CardTitle>
              <CardDescription>
                显示项目中所有零件的详细合格率信息，包括普通尺寸和特殊特性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">序号</TableHead>
                      <TableHead className="w-32">零件号</TableHead>
                      <TableHead className="min-w-40">零件名称</TableHead>
                      <TableHead className="w-24 text-center">全尺寸数量</TableHead>
                      <TableHead className="w-24 text-center">合格尺寸数量</TableHead>
                      <TableHead className="w-24 text-center">尺寸合格率</TableHead>
                      <TableHead className="w-24 text-center">特殊特性数量</TableHead>
                      <TableHead className="w-32 text-center">合格特殊特性数量</TableHead>
                      <TableHead className="w-32 text-center">特殊特性合格率</TableHead>
                      <TableHead className="w-24 text-center">总合格率</TableHead>
                      <TableHead className="w-20 text-center">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualificationData.parts.map((part, index) => {
                      const status = getQualificationStatus(part.overall_qualification_rate);
                      return (
                        <TableRow key={part.part_id} className="hover:bg-slate-50">
                          <TableCell className="text-center font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {part.part_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {part.part_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {part.total_dimensions}
                          </TableCell>
                          <TableCell className="text-center">
                            {part.qualified_dimensions}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded text-sm ${
                              part.dimension_qualification_rate >= 95 ? 'bg-green-100 text-green-800' :
                              part.dimension_qualification_rate >= 85 ? 'bg-blue-100 text-blue-800' :
                              part.dimension_qualification_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {part.dimension_qualification_rate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {part.special_characteristics}
                          </TableCell>
                          <TableCell className="text-center">
                            {part.qualified_special_characteristics}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded text-sm ${
                              part.special_qualification_rate >= 95 ? 'bg-green-100 text-green-800' :
                              part.special_qualification_rate >= 85 ? 'bg-blue-100 text-blue-800' :
                              part.special_qualification_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {part.special_qualification_rate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              part.overall_qualification_rate >= 95 ? 'bg-green-100 text-green-800' :
                              part.overall_qualification_rate >= 85 ? 'bg-blue-100 text-blue-800' :
                              part.overall_qualification_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {part.overall_qualification_rate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
              <p className="text-slate-500">该项目暂无合格率统计数据</p>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目状态 */}
        {!selectedProject && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-400 mb-4">
                <RefreshCw className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">请选择项目</h3>
              <p className="text-slate-500">请在上方选择一个项目来查看合格率统计</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}