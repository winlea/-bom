import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Breadcrumb } from '@/components/layout';
import TableEditor from '@/components/table-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Cell = {
  id: string;
  content: string;
  rowSpan: number;
  colSpan: number;
  selected: boolean;
  backgroundColor: string;
  textColor: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  height?: string;
};

const todayStr = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

// 工具：创建一行（自动处理合并后的隐藏单元格）
function makeRow(
  rowIdx: number,
  defs: Array<{
    col: number;
    content: string;
    colSpan?: number;
    rowSpan?: number;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    bg?: string;
  }>
): Cell[] {
  const cols = 16;
  const base: Cell[] = Array.from({ length: cols }, (_, colIdx) => ({
    id: `${rowIdx}-${colIdx}`,
    content: '',
    rowSpan: 1,
    colSpan: 1,
    selected: false,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontWeight: 'normal',
    textAlign: 'center',
    verticalAlign: 'middle',
    borderTop: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    borderLeft: '1px solid #000',
  }));

  // 放置定义
  defs.forEach((d) => {
    const col = Math.max(0, Math.min(15, d.col));
    base[col].content = d.content ?? '';
    if (d.colSpan && d.colSpan > 1) base[col].colSpan = d.colSpan;
    if (d.rowSpan && d.rowSpan > 1) base[col].rowSpan = d.rowSpan;
    if (d.align) base[col].textAlign = d.align;
    if (d.bold) base[col].fontWeight = 'bold';
    if (d.bg) base[col].backgroundColor = d.bg;
  });

  // 处理合并隐藏（仅横向 colSpan）
  for (let c = 0; c < cols; c++) {
    const span = base[c].colSpan || 1;
    if (span > 1) {
      for (let k = c + 1; k < c + span && k < cols; k++) {
        base[k].rowSpan = 0;
        base[k].colSpan = 0;
        base[k].content = '';
      }
    }
  }
  return base;
}

// 一比一复刻：专注表头与表尾（中间留白供后续补图与明细）
// 说明：列为 A-P 共16列（索引0~15），行按视觉顺序构建
const odsTemplateData: Cell[][] = [
  // 第1行（A1-P1）标题
  makeRow(0, [{ col: 0, content: 'Inspection Instruction  检验指导书', colSpan: 16, bold: true }]),

  // 第2行（表头第一行）
  // A2-C2 公司Logo区；D2-E2 Program 项目；F2 值；G2 Customer 客户；H2 值；
  // I2 Part Name 产品名称；J2-K2 值；L2 Material 材料规格；M2 工艺流程；N2/O2/P2 留空
  makeRow(1, [
    { col: 0, content: 'WINLY logo 及公司英文名', colSpan: 3, align: 'left' },
    { col: 3, content: 'Program: 项目：', colSpan: 2, align: 'left' },
    { col: 5, content: 'WZ1D', bg: '#e6f7ff' },
    { col: 6, content: 'Customer 客户：', align: 'left' },
    { col: 7, content: '奇车亚（武汉）', bg: '#e6f7ff' },
    { col: 8, content: 'Part Name: 产品名称：', align: 'left' },
    { col: 9, content: 'REINFORCEMENT_BRACKET_LEFT', colSpan: 2, bg: '#e6f7ff' },
    { col: 11, content: 'Material 材料规格：', align: 'left' },
    { col: 12, content: 'Q/BQB 419 HC420LA  T=1.0±0.08', bg: '#e6f7ff' },
    { col: 13, content: 'Process Flow 工艺流程', align: 'center' },
    { col: 14, content: '' },
    { col: 15, content: '' },
  ]),

  // 第3行（表头第二行）
  // A3-C3 中文公司名；D3-E3 Station Name 本工序名称；F3 值 冲压；
  // G3 配套日期/版本；H3 值；I3 Part NO 产品编号；J3 值4266005；K3 值4266006；
  // L3-M3 Q/BOB...；N3 上工序；O3 本工序；P3 下工序
  makeRow(2, [
    { col: 0, content: '永利汽车零部件（武汉）有限公司', colSpan: 3, align: 'left' },
    { col: 3, content: 'Station Name: 本工序名称：', colSpan: 2, align: 'left' },
    { col: 5, content: '冲压', bg: '#e6f7ff' },
    { col: 6, content: '配套日期/版本', align: 'left' },
    { col: 7, content: '4266005/01', bg: '#e6f7ff' },
    { col: 8, content: 'Part NO  产品编号：', align: 'left' },
    { col: 9, content: '4266005', bg: '#e6f7ff' },
    { col: 10, content: '4266006', bg: '#e6f7ff' },
    { col: 11, content: 'Q/BOB 419  HC420LA   T=1.0±0.08', colSpan: 2, bg: '#e6f7ff' },
    { col: 13, content: '上工序' },
    { col: 14, content: '本工序' },
    { col: 15, content: '下工序' },
  ]),

  // 第4行（外观检验 / 简图标题行）
  makeRow(3, [
    { col: 0, content: '外观检验', colSpan: 5, bold: true },
    { col: 5, content: 'Operation Illustration 简图', colSpan: 11, bold: true },
  ]),

  // 第5行（外观检验 表头）
  makeRow(4, [
    { col: 0, content: 'Stn NO 序号' },
    { col: 1, content: 'Key-Control 关键控制项目' },
    { col: 2, content: 'Checks 检查方法' },
    { col: 3, content: 'Specification 规格' },
    { col: 4, content: 'Frequency 频率' },
    { col: 5, content: 'REINFORCEMENT_BRACKET_LEFT', colSpan: 9 },
    { col: 14, content: '' }, // 保留，右侧说明另起行
    { col: 15, content: '' },
  ]),

  // 第6-8行（占位，保持网格与边框，后续可拖拽编辑）
  makeRow(5, [
    { col: 0, content: '1' },
    { col: 1, content: '无毛刺、裂痕、划伤、毛刺，边口不变形。', align: 'left' },
    { col: 2, content: '目视/卡尺' },
    { col: 3, content: 'CR' },
    { col: 4, content: '首/巡/末检' },
    { col: 5, content: '', colSpan: 9 },
  ]),
  makeRow(6, [
    { col: 0, content: '2' },
    { col: 1, content: '尺寸检查：关键尺寸，位置度。', align: 'left' },
    { col: 2, content: '量具/卡尺' },
    { col: 3, content: 'MA' },
    { col: 4, content: '首/巡/末检' },
    { col: 5, content: '', colSpan: 9 },
  ]),
  makeRow(7, [
    { col: 0, content: '3' },
    { col: 1, content: '表面完整性：焊点、划伤等。', align: 'left' },
    { col: 2, content: '目视' },
    { col: 3, content: 'MI' },
    { col: 4, content: '首/巡/末检' },
    { col: 5, content: '', colSpan: 9 },
  ]),

  // 第9行（备注，行距收紧）
  (() => {
    const r = makeRow(8, [
      {
        col: 0,
        content: '备注标记 CR：主要尺寸  MA：次要尺寸  MI：关键点',
        colSpan: 5,
        align: 'left',
      },
      { col: 5, content: '', colSpan: 9 },
      {
        col: 14,
        content: '2. 零件要求：无漏喷涂死角，不可有毛刺，不允许有锈斑，保证密封性。',
        colSpan: 2,
        align: 'left',
      },
    ]);
    r.forEach((c) => {
      c.height = '1.5rem';
    });
    return r;
  })(),

  // 中间空白区（保留20行用于图纸、尺寸检验明细，可在编辑器中继续调整）
  ...Array.from({ length: 12 }, (_, idx) => makeRow(9 + idx, [{ col: 0, content: '' }])),

  // 表尾区域（一比一复刻）
  // 说明列（A-F合并 4条） + 中部（F-G/H区域 2条） + 右侧（H/I-J 区域 公差矩阵）
  makeRow(21, [
    { col: 0, content: '1. 首检2PCS；巡检每2小时2PCS；末检2PCS', colSpan: 5, align: 'left' },
    { col: 5, content: '图纸未注公差参照 GB/T1804-m', colSpan: 2, align: 'left' },
    { col: 7, content: '>1000～<2000', align: 'left' },
    { col: 9, content: '±1.2', align: 'left' },
  ]),
  makeRow(22, [
    {
      col: 0,
      content: '2. 发现任何在线的不合格品都要依照不合格品处理流程处理；',
      colSpan: 5,
      align: 'left',
    },
    { col: 5, content: '一般角度公差 ±1°', colSpan: 2, align: 'left' },
    { col: 7, content: '>400～<2000', align: 'left' },
    { col: 9, content: '±0.8', align: 'left' },
  ]),
  makeRow(23, [
    {
      col: 0,
      content: '3. 发现任何不合格的产品或过程必须立即报告当班班长或主管；',
      colSpan: 6,
      align: 'left',
    },
    { col: 7, content: '>120～<400', align: 'left' },
    { col: 9, content: '±0.5', align: 'left' },
    { col: 10, content: 'A0' },
    { col: 11, content: '首次发行' },
    { col: 12, content: '陈星伦' },
    { col: 13, content: '朱继斌' },
    { col: 14, content: todayStr },
  ]),
  makeRow(24, [
    {
      col: 0,
      content: '4. 发现任何安全隐患必须及时报告当班班长或主管。',
      colSpan: 6,
      align: 'left',
    },
    { col: 7, content: '>30～<120', align: 'left' },
    { col: 9, content: '±0.3', align: 'left' },
    { col: 10, content: '版本' },
    { col: 11, content: '更改描述' },
    { col: 12, content: '校对' },
    { col: 13, content: '审核' },
    { col: 14, content: '日期' },
  ]),
  makeRow(25, [
    { col: 7, content: '>6～<30', align: 'left' },
    { col: 9, content: '±0.2', align: 'left' },
  ]),
  makeRow(26, [
    { col: 7, content: '<6', align: 'left' },
    { col: 9, content: '±0.1', align: 'left' },
  ]),

  // 签名行（最底部）
  makeRow(27, [
    { col: 0, content: '编制：', align: 'center' },
    { col: 2, content: '王亮', align: 'center' },
    { col: 9, content: '审核：', align: 'center' },
    { col: 14, content: '批准：', align: 'center' },
  ]),
];

// 附加：显式隐藏某些被合并覆盖的单元（多行合并暂未使用，横向已自动处理）
function postProcessAll(rows: Cell[][]): Cell[][] {
  return rows;
}

const finalData = postProcessAll(odsTemplateData);

export default function TableEditorPage() {
  const [tableData, setTableData] = useState<Cell[][] | null>(null);

  useEffect(() => {
    setTableData(finalData);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Breadcrumb items={[{ label: '表格编辑器' }]} />
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-800">表格编辑器</h1>
          <p className="text-slate-600">
            ODS模板编辑（表头/表尾已按图片一比一复刻，中间留白可继续拖拽编辑、合并、填图）。
          </p>
        </div>

        <Tabs defaultValue="template" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="template">ODS模板</TabsTrigger>
          </TabsList>

          <TabsContent value="template">
            <div className="border rounded-lg overflow-hidden shadow-sm p-4 bg-gray-900 text-white">
              {tableData && <TableEditor initialRows={finalData.length} initialCols={16} initialData={tableData} />}
              {!tableData && <div className="text-center p-4">加载ODS模板中...</div>}
            </div>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>说明</CardTitle>
                <CardDescription>表头与表尾已对齐图片；右下角日期自动取当天，其他固定字段不变。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>中部区域可自由拖拽合并、粘贴图片（作为简图/工程图），也可继续添加“尺寸检验”明细。</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
