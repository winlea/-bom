# PowerShell 脚本：获取零件 Y1392191 的尺寸信息

# 项目ID和零件编号
$projectId = "358"
$partNumber = "Y1392191"

# API URL
$apiUrl = "http://localhost:5000/api/dimensions/projects/$projectId?part_number=$($partNumber | Uri.EscapeDataString)"

Write-Host "正在查询零件 $partNumber 的尺寸信息..."
Write-Host "API URL: $apiUrl"
Write-Host ""

try {
    # 发送HTTP请求
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ 查询成功！"
        Write-Host "共找到 $($response.data.Length) 条尺寸信息"
        Write-Host ""
        
        # 按组号分组
        $groups = @{}
        foreach ($dim in $response.data) {
            $groupNo = $dim.groupNo
            if (-not $groups.ContainsKey($groupNo)) {
                $groups[$groupNo] = @()
            }
            $groups[$groupNo] += $dim
        }
        
        # 按组号排序并展示
        foreach ($groupNo in ($groups.Keys | Sort-Object)) {
            Write-Host "=== 组 $groupNo ==="
            Write-Host ""
            
            foreach ($dim in $groups[$groupNo]) {
                Write-Host "尺寸ID: $($dim.id)"
                Write-Host "尺寸类型: $($dim.dimensionType)"
                Write-Host "名义值: $($dim.nominalValue)"
                Write-Host "上公差: $($dim.upperTolerance)"
                Write-Host "下公差: $($dim.lowerTolerance)"
                Write-Host "公差值: $($dim.toleranceValue)"
                Write-Host "基准: $($dim.datum)"
                Write-Host "特性: $($dim.characteristic)"
                Write-Host "备注: $($dim.notes)"
                if ($dim.imageUrl) {
                    Write-Host "图片URL: $($dim.imageUrl)"
                }
                Write-Host ""
            }
        }
        
        # 输出原始JSON数据
        Write-Host "=== 原始JSON数据 ==="
        $response.data | ConvertTo-Json -Depth 3
    } else {
        Write-Host "❌ 查询失败: $($response.message)"
    }
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)"
    Write-Host "请确保后端服务正在运行，并且API地址正确"
}