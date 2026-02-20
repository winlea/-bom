from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session


class IBOMRepository(ABC):
    """BOM仓储接口"""
    
    @abstractmethod
    def create(self, data: Dict[str, Any]) -> Any:
        """创建BOM记录"""
        pass
    
    @abstractmethod
    def get_by_id(self, record_id: int) -> Optional[Any]:
        """根据ID获取BOM记录"""
        pass
    
    @abstractmethod
    def get_by_part_number(self, part_number: str) -> Optional[Any]:
        """根据零件编号获取BOM记录"""
        pass
    
    @abstractmethod
    def get_by_project(self, project_id: int) -> List[Any]:
        """根据项目ID获取BOM记录"""
        pass
    
    @abstractmethod
    def get_by_sequence(self, sequence: str) -> Optional[Any]:
        """根据序号获取BOM记录"""
        pass
    
    @abstractmethod
    def search(self, query: str, limit: int = 20) -> List[Any]:
        """搜索BOM记录"""
        pass
    
    @abstractmethod
    def update(self, record_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新BOM记录"""
        pass
    
    @abstractmethod
    def delete(self, record_id: int) -> bool:
        """删除BOM记录"""
        pass
    
    @abstractmethod
    def bulk_create(self, data_list: List[Dict[str, Any]]) -> List[Any]:
        """批量创建BOM记录"""
        pass
