from datetime import datetime

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.mysql import LONGBLOB

# Simple DB init pattern; app factory will init with app

db = SQLAlchemy()


# 导入所有模型以确保它们被SQLAlchemy识别
def import_all_models():
    """导入所有模型以确保它们被SQLAlchemy识别"""
    try:
        from bom_system.dimensions.models import Dimension
    except ImportError:
        pass


class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255))
    status = db.Column(db.String(30), default="created")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # relationship to parts
    parts = db.relationship(
        "BomTable",
        backref="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ImportLog(db.Model):
    __tablename__ = "import_logs"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    filename = db.Column(db.String(255))
    created_count = db.Column(db.Integer)
    errors_count = db.Column(db.Integer)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    project = db.relationship("Project", backref="import_logs")


class BomTable(db.Model):
    __tablename__ = "bom_table"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 归属项目
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    # 基础标识
    part_number = db.Column(db.String(100), nullable=False, index=True)
    part_name = db.Column(db.String(200))

    # BOM 序信息
    sequence = db.Column(db.String(50), index=True)  # 序号，如 1.2.3
    assembly_level = db.Column(db.Integer, index=True)  # 装配等级（层级）
    bom_sort = db.Column(db.Integer, index=True)  # 按 BOM 行顺序的排序键

    # 图号与图片
    drawing_2d = db.Column(db.String(100))  # 2D 图号
    drawing_3d = db.Column(db.String(100))  # 3D 图号
    image_data = db.Column(LONGBLOB)  # 零件简图
    image_url = db.Column(db.Text)

    # 材料与分类
    original_material = db.Column(db.String(200))  # 原图材料
    final_material_cn = db.Column(db.String(200))  # 终审拟代材料（中国标准）
    part_category = db.Column(db.String(100))  # 零件分类

    # 其他
    net_weight_kg = db.Column(db.Float)  # 产品净重KG/PCS
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<BOM id={self.id} part_number={self.part_number}>"
