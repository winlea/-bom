from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class IBOMService(ABC):
    """BOM服务接口"""

    @abstractmethod
    def save_base64_image(
        self, part_number: str, base64_str: str, part_name: Optional[str] = None
    ) -> int:
        """保存base64图片"""
        pass

    @abstractmethod
    def save_url_image(
        self, part_number: str, url: str, part_name: Optional[str] = None
    ) -> int:
        """保存URL图片"""
        pass

    @abstractmethod
    def get_image_bytes(self, record_id: int) -> tuple[bytes, str]:
        """获取图片字节"""
        pass

    @abstractmethod
    def get_effective_image_bytes(self, record_id: int) -> tuple[bytes, str]:
        """获取有效图片字节"""
        pass

    @abstractmethod
    def import_bom(
        self, file_data: bytes, filename: str, project_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """导入BOM"""
        pass

    @abstractmethod
    def get_parts(
        self, q: Optional[str] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """获取零件列表"""
        pass
