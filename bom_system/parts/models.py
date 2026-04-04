"""零件基础库模型 - 共享零件信息"""
from datetime import datetime, timezone
from .models import db


def _utcnow():
    return datetime.now(timezone.utc)


class Part(db.Model):
    """零件基础库 - 所有项目共享的零件主数据"""
    __tablename__ = "parts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # 零件唯一标识（全局唯一）
    part_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # 零件基本信息
    part_name = db.Column(db.String(200))  # 零件名称
    drawing_2d = db.Column(db.String(100))  # 2D图号
    drawing_3d = db.Column(db.String(100))  # 3D图号
    
    # 材料信息
    original_material = db.Column(db.String(200))  # 原图材料
    final_material_cn = db.Column(db.String(200))  # 终审拟代材料
    
    # 分类
    part_category = db.Column(db.String(100))  # 零件分类
    material_spec = db.Column(db.String(200))  # 材料规格/下料尺寸
    
    # 计量信息
    net_weight_kg = db.Column(db.Float)  # 净重KG/PCS
    
    # 图片
    image_data = db.Column(db.LargeBinary)
    image_url = db.Column(db.Text)
    
    # U8编码（企业ERP编码）
    u8_code = db.Column(db.String(100), index=True)
    
    # 元数据
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)
    
    # 关联：该项目下哪些BOM关系引用了这个零件
    bom_relations = db.relationship(
        "ProjectBomRelation",
        backref="part",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    # 关联：所有工序
    operations = db.relationship(
        "PartOperation",
        backref="part",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<Part {self.part_number}>"


class ProjectBomRelation(db.Model):
    """项目BOM关系表 - 连接项目和零件，记录项目特定信息
    
    核心设计：
    - 同一零件(Part)可在不同项目(Project)中使用，层级不同
    - 每个项目有独立的BOM层级结构
    - parent_part_id指向父零件，形成树形结构
    """
    __tablename__ = "project_bom_relations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # 所属项目
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # 关联零件（共享基础信息）
    part_id = db.Column(
        db.Integer,
        db.ForeignKey("parts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # 项目特定的BOM信息
    assembly_level = db.Column(db.Integer, index=True)  # 装配等级（1=总成, 2=子总成, 3=零件...）
    sequence = db.Column(db.String(50), index=True)  # 序号（如1.2.3）
    bom_sort = db.Column(db.Integer, index=True)  # 在BOM表中的顺序
    
    # 数量关系
    quantity = db.Column(db.Float, default=1.0)  # 用量
    unit = db.Column(db.String(20), default="PCS")  # 单位
    
    # 父子关系（构建BOM树形结构）
    parent_relation_id = db.Column(
        db.Integer,
        db.ForeignKey("project_bom_relations.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    
    # 自关联 - 子节点
    children = db.relationship(
        "ProjectBomRelation",
        backref=db.backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
    )
    
    # 来源信息
    source_file = db.Column(db.String(255))  # 来源文件
    source_sheet = db.Column(db.String(100))  # 来源Sheet
    source_row = db.Column(db.Integer)  # 来源行号
    
    # 元数据
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False)
    
    # 复合索引：确保项目中零件唯一（同一零件在同一项目只出现一次）
    __table_args__ = (
        db.UniqueConstraint('project_id', 'part_id', name='uq_project_part'),
    )

    def __repr__(self):
        return f"<ProjectBomRelation project={self.project_id} part={self.part_id} level={self.assembly_level}>"
    
    @property
    def full_sequence(self):
        """获取完整序号链"""
        seq_parts = []
        current = self
        while current:
            if current.sequence:
                seq_parts.insert(0, current.sequence)
            current = current.parent
        return ".".join(seq_parts) if seq_parts else str(self.sequence or "")


class PartOperation(db.Model):
    """零件工序表 - 管理每个零件的加工工序"""
    __tablename__ = "part_operations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # 关联零件
    part_id = db.Column(
        db.Integer,
        db.ForeignKey("parts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # 工序信息
    operation_number = db.Column(db.String(20), index=True)  # 工序号
    operation_name = db.Column(db.String(200), nullable=False)  # 工序名称
    operation_code = db.Column(db.String(50))  # 工序代码
    description = db.Column(db.Text)  # 工序描述
    
    # 顺序
    sequence = db.Column(db.Integer, default=0)  # 工序顺序
    
    # 资源
    work_center = db.Column(db.String(100))  # 工作中心
    workstation = db.Column(db.String(100))  # 工位
    standard_time_minutes = db.Column(db.Float)  # 标准工时（分钟）
    
    # 来源
    source_file = db.Column(db.String(255))
    source_row = db.Column(db.Integer)
    
    # 元数据
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow)
    
    # 关联：工序使用的刀具/夹具
    tools = db.relationship(
        "OperationTool",
        backref="operation",
        cascade="all, delete-orphan",
    )
    
    # 复合索引
    __table_args__ = (
        db.Index('ix_part_operation_seq', 'part_id', 'sequence'),
    )

    def __repr__(self):
        return f"<PartOperation {self.part_id}: {self.operation_name}>"


class OperationTool(db.Model):
    """工序刀具/夹具"""
    __tablename__ = "operation_tools"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    operation_id = db.Column(
        db.Integer,
        db.ForeignKey("part_operations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    tool_number = db.Column(db.String(50))  # 刀具编号
    tool_name = db.Column(db.String(200))  # 刀具名称
    tool_spec = db.Column(db.String(100))  # 刀具规格
    quantity = db.Column(db.Float, default=1.0)  # 数量
    
    created_at = db.Column(db.DateTime, default=_utcnow)

    def __repr__(self):
        return f"<OperationTool {self.tool_name}>"
