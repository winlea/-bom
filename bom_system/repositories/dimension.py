from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class IDimensionRepository(ABC):
    """维度仓储接口"""

    @abstractmethod
    def create(self, data: Dict[str, Any]) -> Any:
        """创建维度记录"""
        pass

    @abstractmethod
    def get_by_id(self, dimension_id: int) -> Optional[Any]:
        """根据ID获取维度记录"""
        pass

    @abstractmethod
    def get_by_part(self, part_id: str) -> List[Any]:
        """根据零件ID获取维度记录"""
        pass

    @abstractmethod
    def get_by_project(self, project_id: str) -> List[Any]:
        """根据项目ID获取维度记录"""
        pass

    @abstractmethod
    def search(self, project_id: str, search_term: str) -> List[Any]:
        """搜索维度记录"""
        pass

    @abstractmethod
    def update(self, dimension_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新维度记录"""
        pass

    @abstractmethod
    def delete(self, dimension_id: int) -> bool:
        """删除维度记录"""
        pass

    @abstractmethod
    def get_next_group_number(self, project_id: str) -> int:
        """获取下一个组号"""
        pass

    @abstractmethod
    def get_by_group(self, project_id: str, group_no: int) -> List[Any]:
        """根据组号获取维度记录"""
        pass
