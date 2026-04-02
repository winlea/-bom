import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

interface Cell {
  id: string;
  content: string;
  rowSpan: number;
  colSpan: number;
  selected: boolean;
  backgroundColor: string;
  textColor: string;
  fontWeight: string;
  textAlign: string;
  verticalAlign: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
}

interface TableEditorProps {
  initialRows?: number;
  initialCols?: number;
  initialData?: Cell[][];
  onSave?: (tableData: Cell[][]) => void;
}

export default function TableEditor({
  initialRows = 9,
  initialCols = 16,
  initialData = [] as Cell[][],
  onSave,
}: TableEditorProps) {
  // 列标题 (A-Z)
  const colHeaders = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // 初始化表格数据
  const initializeTable = (rows: number, cols: number) => {
    return Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: cols }, (_, colIndex) => ({
        id: `${rowIndex}-${colIndex}`,
        content: '',
        rowSpan: 1,
        colSpan: 1,
        selected: false,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontWeight: 'normal',
        textAlign: 'center',
        verticalAlign: 'middle',
        borderTop: '1px solid #ccc',
        borderRight: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
        borderLeft: '1px solid #ccc',
      }))
    );
  };

  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [tableData, setTableData] = useState<Cell[][]>(
    initialData || initializeTable(initialRows, initialCols)
  );
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<string | null>(null);
  const [cellContent, setCellContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState('normal');
  const [textAlign, setTextAlign] = useState('center');
  const [verticalAlign, setVerticalAlign] = useState('middle');
  const [borderStyle, setBorderStyle] = useState({
    top: '1px solid #ccc',
    right: '1px solid #ccc',
    bottom: '1px solid #ccc',
    left: '1px solid #ccc',
  });

  // 调整表格大小
  const resizeTable = (newRows: number, newCols: number) => {
    const newTableData = initializeTable(newRows, newCols);

    // 复制现有数据
    for (let i = 0; i < Math.min(rows, newRows); i++) {
      for (let j = 0; j < Math.min(cols, newCols); j++) {
        newTableData[i][j] = { ...tableData[i][j] };
      }
    }

    setRows(newRows);
    setCols(newCols);
    setTableData(newTableData);
    setSelectedCells([]);
  };

  // 处理单元格点击
  const handleCellClick = (rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    event.preventDefault();

    const cellId = `${rowIndex}-${colIndex}`;

    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      setSelectedCells(prev =>
        prev.includes(cellId) ? prev.filter(id => id !== cellId) : [...prev, cellId]
      );
    } else {
      // 单选模式
      setSelectedCells([cellId]);
      setStartCell(cellId);
      setIsSelecting(true);

      // 更新编辑区域的值
      const cell = tableData[rowIndex][colIndex];
      setCellContent(cell.content);
      setBackgroundColor(cell.backgroundColor);
      setTextColor(cell.textColor);
      setFontWeight(cell.fontWeight);
      setTextAlign(cell.textAlign);
      setVerticalAlign(cell.verticalAlign);
      setBorderStyle({
        top: cell.borderTop,
        right: cell.borderRight,
        bottom: cell.borderBottom,
        left: cell.borderLeft,
      });
    }
  };

  // 处理鼠标移动（用于框选）
  const handleCellMouseEnter = (rowIndex: number, colIndex: number) => {
    if (!isSelecting || !startCell) return;

    try {
      const [startRow, startCol] = startCell.split('-').map(Number);

      // 计算选择区域
      const minRow = Math.min(startRow, rowIndex);
      const maxRow = Math.max(startRow, rowIndex);
      const minCol = Math.min(startCol, colIndex);
      const maxCol = Math.max(startCol, colIndex);

      // 创建选择区域内的所有单元格ID
      const newSelectedCells = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelectedCells.push(`${r}-${c}`);
        }
      }

      setSelectedCells(newSelectedCells);
    } catch (error) {
      console.error('选择单元格时出错:', error);
    }
  };

  // 处理鼠标抬起（结束选择）
  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // 更新单元格内容
  const updateCellContent = () => {
    const newTableData = [...tableData];

    selectedCells.forEach(cellId => {
      const [rowIndex, colIndex] = cellId.split('-').map(Number);
      if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < cols) {
        newTableData[rowIndex][colIndex] = {
          ...newTableData[rowIndex][colIndex],
          content: cellContent,
        };
      }
    });

    setTableData(newTableData);
  };

  // 更新单元格样式
  const updateCellStyle = (property: string, value: string) => {
    const newTableData = [...tableData];

    selectedCells.forEach(cellId => {
      const [rowIndex, colIndex] = cellId.split('-').map(Number);
      if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < cols) {
        newTableData[rowIndex][colIndex] = {
          ...newTableData[rowIndex][colIndex],
          [property]: value,
        };
      }
    });

    setTableData(newTableData);
  };

  // 合并单元格
  const mergeCells = () => {
    if (selectedCells.length <= 1) return;

    // 找出选择区域的边界
    const rowIndices = selectedCells.map(id => parseInt(id.split('-')[0]));
    const colIndices = selectedCells.map(id => parseInt(id.split('-')[1]));

    const minRow = Math.min(...rowIndices);
    const maxRow = Math.max(...rowIndices);
    const minCol = Math.min(...colIndices);
    const maxCol = Math.max(...colIndices);

    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;

    // 检查是否是矩形区域
    if (selectedCells.length !== rowSpan * colSpan) {
      alert('只能合并矩形区域的单元格');
      return;
    }

    const newTableData = [...tableData];

    // 设置主单元格
    newTableData[minRow][minCol] = {
      ...newTableData[minRow][minCol],
      rowSpan,
      colSpan,
    };

    // 隐藏其他单元格
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r !== minRow || c !== minCol) {
          newTableData[r][c] = {
            ...newTableData[r][c],
            rowSpan: 0,
            colSpan: 0,
          };
        }
      }
    }

    setTableData(newTableData);
    setSelectedCells([`${minRow}-${minCol}`]);
  };

  // 拆分单元格
  const splitCells = () => {
    if (selectedCells.length !== 1) return;

    const [rowIndex, colIndex] = selectedCells[0].split('-').map(Number);
    const cell = tableData[rowIndex][colIndex];

    if (cell.rowSpan <= 1 && cell.colSpan <= 1) return;

    const newTableData = [...tableData];

    // 恢复主单元格
    newTableData[rowIndex][colIndex] = {
      ...newTableData[rowIndex][colIndex],
      rowSpan: 1,
      colSpan: 1,
    };

    // 恢复被隐藏的单元格
    for (let r = rowIndex; r < rowIndex + cell.rowSpan; r++) {
      for (let c = colIndex; c < colIndex + cell.colSpan; c++) {
        if (r !== rowIndex || c !== colIndex) {
          newTableData[r][c] = {
            ...newTableData[r][c],
            rowSpan: 1,
            colSpan: 1,
          };
        }
      }
    }

    setTableData(newTableData);
  };

  // 导出表格数据
  const exportTableData = () => {
    if (onSave) {
      onSave(tableData);
    }

    // 创建可下载的JSON文件
    const dataStr = JSON.stringify(tableData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = 'table-data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入表格数据
  const importTableData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData) && importedData.length > 0) {
          setRows(importedData.length);
          setCols(importedData[0].length);
          setTableData(importedData);
        }
      } catch (error) {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  // 生成HTML表格代码
  const generateHtmlCode = () => {
    let html = '<table style="border-collapse: collapse; width: 100%;">\n';

    // 添加列标题行
    html += '  <thead>\n    <tr>\n      <th></th>\n';
    for (let c = 0; c < cols; c++) {
      html += `      <th>${colHeaders[c]}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';

    // 添加表格内容
    html += '  <tbody>\n';
    for (let r = 0; r < rows; r++) {
      html += `    <tr>\n      <td>${r + 1}</td>\n`;
      for (let c = 0; c < cols; c++) {
        const cell = tableData[r][c];

        // 跳过被合并的单元格
        if (cell.rowSpan === 0 || cell.colSpan === 0) continue;

        const style = `
          background-color: ${cell.backgroundColor};
          color: ${cell.textColor};
          font-weight: ${cell.fontWeight};
          text-align: ${cell.textAlign};
          vertical-align: ${cell.verticalAlign};
          border-top: ${cell.borderTop};
          border-right: ${cell.borderRight};
          border-bottom: ${cell.borderBottom};
          border-left: ${cell.borderLeft};
        `;

        html += `      <td
        ${cell.rowSpan > 1 ? `rowspan="${cell.rowSpan}"` : ''}
        ${cell.colSpan > 1 ? `colspan="${cell.colSpan}"` : ''}
        style="${style.trim()}"
      >${cell.content}</td>\n`;
      }
      html += '    </tr>\n';
    }
    html += '  </tbody>\n</table>';

    return html;
  };

  // 复制HTML代码到剪贴板
  const copyHtmlCode = () => {
    const htmlCode = generateHtmlCode();
    navigator.clipboard
      .writeText(htmlCode)
      .then(() => alert('HTML代码已复制到剪贴板'))
      .catch(err => console.error('复制失败:', err));
  };

  // 更新边框样式
  const updateBorder = (position: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    setBorderStyle(prev => ({
      ...prev,
      [position]: value,
    }));

    const borderProperty = `border${position.charAt(0).toUpperCase() + position.slice(1)}`;
    updateCellStyle(borderProperty, value);
  };

  useEffect(() => {
    // 添加全局鼠标抬起事件监听
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="rows">行数:</Label>
          <Input
            id="rows"
            type="number"
            min="1"
            max="100"
            value={rows}
            onChange={e => setRows(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="cols">列数:</Label>
          <Input
            id="cols"
            type="number"
            min="1"
            max="26"
            value={cols}
            onChange={e => setCols(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <Button onClick={() => resizeTable(rows, cols)}>调整表格大小</Button>
        <Button onClick={mergeCells} disabled={selectedCells.length <= 1}>
          合并单元格
        </Button>
        <Button onClick={splitCells} disabled={selectedCells.length !== 1}>
          拆分单元格
        </Button>
        <Button onClick={exportTableData}>导出表格</Button>
        <label className="cursor-pointer">
          <span className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
            导入表格
          </span>
          <input type="file" accept=".json" onChange={importTableData} className="hidden" />
        </label>
        <Button onClick={copyHtmlCode}>复制HTML代码</Button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        {/* 表格编辑区域 */}
        <div className="overflow-auto border rounded-md">
          <table className="border-collapse">
            <colgroup>
              <col style={{ width: '4rem' }} /> {/* 第一列（序号列）宽度 */}
              {Array.from({ length: cols }, (_, i) => (
                <col key={i} style={{ width: i === 1 ? '9rem' : '4rem' }} /> /* B列宽度设置为9rem */
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="h-8 bg-gray-100 border"></th>
                {Array.from({ length: cols }, (_, i) => (
                  <th key={i} className="h-8 bg-gray-100 border text-center">
                    {colHeaders[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-8 h-8 bg-gray-100 border text-center">{rowIndex + 1}</td>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const cell = tableData[rowIndex][colIndex];
                    const isSelected = selectedCells.includes(`${rowIndex}-${colIndex}`);

                    // 跳过被合并的单元格
                    if (cell.rowSpan === 0 || cell.colSpan === 0) {
                      return null;
                    }

                    return (
                      <td
                        key={colIndex}
                        className={`border ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          width: colIndex === 1 ? '15rem' : '4rem', // B列宽度恢复到15rem
                          minWidth: colIndex === 1 ? '15rem' : '4rem', // 确保最小宽度也设置
                          height: '2rem',
                          backgroundColor: cell.backgroundColor,
                          color: cell.textColor,
                          fontWeight: cell.fontWeight,
                          textAlign: cell.textAlign as any,
                          verticalAlign: cell.verticalAlign as any,
                          borderTop: cell.borderTop,
                          borderRight: cell.borderRight,
                          borderBottom: cell.borderBottom,
                          borderLeft: cell.borderLeft,
                          padding: '0.25rem',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                        rowSpan={cell.rowSpan > 0 ? cell.rowSpan : undefined}
                        colSpan={cell.colSpan > 0 ? cell.colSpan : undefined}
                        onClick={e => handleCellClick(rowIndex, colIndex, e)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      >
                        {cell.content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 单元格属性编辑区域 */}
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

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cell-content">单元格内容</Label>
                  <Input
                    id="cell-content"
                    value={cellContent}
                    onChange={e => setCellContent(e.target.value)}
                    onBlur={updateCellContent}
                    placeholder="输入单元格内容"
                  />
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bg-color">背景颜色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      onBlur={() => updateCellStyle('backgroundColor', backgroundColor)}
                      className="w-12 h-8 p-0"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      onBlur={() => updateCellStyle('backgroundColor', backgroundColor)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">文字颜色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      onBlur={() => updateCellStyle('textColor', textColor)}
                      className="w-12 h-8 p-0"
                    />
                    <Input
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      onBlur={() => updateCellStyle('textColor', textColor)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-weight">字体粗细</Label>
                  <Select
                    value={fontWeight}
                    onValueChange={value => {
                      setFontWeight(value);
                      updateCellStyle('fontWeight', value);
                    }}
                  >
                    <SelectTrigger id="font-weight">
                      <SelectValue placeholder="选择字体粗细" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">正常</SelectItem>
                      <SelectItem value="bold">粗体</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-align">水平对齐</Label>
                  <Select
                    value={textAlign}
                    onValueChange={value => {
                      setTextAlign(value);
                      updateCellStyle('textAlign', value);
                    }}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="vertical-align">垂直对齐</Label>
                  <Select
                    value={verticalAlign}
                    onValueChange={value => {
                      setVerticalAlign(value);
                      updateCellStyle('verticalAlign', value);
                    }}
                  >
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

              <TabsContent value="border" className="space-y-4">
                <div className="space-y-2">
                  <Label>边框样式</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="border-top"
                        checked={borderStyle.top !== 'none'}
                        onCheckedChange={checked => {
                          updateBorder('top', checked ? '1px solid #000' : 'none');
                        }}
                      />
                      <Label htmlFor="border-top">上边框</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="border-right"
                        checked={borderStyle.right !== 'none'}
                        onCheckedChange={checked => {
                          updateBorder('right', checked ? '1px solid #000' : 'none');
                        }}
                      />
                      <Label htmlFor="border-right">右边框</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="border-bottom"
                        checked={borderStyle.bottom !== 'none'}
                        onCheckedChange={checked => {
                          updateBorder('bottom', checked ? '1px solid #000' : 'none');
                        }}
                      />
                      <Label htmlFor="border-bottom">下边框</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="border-left"
                        checked={borderStyle.left !== 'none'}
                        onCheckedChange={checked => {
                          updateBorder('left', checked ? '1px solid #000' : 'none');
                        }}
                      />
                      <Label htmlFor="border-left">左边框</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>边框预设</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newBorder = '1px solid #000';
                        updateBorder('top', newBorder);
                        updateBorder('right', newBorder);
                        updateBorder('bottom', newBorder);
                        updateBorder('left', newBorder);
                      }}
                    >
                      所有边框
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateBorder('top', 'none');
                        updateBorder('right', 'none');
                        updateBorder('bottom', 'none');
                        updateBorder('left', 'none');
                      }}
                    >
                      无边框
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateBorder('top', '1px solid #000');
                        updateBorder('bottom', '1px solid #000');
                        updateBorder('left', 'none');
                        updateBorder('right', 'none');
                      }}
                    >
                      上下边框
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateBorder('left', '1px solid #000');
                        updateBorder('right', '1px solid #000');
                        updateBorder('top', 'none');
                        updateBorder('bottom', 'none');
                      }}
                    >
                      左右边框
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
