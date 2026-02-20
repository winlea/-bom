from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod


class IDimensionService(ABC):
    """维度服务接口"""
    
    @abstractmethod
    def get_dimensions_by_part(self, part_id: str) -> List[Any]:
        """根据零件ID获取尺寸"""
        pass
    
    @abstractmethod
    def get_dimensions_by_project(self, project_id: str) -> List[Any]:
        """根据项目ID获取尺寸"""
        pass
    
    @abstractmethod
    def search_dimensions(self, project_id: str, search_term: str) -> List[Any]:
        """搜索尺寸"""
        pass
    
    @abstractmethod
    def create_dimension(self, project_id: str, data: Dict[str, Any]) -> Any:
        """创建尺寸"""
        pass
    
    @abstractmethod
    def get_dimension_by_id(self, dimension_id: int) -> Optional[Any]:
        """根据ID获取尺寸"""
        pass
    
    @abstractmethod
    def update_dimension(self, dimension_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新尺寸"""
        pass
    
    @abstractmethod
    def delete_dimension(self, dimension_id: int) -> bool:
        """删除尺寸"""
        pass
    
    @abstractmethod
    def bulk_create_dimensions(self, project_id: str, data_list: List[Dict[str, Any]]) -> List[Any]:
        """批量创建尺寸"""
        pass
    
    @abstractmethod
    def get_next_group_number(self, project_id: str) -> int:
        """获取下一个组号"""
        pass
    
    @abstractmethod
    def insert_dimension_at_position(self, project_id: str, position: int, data: Dict[str, Any]) -> Any:
        """在指定位置插入尺寸"""
        pass
    
    @abstractmethod
    def delete_dimension_with_reorder(self, dimension_id: int) -> bool:
        """删除尺寸并重新排序"""
        pass
    
    def save_dimension_image(self, file) -> str:
        """保存尺寸图片"""
        pass
    
    def get_dimensions_grouped(self, project_id: str) -> List[Dict[str, Any]]:
        """获取分组的尺寸"""
        pass
