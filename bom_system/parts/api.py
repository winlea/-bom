"""零件库API接口"""
from flask import Blueprint, request, jsonify
from .importer import import_bom_file, get_project_bom_tree, get_part_library
from .models import Part, PartOperation, ProjectBomRelation
from bom_system.database.session import get_db_session
from bom_system.models import Project
import logging

logger = logging.getLogger(__name__)

parts_bp = Blueprint('parts', __name__, url_prefix='/api/parts')


@parts_bp.route('/library', methods=['GET'])
def get_parts_library():
    """获取零件库列表"""
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    result = get_part_library(search, page, page_size)
    return jsonify(result)


@parts_bp.route('/<int:part_id>', methods=['GET'])
def get_part(part_id):
    """获取零件详情"""
    session = get_db_session()
    part = session.query(Part).get(part_id)
    
    if not part:
        return jsonify({'error': '零件不存在'}), 404
    
    # 获取关联的项目BOM关系
    relations = session.query(ProjectBomRelation).filter_by(part_id=part_id).all()
    
    # 获取工序
    operations = session.query(PartOperation).filter_by(part_id=part_id).order_by(PartOperation.sequence).all()
    
    return jsonify({
        'id': part.id,
        'part_number': part.part_number,
        'part_name': part.part_name,
        'drawing_2d': part.drawing_2d,
        'drawing_3d': part.drawing_3d,
        'original_material': part.original_material,
        'final_material_cn': part.final_material_cn,
        'part_category': part.part_category,
        'material_spec': part.material_spec,
        'net_weight_kg': part.net_weight_kg,
        'u8_code': part.u8_code,
        'projects': [
            {
                'project_id': r.project_id,
                'project_name': r.project.name if r.project else None,
                'assembly_level': r.assembly_level,
                'sequence': r.sequence,
            }
            for r in relations
        ],
        'operations': [
            {
                'id': op.id,
                'operation_number': op.operation_number,
                'operation_name': op.operation_name,
                'operation_code': op.operation_code,
                'sequence': op.sequence,
                'work_center': op.work_center,
                'description': op.description,
            }
            for op in operations
        ]
    })


@parts_bp.route('/<int:part_id>', methods=['PUT'])
def update_part(part_id):
    """更新零件信息"""
    session = get_db_session()
    part = session.query(Part).get(part_id)
    
    if not part:
        return jsonify({'error': '零件不存在'}), 404
    
    data = request.get_json()
    
    # 更新字段
    updatable_fields = [
        'part_name', 'drawing_2d', 'drawing_3d', 'original_material',
        'final_material_cn', 'part_category', 'material_spec',
        'net_weight_kg', 'u8_code'
    ]
    
    for field in updatable_fields:
        if field in data:
            setattr(part, field, data[field])
    
    try:
        session.commit()
        return jsonify({'success': True, 'id': part.id})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500


@parts_bp.route('/<int:part_id>/operations', methods=['GET'])
def get_part_operations(part_id):
    """获取零件工序"""
    session = get_db_session()
    operations = session.query(PartOperation).filter_by(
        part_id=part_id
    ).order_by(PartOperation.sequence).all()
    
    return jsonify([
        {
            'id': op.id,
            'operation_number': op.operation_number,
            'operation_name': op.operation_name,
            'operation_code': op.operation_code,
            'sequence': op.sequence,
            'work_center': op.work_center,
            'workstation': op.workstation,
            'standard_time_minutes': op.standard_time_minutes,
            'description': op.description,
        }
        for op in operations
    ])


@parts_bp.route('/<int:part_id>/operations', methods=['POST'])
def add_part_operation(part_id):
    """添加工序"""
    session = get_db_session()
    part = session.query(Part).get(part_id)
    
    if not part:
        return jsonify({'error': '零件不存在'}), 404
    
    data = request.get_json()
    
    # 获取最大sequence
    max_seq = session.query(PartOperation).filter_by(part_id=part_id).count()
    
    op = PartOperation(
        part_id=part_id,
        operation_number=data.get('operation_number'),
        operation_name=data.get('operation_name', ''),
        operation_code=data.get('operation_code'),
        sequence=data.get('sequence', max_seq + 1),
        work_center=data.get('work_center'),
        workstation=data.get('workstation'),
        standard_time_minutes=data.get('standard_time_minutes'),
        description=data.get('description'),
    )
    
    session.add(op)
    try:
        session.commit()
        return jsonify({'success': True, 'id': op.id}), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500


@parts_bp.route('/operations/<int:op_id>', methods=['DELETE'])
def delete_operation(op_id):
    """删除工序"""
    session = get_db_session()
    op = session.query(PartOperation).get(op_id)
    
    if not op:
        return jsonify({'error': '工序不存在'}), 404
    
    session.delete(op)
    try:
        session.commit()
        return jsonify({'success': True})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
