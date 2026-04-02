"""
测试尺寸格式化工具
"""

from bom_system.dimensions.formatters import format_dimension

# 模拟尺寸对象
class MockDimension:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

# 测试直径尺寸
print("测试直径尺寸:")
dim1 = MockDimension(
    dimension_type='diameter',
    nominal_value='1',
    datum='ABC'
)
result1 = format_dimension(dim1)
print(f"输入: 直径 1, 基准 ABC")
print(f"输出: {result1}")
print()

# 测试位置度
print("测试位置度:")
dim2 = MockDimension(
    dimension_type='position',
    tolerance_value='0.5',
    datum='ABC'
)
result2 = format_dimension(dim2)
print(f"输入: 位置度 0.5, 基准 ABC")
print(f"输出: {result2}")
print()

# 测试带修饰符的位置度
print("测试带修饰符的位置度:")
dim3 = MockDimension(
    dimension_type='position',
    tolerance_value='0.5',
    fcf_modifier='M',
    datum='ABC'
)
result3 = format_dimension(dim3)
print(f"输入: 位置度 0.5, 修饰符 M, 基准 ABC")
print(f"输出: {result3}")
print()

# 测试带公差的直径尺寸
print("测试带公差的直径尺寸:")
dim4 = MockDimension(
    dimension_type='diameter',
    nominal_value='10',
    tolerance_value='0.1',
    datum='ABC'
)
result4 = format_dimension(dim4)
print(f"输入: 直径 10, 公差 0.1, 基准 ABC")
print(f"输出: {result4}")
print()

# 测试半径尺寸
print("测试半径尺寸:")
dim5 = MockDimension(
    dimension_type='radius',
    nominal_value='5',
    tolerance_value='0.05'
)
result5 = format_dimension(dim5)
print(f"输入: 半径 5, 公差 0.05")
print(f"输出: {result5}")
