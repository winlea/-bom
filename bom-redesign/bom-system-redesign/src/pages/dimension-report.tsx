import React, { useEffect, useMemo, useState } from 'react';
import Layout, { Breadcrumb } from '../components/layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Ruler } from 'lucide-react';
import { DimensionImageGenerator } from '@/components/dimensions';

interface DimRow {
  id: number;
  groupNo: number;
  dimensionType: string;
  nominalValue: string;
  toleranceValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  datum: string;
  characteristic: string;
  notes: string;
  imageUrl?: string;
}

interface DimensionGroup {
  groupNumber: number;
  rows: DimRow[];
}

type MeasuredMap = Record<number, string[]>; // key: row.id -> [v1..v5]

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  // 抽取第一个数字（支持负号/小数点），兼容 "±0.2" 这种格式
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function getTolerance(row: DimRow): { upper: number; lower: number } | null {
  const up = parseNum(row.upperTolerance);
  const low = parseNum(row.lowerTolerance);
  if (up !== null && low !== null) return { upper: up, lower: low };
  const t = parseNum(row.toleranceValue);
  const nominal = parseNum(row.nominalValue);
  // 容错：t 存在则对称公差
  if (t !== null && nominal !== null) return { upper: t, lower: -t };
  return null;
}

function isOutOfTolerance(row: DimRow, valueStr: string): boolean {
  const v = parseNum(valueStr);
  const nominal = parseNum(row.nominalValue);
  if (v === null || nominal === null) return false; // 未输入或无基准则不判红
  const tol = getTolerance(row);
  if (!tol) return false;
  const delta = v - nominal;
  return delta < tol.lower || delta > tol.upper;
}

export default function DimensionReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sp = new URLSearchParams(location.search);
  const projectId = sp.get('project_id') || '131231';
  const projectName = sp.get('project_name') || '';
  const [partNumber, setPartNumber] = useState<string>(sp.get('part_number') || '');

  const [loading, setLoading] = useState(false);
  const [dimensionData, setDimensionData] = useState<DimRow[]>([]);
  const [measured, setMeasured] = useState<MeasuredMap>({});
  const [parts, setParts] = useState<Array<{ id: number; part_number?: string; part_name?: string }>>([]);

  const fetchParts = async (projectId: string) => {
    try {
      const r = await fetch(`/api/parts?project_id=${projectId}`);
      const j = await r.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(j)) items = j;
      else if (j && Array.isArray(j.items)) items = j.items;
      else if (j && Array.isArray(j.data)) items = j.data;
      setParts(items);
    } catch (e) {
      setParts([]);
    }
  };

  const fetchDimensions = async (retryCount = 0) => {
    setLoading(true);
    try {
      if (!partNumber) {
        setDimensionData([]);
        setMeasured({});
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const url = `http://localhost:5000/api/dimensions/projects/${projectId}?part_number=${encodeURIComponent(partNumber)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const transformed: DimRow[] = result.data.map((item: any) => ({
            id: item.id,
            groupNo: item.groupNo,
            dimensionType: item.dimensionType,
            nominalValue: item.nominalValue,
            toleranceValue: item.toleranceValue || '',
            upperTolerance: item.upperTolerance || '',
            lowerTolerance: item.lowerTolerance || '',
            datum: item.datum || '',
            characteristic: item.characteristic || '',
            notes: item.notes || '',
            imageUrl: item.imageUrl || item.image_url || '',
          }));
          setDimensionData(transformed);
          // 初始化实测值
          const init: MeasuredMap = {};
          transformed.forEach((r) => (init[r.id] = ['', '', '', '', '']));
          setMeasured(init);
        } else {
          throw new Error(result.message || '服务器返回错误');
        }
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e: any) {
      // 回退默认数据
      const fallback: DimRow[] = [
        {
          id: 1,
          groupNo: 1,
          dimensionType: 'diameter',
          nominalValue: '',
          toleranceValue: '+0.1/-0.5',
          upperTolerance: '0.1',
          lowerTolerance: '-0.5',
          datum: '',
          characteristic: 'CC01',
          notes: '默认数据',
        },
        {
          id: 2,
          groupNo: 2,
          dimensionType: 'normal',
          nominalValue: '',
          toleranceValue: '±0.2',
          upperTolerance: '0.2',
          lowerTolerance: '-0.2',
          datum: 'A',
          characteristic: 'SC02',
          notes: '默认数据',
        },
      ];
      setDimensionData(fallback);
      const init: MeasuredMap = {};
      fallback.forEach((r) => (init[r.id] = ['', '', '', '', '']));
      setMeasured(init);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    fetchDimensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, partNumber]);

  useEffect(() => {
    const sp2 = new URLSearchParams(location.search);
    const pn = sp2.get('part_number') || '';
    setPartNumber(pn);
  }, [location.search]);

  const groups: DimensionGroup[] = useMemo(() => {
    const g: Record<number, DimRow[]> = {};
    dimensionData.forEach((r) => {
      if (!g[r.groupNo]) g[r.groupNo] = [];
      g[r.groupNo].push(r);
    });
    return Object.keys(g)
      .map((k) => ({ groupNumber: parseInt(k, 10), rows: g[parseInt(k, 10)] }))
      .sort((a, b) => a.groupNumber - b.groupNumber);
  }, [dimensionData]);

  const handleChange = (rowId: number, idx: number, value: string) => {
    setMeasured((prev) => {
      const next = { ...prev };
      const arr = [...(next[rowId] || ['', '', '', '', ''])];
      arr[idx] = value;
      next[rowId] = arr;
      return next;
    });
  };

  const cellClass = (row: DimRow, value: string) => {
    const out = isOutOfTolerance(row, value);
    if (out) {
      return 'w-24 h-8 text-center text-xs border border-red-400 bg-red-50 text-red-700 focus-visible:ring-red-400';
    }
    if (value && !out) {
      return 'w-24 h-8 text-center text-xs border border-green-300 bg-green-50 text-green-700 focus-visible:ring-green-300';
    }
    return 'w-24 h-8 text-center text-xs border border-slate-200 focus-visible:ring-blue-400';
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: projectName || `项目 ${projectId}`, to: `/parts?project_id=${projectId}` },
            { label: partNumber || '零件', to: undefined },
            { label: '尺寸报告' },
          ]}
        />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Ruler className="h-6 w-6" />
              尺寸报告
            </h1>
            <p className="text-slate-600 mt-1">
              项目：{projectName || projectId}，零件：{partNumber || '-'}
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={partNumber}
              onValueChange={(v) => {
                setPartNumber(v);
                navigate(
                  `/dimension-report?project_id=${projectId}&project_name=${encodeURIComponent(projectName)}&part_number=${encodeURIComponent(v)}`,
                  { replace: true }
                );
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="选择零件（当前项目）" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((p) => {
                  const label = String(p.part_number || p.part_name || '-');
                  const val = String(p.part_number || p.part_name || '');
                  return (
                    <SelectItem key={p.id} value={val}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => navigate(`/parts?project_id=${projectId}`)}>
              返回零件列表
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              打印/导出PDF
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Excel风格尺寸录入
              <span className="text-sm font-normal text-slate-500 ml-2">共 {dimensionData.length} 条尺寸</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">加载中...</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="border-collapse w-full bg-white" style={{ minWidth: 1000 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                    <th
                      className="text-center py-2 px-2 font-bold text-slate-800 border-r-2 border-slate-300 bg-blue-50"
                      style={{ width: 70, minWidth: 70 }}
                    >
                      编号
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      名义值
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      上公差
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      下公差
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      特殊特性
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      图纸尺寸
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      数据1
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      数据2
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      数据3
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700 border-r border-slate-200">
                      数据4
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700">数据5</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, groupIndex) => (
                    <React.Fragment key={group.groupNumber}>
                      {groupIndex > 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            className="h-1 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 border-0"
                          ></td>
                        </tr>
                      )}
                      {group.rows.map((row, idx) => {
                        const mv = measured[row.id] || ['', '', '', '', ''];
                        return (
                          <tr
                            key={row.id}
                            className={`${
                              idx === 0 ? 'border-t-2 border-blue-200' : 'border-t border-slate-100'
                            } border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 ${
                              idx === group.rows.length - 1 ? 'border-b-2 border-blue-200' : ''
                            }`}
                            style={{ height: 56, minHeight: 56 }}
                          >
                            {idx === 0 && (
                              <td
                                rowSpan={group.rows.length}
                                className="text-center p-1 border-r-2 border-blue-300 align-middle bg-gradient-to-b from-blue-50 to-blue-100 relative"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 rounded-l-lg"></div>
                                <div className="relative flex items-center justify-center h-full">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border border-white">
                                    {group.groupNumber}
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="text-center p-1 border-r border-slate-200">
                              <div className="px-2 py-1 bg-blue-50 rounded-md border border-blue-200 text-sm font-bold text-blue-800">
                                {row.nominalValue || '—'}
                              </div>
                            </td>
                            <td className="text-center p-1 border-r border-slate-200">
                              <div className="px-2 py-1 bg-green-50 rounded-md border border-green-200 text-sm font-medium text-green-700">
                                {row.upperTolerance || '—'}
                              </div>
                            </td>
                            <td className="text-center p-1 border-r border-slate-200">
                              <div className="px-2 py-1 bg-red-50 rounded-md border border-red-200 text-sm font-medium text-red-700">
                                {row.lowerTolerance || '—'}
                              </div>
                            </td>
                            <td className="text-center p-1 border-r border-slate-200">
                              <div className="px-2 py-1 bg-yellow-50 rounded-md border border-yellow-200 text-sm font-medium text-yellow-700">
                                {row.characteristic || '—'}
                              </div>
                            </td>
                            <td
                              className="text-center p-1 border-r border-slate-200"
                              style={{
                                padding: '8px',
                                minHeight: '56px',
                                height: '56px',
                                verticalAlign: 'middle',
                                minWidth: '120px',
                                width: '120px',
                              }}
                            >
                              {(row.dimensionType === 'image_dimension' || row.dimensionType === 'image') &&
                              row.imageUrl ? (
                                <div className="flex justify-center items-center p-1">
                                  <img
                                    src={`http://localhost:5000${row.imageUrl}`}
                                    alt="尺寸图片"
                                    className="object-contain border border-gray-200 rounded"
                                    style={{ maxWidth: '110px', maxHeight: '40px' }}
                                    onClick={() => window.open(`http://localhost:5000${row.imageUrl}`, '_blank')}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <DimensionImageGenerator
                                    dimensionType={row.dimensionType}
                                    nominalValue={row.nominalValue}
                                    toleranceValue={row.toleranceValue}
                                    upperTolerance={row.upperTolerance}
                                    lowerTolerance={row.lowerTolerance}
                                    datum={row.datum}
                                    className="mx-auto scale-75"
                                  />
                                </div>
                              )}
                            </td>
                            {[0, 1, 2, 3, 4].map((i) => (
                              <td key={i} className={`text-center p-1 ${i < 4 ? 'border-r border-slate-200' : ''}`}>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={`数据${i + 1}`}
                                  className={cellClass(row, mv[i])}
                                  value={mv[i]}
                                  onChange={(e) => handleChange(row.id, i, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-slate-500">
          判定规则：若有上/下公差，判定 v 是否满足 nominal + lower ≤ v ≤ nominal + upper；否则若公差值存在，判定 |v -
          nominal| ≤ toleranceValue；否则不判定。
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="h-4 w-4 mr-1" />
            打印/导出PDF
          </Button>
        </div>
      </div>
    </Layout>
  );
}
