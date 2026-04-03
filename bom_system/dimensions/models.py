"""
尺寸数据模型
"""

from datetime import datetime, timezone

from bom_system.models import db, _utcnow


class Dimension(db.Model):
    """尺寸数据表"""

    __tablename__ = "dimensions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.String(50), nullable=False, comment="项目ID")
    part_id = db.Column(db.String(50), nullable=True, comment="零件ID")
    group_no = db.Column(db.Integer, nullable=False, comment="组号")
    dimension_type = db.Column(db.String(50), nullable=False, comment="尺寸类型")
    nominal_value = db.Column(db.String(20), nullable=False, comment="名义值")
    tolerance_value = db.Column(db.String(20), comment="公差值")
    upper_tolerance = db.Column(db.String(20), comment="上公差")
    lower_tolerance = db.Column(db.String(20), comment="下公差")
    unit = db.Column(db.String(10), default="mm", comment="单位")
    datum = db.Column(db.String(20), comment="基准")
    characteristic = db.Column(db.String(20), comment="特性")
    fcf_symbol = db.Column(db.String(10), comment="FCF符号")
    fcf_value = db.Column(db.String(20), comment="FCF值")
    fcf_modifier = db.Column(db.String(10), comment="FCF修饰符")
    fcf_datums = db.Column(db.String(50), comment="FCF基准序列")
    notes = db.Column(db.Text, comment="备注")
    image_url = db.Column(db.String(255), comment="图片URL")
    image_data = db.Column(db.Text, comment="图片数据(Base64)")
    image_type = db.Column(db.String(20), default="canvas", comment="图片类型")
    combined_image_url = db.Column(db.String(255), comment="拼接图片URL")
    combined_image_data = db.Column(db.Text, comment="拼接图片数据(Base64)")
    created_at = db.Column(db.DateTime, default=_utcnow, comment="创建时间")
    updated_at = db.Column(
        db.DateTime,
        default=_utcnow,
        onupdate=_utcnow,
        comment="更新时间",
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
            "toleranceValue": self.tolerance_value,
            "upperTolerance": self.upper_tolerance,
            "lowerTolerance": self.lower_tolerance,
            "unit": self.unit,
            "datum": self.datum,
            "characteristic": self.characteristic,
            "fcfSymbol": self.fcf_symbol,
            "fcfValue": self.fcf_value,
            "fcfModifier": self.fcf_modifier,
            "fcfDatums": self.fcf_datums,
            "notes": self.notes,
            "imageUrl": self.image_url,
            "imageData": self.image_data,
            "imageType": self.image_type,
            "combinedImageUrl": self.combined_image_url,
            "combinedImageData": self.combined_image_data,
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


class DimensionVersion(db.Model):
    """尺寸版本历史表"""

    __tablename__ = "dimension_versions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dimension_id = db.Column(
        db.Integer, db.ForeignKey("dimensions.id"), nullable=False, comment="尺寸ID"
    )
    version = db.Column(db.Integer, nullable=False, comment="版本号")
    project_id = db.Column(db.String(50), nullable=False, comment="项目ID")
    part_id = db.Column(db.String(50), nullable=True, comment="零件ID")
    group_no = db.Column(db.Integer, nullable=False, comment="组号")
    dimension_type = db.Column(db.String(50), nullable=False, comment="尺寸类型")
    nominal_value = db.Column(db.String(20), nullable=False, comment="名义值")
    tolerance_value = db.Column(db.String(20), comment="公差值")
    upper_tolerance = db.Column(db.String(20), comment="上公差")
    lower_tolerance = db.Column(db.String(20), comment="下公差")
    unit = db.Column(db.String(10), default="mm", comment="单位")
    datum = db.Column(db.String(20), comment="基准")
    characteristic = db.Column(db.String(20), comment="特性")
    fcf_symbol = db.Column(db.String(10), comment="FCF符号")
    fcf_value = db.Column(db.String(20), comment="FCF值")
    fcf_modifier = db.Column(db.String(10), comment="FCF修饰符")
    fcf_datums = db.Column(db.String(50), comment="FCF基准序列")
    notes = db.Column(db.Text, comment="备注")
    image_url = db.Column(db.String(255), comment="图片URL")
    image_data = db.Column(db.Text, comment="图片数据(Base64)")
    image_type = db.Column(db.String(20), default="canvas", comment="图片类型")
    combined_image_url = db.Column(db.String(255), comment="拼接图片URL")
    combined_image_data = db.Column(db.Text, comment="拼接图片数据(Base64)")
    modified_by = db.Column(db.String(50), comment="修改人")
    modification_reason = db.Column(db.Text, comment="修改原因")
    created_at = db.Column(db.DateTime, default=_utcnow, comment="创建时间")

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "dimensionId": self.dimension_id,
            "version": self.version,
            "projectId": self.project_id,
            "partId": self.part_id,
            "groupNo": self.group_no,
            "dimensionType": self.dimension_type,
            "nominalValue": self.nominal_value,
            "toleranceValue": self.tolerance_value,
            "upperTolerance": self.upper_tolerance,
            "lowerTolerance": self.lower_tolerance,
            "unit": self.unit,
            "datum": self.datum,
            "characteristic": self.characteristic,
            "fcfSymbol": self.fcf_symbol,
            "fcfValue": self.fcf_value,
            "fcfModifier": self.fcf_modifier,
            "fcfDatums": self.fcf_datums,
            "notes": self.notes,
            "imageUrl": self.image_url,
            "imageData": self.image_data,
            "imageType": self.image_type,
            "combinedImageUrl": self.combined_image_url,
            "combinedImageData": self.combined_image_data,
            "modifiedBy": self.modified_by,
            "modificationReason": self.modification_reason,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class DimensionTemplate(db.Model):
    """尺寸模板表"""

    __tablename__ = "dimension_templates"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, comment="模板名称")
    description = db.Column(db.Text, comment="模板描述")
    dimension_type = db.Column(db.String(50), nullable=False, comment="尺寸类型")
    nominal_value = db.Column(db.String(20), comment="名义值")
    tolerance_value = db.Column(db.String(20), comment="公差值")
    upper_tolerance = db.Column(db.String(20), comment="上公差")
    lower_tolerance = db.Column(db.String(20), comment="下公差")
    unit = db.Column(db.String(10), default="mm", comment="单位")
    datum = db.Column(db.String(20), comment="基准")
    characteristic = db.Column(db.String(20), comment="特性")
    fcf_symbol = db.Column(db.String(10), comment="FCF符号")
    fcf_value = db.Column(db.String(20), comment="FCF值")
    fcf_modifier = db.Column(db.String(10), comment="FCF修饰符")
    fcf_datums = db.Column(db.String(50), comment="FCF基准序列")
    notes = db.Column(db.Text, comment="备注")
    is_system = db.Column(db.Boolean, default=False, comment="是否系统模板")
    created_by = db.Column(db.String(50), comment="创建人")
    created_at = db.Column(db.DateTime, default=_utcnow, comment="创建时间")
    updated_at = db.Column(
        db.DateTime, 
        default=_utcnow, 
        onupdate=_utcnow, 
        comment="更新时间"
    )

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "dimensionType": self.dimension_type,
            "nominalValue": self.nominal_value,
            "toleranceValue": self.tolerance_value,
            "upperTolerance": self.upper_tolerance,
            "lowerTolerance": self.lower_tolerance,
            "unit": self.unit,
            "datum": self.datum,
            "characteristic": self.characteristic,
            "fcfSymbol": self.fcf_symbol,
            "fcfValue": self.fcf_value,
            "fcfModifier": self.fcf_modifier,
            "fcfDatums": self.fcf_datums,
            "notes": self.notes,
            "isSystem": self.is_system,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data):
        """从字典创建实例"""
        return cls(
            name=data.get("name"),
            description=data.get("description"),
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
            is_system=data.get("isSystem", False),
            created_by=data.get("createdBy"),
        )
