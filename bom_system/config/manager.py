import os

from dotenv import load_dotenv


class ConfigManager:
    """配置管理器"""

    def __init__(self):
        """初始化配置管理器"""
        # 加载 .env 文件
        load_dotenv()

        # 环境类型
        self.env = os.getenv("FLASK_ENV", "development")

        # 配置缓存
        self._config_cache = {}

    def get(self, key, default=None):
        """获取配置值

        Args:
            key: 配置键
            default: 默认值

        Returns:
            配置值
        """
        # 检查缓存
        if key in self._config_cache:
            return self._config_cache[key]

        # 从环境变量获取
        value = os.getenv(key)

        # 如果环境变量不存在，返回默认值
        if value is None:
            self._config_cache[key] = default
            return default

        # 类型转换
        if isinstance(default, bool):
            value = value.lower() in ("true", "1", "yes", "y")
        elif isinstance(default, int):
            try:
                value = int(value)
            except ValueError:
                value = default
        elif isinstance(default, float):
            try:
                value = float(value)
            except ValueError:
                value = default
        elif isinstance(default, set):
            value = set(value.split(","))
        elif isinstance(default, dict):
            import json

            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = default

        # 缓存配置
        self._config_cache[key] = value

        return value

    def get_env(self):
        """获取当前环境类型"""
        return self.env

    def is_development(self):
        """是否为开发环境"""
        return self.env == "development"

    def is_testing(self):
        """是否为测试环境"""
        return self.env == "testing"

    def is_production(self):
        """是否为生产环境"""
        return self.env == "production"
