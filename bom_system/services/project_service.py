"""Project Service Implementation"""
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from ..interfaces.project import IProjectService
from ..models import Project

logger = logging.getLogger(__name__)


class ProjectService(IProjectService):
    """Project服务实现类"""

    def __init__(self, session: Session):
        self._session = session

    def create_project(self, name: str, description: str = None, **kwargs) -> Dict[str, Any]:
        """Create a new project"""
        project = Project(name=name, description=description, **kwargs)
        self._session.add(project)
        self._session.commit()
        return self._serialize(project)

    def get_project(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        project = self._session.query(Project).get(project_id)
        return self._serialize(project) if project else None

    def list_projects(self, q: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List projects with optional search"""
        query = self._session.query(Project)
        
        if q:
            query = query.filter(Project.name.like(f"%{q}%"))
        
        projects = query.order_by(Project.created_at.desc()).limit(limit).all()
        return [self._serialize(p) for p in projects]

    def update_project(self, project_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """Update project"""
        project = self._session.query(Project).get(project_id)
        if not project:
            return None
        
        for key, value in kwargs.items():
            if hasattr(project, key):
                setattr(project, key, value)
        
        self._session.commit()
        return self._serialize(project)

    def delete_project(self, project_id: int) -> bool:
        """Delete project"""
        project = self._session.query(Project).get(project_id)
        if not project:
            return False
        
        self._session.delete(project)
        self._session.commit()
        return True

    def _serialize(self, project: Project) -> Dict[str, Any]:
        """Serialize project to dict"""
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "supplier_name": project.supplier_name,
            "customer_name": project.customer_name,
            "created_at": project.created_at.isoformat() if project.created_at else None,
        }
