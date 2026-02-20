import os
from bom_system.config.manager import ConfigManager


def test_config_manager():
    """测试配置管理器"""
    config_manager = ConfigManager()
    
    # 测试获取默认值
    assert config_manager.get('TEST_KEY', 'default_value') == 'default_value'
    
    # 测试获取布尔值
    assert isinstance(config_manager.get('TEST_BOOL', True), bool)
    assert config_manager.get('TEST_BOOL', True) is True
    
    # 测试获取整数
    assert isinstance(config_manager.get('TEST_INT', 10), int)
    assert config_manager.get('TEST_INT', 10) == 10
    
    # 测试获取浮点数
    assert isinstance(config_manager.get('TEST_FLOAT', 10.5), float)
    assert config_manager.get('TEST_FLOAT', 10.5) == 10.5
    
    # 测试获取集合
    assert isinstance(config_manager.get('TEST_SET', {'a', 'b'}), set)
    assert config_manager.get('TEST_SET', {'a', 'b'}) == {'a', 'b'}
    
    # 测试获取字典
    assert isinstance(config_manager.get('TEST_DICT', {'key': 'value'}), dict)
    assert config_manager.get('TEST_DICT', {'key': 'value'}) == {'key': 'value'}


def test_config_manager_env():
    """测试配置管理器的环境检测功能"""
    config_manager = ConfigManager()
    
    # 测试获取当前环境
    env = config_manager.get_env()
    assert env in ['development', 'testing', 'production']
    
    # 测试环境检测方法
    assert isinstance(config_manager.is_development(), bool)
    assert isinstance(config_manager.is_testing(), bool)
    assert isinstance(config_manager.is_production(), bool)
