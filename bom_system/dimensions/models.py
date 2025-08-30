"""
尺寸数据模型
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Dimension(Base):
    """尺寸数据表"""

    __tablename__ = "dimensions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(50), nullable=False, comment="项目ID")
    part_id = Column(String(50), nullable=True, comment="零件ID")
    group_no = Column(Integer, nullable=False, comment="组号")
    dimension_type = Column(String(50), nullable=False, comment="尺寸类型")
    nominal_value = Column(String(20), nullable=False, comment="名义值")
    tolerance_value = Column(String(20), comment="公差值")
    upper_tolerance = Column(String(20), comment="上公差")
    lower_tolerance = Column(String(20), comment="下公差")
    unit = Column(String(10), default="mm", comment="单位")
    datum = Column(String(20), comment="基准")
    characteristic = Column(String(20), comment="特性")
    fcf_symbol = Column(String(10), comment="FCF符号")
    fcf_value = Column(String(20), comment="FCF值")
    fcf_modifier = Column(String(10), comment="FCF修饰符")
    fcf_datums = Column(String(50), comment="FCF基准序列")
    notes = Column(Text, comment="备注")
    image_url = Column(String(255), comment="图片URL")
    image_data = Column(Text, comment="图片数据(Base64)")
    image_type = Column(String(20), default="canvas", comment="图片类型")
    combined_image_url = Column(String(255), comment="拼接图片URL")
    combined_image_data = Column(Text, comment="拼接图片数据(Base64)")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间"
    )

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "partId": getattr(self, "part_id", None),
            "groupNo": self.group_no,
            "dimensionType": self.dimension_type,
            "nominalValue": self.nominal_value,
            "toleranceValue": self.tolerance_value or "",
            "upperTolerance": self.upper_tolerance or "",
            "lowerTolerance": self.lower_tolerance or "",
            "unit": self.unit or "mm",
            "datum": self.datum or "",
            "characteristic": self.characteristic or "",
            "fcfSymbol": self.fcf_symbol or "",
            "fcfValue": self.fcf_value or "",
            "fcfModifier": self.fcf_modifier or "",
            "fcfDatums": self.fcf_datums or "",
            "notes": self.notes or "",
            "imageUrl": self.image_url or "",
            "imageData": self.image_data or "",
            "imageType": self.image_type or "canvas",
            "combinedImageUrl": self.combined_image_url or "",
            "combinedImageData": self.combined_image_data or "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data):
        """从字典创建实例"""
        return cls(
            project_id=data.get("project_id"),
            part_id=data.get("partId"),
            group_no=data.get("groupNo"),
            dimension_type=data.get("dimensionType"),
            nominal_value=data.get("nominalValue"),
            tolerance_value=data.get("toleranceValue"),
            upper_tolerance=data.get("upperTolerance"),
            lower_tolerance=data.get("lowerTolerance"),
            unit=data.get("unit", "mm"),
            datum=data.get("datum"),
            characteristic=data.get("characteristic"),
            fcf_symbol=data.get("fcfSymbol"),
            fcf_value=data.get("fcfValue"),
            fcf_modifier=data.get("fcfModifier"),
            fcf_datums=data.get("fcfDatums"),
            notes=data.get("notes"),
            image_url=data.get("imageUrl"),
        )
