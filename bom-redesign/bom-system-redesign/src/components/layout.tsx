import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Ruler, FileInput, Menu, X, ChevronRight, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  projectCount?: number;
  partsCount?: number;
}

// 面包屑导航组件
interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center text-sm mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-2 text-slate-400">/</span>}
          {item.to ? (
            <Link to={item.to} className="text-blue-600 hover:text-blue-800">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Layout({ children, projectCount, partsCount }: LayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    {
      name: '项目列表',
      path: '/projects',
      icon: <LayoutDashboard size={20} className="icon" />,
    },
    {
      name: '零件列表',
      path: '/parts',
      icon: <Package size={20} className="icon" />,
    },
    {
      name: '尺寸列表',
      path: '/dimensions',
      icon: <Ruler size={20} className="icon" />,
    },
    {
      name: 'BOM导入',
      path: '/import',
      icon: <FileInput size={20} className="icon" />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">BOM系统</span>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <X size={20} />
              </Button>
            )}
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 ${
                  isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {isActive(item.path) && <ChevronRight size={16} className="ml-auto text-blue-600" />}
              </Link>
            ))}
          </nav>

          {/* 侧边栏底部 */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-blue-100 text-blue-700">管理</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">管理员</p>
                  <p className="text-xs text-slate-500">admin@example.com</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings size={16} className="mr-2" /> 设置
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <LogOut size={16} className="mr-2" /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
              <Menu size={20} />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-medium">{navItems.find((item) => isActive(item.path))?.name || 'BOM系统'}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              帮助
            </Button>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* 页脚 */}
        <footer className="py-4 px-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} BOM系统 - 零件管理平台</p>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <a href="#" className="text-sm text-slate-500 hover:text-blue-600">
                关于我们
              </a>
              <Separator orientation="vertical" className="h-4" />
              <a href="#" className="text-sm text-slate-500 hover:text-blue-600">
                联系支持
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
