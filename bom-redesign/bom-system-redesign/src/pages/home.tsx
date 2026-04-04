import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  FolderOpen,
  Ruler,
  FileText,
  Settings,
  Upload,
  Download,
  BarChart3,
  Users,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import { DASHBOARD_RECENT } from '@/constants/api';

// 项目类型定义
interface Project {
  id: number;
  name: string;
  supplier_name?: string;
  customer_name?: string;
  created_at?: string;
}

// 系统统计类型定义
interface SystemStats {
  totalProjects: number;
  totalParts: number;
  totalDimensions: number;
  version: string;
}

export default function HomePage() {
  const navigate = useNavigate();

  // 功能模块定义
  const modules = [
    {
      title: '项目管理',
      description: '创建和管理BOM项目',
      icon: <FolderOpen className="h-10 w-10 text-blue-600" />,
      path: '/projects',
      color: 'bg-blue-50',
    },
    {
      title: '零件管理',
      description: '管理项目中的零件数据',
      icon: <Package className="h-10 w-10 text-green-600" />,
      path: '/parts',
      color: 'bg-green-50',
    },
    {
      title: '尺寸管理',
      description: '管理零件的尺寸数据',
      icon: <Ruler className="h-10 w-10 text-purple-600" />,
      path: '/dimensions',
      color: 'bg-purple-50',
    },
    {
      title: 'ODS生成器',
      description: '生成作业指导书文档',
      icon: <FileSpreadsheet className="h-10 w-10 text-emerald-600" />,
      path: '/ods',
      color: 'bg-emerald-50',
    },
    {
      title: 'PSW生成器',
      description: '生成零件保证书文档',
      icon: <FileSpreadsheet className="h-10 w-10 text-blue-600" />,
      path: '/psw',
      color: 'bg-blue-50',
    },
    {
      title: '初始能力分析',
      description: '生成初始过程能力分析报告',
      icon: <Activity className="h-10 w-10 text-purple-600" />,
      path: '/process-capability',
      color: 'bg-purple-50',
    },
    {
      title: '数据导入',
      description: '导入BOM数据',
      icon: <Upload className="h-10 w-10 text-orange-600" />,
      path: '/import',
      color: 'bg-orange-50',
    },
    {
      title: '数据导出',
      description: '导出项目数据',
      icon: <Download className="h-10 w-10 text-cyan-600" />,
      path: '/export',
      color: 'bg-cyan-50',
    },
    {
      title: '全尺寸合格率',
      description: '统计零件尺寸合格率',
      icon: <BarChart3 className="h-10 w-10 text-amber-600" />,
      path: '/qualification-rate',
      color: 'bg-amber-50',
    },
    {
      title: '报表统计',
      description: '查看数据统计和报表',
      icon: <BarChart3 className="h-10 w-10 text-red-600" />,
      path: '/reports',
      color: 'bg-red-50',
    },
    {
      title: '用户管理',
      description: '管理系统用户和权限',
      icon: <Users className="h-10 w-10 text-indigo-600" />,
      path: '/users',
      color: 'bg-indigo-50',
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: <Settings className="h-10 w-10 text-slate-600" />,
      path: '/settings',
      color: 'bg-slate-50',
    },
    {
      title: '图纸变更',
      description: '管理图纸变更信息',
      icon: <FileText className="h-10 w-10 text-red-600" />,
      path: '/drawing-change',
      color: 'bg-red-50',
    },
  ];

  // 最近项目数据
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalProjects: 0,
    totalParts: 0,
    totalDimensions: 0,
    version: 'v2.0.0',
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 从后端API获取最近项目数据和系统统计
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(DASHBOARD_RECENT);
        if (response.ok) {
          const data = await response.json();
          setRecentProjects(data.recent_projects || []);
          // 如果后端返回统计信息，更新系统状态
          if (data.stats) {
            setSystemStats((prev) => ({
              ...prev,
              totalProjects: data.stats.totalProjects || data.stats.total_projects || 0,
              totalParts: data.stats.totalParts || data.stats.total_parts || 0,
              totalDimensions: data.stats.totalDimensions || data.stats.total_dimensions || 0,
            }));
          }
        } else {
          console.error('获取最近项目失败');
        }
      } catch (error) {
        console.error('获取最近项目错误:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* 欢迎区域 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">欢迎使用BOM管理系统</h1>
          <p className="text-blue-100 mb-6">高效管理您的物料清单和零件数据</p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/projects/new')} className="bg-white text-blue-700 hover:bg-blue-50">
              <FolderOpen className="mr-2 h-4 w-4" /> 创建新项目
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
              className="bg-transparent border-white text-white hover:bg-blue-700"
            >
              <Package className="mr-2 h-4 w-4" /> 查看所有项目
            </Button>
          </div>
        </div>

        {/* 功能模块导航 */}
        <h2 className="text-2xl font-bold mb-4 text-slate-800">功能模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {modules.map((module, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-6">
                <div className={`rounded-full p-3 inline-block mb-3 ${module.color}`}>{module.icon}</div>
                <h3 className="text-lg font-medium mb-1">{module.title}</h3>
                <p className="text-sm text-slate-500">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 最近项目 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>最近项目</CardTitle>
                <CardDescription>您最近访问的项目</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : recentProjects.length > 0 ? (
                    recentProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-md mr-3">
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-slate-500">
                              {project.supplier_name || '无供应商'} - {project.customer_name || '无客户'}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : '未知'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-slate-500">暂无项目数据</div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/projects')}>
                  查看所有项目
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* 快速操作 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用功能快速入口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/projects/new')}>
                  <FolderOpen className="mr-2 h-4 w-4 text-blue-600" />
                  创建新项目
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/import')}>
                  <Upload className="mr-2 h-4 w-4 text-green-600" />
                  导入BOM数据
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/export')}>
                  <Download className="mr-2 h-4 w-4 text-orange-600" />
                  导出项目数据
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/ods')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                  生成ODS文档
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/psw')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
                  生成PSW文档
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/process-capability')}
                >
                  <Activity className="mr-2 h-4 w-4 text-purple-600" />
                  初始能力分析
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/qualification-rate')}
                >
                  <BarChart3 className="mr-2 h-4 w-4 text-amber-600" />
                  全尺寸合格率
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports')}>
                  <BarChart3 className="mr-2 h-4 w-4 text-purple-600" />
                  查看数据报表
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/drawing-change')}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  图纸变更管理
                </Button>
              </CardContent>
            </Card>

            {/* 系统状态 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>系统状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">项目总数</span>
                    <span className="font-medium">{systemStats.totalProjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">零件总数</span>
                    <span className="font-medium">{systemStats.totalParts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">尺寸记录</span>
                    <span className="font-medium">{systemStats.totalDimensions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">系统版本</span>
                    <span className="font-medium">{systemStats.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
