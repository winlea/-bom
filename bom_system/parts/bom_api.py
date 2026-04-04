"""BOM导入API接口"""
from flask import Blueprint, request, jsonify
from .importer import import_bom_file, get_project_bom_tree
from .models import ProjectBomRelation
from bom_system.database.session import get_db_session
from bom_system.models import Project, db
import logging

logger = logging.getLogger(__name__)

bom_bp = Blueprint('bom', __name__, url_prefix='/api/bom')


@bom_bp.route('/import', methods=['POST'])
def import_bom():
    """导入BOM文件"""
    if 'file' not in request.files:
        return jsonify({'error': '请上传文件'}), 400
    
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': '请选择文件'}), 400
    
    project_name = request.form.get('project_name')
    
    try:
        file_bytes = file.read()
        result = import_bom_file(
            file_bytes,
            project_name=project_name,
            filename=file.filename
        )
        
        return jsonify({
            'success': True,
            'project_created': result.project_created,
            'parts_created': result.parts_created,
            'relations_created': result.relations_created,
            'errors': result.errors,
            'warnings': result.warnings,
        })
    except Exception as e:
        logger.error(f"BOM导入失败: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bom_bp.route('/projects', methods=['GET'])
def get_projects():
    """获取所有项目"""
    session = get_db_session()
    projects = session.query(Project).all()
    
    return jsonify([
        {
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'status': p.status,
            'created_at': p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ])


@bom_bp.route('/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """获取项目详情"""
    session = get_db_session()
    project = session.query(Project).get(project_id)
    
    if not project:
        return jsonify({'error': '项目不存在'}), 404
    
    # 获取BOM关系统计
    relations_count = session.query(ProjectBomRelation).filter_by(
        project_id=project_id
    ).count()
    
    return jsonify({
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'status': project.status,
        'created_at': project.created_at.isoformat() if project.created_at else None,
        'bom_parts_count': relations_count,
    })


@bom_bp.route('/projects/<int:project_id>/tree', methods=['GET'])
def get_project_tree(project_id):
    """获取项目BOM树形结构"""
    tree = get_project_bom_tree(project_id)
    return jsonify(tree)


@bom_bp.route('/projects/<int:project_id>/flat', methods=['GET'])
def get_project_flat(project_id):
    """获取项目BOM扁平列表"""
    session = get_db_session()
    
    level = request.args.get('level', type=int)
    
    query = session.query(ProjectBomRelation).filter_by(project_id=project_id)
    
    if level:
        query = query.filter_by(assembly_level=level)
    
    relations = query.order_by(ProjectBomRelation.bom_sort).all()
    
    return jsonify([
        {
            'id': r.id,
            'part_id': r.part_id,
            'part_number': r.part.part_number,
            'part_name': r.part.part_name,
            'drawing_2d': r.part.drawing_2d,
            'drawing_3d': r.part.drawing_3d,
            'assembly_level': r.assembly_level,
            'sequence': r.sequence,
            'quantity': r.quantity,
            'unit': r.unit,
            'original_material': r.part.original_material,
            'final_material_cn': r.part.final_material_cn,
            'part_category': r.part.part_category,
        }
        for r in relations
    ])


@bom_bp.route('/projects/<int:project_id>/parts', methods=['GET'])
def get_project_parts(project_id):
    """获取项目零件列表"""
    session = get_db_session()
    
    # 支持按层级筛选
    level = request.args.get('level', type=int)
    
    query = session.query(ProjectBomRelation).filter_by(project_id=project_id)
    
    if level:
        query = query.filter_by(assembly_level=level)
    
    relations = query.order_by(
        ProjectBomRelation.assembly_level,
        ProjectBomRelation.bom_sort
    ).all()
    
    # 按层级分组
    by_level = {}
    for r in relations:
        lvl = r.assembly_level or 0
        if lvl not in by_level:
            by_level[lvl] = []
        by_level[lvl].append({
            'id': r.id,
            'part_id': r.part_id,
            'part_number': r.part.part_number,
            'part_name': r.part.part_name,
            'sequence': r.sequence,
        })
    
    return jsonify({
        'project_id': project_id,
        'total': len(relations),
        'by_level': by_level,
        'parts': [
            {
                'id': r.id,
                'part_id': r.part_id,
                'part_number': r.part.part_number,
                'part_name': r.part.part_name,
                'drawing_2d': r.part.drawing_2d,
                'drawing_3d': r.part.drawing_3d,
                'assembly_level': r.assembly_level,
                'sequence': r.sequence,
                'u8_code': r.part.u8_code,
                'material': r.part.final_material_cn or r.part.original_material,
                'category': r.part.part_category,
            }
            for r in relations
        ]
    })


@bom_bp.route('/projects/<int:project_id>/duplicate-check', methods=['GET'])
def check_duplicates(project_id):
    """检查项目中的重复零件"""
    session = get_db_session()
    
    # 查找同一层级中重复的零件
    subq = session.query(
        ProjectBomRelation.part_id,
        ProjectBomRelation.assembly_level,
    ).filter_by(project_id=project_id).group_by(
        ProjectBomRelation.part_id,
        ProjectBomRelation.assembly_level,
    ).having(
        db.func.count(ProjectBomRelation.id) > 1
    ).subquery()
    
    duplicates = session.query(ProjectBomRelation).join(
        subq,
        db.and_(
            ProjectBomRelation.part_id == subq.c.part_id,
            ProjectBomRelation.assembly_level == subq.c.assembly_level,
        )
    ).filter_by(project_id=project_id).all()
    
    return jsonify({
        'has_duplicates': len(duplicates) > 0,
        'count': len(duplicates),
        'duplicates': [
            {
                'id': r.id,
                'part_number': r.part.part_number,
                'part_name': r.part.part_name,
                'assembly_level': r.assembly_level,
            }
            for r in duplicates
        ]
    })
