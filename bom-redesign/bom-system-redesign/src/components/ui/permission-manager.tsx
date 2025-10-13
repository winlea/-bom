import { useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Shield, Users, UserPlus, Settings, Eye, Edit, Trash2, Plus, X, Check, AlertCircle, Lock, Unlock, Key, Crown, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// 权限类型
export type Permission = {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  level: 'read' | 'write' | 'delete' | 'admin';
};

// 角色类型
export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 用户类型
export type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// 权限组类型
export type PermissionGroup = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
};

// 权限管理组件属性
interface PermissionManagerProps {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
  onCreateUser?: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  onUpdateUser?: (id: string, updates: Partial<User>) => Promise<User>;
  onDeleteUser?: (id: string) => Promise<boolean>;
  onCreateRole?: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  onUpdateRole?: (id: string, updates: Partial<Role>) => Promise<Role>;
  onDeleteRole?: (id: string) => Promise<boolean>;
  onAssignRole?: (userId: string, roleIds: string[]) => Promise<boolean>;
  onAssignPermission?: (roleId: string, permissionIds: string[]) => Promise<boolean>;
  className?: string;
  children?: ReactNode;
}

// 默认权限
const DEFAULT_PERMISSIONS: Permission[] = [
  // 项目权限
  { id: 'project.read', name: '查看项目', description: '查看项目列表和详情', module: 'project', action: 'read', level: 'read' },
  { id: 'project.create', name: '创建项目', description: '创建新项目', module: 'project', action: 'create', level: 'write' },
  { id: 'project.update', name: '编辑项目', description: '编辑项目信息', module: 'project', action: 'update', level: 'write' },
  { id: 'project.delete', name: '删除项目', description: '删除项目', module: 'project', action: 'delete', level: 'delete' },
  
  // 零件权限
  { id: 'part.read', name: '查看零件', description: '查看零件列表和详情', module: 'part', action: 'read', level: 'read' },
  { id: 'part.create', name: '创建零件', description: '创建新零件', module: 'part', action: 'create', level: 'write' },
  { id: 'part.update', name: '编辑零件', description: '编辑零件信息', module: 'part', action: 'update', level: 'write' },
  { id: 'part.delete', name: '删除零件', description: '删除零件', module: 'part', action: 'delete', level: 'delete' },
  { id: 'part.import', name: '导入零件', description: '导入零件数据', module: 'part', action: 'import', level: 'write' },
  { id: 'part.export', name: '导出零件', description: '导出零件数据', module: 'part', action: 'export', level: 'read' },
  
  // 尺寸权限
  { id: 'dimension.read', name: '查看尺寸', description: '查看尺寸列表和详情', module: 'dimension', action: 'read', level: 'read' },
  { id: 'dimension.create', name: '创建尺寸', description: '创建新尺寸', module: 'dimension', action: 'create', level: 'write' },
  { id: 'dimension.update', name: '编辑尺寸', description: '编辑尺寸信息', module: 'dimension', action: 'update', level: 'write' },
  { id: 'dimension.delete', name: '删除尺寸', description: '删除尺寸', module: 'dimension', action: 'delete', level: 'delete' },
  
  // 用户权限
  { id: 'user.read', name: '查看用户', description: '查看用户列表和详情', module: 'user', action: 'read', level: 'read' },
  { id: 'user.create', name: '创建用户', description: '创建新用户', module: 'user', action: 'create', level: 'write' },
  { id: 'user.update', name: '编辑用户', description: '编辑用户信息', module: 'user', action: 'update', level: 'write' },
  { id: 'user.delete', name: '删除用户', description: '删除用户', module: 'user', action: 'delete', level: 'delete' },
  
  // 角色权限
  { id: 'role.read', name: '查看角色', description: '查看角色列表和详情', module: 'role', action: 'read', level: 'read' },
  { id: 'role.create', name: '创建角色', description: '创建新角色', module: 'role', action: 'create', level: 'write' },
  { id: 'role.update', name: '编辑角色', description: '编辑角色信息', module: 'role', action: 'update', level: 'write' },
  { id: 'role.delete', name: '删除角色', description: '删除角色', module: 'role', action: 'delete', level: 'delete' },
  
  // 系统权限
  { id: 'system.admin', name: '系统管理', description: '系统管理权限', module: 'system', action: 'admin', level: 'admin' },
];

// 默认角色
const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'engineer',
    name: '工程师',
    description: '工程师，可以管理项目和零件',
    permissions: [
      'project.read', 'project.create', 'project.update',
      'part.read', 'part.create', 'part.update', 'part.import', 'part.export',
      'dimension.read', 'dimension.create', 'dimension.update',
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'viewer',
    name: '查看者',
    description: '查看者，只能查看数据',
    permissions: [
      'project.read',
      'part.read', 'part.export',
      'dimension.read',
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// 权限管理组件
export function PermissionManager({
  users = [],
  roles = DEFAULT_ROLES,
  permissions = DEFAULT_PERMISSIONS,
  permissionGroups = [],
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onAssignRole,
  onAssignPermission,
  className,
  children,
}: PermissionManagerProps) {
  // 状态
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    isActive: true,
    roles: [] as string[],
  });
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 按模块分组权限
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    
    return grouped;
  }, [permissions]);
  
  // 获取角色名称
  const getRoleName = useCallback((roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }, [roles]);
  
  // 获取权限名称
  const getPermissionName = useCallback((permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  }, [permissions]);
  
  // 获取用户角色
  const getUserRoles = useCallback((user: User) => {
    return roles.filter(role => user.roles.includes(role.id));
  }, [roles]);
  
  // 获取角色权限
  const getRolePermissions = useCallback((role: Role) => {
    return permissions.filter(permission => role.permissions.includes(permission.id));
  }, [permissions]);
  
  // 检查用户是否有权限
  const hasPermission = useCallback((user: User, permissionId: string) => {
    const userRoles = getUserRoles(user);
    return userRoles.some(role => role.permissions.includes(permissionId));
  }, [getUserRoles]);
  
  // 创建用户
  const handleCreateUser = useCallback(async () => {
    if (!onCreateUser) return;
    
    setIsCreating(true);
    try {
      const newUser = await onCreateUser({
        ...userForm,
        roles: userForm.roles,
      });
      
      // 重置表单
      setUserForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        isActive: true,
        roles: [],
      });
      
      setUserDialogOpen(false);
    } catch (error) {
      console.error('创建用户失败:', error);
    } finally {
      setIsCreating(false);
    }
  }, [onCreateUser, userForm]);
  
  // 更新用户
  const handleUpdateUser = useCallback(async () => {
    if (!onUpdateUser || !selectedUser) return;
    
    setIsUpdating(true);
    try {
      await onUpdateUser(selectedUser.id, {
        ...userForm,
        roles: userForm.roles,
      });
      
      setSelectedUser(null);
      setUserDialogOpen(false);
    } catch (error) {
      console.error('更新用户失败:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdateUser, selectedUser, userForm]);
  
  // 删除用户
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!onDeleteUser) return;
    
    setIsDeleting(true);
    try {
      await onDeleteUser(userId);
    } catch (error) {
      console.error('删除用户失败:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteUser]);
  
  // 创建角色
  const handleCreateRole = useCallback(async () => {
    if (!onCreateRole) return;
    
    setIsCreating(true);
    try {
      const newRole = await onCreateRole({
        ...roleForm,
        permissions: roleForm.permissions,
        isSystem: false,
      });
      
      // 重置表单
      setRoleForm({
        name: '',
        description: '',
        permissions: [],
      });
      
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('创建角色失败:', error);
    } finally {
      setIsCreating(false);
    }
  }, [onCreateRole, roleForm]);
  
  // 更新角色
  const handleUpdateRole = useCallback(async () => {
    if (!onUpdateRole || !selectedRole) return;
    
    setIsUpdating(true);
    try {
      await onUpdateRole(selectedRole.id, {
        ...roleForm,
        permissions: roleForm.permissions,
      });
      
      setSelectedRole(null);
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('更新角色失败:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdateRole, selectedRole, roleForm]);
  
  // 删除角色
  const handleDeleteRole = useCallback(async (roleId: string) => {
    if (!onDeleteRole) return;
    
    setIsDeleting(true);
    try {
      await onDeleteRole(roleId);
    } catch (error) {
      console.error('删除角色失败:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteRole]);
  
  // 分配角色
  const handleAssignRole = useCallback(async (userId: string, roleIds: string[]) => {
    if (!onAssignRole) return;
    
    try {
      await onAssignRole(userId, roleIds);
    } catch (error) {
      console.error('分配角色失败:', error);
    }
  }, [onAssignRole]);
  
  // 分配权限
  const handleAssignPermission = useCallback(async (roleId: string, permissionIds: string[]) => {
    if (!onAssignPermission) return;
    
    try {
      await onAssignPermission(roleId, permissionIds);
    } catch (error) {
      console.error('分配权限失败:', error);
    }
  }, [onAssignPermission]);
  
  // 打开用户对话框
  const openUserDialog = useCallback((user?: User) => {
    if (user) {
      setSelectedUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: '',
        isActive: user.isActive,
        roles: user.roles,
      });
    } else {
      setSelectedUser(null);
      setUserForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        isActive: true,
        roles: [],
      });
    }
    setUserDialogOpen(true);
  }, []);
  
  // 打开角色对话框
  const openRoleDialog = useCallback((role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setRoleForm({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    } else {
      setSelectedRole(null);
      setRoleForm({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setRoleDialogOpen(true);
  }, []);
  
  // 渲染用户列表
  const renderUsers = useCallback(() => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>用户管理</span>
              </CardTitle>
              <CardDescription>
                管理系统用户和权限
              </CardDescription>
            </div>
            <Button onClick={() => openUserDialog()}>
              <UserPlus className="h-4 w-4 mr-2" />
              添加用户
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.fullName} />
                        <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getUserRoles(user).map(role => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {user.isActive ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-500" />
                          <span className="text-sm">活跃</span>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-red-500" />
                          <span className="text-sm">禁用</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <div className="text-sm">
                        {user.lastLogin.toLocaleDateString()}
                        <div className="text-slate-500">
                          {user.lastLogin.toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">从未登录</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openUserDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isDeleting || user.roles.includes('admin')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }, [users, getUserRoles, isDeleting, openUserDialog, handleDeleteUser]);
  
  // 渲染角色列表
  const renderRoles = useCallback(() => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>角色管理</span>
              </CardTitle>
              <CardDescription>
                管理系统角色和权限
              </CardDescription>
            </div>
            <Button onClick={() => openRoleDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              添加角色
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-slate-500">{role.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="secondary">系统角色</Badge>
                    ) : (
                      <Badge variant="outline">自定义角色</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openRoleDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={isDeleting || role.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }, [roles, isDeleting, openRoleDialog, handleDeleteRole]);
  
  // 渲染权限列表
  const renderPermissions = useCallback(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>权限列表</span>
          </CardTitle>
          <CardDescription>
            查看系统所有权限
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
              <div key={module}>
                <h3 className="text-lg font-medium mb-3 capitalize">{module}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modulePermissions.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-2 p-3 border rounded-md">
                      <div className="mt-0.5">
                        {permission.level === 'admin' && <Crown className="h-4 w-4 text-red-500" />}
                        {permission.level === 'delete' && <Trash2 className="h-4 w-4 text-red-500" />}
                        {permission.level === 'write' && <Edit className="h-4 w-4 text-blue-500" />}
                        {permission.level === 'read' && <Eye className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-slate-500">{permission.description}</div>
                        <div className="text-xs text-slate-400 mt-1">{permission.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }, [permissionsByModule]);
  
  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>用户</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>角色</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>权限</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          {renderUsers()}
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          {renderRoles()}
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          {renderPermissions()}
        </TabsContent>
      </Tabs>
      
      {/* 用户对话框 */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? '编辑用户' : '添加用户'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? '编辑用户信息和权限' : '创建新用户并分配权限'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={userForm.username}
                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                disabled={!!selectedUser}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                value={userForm.fullName}
                onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            
            {!selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>角色</Label>
              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={userForm.roles.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setUserForm(prev => ({ ...prev, roles: [...prev.roles, role.id] }));
                        } else {
                          setUserForm(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role.id) }));
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={userForm.isActive}
                onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="is-active">活跃状态</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={selectedUser ? handleUpdateUser : handleCreateUser} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? '保存中...' : (selectedUser ? '更新' : '创建')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 角色对话框 */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? '编辑角色' : '添加角色'}
            </DialogTitle>
            <DialogDescription>
              {selectedRole ? '编辑角色信息和权限' : '创建新角色并分配权限'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">角色名称</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-description">描述</Label>
                <Input
                  id="role-description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>权限</Label>
                <div className="space-y-4">
                  {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <div key={module}>
                      <h4 className="font-medium capitalize mb-2">{module}</h4>
                      <div className="space-y-2">
                        {modulePermissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={roleForm.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setRoleForm(prev => ({ ...prev, permissions: [...prev.permissions, permission.id] }));
                                } else {
                                  setRoleForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permission.id) }));
                                }
                              }}
                            />
                            <Label htmlFor={`permission-${permission.id}`} className="flex items-center space-x-2">
                              <span>{permission.name}</span>
                              {permission.level === 'admin' && <Crown className="h-3 w-3 text-red-500" />}
                              {permission.level === 'delete' && <Trash2 className="h-3 w-3 text-red-500" />}
                              {permission.level === 'write' && <Edit className="h-3 w-3 text-blue-500" />}
                              {permission.level === 'read' && <Eye className="h-3 w-3 text-green-500" />}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={selectedRole ? handleUpdateRole : handleCreateRole} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? '保存中...' : (selectedRole ? '更新' : '创建')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {children}
    </div>
  );
}

export default PermissionManager;