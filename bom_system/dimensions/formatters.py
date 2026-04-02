"""
尺寸格式化工具
用于将尺寸数据转换为符合GD&T标准的字符串格式
"""

def format_dimension(dimension):
    """
    格式化尺寸数据为符合GD&T标准的字符串
    
    Args:
        dimension: 尺寸对象，包含以下属性：
            - dimension_type: 尺寸类型
            - nominal_value: 名义值
            - tolerance_value: 公差值
            - upper_tolerance: 上公差
            - lower_tolerance: 下公差
            - datum: 基准
            - fcf_symbol: FCF符号
            - fcf_value: FCF值
            - fcf_modifier: FCF修饰符
            - fcf_datums: FCF基准序列
    
    Returns:
        str: 格式化后的尺寸字符串
    """
    if not dimension:
        return ""
    
    # 处理不同类型的尺寸
    if hasattr(dimension, 'dimension_type'):
        dim_type = dimension.dimension_type
        
        # 位置度处理
        if dim_type == 'position':
            return _format_position_tolerance(dimension)
        
        # 直径处理
        elif dim_type == 'diameter':
            return _format_diameter(dimension)
        
        # 半径处理
        elif dim_type == 'radius':
            return _format_radius(dimension)
        
        # 其他尺寸类型
        else:
            return _format_general_dimension(dimension)
    
    return ""


def _format_position_tolerance(dimension):
    """
    格式化位置度公差
    格式：⌖ 0.5 Ⓜ A B C
    """
    # 位置度符号
    position_symbol = "⌖"
    
    # 公差值
    tolerance_display = getattr(dimension, 'tolerance_value', '') or getattr(dimension, 'fcf_value', '') or ""
    
    # 为公差值添加方框
    if tolerance_display:
        tolerance_display = f"[{tolerance_display}]"
    
    # 修饰符（如M、L等）
    modifier = getattr(dimension, 'fcf_modifier', '') or ""
    if modifier:
        # 转换为圆圈包围的符号
        if modifier.upper() == 'M':
            modifier = "Ⓜ"
        elif modifier.upper() == 'L':
            modifier = "Ⓛ"
        elif modifier.upper() == 'S':
            modifier = "Ⓢ"
    
    # 基准
    datum_display = getattr(dimension, 'datum', '') or getattr(dimension, 'fcf_datums', '') or ""
    
    # 优化基准显示，确保用空格分隔
    if datum_display and not ' ' in datum_display:
        datum_display = ' '.join([c for c in datum_display])
    
    # 构建位置度特征描述
    parts = [position_symbol, tolerance_display]
    
    if modifier:
        parts.append(modifier)
    
    if datum_display:
        parts.append(datum_display)
    
    return " ".join(parts)


def _format_diameter(dimension):
    """
    格式化直径尺寸
    格式：Φ1±0.1 A B C
    """
    # 直径符号
    diameter_symbol = "Φ"
    
    # 名义值
    nominal_value = getattr(dimension, 'nominal_value', '') or ""
    
    # 公差
    tolerance_display = _format_tolerance(dimension)
    
    # 基准
    datum_display = getattr(dimension, 'datum', '') or ""
    
    # 优化基准显示，确保用空格分隔
    if datum_display and not ' ' in datum_display:
        datum_display = ' '.join([c for c in datum_display])
    
    # 构建直径尺寸描述
    parts = [f"{diameter_symbol}{nominal_value}"]
    
    if tolerance_display:
        parts.append(tolerance_display)
    
    if datum_display:
        parts.append(datum_display)
    
    return " ".join(parts)


def _format_radius(dimension):
    """
    格式化半径尺寸
    格式：R5±0.1
    """
    # 半径符号
    radius_symbol = "R"
    
    # 名义值
    nominal_value = getattr(dimension, 'nominal_value', '') or ""
    
    # 公差
    tolerance_display = _format_tolerance(dimension)
    
    # 构建半径尺寸描述
    parts = [f"{radius_symbol}{nominal_value}"]
    
    if tolerance_display:
        parts.append(tolerance_display)
    
    return " ".join(parts)


def _format_general_dimension(dimension):
    """
    格式化一般尺寸
    格式：100±0.1
    """
    # 根据尺寸类型添加相应的符号
    dimension_symbol = ""
    dim_type = getattr(dimension, 'dimension_type', '')
    
    if dim_type == 'spherical_diameter':
        dimension_symbol = "SΦ"
    elif dim_type == 'spherical_radius':
        dimension_symbol = "SR"
    
    # 名义值
    nominal_value = getattr(dimension, 'nominal_value', '') or ""
    
    # 公差
    tolerance_display = _format_tolerance(dimension)
    
    # 构建一般尺寸描述
    parts = [f"{dimension_symbol}{nominal_value}"]
    
    if tolerance_display:
        parts.append(tolerance_display)
    
    return " ".join(parts)


def _format_tolerance(dimension):
    """
    格式化公差
    """
    tolerance_display = ""
    
    # 优先使用tolerance_value
    if hasattr(dimension, 'tolerance_value') and dimension.tolerance_value:
        # 如果tolerance_value是一个数字，自动添加±符号
        if dimension.tolerance_value.replace('.', '').replace('-', '').isdigit():
            tolerance_display = f"±{dimension.tolerance_value}"
        else:
            tolerance_display = dimension.tolerance_value
    
    # 否则使用上下公差
    elif hasattr(dimension, 'upper_tolerance') and hasattr(dimension, 'lower_tolerance'):
        upper = dimension.upper_tolerance
        lower = dimension.lower_tolerance
        
        if upper and lower:
            # 检查是否为对称公差
            if upper == lower.replace('-', ''):
                tolerance_display = f"±{upper}"
            else:
                tolerance_display = f"+{upper}-{lower.replace('-', '')}"
        elif upper:
            tolerance_display = f"+{upper}"
        elif lower:
            tolerance_display = f"-{lower}"
    
    return tolerance_display
