from .manager import ConfigManager

# 创建配置管理器实例
config_manager = ConfigManager()

# 导出配置
SQLALCHEMY_DATABASE_URI = config_manager.get('DATABASE_URL', 'sqlite:///bom_db.sqlite')
SQLALCHEMY_TRACK_MODIFICATIONS = config_manager.get('SQLALCHEMY_TRACK_MODIFICATIONS', False)
MAX_IMAGE_BYTES = config_manager.get('MAX_IMAGE_BYTES', 5 * 1024 * 1024)
ALLOWED_IMAGE_MIME = config_manager.get('ALLOWED_IMAGE_MIME', {'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'})
HTTP_FETCH_TIMEOUT = config_manager.get('HTTP_FETCH_TIMEOUT', 10.0)
ADMIN_TOKEN = config_manager.get('ADMIN_TOKEN', '')
PLACEHOLDER_ENABLED = config_manager.get('PLACEHOLDER_ENABLED', True)
PLACEHOLDER_WIDTH = config_manager.get('PLACEHOLDER_WIDTH', 240)
PLACEHOLDER_HEIGHT = config_manager.get('PLACEHOLDER_HEIGHT', 180)
PLACEHOLDER_BG = config_manager.get('PLACEHOLDER_BG', '#f0f3f9')
PLACEHOLDER_FG = config_manager.get('PLACEHOLDER_FG', '#2b4c7e')
PLACEHOLDER_TEXT_FMT = config_manager.get('PLACEHOLDER_TEXT_FMT', '{part_number}')

__all__ = [
    'SQLALCHEMY_DATABASE_URI',
    'SQLALCHEMY_TRACK_MODIFICATIONS',
    'MAX_IMAGE_BYTES',
    'ALLOWED_IMAGE_MIME',
    'HTTP_FETCH_TIMEOUT',
    'ADMIN_TOKEN',
    'PLACEHOLDER_ENABLED',
    'PLACEHOLDER_WIDTH',
    'PLACEHOLDER_HEIGHT',
    'PLACEHOLDER_BG',
    'PLACEHOLDER_FG',
    'PLACEHOLDER_TEXT_FMT',
]
