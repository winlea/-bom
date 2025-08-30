import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout, { Breadcrumb } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Ruler, Save, ArrowLeft, Eye, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface DimensionFormData {
  // 基本信息
  name: string;
  description: string;
  project_id: number;

  // 尺寸类型
  dimensionType: string;

  // 数值信息
  nominal: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit: string;

  // 基准与特性
  datum: string;
  specialCharacteristic: string;

  // FCF信息
  fcfSymbol: string;
  fcfValue: string;
  fcfModifier: string;
  fcfDatums: string[];

  // 备注
  notes: string;
}

export default function DimensionsAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id');

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<DimensionFormData>({
    name: '',
    description: '',
    project_id: projectId ? parseInt(projectId) : 0,
    dimensionType: '普通尺寸',
    nominal: '',
    upperTolerance: '',
    lowerTolerance: '',
    unit: 'mm',
    datum: '',
    specialCharacteristic: '',
    fcfSymbol: '',
    fcfValue: '',
    fcfModifier: '',
    fcfDatums: [],
    notes: '',
  });

  // 加载项目列表
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          const projectsList = Array.isArray(data) ? data : data.items || [];
          setProjects(projectsList);

          // 如果没有选择项目且有项目列表，选择第一个
          if (!formData.project_id && projectsList.length > 0) {
            setFormData(prev => ({ ...prev, project_id: projectsList[0].id }));
          }
        }
      } catch (error) {
        console.error('加载项目列表失败:', error);
      }
    }

    fetchProjects();
  }, []);

  // 尺寸类型配置
  const dimensionTypes = [
    { value: '普通尺寸', label: '普通尺寸', symbol: '·', description: '标准线性尺寸' },
    { value: '孔径', label: '孔径', symbol: '⌀', description: '圆孔直径尺寸' },
    { value: '位置度', label: '位置度', symbol: '⌖', description: '几何位置公差' },
    { value: '面轮廓', label: '面轮廓', symbol: '⌓', description: '表面轮廓公差' },
    { value: '平面度', label: '平面度', symbol: '⏥', description: '平面度公差' },
    { value: '共面度', label: '共面度', symbol: '◇', description: '共面度公差' },
  ];

  // 单位选项
  const units = [
    { value: 'mm', label: '毫米 (mm)' },
    { value: 'cm', label: '厘米 (cm)' },
    { value: 'm', label: '米 (m)' },
    { value: 'inch', label: '英寸 (inch)' },
    { value: '°', label: '度 (°)' },
  ];

  // 修饰符选项
  const modifiers = [
    { value: '', label: '无' },
    { value: 'M', label: 'Ⓜ (最大实体)' },
    { value: 'L', label: 'Ⓛ (最小实体)' },
    { value: 'S', label: 'Ⓢ (无论何种尺寸)' },
  ];

  // 处理尺寸类型变化
  function handleDimensionTypeChange(type: string) {
    const typeConfig = dimensionTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      dimensionType: type,
      fcfSymbol: typeConfig?.symbol === '·' ? '' : typeConfig?.symbol || '',
    }));
  }

  // 生成预览文本
  function generatePreviewText(): string {
    const { dimensionType, nominal, upperTolerance, lowerTolerance } = formData;
    if (!nominal) return '请输入名义值';

    const nNum = parseFloat(nominal);
    const upNum = upperTolerance ? parseFloat(upperTolerance) : NaN;
    const lowNum = lowerTolerance ? parseFloat(lowerTolerance) : NaN;

    // 对称公差
    if (!isNaN(upNum) && !isNaN(lowNum) && Math.abs(upNum + lowNum) < 1e-6) {
      const tolerance = Math.abs(upNum);
      const prefix = dimensionType === '孔径' ? '⌀' : '';
      return `${prefix}${nNum}±${tolerance}`;
    }

    // 非对称公差
    if (!isNaN(upNum) && !isNaN(lowNum)) {
      const prefix = dimensionType === '孔径' ? '⌀' : '';
      return `${prefix}${nNum} +${upNum}/${lowNum}`;
    }

    // 单边公差
    if (!isNaN(upNum)) {
      const prefix = dimensionType === '孔径' ? '⌀' : '';
      return `${prefix}${nNum} +${upNum}`;
    }

    if (!isNaN(lowNum)) {
      const prefix = dimensionType === '孔径' ? '⌀' : '';
      const sign = lowNum >= 0 ? '+' : '';
      return `${prefix}${nNum} ${sign}${lowNum}`;
    }

    // 仅名义值
    const prefix = dimensionType === '孔径' ? '⌀' : '';
    return `${prefix}${nominal}`;
  }

  // 表单验证
  function validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('请输入尺寸名称');
    }

    if (!formData.project_id) {
      errors.push('请选择项目');
    }

    if (!formData.nominal.trim()) {
      errors.push('请输入名义值');
    } else if (isNaN(parseFloat(formData.nominal))) {
      errors.push('名义值必须是有效数字');
    }

    if (formData.upperTolerance && isNaN(parseFloat(formData.upperTolerance))) {
      errors.push('上公差必须是有效数字');
    }

    if (formData.lowerTolerance && isNaN(parseFloat(formData.lowerTolerance))) {
      errors.push('下公差必须是有效数字');
    }

    return { isValid: errors.length === 0, errors };
  }

  // 处理表单提交
  async function handleSubmit() {
    const validation = validateForm();
    if (!validation.isValid) {
      alert('表单验证失败：\n' + validation.errors.join('\n'));
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        project_id: formData.project_id,
        dimension_type: formData.dimensionType,
        nominal_value: parseFloat(formData.nominal),
        upper_tolerance: formData.upperTolerance ? parseFloat(formData.upperTolerance) : null,
        lower_tolerance: formData.lowerTolerance ? parseFloat(formData.lowerTolerance) : null,
        unit: formData.unit,
        datum: formData.datum || null,
        special_characteristic: formData.specialCharacteristic || null,
        fcf_symbol: formData.fcfSymbol || null,
        fcf_value: formData.fcfValue || null,
        fcf_modifier: formData.fcfModifier || null,
        fcf_datums: formData.fcfDatums.length > 0 ? formData.fcfDatums : null,
        notes: formData.notes || null,
      };

      const response = await fetch('/api/dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate(`/dimensions?project_id=${formData.project_id}`);
      } else {
        const error = await response.text();
        alert('保存失败: ' + error);
      }
    } catch (error) {
      console.error('保存尺寸时出错:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  const currentProject = projects.find(p => p.id === formData.project_id);
  const selectedType = dimensionTypes.find(t => t.value === formData.dimensionType);
  const validation = validateForm();

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto w-full">
        <Breadcrumb
          items={[
            { label: '首页', to: '/' },
            { label: '项目列表', to: '/projects' },
            { label: '尺寸列表', to: `/dimensions?project_id=${formData.project_id}` },
            { label: '添加尺寸' },
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-slate-800">
              <Ruler className="mr-2 text-blue-600" size={24} /> 添加尺寸
            </h1>
            <p className="text-slate-500 mt-1">
              为项目 "{currentProject?.name || '未选择'}" 添加新的尺寸记录
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/dimensions?project_id=${formData.project_id}`)}
            >
              <ArrowLeft size={16} className="mr-1" /> 返回列表
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !validation.isValid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" /> 保存尺寸
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：表单区域 */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="tolerance">公差设置</TabsTrigger>
                <TabsTrigger value="advanced">高级选项</TabsTrigger>
              </TabsList>

              {/* 基本信息 */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>设置尺寸的基本属性</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">尺寸名称 *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="例如：主轴孔径"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project">所属项目 *</Label>
                        <Select
                          value={String(formData.project_id)}
                          onValueChange={value =>
                            setFormData(prev => ({ ...prev, project_id: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择项目" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={String(project.id)}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="详细描述这个尺寸的用途和要求..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>尺寸类型</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {dimensionTypes.map(type => (
                          <div
                            key={type.value}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.dimensionType === type.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => handleDimensionTypeChange(type.value)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{type.symbol}</span>
                                  <span className="font-medium">{type.label}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                              </div>
                              {formData.dimensionType === type.value && (
                                <CheckCircle2 size={16} className="text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 公差设置 */}
              <TabsContent value="tolerance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>数值与公差</CardTitle>
                    <CardDescription>设置尺寸的名义值和公差范围</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nominal">名义值 *</Label>
                        <Input
                          id="nominal"
                          type="number"
                          step="0.001"
                          value={formData.nominal}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, nominal: e.target.value }))
                          }
                          placeholder="12.000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upper">上公差</Label>
                        <Input
                          id="upper"
                          type="number"
                          step="0.001"
                          value={formData.upperTolerance}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, upperTolerance: e.target.value }))
                          }
                          placeholder="0.500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lower">下公差</Label>
                        <Input
                          id="lower"
                          type="number"
                          step="0.001"
                          value={formData.lowerTolerance}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, lowerTolerance: e.target.value }))
                          }
                          placeholder="-0.500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">单位</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={value => setFormData(prev => ({ ...prev, unit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择单位" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">公差设置提示：</p>
                          <ul className="mt-1 text-blue-700 space-y-1">
                            <li>• 对称公差：上公差 = -下公差，将显示为 ± 格式</li>
                            <li>• 非对称公差：显示为 +上/-下 格式</li>
                            <li>• 单边公差：只填写上公差或下公差</li>
                            <li>• 孔径类型会自动添加 ⌀ 符号</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 高级选项 */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基准与特性</CardTitle>
                    <CardDescription>设置基准参考和特殊特性标记</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="datum">基准</Label>
                        <Input
                          id="datum"
                          value={formData.datum}
                          onChange={e => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                          placeholder="A, B, C"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="special">特殊特性</Label>
                        <Input
                          id="special"
                          value={formData.specialCharacteristic}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              specialCharacteristic: e.target.value,
                            }))
                          }
                          placeholder="CC01, SC02"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FCF设置 - 仅非普通尺寸显示 */}
                {formData.dimensionType !== '普通尺寸' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>特征控制框 (FCF)</CardTitle>
                      <CardDescription>设置几何公差的特征控制框参数</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fcfValue">公差值</Label>
                          <Input
                            id="fcfValue"
                            type="number"
                            step="0.001"
                            value={formData.fcfValue}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, fcfValue: e.target.value }))
                            }
                            placeholder="0.500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fcfModifier">修饰符</Label>
                          <Select
                            value={formData.fcfModifier}
                            onValueChange={value =>
                              setFormData(prev => ({ ...prev, fcfModifier: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择修饰符" />
                            </SelectTrigger>
                            <SelectContent>
                              {modifiers.map(modifier => (
                                <SelectItem key={modifier.value} value={modifier.value}>
                                  {modifier.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>基准序列</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['A', 'B', 'C', 'D', 'E', 'F'].map(datum => (
                            <Button
                              key={datum}
                              type="button"
                              variant={formData.fcfDatums.includes(datum) ? 'default' : 'outline'}
                              size="sm"
                              className="w-10 h-10 p-0"
                              onClick={() => {
                                const newDatums = formData.fcfDatums.includes(datum)
                                  ? formData.fcfDatums.filter(d => d !== datum)
                                  : [...formData.fcfDatums, datum];
                                setFormData(prev => ({ ...prev, fcfDatums: newDatums }));
                              }}
                            >
                              {datum}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>备注</CardTitle>
                    <CardDescription>添加额外的说明信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="添加备注信息..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧：预览区域 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={18} />
                  实时预览
                </CardTitle>
                <CardDescription>查看尺寸标注的最终效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 min-h-[120px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-mono mb-2">{generatePreviewText()}</div>
                    <div className="text-sm text-slate-500">
                      {selectedType?.label} ({formData.unit})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>表单状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">表单完整性</span>
                  <Badge variant={validation.isValid ? 'default' : 'destructive'}>
                    {validation.isValid ? '完整' : '不完整'}
                  </Badge>
                </div>

                {!validation.isValid && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="text-sm text-red-600">
                      <div className="flex items-center gap-1 mb-2">
                        <AlertCircle size={14} />
                        <span className="font-medium">需要修正：</span>
                      </div>
                      <ul className="space-y-1 ml-4">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-xs">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="text-xs text-slate-500 space-y-1">
                  <p>• 必填字段标有 * 号</p>
                  <p>• 数值字段支持小数点后3位</p>
                  <p>• 保存后将返回尺寸列表</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
