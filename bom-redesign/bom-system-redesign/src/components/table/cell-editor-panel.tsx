import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CellEditorPanelProps {
  cellContent: string;
  backgroundColor: string;
  textColor: string;
  fontWeight: string;
  textAlign: string;
  verticalAlign: string;
  borderStyle: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  onCellContentChange: (value: string) => void;
  onCellContentBlur: () => void;
  onBackgroundColorChange: (value: string) => void;
  onBackgroundColorBlur: () => void;
  onTextColorChange: (value: string) => void;
  onTextColorBlur: () => void;
  onFontWeightChange: (value: string) => void;
  onTextAlignChange: (value: string) => void;
  onVerticalAlignChange: (value: string) => void;
  onBorderChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void;
}

export function CellEditorPanel({
  cellContent,
  backgroundColor,
  textColor,
  fontWeight,
  textAlign,
  verticalAlign,
  borderStyle,
  onCellContentChange,
  onCellContentBlur,
  onBackgroundColorChange,
  onBackgroundColorBlur,
  onTextColorChange,
  onTextColorBlur,
  onFontWeightChange,
  onTextAlignChange,
  onVerticalAlignChange,
  onBorderChange,
}: CellEditorPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>单元格属性</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content">内容</TabsTrigger>
            <TabsTrigger value="style">样式</TabsTrigger>
            <TabsTrigger value="border">边框</TabsTrigger>
          </TabsList>

          {/* 内容编辑 */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cell-content">单元格内容</Label>
              <Input
                id="cell-content"
                value={cellContent}
                onChange={(e) => onCellContentChange(e.target.value)}
                onBlur={onCellContentBlur}
                placeholder="输入单元格内容"
              />
            </div>
          </TabsContent>

          {/* 样式编辑 */}
          <TabsContent value="style" className="space-y-4">
            {/* 背景颜色 */}
            <div className="space-y-2">
              <Label htmlFor="bg-color">背景颜色</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  onBlur={onBackgroundColorBlur}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  onBlur={onBackgroundColorBlur}
                  className="flex-1"
                />
              </div>
            </div>

            {/* 文字颜色 */}
            <div className="space-y-2">
              <Label htmlFor="text-color">文字颜色</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => onTextColorChange(e.target.value)}
                  onBlur={onTextColorBlur}
                  className="w-12 h-8 p-0"
                />
                <Input
                  value={textColor}
                  onChange={(e) => onTextColorChange(e.target.value)}
                  onBlur={onTextColorBlur}
                  className="flex-1"
                />
              </div>
            </div>

            {/* 字体粗细 */}
            <div className="space-y-2">
              <Label htmlFor="font-weight">字体粗细</Label>
              <Select value={fontWeight} onValueChange={onFontWeightChange}>
                <SelectTrigger id="font-weight">
                  <SelectValue placeholder="选择字体粗细" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="bold">粗体</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 水平对齐 */}
            <div className="space-y-2">
              <Label htmlFor="text-align">水平对齐</Label>
              <Select value={textAlign} onValueChange={onTextAlignChange}>
                <SelectTrigger id="text-align">
                  <SelectValue placeholder="选择水平对齐方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左对齐</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                  <SelectItem value="right">右对齐</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 垂直对齐 */}
            <div className="space-y-2">
              <Label htmlFor="vertical-align">垂直对齐</Label>
              <Select value={verticalAlign} onValueChange={onVerticalAlignChange}>
                <SelectTrigger id="vertical-align">
                  <SelectValue placeholder="选择垂直对齐方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">顶部对齐</SelectItem>
                  <SelectItem value="middle">居中</SelectItem>
                  <SelectItem value="bottom">底部对齐</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* 边框编辑 */}
          <TabsContent value="border" className="space-y-4">
            <div className="space-y-2">
              <Label>边框样式</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="border-top"
                    checked={borderStyle.top !== 'none'}
                    onCheckedChange={(checked) => onBorderChange('top', checked ? '1px solid #000' : 'none')}
                  />
                  <Label htmlFor="border-top">上边框</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="border-right"
                    checked={borderStyle.right !== 'none'}
                    onCheckedChange={(checked) => onBorderChange('right', checked ? '1px solid #000' : 'none')}
                  />
                  <Label htmlFor="border-right">右边框</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="border-bottom"
                    checked={borderStyle.bottom !== 'none'}
                    onCheckedChange={(checked) => onBorderChange('bottom', checked ? '1px solid #000' : 'none')}
                  />
                  <Label htmlFor="border-bottom">下边框</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="border-left"
                    checked={borderStyle.left !== 'none'}
                    onCheckedChange={(checked) => onBorderChange('left', checked ? '1px solid #000' : 'none')}
                  />
                  <Label htmlFor="border-left">左边框</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CellEditorPanel;
