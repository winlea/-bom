import pytest
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


class TestDimensionValidation:
    """测试尺寸验证逻辑（符合ISO 1101-2004标准）"""

    def setup_method(self):
        """设置测试环境"""
        self.session = Session()
        self.service = DimensionService(self.session)

    def teardown_method(self):
        """清理测试环境"""
        self.session.close()

    def test_valid_dimension_data(self):
        """测试有效的尺寸数据"""
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

        # 应该通过验证
        self.service.validate_dimension_data(valid_data)

    def test_invalid_negative_tolerance(self):
        """测试无效的负公差值"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "10.0",
            "toleranceValue": "-0.1",  # 负公差值
            "upperTolerance": "0.05",
            "lowerTolerance": "-0.05",
            "datum": "A",
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="\[公差值\] 不能为负数"):
            self.service.validate_dimension_data(invalid_data)

    def test_invalid_upper_tolerance_less_than_lower(self):
        """测试无效的上公差小于下公差"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "10.0",
            "upperTolerance": "-0.05",  # 上公差小于下公差
            "lowerTolerance": "0.05",
            "datum": "A",
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(
            DimensionValidationError, match="上公差必须大于或等于下公差"
        ):
            self.service.validate_dimension_data(invalid_data)

    def test_invalid_datum_format(self):
        """测试无效的基准符号格式"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "10.0",
            "toleranceValue": "0.1",
            "datum": "a",  # 小写字母，无效
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="\[基准符号\] 格式无效"):
            self.service.validate_dimension_data(invalid_data)

    def test_invalid_dimension_type(self):
        """测试无效的尺寸类型"""
        invalid_data = {
            "dimensionType": "invalid_type",  # 无效的尺寸类型
            "nominalValue": "10.0",
            "toleranceValue": "0.1",
            "datum": "A",
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="\[尺寸类型\] 无效"):
            self.service.validate_dimension_data(invalid_data)

    def test_missing_characteristic(self):
        """测试缺少特殊特性（现在允许为空）"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "10.0",
            "toleranceValue": "0.1",
            "datum": "A",
            "characteristic": "",  # 空的特殊特性
        }

        # 应该通过验证，因为特殊特性现在允许为空
        self.service.validate_dimension_data(invalid_data)

    def test_missing_nominal_value(self):
        """测试缺少名义值"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "",  # 空的名义值
            "toleranceValue": "0.1",
            "datum": "A",
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="\[名义值\] 不能为空"):
            self.service.validate_dimension_data(invalid_data)

    def test_invalid_nominal_value_format(self):
        """测试无效的名义值格式"""
        invalid_data = {
            "dimensionType": "linear",
            "nominalValue": "invalid",  # 无效的数值格式
            "toleranceValue": "0.1",
            "datum": "A",
            "characteristic": "尺寸1",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="\[名义值\] 必须是有效数字"):
            self.service.validate_dimension_data(invalid_data)

    def test_valid_image_dimension(self):
        """测试有效的图片尺寸数据"""
        valid_data = {
            "dimensionType": "image",
            "imageUrl": "/static/uploads/dimensions/test.png",
            "characteristic": "图片尺寸",
        }

        # 应该通过验证
        self.service.validate_dimension_data(valid_data)

    def test_invalid_image_dimension_missing_url(self):
        """测试缺少图片URL的图片尺寸"""
        invalid_data = {
            "dimensionType": "image",
            "imageUrl": "",  # 空的图片URL
            "characteristic": "图片尺寸",
        }

        # 应该抛出验证错误
        with pytest.raises(DimensionValidationError, match="图片尺寸必须包含图片URL"):
            self.service.validate_dimension_data(invalid_data)

    def test_invalid_image_dimension_missing_characteristic(self):
        """测试缺少特殊特性的图片尺寸（现在允许为空）"""
        invalid_data = {
            "dimensionType": "image",
            "imageUrl": "/static/uploads/dimensions/test.png",
            "characteristic": "",  # 空的特殊特性
        }

        # 应该通过验证，因为特殊特性现在允许为空
        self.service.validate_dimension_data(invalid_data)

    def test_valid_datum_with_number(self):
        """测试带数字的有效基准符号"""
        valid_data = {
            "dimensionType": "linear",
            "nominalValue": "10.0",
            "toleranceValue": "0.1",
            "datum": "A1",  # 带数字的基准符号
            "characteristic": "尺寸1",
        }

        # 应该通过验证
        self.service.validate_dimension_data(valid_data)

    def test_valid_angular_dimension(self):
        """测试有效的角度尺寸"""
        valid_data = {
            "dimensionType": "angular",
            "nominalValue": "90.0",
            "toleranceValue": "1.0",
            "datum": "A",
            "characteristic": "角度尺寸",
        }

        # 应该通过验证
        self.service.validate_dimension_data(valid_data)

    def test_valid_position_dimension(self):
        """测试有效的位置度尺寸"""
        valid_data = {
            "dimensionType": "position",
            "nominalValue": "0.0",
            "toleranceValue": "0.1",
            "datum": "A-B-C",  # 多个基准符号
            "characteristic": "位置度",
        }

        # 应该通过验证
        self.service.validate_dimension_data(valid_data)
