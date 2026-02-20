from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod


class IProjectService(ABC):
    """项目服务接口"""
    
    @abstractmethod
    def create_project(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """创建项目"""
        pass
    
    @abstractmethod
    def get_project(self, project_id: int) -> Optional[Dict[str, Any]]:
        """获取项目"""
        pass
    
    @abstractmethod
    def get_projects(self, q: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取项目列表"""
        pass
    
    @abstractmethod
    def update_project(self, project_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """更新项目"""
        pass
    
    @abstractmethod
    def delete_project(self, project_id: int) -> bool:
        """删除项目"""
        pass
    
    @abstractmethod
    def get_project_parts(self, project_id: int) -> List[Dict[str, Any]]:
        """获取项目的零件"""
        pass
