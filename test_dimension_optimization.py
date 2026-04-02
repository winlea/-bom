#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试优化后的尺寸管理逻辑
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bom_system.config.manager import ConfigManager
from bom_system.dimensions.services import DimensionService, DimensionValidationError

# 获取数据库连接字符串
config_manager = ConfigManager()
DATABASE_URL = config_manager.get("DATABASE_URL", "sqlite:///bom_db.sqlite")

# 创建数据库引擎和会话
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# 创建测试会话
session = Session()
service = DimensionService(session)

print("开始测试优化后的尺寸管理逻辑...\n")

# 测试1: 智能尺寸类型判断
print("测试1: 智能尺寸类型判断")
try:
    # 测试直径尺寸
    diameter_type = service.detect_dimension_type("Φ10.0")
    print(f"✓ 直径尺寸检测: {diameter_type}")
    
    # 测试半径尺寸
    radius_type = service.detect_dimension_type("R5.0")
    print(f"✓ 半径尺寸检测: {radius_type}")
    
    # 测试角度尺寸
    angle_type = service.detect_dimension_type("45°")
    print(f"✓ 角度尺寸检测: {angle_type}")
    
    # 测试球直径
    sphere_diameter_type = service.detect_dimension_type("SΦ20.0")
    print(f"✓ 球直径检测: {sphere_diameter_type}")
    
    # 测试球半径
    sphere_radius_type = service.detect_dimension_type("SR8.0")
    print(f"✓ 球半径检测: {sphere_radius_type}")
    
    # 测试线性尺寸
    linear_type = service.detect_dimension_type("100.0")
    print(f"✓ 线性尺寸检测: {linear_type}")
    
except Exception as e:
    print(f"❌ 智能尺寸类型判断失败: {str(e)}")

print("\n测试2: 公差自动计算")
try:
    # 测试不同尺寸的公差计算
    test_values = ["10.0", "50.0", "200.0", "1000.0"]
    for value in test_values:
        tolerance = service.calculate_tolerance(value)
        print(f"✓ 尺寸 {value}: 公差={tolerance.get('toleranceValue')}, 上公差={tolerance.get('upperTolerance')}, 下公差={tolerance.get('lowerTolerance')}")
    
    # 测试不同标准
    iso_tolerance = service.calculate_tolerance("10.0", "ISO 2768")
    print(f"✓ ISO 2768标准: 尺寸10.0, 公差={iso_tolerance.get('toleranceValue')}")
    
except Exception as e:
    print(f"❌ 公差自动计算失败: {str(e)}")

print("\n测试3: 尺寸版本控制")
try:
    # 创建测试尺寸
    test_dimension = service.create_dimension(
        "test_project",
        {
            "partId": "test_part",
            "groupNo": 1,
            "dimensionType": "linear",
            "nominalValue": "100.0",
            "toleranceValue": "0.5",
            "upperTolerance": "0.25",
            "lowerTolerance": "-0.25",
            "datum": "A",
            "characteristic": "测试尺寸"
        }
    )
    print(f"✓ 创建测试尺寸成功，ID: {test_dimension.id}")
    
    # 更新尺寸（应该创建版本历史）
    updated_dimension = service.update_dimension(
        test_dimension.id,
        {
            "nominalValue": "105.0",
            "toleranceValue": "0.6",
            "modifiedBy": "test_user",
            "modificationReason": "调整尺寸值"
        }
    )
    print(f"✓ 更新尺寸成功")
    
    # 获取版本历史
    versions = service.get_dimension_versions(test_dimension.id)
    print(f"✓ 版本历史数量: {len(versions)}")
    for version in versions:
        print(f"  版本 {version.version}: 创建时间={version.created_at}")
    
    # 测试回滚
    if versions:
        rolled_back = service.rollback_to_version(test_dimension.id, versions[-1].version)
        print(f"✓ 回滚到版本 {versions[-1].version} 成功")
    
    # 清理测试数据
    service.delete_dimension(test_dimension.id)
    print(f"✓ 清理测试数据成功")
    
except Exception as e:
    print(f"❌ 尺寸版本控制测试失败: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n测试4: 尺寸统计分析")
try:
    # 创建一些测试尺寸用于统计
    test_dimensions = []
    for i in range(5):
        dim = service.create_dimension(
            "test_project",
            {
                "partId": f"test_part_{i}",
                "groupNo": i + 1,
                "dimensionType": "linear",
                "nominalValue": f"{100 + i * 10}.0",
                "toleranceValue": f"{0.1 + i * 0.1}",
                "datum": "A",
                "characteristic": f"测试尺寸{i}"
            }
        )
        test_dimensions.append(dim)
    
    # 测试项目统计
    project_stats = service.get_dimension_statistics("test_project")
    print(f"✓ 项目统计: 总尺寸={project_stats['total_dimensions']}, 总零件={project_stats['total_parts']}")
    print(f"✓ 尺寸类型分布: {project_stats['dimension_type_distribution']}")
    print(f"✓ 公差范围分布: {project_stats['tolerance_range_distribution']}")
    print(f"✓ 名义值统计: 最小值={project_stats['nominal_value_stats']['min']}, 最大值={project_stats['nominal_value_stats']['max']}, 平均值={project_stats['nominal_value_stats']['avg']:.2f}")
    
    # 测试零件统计
    if test_dimensions:
        part_stats = service.get_part_dimension_statistics("test_project", test_dimensions[0].part_id)
        print(f"✓ 零件统计: 总尺寸={part_stats['total_dimensions']}")
    
    # 清理测试数据
    for dim in test_dimensions:
        service.delete_dimension(dim.id)
    print(f"✓ 清理测试数据成功")
    
except Exception as e:
    print(f"❌ 尺寸统计分析测试失败: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n测试5: 尺寸模板库")
try:
    # 创建测试模板
    test_template = service.create_template(
        {
            "name": "测试模板",
            "description": "测试尺寸模板",
            "dimensionType": "linear",
            "nominalValue": "100.0",
            "toleranceValue": "0.5",
            "upperTolerance": "0.25",
            "lowerTolerance": "-0.25",
            "datum": "A",
            "characteristic": "标准线性尺寸",
            "createdBy": "test_user"
        }
    )
    print(f"✓ 创建测试模板成功，ID: {test_template.id}")
    
    # 获取模板列表
    templates = service.get_templates()
    print(f"✓ 模板列表数量: {len(templates)}")
    
    # 按类型获取模板
    linear_templates = service.get_templates("linear")
    print(f"✓ 线性尺寸模板数量: {len(linear_templates)}")
    
    # 应用模板创建尺寸
    applied_dimension = service.apply_template(
        "test_project",
        test_template.id,
        {
            "partId": "template_test_part",
            "groupNo": 1,
            "nominalValue": "150.0"  # 覆盖模板的名义值
        }
    )
    print(f"✓ 应用模板创建尺寸成功，ID: {applied_dimension.id}")
    print(f"  尺寸类型: {applied_dimension.dimension_type}")
    print(f"  名义值: {applied_dimension.nominal_value}")
    print(f"  公差值: {applied_dimension.tolerance_value}")
    
    # 更新模板
    updated_template = service.update_template(
        test_template.id,
        {
            "name": "更新后的测试模板",
            "toleranceValue": "0.6"
        }
    )
    print(f"✓ 更新模板成功")
    
    # 删除模板
    delete_result = service.delete_template(test_template.id)
    print(f"✓ 删除模板成功: {delete_result}")
    
    # 清理测试数据
    service.delete_dimension(applied_dimension.id)
    print(f"✓ 清理测试数据成功")
    
except Exception as e:
    print(f"❌ 尺寸模板库测试失败: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n测试6: 综合功能测试")
try:
    # 测试自动尺寸类型检测和公差计算
    test_data = {
        "partId": "comprehensive_test",
        "groupNo": 1,
        "nominalValue": "Φ50.0",  # 应该自动检测为直径
        # 不提供尺寸类型和公差，应该自动计算
        "datum": "A",
        "characteristic": "综合测试尺寸"
    }
    
    # 验证数据（应该自动检测类型和计算公差）
    service.validate_dimension_data(test_data)
    print(f"✓ 综合验证成功")
    print(f"  自动检测的尺寸类型: {test_data.get('dimensionType')}")
    print(f"  自动计算的公差: {test_data.get('toleranceValue')}")
    print(f"  自动计算的上公差: {test_data.get('upperTolerance')}")
    print(f"  自动计算的下公差: {test_data.get('lowerTolerance')}")
    
    # 创建尺寸
    comprehensive_dimension = service.create_dimension("test_project", test_data)
    print(f"✓ 创建综合测试尺寸成功，ID: {comprehensive_dimension.id}")
    
    # 清理测试数据
    service.delete_dimension(comprehensive_dimension.id)
    print(f"✓ 清理测试数据成功")
    
except Exception as e:
    print(f"❌ 综合功能测试失败: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n所有测试完成！")

# 关闭会话
session.close()
