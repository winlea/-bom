from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod


class IProjectRepository(ABC):
    """项目仓储接口"""
    
    @abstractmethod
    def create(self, data: Dict[str, Any]) -> Any:
        """创建项目记录"""
        pass
    
    @abstractmethod
    def get_by_id(self, project_id: int) -> Optional[Any]:
        """根据ID获取项目记录"""
        pass
    
    @abstractmethod
    def get_all(self) -> List[Any]:
        """获取所有项目记录"""
        pass
    
    @abstractmethod
    def search(self, query: str) -> List[Any]:
        """搜索项目记录"""
        pass
    
    @abstractmethod
    def update(self, project_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新项目记录"""
        pass
    
    @abstractmethod
    def delete(self, project_id: int) -> bool:
        """删除项目记录"""
        pass
