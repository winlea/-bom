import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Download, Grid } from 'lucide-react';

export interface DimensionToolbarProps {
  selectedProject: string;
  partNumber: string;
  projectName: string;
  projects: Array<{ id: number; name?: string }>;
  parts: Array<{ id: number; part_number?: string; part_name?: string }>;
  searchTerm: string;
  onProjectChange: (projectId: string) => void;
  onPartChange: (partNumber: string) => void;
  onSearchChange: (term: string) => void;
  onAddGroup: () => void;
  onBatchSaveCanvas: () => void;
  onShowImageCombiner: () => void;
  savingCanvasImages: boolean;
}

export function DimensionToolbar({
  selectedProject,
  partNumber,
  projectName,
  projects,
  parts,
  searchTerm,
  onProjectChange,
  onPartChange,
  onSearchChange,
  onAddGroup,
  onBatchSaveCanvas,
  onShowImageCombiner,
  savingCanvasImages,
}: DimensionToolbarProps) {
  return (
    <div className="space-y-4">
      {/* 项目和零件选择 */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">项目</label>
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择项目" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name || `项目 ${p.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">零件</label>
          <Select value={partNumber} onValueChange={onPartChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择零件" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((p) => (
                <SelectItem key={p.id} value={p.part_number || String(p.id)}>
                  {p.part_number || p.part_name || `零件 ${p.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {projectName && <div className="text-sm text-gray-600 px-2 py-2">当前项目: {projectName}</div>}

        <div className="flex-1" />

        {/* 搜索框 */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索尺寸..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={onAddGroup} className="gap-2">
          <Plus className="h-4 w-4" />
          新增尺寸组
        </Button>
        <Button onClick={onBatchSaveCanvas} variant="outline" disabled={savingCanvasImages} className="gap-2">
          <Download className="h-4 w-4" />
          {savingCanvasImages ? '保存中...' : '批量保存Canvas图片'}
        </Button>
        <Button onClick={onShowImageCombiner} variant="outline" className="gap-2">
          <Grid className="h-4 w-4" />
          组合图片
        </Button>
      </div>
    </div>
  );
}

export default DimensionToolbar;
