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

# 测试结果列表
results = []

# 测试1: 有效的尺寸数据
try:
    valid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1",
        "notes": "测试尺寸",
    }
    service.validate_dimension_data(valid_data)
    results.append("✅ 测试1通过: 有效的尺寸数据")
except Exception as e:
    results.append(f"❌ 测试1失败: {str(e)}")

# 测试2: 无效的负公差值
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "-0.1",  # 负公差值
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1",
    }
    service.validate_dimension_data(invalid_data)
    results.append("❌ 测试2失败: 应该拒绝负公差值")
except DimensionValidationError as e:
    results.append(f"✅ 测试2通过: {str(e)}")
except Exception as e:
    results.append(f"❌ 测试2失败: {str(e)}")

# 测试3: 无效的上公差小于下公差
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "upperTolerance": "-0.05",  # 上公差小于下公差
        "lowerTolerance": "0.05",
        "datum": "A",
        "characteristic": "尺寸1",
    }
    service.validate_dimension_data(invalid_data)
    results.append("❌ 测试3失败: 应该拒绝上公差小于下公差")
except DimensionValidationError as e:
    results.append(f"✅ 测试3通过: {str(e)}")
except Exception as e:
    results.append(f"❌ 测试3失败: {str(e)}")

# 测试4: 无效的基准符号格式
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "a",  # 小写字母，无效
        "characteristic": "尺寸1",
    }
    service.validate_dimension_data(invalid_data)
    results.append("❌ 测试4失败: 应该拒绝小写基准符号")
except DimensionValidationError as e:
    results.append(f"✅ 测试4通过: {str(e)}")
except Exception as e:
    results.append(f"❌ 测试4失败: {str(e)}")

# 测试5: 无效的尺寸类型
try:
    invalid_data = {
        "dimensionType": "invalid_type",  # 无效的尺寸类型
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "A",
        "characteristic": "尺寸1",
    }
    service.validate_dimension_data(invalid_data)
    results.append("❌ 测试5失败: 应该拒绝无效的尺寸类型")
except DimensionValidationError as e:
    results.append(f"✅ 测试5通过: {str(e)}")
except Exception as e:
    results.append(f"❌ 测试5失败: {str(e)}")

# 测试6: 缺少特殊特性
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "A",
        "characteristic": "",  # 空的特殊特性
    }
    service.validate_dimension_data(invalid_data)
    results.append("❌ 测试6失败: 应该拒绝缺少特殊特性")
except DimensionValidationError as e:
    results.append(f"✅ 测试6通过: {str(e)}")
except Exception as e:
    results.append(f"❌ 测试6失败: {str(e)}")

# 测试7: 有效的图片尺寸数据
try:
    valid_data = {
        "dimensionType": "image",
        "imageUrl": "/static/uploads/dimensions/test.png",
        "characteristic": "图片尺寸",
    }
    service.validate_dimension_data(valid_data)
    results.append("✅ 测试7通过: 有效的图片尺寸数据")
except Exception as e:
    results.append(f"❌ 测试7失败: {str(e)}")

# 测试8: 有效的带数字的基准符号
try:
    valid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "A1",  # 带数字的基准符号
        "characteristic": "尺寸1",
    }
    service.validate_dimension_data(valid_data)
    results.append("✅ 测试8通过: 有效的带数字的基准符号")
except Exception as e:
    results.append(f"❌ 测试8失败: {str(e)}")

# 测试9: 有效的角度尺寸
try:
    valid_data = {
        "dimensionType": "angular",
        "nominalValue": "90.0",
        "toleranceValue": "1.0",
        "datum": "A",
        "characteristic": "角度尺寸",
    }
    service.validate_dimension_data(valid_data)
    results.append("✅ 测试9通过: 有效的角度尺寸")
except Exception as e:
    results.append(f"❌ 测试9失败: {str(e)}")

# 关闭会话
session.close()

# 写入测试结果到文件
with open("test_results.txt", "w", encoding="utf-8") as f:
    f.write("尺寸验证逻辑测试结果\n")
    f.write("=====================\n\n")
    for result in results:
        f.write(result + "\n")

    # 统计通过和失败的测试数量
    passed = sum(1 for r in results if r.startswith("✅"))
    failed = sum(1 for r in results if r.startswith("❌"))

    f.write("\n测试统计\n")
    f.write("=========\n")
    f.write(f"通过: {passed}\n")
    f.write(f"失败: {failed}\n")
    f.write(f"总测试数: {passed + failed}\n")

print("测试完成！结果已写入 test_results.txt 文件。")
