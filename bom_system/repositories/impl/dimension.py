from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from bom_system.repositories.dimension import IDimensionRepository
from bom_system.dimensions.models import Dimension


class DimensionRepository(IDimensionRepository):
    """维度仓储实现类"""
    
    def __init__(self, session: Session):
        """初始化仓储"""
        self.session = session
    
    def create(self, data: Dict[str, Any]) -> Any:
        """创建维度记录"""
        dimension = Dimension(**data)
        self.session.add(dimension)
        self.session.commit()
        self.session.refresh(dimension)
        return dimension
    
    def get_by_id(self, dimension_id: int) -> Optional[Any]:
        """根据ID获取维度记录"""
        return self.session.query(Dimension).filter(Dimension.id == dimension_id).first()
    
    def get_by_part(self, part_id: str) -> List[Any]:
        """根据零件ID获取维度记录"""
        return self.session.query(Dimension).filter(Dimension.partId == part_id).all()
    
    def get_by_project(self, project_id: str) -> List[Any]:
        """根据项目ID获取维度记录"""
        return self.session.query(Dimension).filter(Dimension.projectId == project_id).all()
    
    def search(self, project_id: str, search_term: str) -> List[Any]:
        """搜索维度记录"""
        like = f"%{search_term}%"
        return self.session.query(Dimension).filter(
            Dimension.projectId == project_id,
            Dimension.characteristic.like(like)
        ).all()
    
    def update(self, dimension_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新维度记录"""
        dimension = self.get_by_id(dimension_id)
        if not dimension:
            return None
        for key, value in data.items():
            if hasattr(dimension, key):
                setattr(dimension, key, value)
        self.session.commit()
        self.session.refresh(dimension)
        return dimension
    
    def delete(self, dimension_id: int) -> bool:
        """删除维度记录"""
        dimension = self.get_by_id(dimension_id)
        if not dimension:
            return False
        self.session.delete(dimension)
        self.session.commit()
        return True
    
    def get_next_group_number(self, project_id: str) -> int:
        """获取下一个组号"""
        max_group = self.session.query(Dimension).filter(
            Dimension.projectId == project_id
        ).with_entities(Dimension.group_no).order_by(Dimension.group_no.desc()).first()
        return (max_group[0] + 1) if max_group else 1
    
    def get_by_group(self, project_id: str, group_no: int) -> List[Any]:
        """根据组号获取维度记录"""
        return self.session.query(Dimension).filter(
            Dimension.projectId == project_id,
            Dimension.group_no == group_no
        ).all()
