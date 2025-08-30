import React, { useMemo, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/layout';
import { useSearchParams } from 'react-router-dom';

// ODS预览数据类型定义
interface ODSPreviewData {
  headerData: {
    program: string;
    customer: string;
    partName: string;
    partNo: string;
    material: string;
    station: string;
    date: string;
    qbob: string;
  };
  selectedPart: string;
  tableData: Array<{
    id: number;
    str_no: number | string;
    neral_no: string;
    checks: string;
    ccsc: string;
    frequency: string;
    remarks: string;
    imageUrl?: string; // 添加图片URL字段
  }>;
}

export default function TemplatePreviewPage() {
  // 获取URL参数
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  // 默认使用你提供的模板路径（相对于项目根）
  const [tplPath, setTplPath] = useState<string>('templates/WZ1D_冲压ODS_4266005&4266006.xlsx');
  const [odsData, setOdsData] = useState<ODSPreviewData | null>(null);

  // 格式化技术规范文本，处理几何公差符号
  const formatTechnicalNote = (text: string): string => {
    if (!text) return '';
    
    // 添加调试信息
    console.log('[DEBUG] formatTechnicalNote 输入:', text);
    
    // 临时强制测试：如果包含"0.5"，强制显示表格框格式
    if (text.includes('0.5')) {
      console.log('[DEBUG] 强制测试模式：检测到0.5，生成表格框格式');
      const toleranceTableStyle = 'display:inline-flex;border:2px solid #374151;font-family:Arial,sans-serif;vertical-align:middle;margin:2px;';
      const cellStyle = 'border-right:1px solid #374151;padding:4px 6px;background:white;text-align:center;font-size:12px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;';
      const lastCellStyle = 'padding:4px 6px;background:white;text-align:center;font-size:12px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;';
      const symbolStyle = 'padding:4px 6px;background:white;text-align:center;font-size:14px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;border-right:1px solid #374151;';
      
      const tableHtml = `<span style="${toleranceTableStyle}"><span style="${symbolStyle}">⊕</span><span style="${cellStyle}">0.5</span><span style="${cellStyle}">A</span><span style="${cellStyle}">B</span><span style="${lastCellStyle}">C</span></span>`;
      console.log('[DEBUG] 强制生成的HTML:', tableHtml);
      return tableHtml;
    }
    
    // 检查是否包含几何公差信息（位置度符号 + 数值 + 基准）
    const geometricTolerancePattern = /([⌖⌘⛶⊕])\s*([0-9.]+)\s*([A-Z\s]+)/;
    const match = text.match(geometricTolerancePattern);
    
    console.log('[DEBUG] 正则匹配结果:', match);
    
    if (match) {
      console.log('[DEBUG] 匹配到几何公差，生成表格框格式');
      
      // 几何公差表格样式
      const toleranceTableStyle = 'display:inline-flex;border:2px solid #374151;font-family:Arial,sans-serif;vertical-align:middle;margin:2px;';
      const cellStyle = 'border-right:1px solid #374151;padding:4px 6px;background:white;text-align:center;font-size:12px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;';
      const lastCellStyle = 'padding:4px 6px;background:white;text-align:center;font-size:12px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;';
      const symbolStyle = 'padding:4px 6px;background:white;text-align:center;font-size:14px;font-weight:bold;color:#374151;min-height:20px;display:flex;align-items:center;justify-content:center;border-right:1px solid #374151;';
      
      const [_, symbol, value, datums] = match;
      const datumList = datums.trim().split(/\s+/).filter(d => d.length > 0);
      
      console.log('[DEBUG] 解析结果:', { symbol, value, datums, datumList });
      
      // 构建表格框格式
      let tableHtml = `<span style="${toleranceTableStyle}">`;
      
      // 位置度符号框
      tableHtml += `<span style="${symbolStyle}">⊕</span>`;
      
      // 数值框
      tableHtml += `<span style="${cellStyle}">${value}</span>`;
      
      // 基准框（每个基准一个框）
      datumList.forEach((datum, index) => {
        const isLast = index === datumList.length - 1;
        const style = isLast ? lastCellStyle : cellStyle;
        tableHtml += `<span style="${style}">${datum}</span>`;
      });
      
      tableHtml += '</span>';
      
      console.log('[DEBUG] 生成的HTML:', tableHtml);
      return tableHtml;
    }
    
    console.log('[DEBUG] 不匹配几何公差模式，使用普通格式化');
    
    // 非几何公差的普通格式化
    // 位置度符号的CSS样式（单独圆圈符号）
    const positionSymbolStyle = 'display:inline-block;width:16px;height:16px;border:1.5px solid #374151;border-radius:50%;position:relative;vertical-align:middle;margin:0 2px;background:#f9fafb;';
    const positionSymbolInner = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;line-height:1;color:#374151;font-weight:bold;';
    const positionSymbol = `<span style="${positionSymbolStyle}"><span style="${positionSymbolInner}">+</span></span>`;
    
    // 将常见的几何公差符号替换为HTML实体或可显示的符号
    let formatted = text
      // 位置度符号 - 使用CSS绘制的圆圈加十字（用于非表格格式）
      .replace(/[⌖⌘⛶⊕]/g, positionSymbol)
      // 直径符号
      .replace(/[⌀Φ]/g, '&Phi;')
      // 正负号
      .replace(/±/g, '&plusmn;')
      // 其他几何公差符号
      .replace(/∅/g, '&#8709;')  // Empty set
      .replace(/○/g, '&#9711;')  // White circle (圆度)
      .replace(/◉/g, '&#9673;')  // Fisheye (同心度)
      .replace(/⏤/g, '&#9188;')  // Straightness
      .replace(/⏥/g, '&#9189;')  // Flatness
      // 如果仍然有位置度相关的文本，使用CSS符号
      .replace(/(position|POS|位置度)/gi, positionSymbol);
    
    console.log('[DEBUG] 普通格式化结果:', formatted);
    return formatted;
  };

  // 从sessionStorage获取ODS数据
  useEffect(() => {
    if (mode === 'ods-preview' || mode === 'ods-data-preview') {
      try {
        const storedData = sessionStorage.getItem('odsPreviewData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);

          // 适配新的数据格式
          if (mode === 'ods-data-preview' && parsedData.part) {
            // 转换为ODS预览数据格式
            const convertedData: ODSPreviewData = {
              headerData: {
                program: parsedData.project?.name || '',
                customer: parsedData.part.customer_name || '',
                partName: parsedData.part.part_name || '',
                partNo: parsedData.part.part_number || '',
                material: parsedData.part.material || '',
                station: parsedData.header_data?.stationName || '',
                date: parsedData.header_data?.drawingDate || '',
                qbob: parsedData.part.material_specification || '',
              },
              selectedPart: parsedData.part.id || '',
              tableData: parsedData.dimensions.map((dim: any, index: number) => ({
                id: index + 1,
                str_no: dim.sequence_no || index + 1, // 使用sequence_no作为编号
                neral_no:
                  dim.technical_note || `${dim.nominal_value || ''} ${dim.tolerance_value || ''}`, // 使用technical_note作为技术说明
                checks: dim.measurement_method || '卡尺/游标卡尺',
                ccsc: dim.characteristic_code || dim.characteristic || '', // 使用characteristic_code作为特性号码
                frequency: dim.frequency || '首/巡/末检',
                remarks: '',
                imageUrl: dim.imageUrl || dim.image_url || '', // 添加图片URL支持
              })),
            };
            setOdsData(convertedData);
          } else {
            setOdsData(parsedData);
          }
        }
      } catch (error) {
        console.error('读取ODS预览数据失败:', error);
      }
    }
  }, [mode]);

  const apiUrl = useMemo(() => {
    // 如果是ODS预览模式，不使用模板路径
    if ((mode === 'ods-preview' || mode === 'ods-data-preview') && odsData) {
      return '';
    }

    // 优先使用 LibreOffice 高保真转换
    const q = encodeURIComponent(tplPath);
    return `http://localhost:5000/api/templates/lo-preview?path=${q}`;
  }, [tplPath, mode, odsData]);

  // 强制刷新 iframe（避免浏览器缓存）
  const [nonce, setNonce] = useState<number>(Date.now());
  const refresh = () => setNonce(Date.now());

  // 渲染ODS预览内容
  const renderODSPreview = () => {
    if (!odsData) return null;

    const { headerData, tableData } = odsData;

    // 对数据按序号分组，用于合并单元格
    const groupedData = tableData.reduce((groups: Record<string, any[]>, row: any) => {
      const sequenceNo = String(row.str_no); // 确保序号为字符串
      if (!groups[sequenceNo]) {
        groups[sequenceNo] = [];
      }
      groups[sequenceNo].push(row);
      return groups;
    }, {});

    // 按序号排序
    const sortedGroups = Object.entries(groupedData).sort(([a], [b]) => {
      // 尝试数字排序，如果不是数字则按字符串排序
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    // 渲染表格行，支持序号列合并
    const renderTableRows = () => {
      const rows: JSX.Element[] = [];
      let globalRowIndex = 0;
      const totalRows = tableData.length;

      sortedGroups.forEach(([sequenceNo, groupRows]) => {
        groupRows.forEach((row, groupIndex) => {
          const isFirstInGroup = groupIndex === 0;
          const groupSize = groupRows.length;

          rows.push(
            <tr key={`${sequenceNo}-${groupIndex}`}>
              {/* 序号列：只在组的第一行显示，使用rowSpan合并 */}
              {isFirstInGroup && (
                <td
                  className="border border-gray-800 text-center p-3 bg-gradient-to-r from-blue-100 to-blue-50 font-bold text-blue-800"
                  rowSpan={groupSize}
                  style={{ 
                    verticalAlign: 'middle',
                    minWidth: '80px',
                    width: '80px',
                    fontSize: '16px'
                  }}
                >
                  {sequenceNo}
                </td>
              )}
              {/* 其他列：每行都显示 */}
              <td 
                className="border border-gray-800 text-center p-2 bg-white hover:bg-gray-50"
                style={{ 
                  minWidth: '200px', 
                  width: '200px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  fontFamily: 'Arial, "Segoe UI Symbol", "Noto Sans Symbols", sans-serif'
                }}
              >
                {/* 优先显示图片尺寸，所有图纸尺寸都应该是图片 */}
                {row.imageUrl && row.imageUrl.trim() !== '' ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={`http://localhost:5000${row.imageUrl}`}
                      alt={`图纸尺寸 序号${row.str_no}`}
                      className="object-contain rounded-md border-2 border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 bg-white"
                      style={{
                        maxWidth: '180px',
                        maxHeight: '80px',
                        minWidth: '100px',
                        minHeight: '60px',
                        padding: '4px'
                      }}
                      onClick={() => window.open(`http://localhost:5000${row.imageUrl}`, '_blank')}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        console.error('图片加载失败:', row.imageUrl);
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          // 图片加载失败时，显示文字技术规范
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.className = 'text-red-500 text-xs p-3 border border-red-300 rounded bg-red-50';
                          fallbackDiv.innerHTML = `
                            <div class="font-semibold mb-1">📷 图片加载失败</div>
                            <div class="text-gray-700">${formatTechnicalNote(row.neral_no)}</div>
                            <div class="text-blue-600 mt-2 cursor-pointer hover:underline" onclick="alert('请重新上传图片尺寸')">
                              重新上传
                            </div>
                          `;
                          parent.appendChild(fallbackDiv);
                        }
                      }}
                    />
                    <div className="text-xs text-blue-600 font-medium">
                      🖼️ 图纸尺寸图片
                    </div>
                  </div>
                ) : (
                  // 没有图片时，强烈提示需要上传图片尺寸
                  <div className="flex flex-col items-center space-y-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                    <div className="text-amber-600 text-lg">
                      ⚠️
                    </div>
                    <div className="text-amber-800 text-sm font-semibold text-center">
                      缺少图纸尺寸图片
                    </div>
                    <div className="text-xs text-gray-700 text-center px-2">
                      {row.neral_no ? (
                        <div className="mb-2">
                          文字规范: <span dangerouslySetInnerHTML={{ __html: formatTechnicalNote(row.neral_no) }} />
                        </div>
                      ) : (
                        <div className="mb-2 text-gray-500">暂无尺寸数据</div>
                      )}
                    </div>
                    <button 
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                      onClick={() => {
                        console.log('需要为序号', row.str_no, '上传图片尺寸');
                        alert(`请为序号 ${row.str_no} 上传图纸尺寸图片\n\n建议格式：类似您提供的表格框格式图片`);
                      }}>
                      📤 上传图片
                    </button>
                  </div>
                )}
              </td>
              <td 
                className="border border-gray-800 text-center p-2 bg-white hover:bg-gray-50"
                style={{ 
                  minWidth: '120px', 
                  width: '120px',
                  fontSize: '13px'
                }}
              >
                <span className="text-gray-700">{row.checks}</span>
              </td>
              <td 
                className="border border-gray-800 text-center p-2 bg-white hover:bg-gray-50"
                style={{ 
                  minWidth: '100px', 
                  width: '100px',
                  fontSize: '13px'
                }}
              >
                <span className="text-red-600 font-medium">{row.ccsc}</span>
              </td>
              <td 
                className="border border-gray-800 text-center p-2 bg-white hover:bg-gray-50"
                style={{ 
                  minWidth: '100px', 
                  width: '100px',
                  fontSize: '12px'
                }}
              >
                <span className="text-green-700">{row.frequency}</span>
              </td>
              
              {/* 图纸气泡图区域：简化显示，因为图片已在技术规范列中 */}
              {globalRowIndex === 0 && (
                <td 
                  colSpan={3} 
                  className="border border-gray-800 text-center p-4 bg-gradient-to-br from-blue-50 to-gray-50"
                  rowSpan={totalRows}
                  style={{ 
                    verticalAlign: 'middle',
                    minWidth: '300px',
                    width: '300px'
                  }}
                >
                  <div className="flex flex-col justify-center items-center h-full space-y-3">
                    {/* 图纸图标 */}
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <svg 
                        className="w-8 h-8 text-blue-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                    </div>
                    
                    {/* 文字说明 */}
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        图纸气泡图区域
                      </div>
                      <div className="text-xs text-gray-500">
                        零件技术图纸
                      </div>
                      <div className="text-xs text-blue-600 mt-2">
                        {headerData.partName}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        尺寸图片已在技术规范列中显示
                      </div>
                    </div>
                    
                    {/* 占位符边框 */}
                    <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white/50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">整体图纸预览区</span>
                    </div>
                  </div>
                </td>
              )}
            </tr>
          );
          globalRowIndex++;
        });
      });

      return rows;
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table
            className="border-collapse border-2 border-gray-800 w-full bg-white"
            style={{ 
              tableLayout: 'fixed',
              minWidth: '1000px' // 确保表格有足够宽度显示所有列
            }}
          >
          {/* 表头部分 */}
          <tbody>
            <tr>
              <td colSpan={2} className="border border-gray-800 text-center font-bold p-2">
                Winly Automotive (Wuhan) Limited
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                Program: {headerData.program}
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                Customer: {headerData.customer}
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                Part Name: {headerData.partName}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-gray-800 text-center font-bold p-2">
                永利汽车零部件（武汉）有限公司
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                Station Name: {headerData.station}
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                出货日期: {headerData.date}
              </td>
              <td colSpan={2} className="border border-gray-800 p-2">
                Part NO: {headerData.partNo}
              </td>
            </tr>
            <tr>
              <td colSpan={8} className="border border-gray-800 p-2">
                Q/BOB: {headerData.qbob}
              </td>
            </tr>

            {/* Operation Illustration 部分 */}
            <tr>
              <td colSpan={8} className="border border-gray-800 text-center font-bold p-2">
                Operation Illustration 简图
              </td>
            </tr>
            <tr>
              <td
                colSpan={4}
                className="border border-gray-800 text-center p-2"
                style={{ height: '200px' }}
              >
                <div className="flex items-center justify-center h-full">左侧侧板_LEFT</div>
              </td>
              <td colSpan={4} className="border border-gray-800 text-center p-2">
                <div className="flex items-center justify-center h-full">左侧侧板_RIGHT</div>
              </td>
            </tr>

            {/* 尺寸检验部分 */}
            <tr>
              <td colSpan={8} className="border border-gray-800 text-center font-bold p-2">
                尺寸检验
              </td>
            </tr>
            <tr className="bg-gray-100">
              <td 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '80px', width: '80px' }}
              >
                Str_NO
              </td>
              <td 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '200px', width: '200px' }}
              >
                NERAL_NO
              </td>
              <td 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '120px', width: '120px' }}
              >
                Checks
              </td>
              <td 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '100px', width: '100px' }}
              >
                CCSC
              </td>
              <td 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '100px', width: '100px' }}
              >
                Frequency
              </td>
              <td 
                colSpan={3} 
                className="border border-gray-800 text-center p-2 font-semibold"
                style={{ minWidth: '200px' }}
              >
                图纸气泡图
              </td>
            </tr>

            {/* 尺寸检验数据行 - 支持序号列合并 */}
            {renderTableRows()}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Breadcrumb items={[{ label: '模板预览' }]} />
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'ods-preview' ? 'ODS预览' : '模板预览（LibreOffice 高保真）'}
          </h1>

          {mode !== 'ods-preview' && (
            <>
              <p className="text-slate-600">
                后端将模板转换为 HTML 后展示在下方；推荐把模板放在项目 templates
                目录。当前默认模板：
                <span className="ml-2 font-mono px-2 py-1 bg-slate-100 rounded border border-slate-200">
                  {tplPath}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={tplPath}
                  onChange={e => setTplPath(e.target.value)}
                  className="w-[560px]"
                  placeholder="输入模板相对路径，例如：templates/xxx.xlsx 或 templates/xxx.ods"
                />
                <Button onClick={refresh} className="bg-blue-600 hover:bg-blue-700">
                  生成预览
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden shadow-sm">
          {mode === 'ods-preview' ? (
            renderODSPreview()
          ) : (
            <iframe
              key={nonce}
              title="模板预览"
              src={apiUrl}
              className="w-full"
              style={{ height: '80vh', background: 'white' }}
            />
          )}
        </div>

        {mode !== 'ods-preview' && (
          <div className="mt-3 text-sm text-slate-500">
            注意：
            <ul className="list-disc ml-5 mt-1">
              <li>如遇到"非法路径"，请确保文件位于项目 templates 目录下。</li>
              <li>
                当前为高保真结构预览（包含合并单元格和基础边框），若需像素级样式一致，可在后端接入
                LibreOffice 转换增强样式。
              </li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
