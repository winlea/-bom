import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectOption } from '@/types/import';

interface ProjectSelectorProps {
  projects: ProjectOption[];
  selectedProject: string | undefined;
  createNewProject: boolean;
  newProjectName: string;
  newProjectDesc: string;
  onProjectChange: (value: string) => void;
  onCreateNewProjectChange: (value: boolean) => void;
  onNewProjectNameChange: (value: string) => void;
  onNewProjectDescChange: (value: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProject,
  createNewProject,
  newProjectName,
  newProjectDesc,
  onProjectChange,
  onCreateNewProjectChange,
  onNewProjectNameChange,
  onNewProjectDescChange,
}: ProjectSelectorProps) {
  return (
    <div className="space-y-4">
      {/* 项目选择方式 */}
      <div className="flex items-center">
        <label className="text-sm font-medium text-slate-700 mr-4">导入到：</label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="existing-project"
              name="project-type"
              checked={!createNewProject}
              onChange={() => onCreateNewProjectChange(false)}
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
              onChange={() => onCreateNewProjectChange(true)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="new-project" className="text-sm text-slate-700">
              创建新项目
            </label>
          </div>
        </div>
      </div>

      {/* 现有项目选择 */}
      {!createNewProject ? (
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">选择现有项目</label>
          <Select onValueChange={onProjectChange} value={selectedProject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择项目" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
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
            <label className="text-sm font-medium text-slate-700 mb-1 block">新项目名称</label>
            <Input
              placeholder="输入项目名称"
              value={newProjectName}
              onChange={(e) => onNewProjectNameChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">项目描述 (可选)</label>
            <Input
              placeholder="输入项目描述"
              value={newProjectDesc}
              onChange={(e) => onNewProjectDescChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectSelector;
