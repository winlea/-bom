"""
质量控制相关数据模型
"""

from datetime import datetime

from bom_system.models import db


class DimensionInspection(db.Model):
    """尺寸检验结果表"""

    __tablename__ = "dimension_inspections"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dimension_id = db.Column(
        db.Integer, db.ForeignKey("dimensions.id"), nullable=False, comment="尺寸ID"
    )
    project_id = db.Column(db.String(50), nullable=False, comment="项目ID")
    part_id = db.Column(db.String(50), nullable=True, comment="零件ID")
    actual_value = db.Column(db.String(20), nullable=False, comment="实际测量值")
    is_passed = db.Column(db.Boolean, nullable=False, comment="是否合格")
    inspection_date = db.Column(
        db.DateTime, default=datetime.utcnow, comment="检验日期"
    )
    inspector = db.Column(db.String(50), comment="检验员")
    notes = db.Column(db.Text, comment="备注")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, comment="创建时间")

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "dimension_id": self.dimension_id,
            "project_id": self.project_id,
            "part_id": self.part_id,
            "actual_value": self.actual_value,
            "is_passed": self.is_passed,
            "inspection_date": (
                self.inspection_date.isoformat() if self.inspection_date else None
            ),
            "inspector": self.inspector,
            "notes": self.notes,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
        }


class QualityReport(db.Model):
    """质量报告表"""

    __tablename__ = "quality_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.String(50), nullable=False, comment="项目ID")
    report_name = db.Column(db.String(100), nullable=False, comment="报告名称")
    total_inspections = db.Column(db.Integer, nullable=False, comment="总检验数")
    passed_inspections = db.Column(db.Integer, nullable=False, comment="合格数")
    pass_rate = db.Column(db.Float, nullable=False, comment="合格率")
    report_date = db.Column(db.DateTime, default=datetime.utcnow, comment="报告日期")
    generated_by = db.Column(db.String(50), comment="生成人")
    notes = db.Column(db.Text, comment="备注")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, comment="创建时间")

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "report_name": self.report_name,
            "total_inspections": self.total_inspections,
            "passed_inspections": self.passed_inspections,
            "pass_rate": self.pass_rate,
            "report_date": (
                self.report_date.isoformat() if self.report_date else None
            ),
            "generated_by": self.generated_by,
            "notes": self.notes,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
        }
