from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from bom_system.models import BomTable
from bom_system.repositories.bom import IBOMRepository


class BOMRepository(IBOMRepository):
    """BOM仓储实现类"""

    def __init__(self, session: Session):
        """初始化仓储"""
        self.session = session

    def create(self, data: Dict[str, Any]) -> Any:
        """创建BOM记录"""
        bom = BomTable(**data)
        self.session.add(bom)
        self.session.commit()
        self.session.refresh(bom)
        return bom

    def get_by_id(self, record_id: int) -> Optional[Any]:
        """根据ID获取BOM记录"""
        return self.session.query(BomTable).filter(BomTable.id == record_id).first()

    def get_by_part_number(self, part_number: str) -> Optional[Any]:
        """根据零件编号获取BOM记录"""
        return (
            self.session.query(BomTable)
            .filter(BomTable.part_number == part_number)
            .first()
        )

    def get_by_project(self, project_id: int) -> List[Any]:
        """根据项目ID获取BOM记录"""
        return (
            self.session.query(BomTable).filter(BomTable.project_id == project_id).all()
        )

    def get_by_sequence(self, sequence: str) -> Optional[Any]:
        """根据序号获取BOM记录"""
        return (
            self.session.query(BomTable).filter(BomTable.sequence == sequence).first()
        )

    def search(self, query: str, limit: int = 20) -> List[Any]:
        """搜索BOM记录"""
        like = f"%{query}%"
        return (
            self.session.query(BomTable)
            .filter(BomTable.part_number.like(like))
            .order_by(BomTable.created_at.desc())
            .limit(limit)
            .all()
        )

    def update(self, record_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """更新BOM记录"""
        bom = self.get_by_id(record_id)
        if not bom:
            return None
        for key, value in data.items():
            if hasattr(bom, key):
                setattr(bom, key, value)
        self.session.commit()
        self.session.refresh(bom)
        return bom

    def delete(self, record_id: int) -> bool:
        """删除BOM记录"""
        bom = self.get_by_id(record_id)
        if not bom:
            return False
        self.session.delete(bom)
        self.session.commit()
        return True

    def bulk_create(self, data_list: List[Dict[str, Any]]) -> List[Any]:
        """批量创建BOM记录"""
        boms = [BomTable(**data) for data in data_list]
        self.session.add_all(boms)
        self.session.commit()
        return boms
