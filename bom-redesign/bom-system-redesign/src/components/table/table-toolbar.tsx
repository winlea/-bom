import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Merge, Split, Trash2, Copy, Undo, Redo, Plus, Minus, Download } from 'lucide-react';

interface TableToolbarProps {
  rows: number;
  cols: number;
  selectedCells: string[];
  onResize: (rows: number, cols: number) => void;
  onMergeCells: () => void;
  onSplitCells: () => void;
  onDeleteCells: () => void;
  onCopy: () => void;
  onClearSelection: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export function TableToolbar({
  rows,
  cols,
  selectedCells,
  onResize,
  onMergeCells,
  onSplitCells,
  onDeleteCells,
  onCopy,
  onClearSelection,
  onExportCSV,
  onExportJSON,
}: TableToolbarProps) {
  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
      {/* 表格尺寸控制 */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="table-rows">行数</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => rows > 1 && onResize(rows - 1, cols)}
              disabled={rows <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="table-rows"
              type="number"
              value={rows}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0) onResize(val, cols);
              }}
              className="w-16 text-center"
              min={1}
            />
            <Button variant="outline" size="icon" onClick={() => onResize(rows + 1, cols)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="table-cols">列数</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => cols > 1 && onResize(rows, cols - 1)}
              disabled={cols <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="table-cols"
              type="number"
              value={cols}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0) onResize(rows, val);
              }}
              className="w-16 text-center"
              min={1}
            />
            <Button variant="outline" size="icon" onClick={() => onResize(rows, cols + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500 px-2">已选择 {selectedCells.length} 个单元格</div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMergeCells}
          disabled={selectedCells.length <= 1}
          className="gap-2"
        >
          <Merge className="h-4 w-4" />
          合并单元格
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSplitCells}
          disabled={selectedCells.length !== 1}
          className="gap-2"
        >
          <Split className="h-4 w-4" />
          拆分单元格
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteCells}
          disabled={selectedCells.length === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          删除内容
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} disabled={selectedCells.length === 0} className="gap-2">
          <Copy className="h-4 w-4" />
          复制
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={selectedCells.length === 0}
          className="gap-2"
        >
          清除选择
        </Button>

        <div className="flex-1" />

        {/* 导出选项 */}
        <Select
          onValueChange={(value) => {
            if (value === 'csv') onExportCSV();
            else if (value === 'json') onExportJSON();
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="导出" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">导出 CSV</SelectItem>
            <SelectItem value="json">导出 JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default TableToolbar;
