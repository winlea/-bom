from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from bom_system.repositories.project import IProjectRepository
from bom_system.models import Project


class ProjectRepository(IProjectRepository):
    """项目仓储实现类"""
    
    def __init__(self, session: Session):
        """初始化仓储"""
        self.session = session
    
    def create(self, data: Dict[str, Any]) -> Any:
        """创建项目记录"""
        project = Project(**data)
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project
    
    def get_by_id(self, project_id: int) -> Optional[Any]:
        """根据ID获取项目记录"""
        return self.session.query(Project).filter(Project.id == project_id).first()
    
    def get_all(self) -> List[Any]:
        """获取所有项目记录"""
        return self.session.query(Project).all()
    
    def search(self, query: str) -> List[Any]:
        """搜索项目记录"""
        like = f"%{query}%"
        return self.session.query(Project).filter(
            (Project.name.like(like)) | (Project.description.like(like))
        ).all()
    
    def update(self, project_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新项目记录"""
        project = self.get_by_id(project_id)
        if not project:
            return None
        for key, value in data.items():
            if hasattr(project, key):
                setattr(project, key, value)
        self.session.commit()
        self.session.refresh(project)
        return project
    
    def delete(self, project_id: int) -> bool:
        """删除项目记录"""
        project = self.get_by_id(project_id)
        if not project:
            return False
        self.session.delete(project)
        self.session.commit()
        return True
