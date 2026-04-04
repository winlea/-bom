import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Filter, RotateCcw, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
}

interface PartData {
  part_id: number;
  part_number: string;
  part_name: string;
  bom_level: number;
  assembly_level: number;
  total_dimensions: number;
  qualified_dimensions: number;
  qualification_rate: number;
  ccsc_total: number;
  ccsc_qualified: number;
  ccsc_rate: number;
}

interface MatrixData {
  parts: PartData[];
  summary: {
    total_dimensions_sum: number;
    qualified_dimensions_sum: number;
    overall_qualification_rate: number;
    ccsc_total_sum: number;
    ccsc_qualified_sum: number;
    overall_ccsc_rate: number;
  };
}

const MatrixQualificationRatePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'bom_level' | 'part_number' | 'qualification_rate'>('bom_level');
  const [filterRate, setFilterRate] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id);
          }
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
        toast.error('获取项目列表失败');
      }
    };

    fetchProjects();
  }, []);

  // 获取矩阵数据
  const fetchMatrixData = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/matrix-qualification/project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMatrixData(data);
      } else {
        toast.error('获取矩阵数据失败');
      }
    } catch (error) {
      console.error('获取矩阵数据失败:', error);
      toast.error('获取矩阵数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 项目选择变化
  useEffect(() => {
    if (selectedProjectId) {
      fetchMatrixData(selectedProjectId);
    }
  }, [selectedProjectId]);

  // 获取合格率颜色
  const getQualificationRateColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-100 text-green-800';
    if (rate >= 85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // 排序和筛选数据
  const getFilteredAndSortedParts = () => {
    if (!matrixData) return [];

    let filteredParts = [...matrixData.parts];

    // 筛选
    if (filterRate !== 'all') {
      filteredParts = filteredParts.filter((part) => {
        if (filterRate === 'high') return part.qualification_rate >= 95;
        if (filterRate === 'medium') return part.qualification_rate >= 85 && part.qualification_rate < 95;
        if (filterRate === 'low') return part.qualification_rate < 85;
        return true;
      });
    }

    // 排序
    filteredParts.sort((a, b) => {
      if (sortBy === 'bom_level') {
        if (a.bom_level !== b.bom_level) return a.bom_level - b.bom_level;
        return a.part_number.localeCompare(b.part_number);
      }
      if (sortBy === 'part_number') return a.part_number.localeCompare(b.part_number);
      if (sortBy === 'qualification_rate') return b.qualification_rate - a.qualification_rate;
      return 0;
    });

    return filteredParts;
  };

  // 导出Excel
  const handleExport = () => {
    if (!matrixData) return;

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `零件质量统计矩阵_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('导出成功');
  };

  // 生成CSV内容
  const generateCSV = () => {
    if (!matrixData) return '';

    const parts = getFilteredAndSortedParts();
    const headers = ['统计指标', ...parts.map((p) => p.part_number)];

    const rows = [
      ['零件号', ...parts.map((p) => p.part_number)],
      ['零件名称', ...parts.map((p) => p.part_name)],
      ['BOM层级', ...parts.map((p) => p.bom_level.toString())],
      ['全尺寸数量', ...parts.map((p) => p.total_dimensions.toString())],
      ['全尺寸合格', ...parts.map((p) => p.qualified_dimensions.toString())],
      ['全尺寸率', ...parts.map((p) => `${p.qualification_rate.toFixed(1)}%`)],
      ['CCSC数量', ...parts.map((p) => p.ccsc_total.toString())],
      ['CCSC合格', ...parts.map((p) => p.ccsc_qualified.toString())],
      ['CCSC率', ...parts.map((p) => `${p.ccsc_rate.toFixed(1)}%`)],
    ];

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const filteredParts = getFilteredAndSortedParts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Grid3X3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">网格式零件质量统计矩阵</h1>
            <p className="text-gray-600 mt-1">纵向排列的零件质量统计表，按BOM层级排序</p>
          </div>
        </div>
      </div>

      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">控制面板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* 项目选择 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">项目:</label>
              <Select
                value={selectedProjectId?.toString() || ''}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序选择 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">排序:</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bom_level">BOM层级</SelectItem>
                  <SelectItem value="part_number">零件号</SelectItem>
                  <SelectItem value="qualification_rate">合格率</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 筛选选择 */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterRate} onValueChange={(value: any) => setFilterRate(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="high">≥95%</SelectItem>
                  <SelectItem value="medium">85-94%</SelectItem>
                  <SelectItem value="low">&lt;85%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedProjectId && fetchMatrixData(selectedProjectId)}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                刷新
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!matrixData || loading}>
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 矩阵表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>零件质量统计矩阵</span>
            {matrixData && <Badge variant="secondary">共 {filteredParts.length} 个零件</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : matrixData && filteredParts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900 min-w-24">
                      统计指标
                    </th>
                    {filteredParts.map((part) => (
                      <th
                        key={part.part_id}
                        className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900 min-w-32"
                      >
                        <div className="space-y-1">
                          <div className="font-bold">{part.part_number}</div>
                          <Badge variant="outline" className="text-xs">
                            L{part.bom_level}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 零件名称行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">零件名称</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        {part.part_name}
                      </td>
                    ))}
                  </tr>

                  {/* 全尺寸数量行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">全尺寸数量</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        {part.total_dimensions.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* 全尺寸合格行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">全尺寸合格</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        {part.qualified_dimensions.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* 全尺寸率行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">全尺寸率</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getQualificationRateColor(part.qualification_rate)}`}
                        >
                          {part.qualification_rate.toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* CCSC数量行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">CCSC数量</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        {part.ccsc_total.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* CCSC合格行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">CCSC合格</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        {part.ccsc_qualified.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* CCSC率行 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">CCSC率</td>
                    {filteredParts.map((part) => (
                      <td key={part.part_id} className="border border-gray-300 px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getQualificationRateColor(part.ccsc_rate)}`}
                        >
                          {part.ccsc_rate.toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* 汇总行 */}
                  <tr className="bg-blue-50">
                    <td className="border border-gray-300 px-3 py-2 font-bold text-blue-900">项目汇总</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                      全尺寸总数: {matrixData.summary.total_dimensions_sum.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                      全尺寸合格: {matrixData.summary.qualified_dimensions_sum.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                      全尺寸率: {matrixData.summary.overall_qualification_rate.toFixed(1)}%
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                      CCSC总数: {matrixData.summary.ccsc_total_sum.toLocaleString()}
                    </td>
                    {filteredParts.length > 4 && (
                      <>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                          CCSC合格: {matrixData.summary.ccsc_qualified_sum.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium text-blue-900">
                          CCSC率: {matrixData.summary.overall_ccsc_rate.toFixed(1)}%
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {matrixData ? '没有符合条件的零件数据' : '请选择项目查看数据'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计概览 */}
      {matrixData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {matrixData.summary.total_dimensions_sum.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">全尺寸总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {matrixData.summary.qualified_dimensions_sum.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">全尺寸合格</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div
                className={`text-2xl font-bold ${
                  getQualificationRateColor(matrixData.summary.overall_qualification_rate).includes('green')
                    ? 'text-green-600'
                    : getQualificationRateColor(matrixData.summary.overall_qualification_rate).includes('yellow')
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {matrixData.summary.overall_qualification_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">项目合格率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{filteredParts.length}</div>
              <div className="text-sm text-gray-600">零件数量</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MatrixQualificationRatePage;
