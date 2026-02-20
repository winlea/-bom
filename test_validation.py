from bom_system.dimensions.services import DimensionService, DimensionValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from bom_system.config.manager import ConfigManager

# 获取数据库连接字符串
config_manager = ConfigManager()
DATABASE_URL = config_manager.get('DATABASE_URL', 'sqlite:///bom_db.sqlite')

# 创建数据库引擎和会话
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# 创建测试会话
session = Session()
service = DimensionService(session)

print("开始测试尺寸验证逻辑...")

# 测试1: 有效的尺寸数据
print("\n测试1: 有效的尺寸数据")
try:
    valid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1",
        "notes": "测试尺寸"
    }
    service.validate_dimension_data(valid_data)
    print("✅ 通过: 有效的尺寸数据")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试2: 无效的负公差值
print("\n测试2: 无效的负公差值")
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "-0.1",  # 负公差值
        "upperTolerance": "0.05",
        "lowerTolerance": "-0.05",
        "datum": "A",
        "characteristic": "尺寸1"
    }
    service.validate_dimension_data(invalid_data)
    print("❌ 失败: 应该拒绝负公差值")
except DimensionValidationError as e:
    print(f"✅ 通过: {str(e)}")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试3: 无效的上公差小于下公差
print("\n测试3: 无效的上公差小于下公差")
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "upperTolerance": "-0.05",  # 上公差小于下公差
        "lowerTolerance": "0.05",
        "datum": "A",
        "characteristic": "尺寸1"
    }
    service.validate_dimension_data(invalid_data)
    print("❌ 失败: 应该拒绝上公差小于下公差")
except DimensionValidationError as e:
    print(f"✅ 通过: {str(e)}")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试4: 无效的基准符号格式
print("\n测试4: 无效的基准符号格式")
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "a",  # 小写字母，无效
        "characteristic": "尺寸1"
    }
    service.validate_dimension_data(invalid_data)
    print("❌ 失败: 应该拒绝小写基准符号")
except DimensionValidationError as e:
    print(f"✅ 通过: {str(e)}")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试5: 无效的尺寸类型
print("\n测试5: 无效的尺寸类型")
try:
    invalid_data = {
        "dimensionType": "invalid_type",  # 无效的尺寸类型
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "A",
        "characteristic": "尺寸1"
    }
    service.validate_dimension_data(invalid_data)
    print("❌ 失败: 应该拒绝无效的尺寸类型")
except DimensionValidationError as e:
    print(f"✅ 通过: {str(e)}")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试6: 缺少特殊特性
print("\n测试6: 缺少特殊特性")
try:
    invalid_data = {
        "dimensionType": "linear",
        "nominalValue": "10.0",
        "toleranceValue": "0.1",
        "datum": "A",
        "characteristic": ""  # 空的特殊特性
    }
    service.validate_dimension_data(invalid_data)
    print("❌ 失败: 应该拒绝缺少特殊特性")
except DimensionValidationError as e:
    print(f"✅ 通过: {str(e)}")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 测试7: 有效的图片尺寸数据
print("\n测试7: 有效的图片尺寸数据")
try:
    valid_data = {
        "dimensionType": "image",
        "imageUrl": "/static/uploads/dimensions/test.png",
        "characteristic": "图片尺寸"
    }
    service.validate_dimension_data(valid_data)
    print("✅ 通过: 有效的图片尺寸数据")
except Exception as e:
    print(f"❌ 失败: {str(e)}")

# 关闭会话
session.close()
print("\n测试完成!")
