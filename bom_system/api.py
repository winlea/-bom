from io import BytesIO

from flask import Blueprint, jsonify, request, send_file

from .importer import import_csv, import_xlsx
from .models import BomTable, ImportLog, Project
from .services import (
    get_effective_image_bytes,
    get_image_bytes,
    save_base64_image,
    save_url_image,
)

api_bp = Blueprint("api", __name__)


@api_bp.route("/upload/base64", methods=["POST"])
def upload_base64():
    payload = request.get_json(silent=True) or {}
    part_number = payload.get("part_number")
    image_data = payload.get("image_data")
    part_name = payload.get("part_name")
    if not part_number or not image_data:
        return jsonify({"error": "part_number and image_data are required"}), 400
    try:
        rec_id = save_base64_image(part_number, image_data, part_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"status": "success", "id": rec_id})


@api_bp.route("/upload/url", methods=["POST"])
def upload_url():
    payload = request.get_json(silent=True) or {}
    part_number = payload.get("part_number")
    url = payload.get("url")
    part_name = payload.get("part_name")
    if not part_number or not url:
        return jsonify({"error": "part_number and url are required"}), 400
    try:
        rec_id = save_url_image(part_number, url, part_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"status": "success", "id": rec_id})


@api_bp.route("/download/<int:record_id>", methods=["GET"])
def download_image(record_id: int):
    # attempt exact image; if not present, try ancestor fallback
    try:
        data, mime = get_image_bytes(record_id)
    except LookupError:
        try:
            data, mime = get_effective_image_bytes(record_id)
        except LookupError:
            return jsonify({"error": "not found"}), 404
    return send_file(
        BytesIO(data),
        mimetype=mime,
        as_attachment=False,
        download_name=f"image_{record_id}",
    )


@api_bp.route("/import/bom", methods=["POST"])
def import_bom():
    """Import BOM into a project. multipart/form-data with fields: file, project_id."""
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400
    try:
        project_id = int(request.form.get("project_id"))
    except Exception:
        project_id = None
    f = request.files["file"]
    data = f.read()
    filename = (f.filename or "").lower()
    try:
        if filename.endswith(".csv"):
            result = import_csv(data, project_id=project_id)
        elif filename.endswith(".xlsx") or filename.endswith(".xlsm"):
            result = import_xlsx(data, project_id=project_id)
        else:
            return jsonify({"error": "Unsupported file type"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # log import result and update project status
    try:
        log = ImportLog(
            project_id=project_id,
            filename=(f.filename or ""),
            created_count=result.get("created", 0),
            errors_count=len(result.get("errors", []) or []),
            message="; ".join(result.get("errors", []) or []),
        )
        db = BomTable.query.session
        db.add(log)
        if project_id:
            proj = db.get(Project, project_id)
            if proj and proj.status == "created" and result.get("created", 0) > 0:
                proj.status = "imported"
        db.commit()
    except Exception:
        pass

    return jsonify({"status": "success", **result})


@api_bp.route("/items", methods=["GET"])
def list_items():
    """List recent items for UI: supports ?q=part&limit=20"""
    q = (request.args.get("q") or "").strip()
    try:
        limit = int(request.args.get("limit", "20"))
    except ValueError:
        limit = 20
    limit = max(1, min(100, limit))

    query = BomTable.query
    if q:
        like = f"%{q}%"
        query = query.filter(BomTable.part_number.like(like))
    # List all items (including those without images)
    rows = query.order_by(BomTable.created_at.desc()).limit(limit).all()

    def ser(r: BomTable):
        return {
            "id": r.id,
            "part_number": r.part_number,
            "part_name": r.part_name,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    return jsonify({"items": [ser(r) for r in rows]})


@api_bp.route("/parts", methods=["GET"])
def list_parts():
    """List parts with optional project filter: supports ?project_id=N"""
    project_id = request.args.get("project_id")
    query = BomTable.query
    
    if project_id:
        try:
            project_id = int(project_id)
            query = query.filter(BomTable.project_id == project_id)
        except ValueError:
            return jsonify({"error": "invalid project_id"}), 400
    else:
        # 如果没有提供project_id，返回空结果而不是所有零件
        return jsonify({"items": []})
    
    # 按照序号(sequence)排序，实现1, 1.1, 1.2, 2, 2.1, 3, 3.1的排序方式
    # 首先按序号排序，如果序号为空则按assembly_level和bom_sort排序
    rows = query.order_by(
        # 先按序号是否为空排序，非空的排在前面
        BomTable.sequence.is_(None).asc(),
        # 然后按序号排序
        BomTable.sequence.asc(),
        # 最后按assembly_level和bom_sort排序（作为序号为空时的备选排序）
        BomTable.assembly_level.asc(),
        BomTable.bom_sort.asc()
    ).all()
    
    def ser(r: BomTable):
        return {
            "id": r.id,
            "part_number": r.part_number,
            "part_name": r.part_name,
            "project_id": r.project_id,
            "sequence": r.sequence,
            "assembly_level": r.assembly_level,
            "drawing_2d": r.drawing_2d,
            "drawing_3d": r.drawing_3d,
            "image_url": r.image_url,
            "has_image": True if r.image_data or r.image_url else False,
            "original_material": r.original_material,
            "final_material_cn": r.final_material_cn,
            "part_category": r.part_category,
            "net_weight_kg": r.net_weight_kg,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
    
    return jsonify({"items": [ser(r) for r in rows]})


@api_bp.route("/parts/<int:part_id>/image", methods=["GET"])
def get_part_image(part_id: int):
    """Get part image by part ID"""
    part = BomTable.query.get(part_id)
    if not part:
        return jsonify({"error": "Part not found"}), 404
    
    # If part has image_data, return it
    if part.image_data:
        return send_file(
            BytesIO(part.image_data),
            mimetype="image/jpeg",
            as_attachment=False,
            download_name=f"part_{part_id}_image.jpg",
        )
    
    # If part has image_url, redirect to it
    if part.image_url:
        # For security, we'll fetch the image and serve it
        try:
            import requests
            response = requests.get(part.image_url, timeout=5)
            if response.status_code == 200:
                return send_file(
                    BytesIO(response.content),
                    mimetype=response.headers.get('Content-Type', 'image/jpeg'),
                    as_attachment=False,
                    download_name=f"part_{part_id}_image.jpg",
                )
        except Exception:
            pass
    
    # If no image found, return placeholder
    return jsonify({"error": "No image found"}), 404


@api_bp.route("/parts/<int:part_id>", methods=["DELETE"])
def delete_part(part_id: int):
    """Delete a part by ID"""
    part = BomTable.query.get(part_id)
    if not part:
        return jsonify({"error": "Part not found"}), 404
    
    try:
        db = BomTable.query.session
        db.delete(part)
        db.commit()
        return jsonify({"status": "success", "message": "Part deleted successfully"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to delete part: {str(e)}"}), 500


@api_bp.route("/parts/<int:part_id>", methods=["PUT"])
def update_part(part_id: int):
    """Update a part by ID"""
    part = BomTable.query.get(part_id)
    if not part:
        return jsonify({"error": "Part not found"}), 404
    
    try:
        data = request.get_json(silent=True) or {}
        
        # 只允许更新特定字段
        if "final_material_cn" in data:
            part.final_material_cn = data["final_material_cn"]
        
        db = BomTable.query.session
        db.commit()
        return jsonify({"status": "success", "message": "Part updated successfully"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to update part: {str(e)}"}), 500


@api_bp.route("/update-final-material", methods=["POST"])
def update_final_material():
    """批量更新终审拟代材料字段：将original_material字段的值复制到final_material_cn字段"""
    try:
        # 使用原生SQL更新数据
        from sqlalchemy import text
        
        sql = text("""
            UPDATE bom_table 
            SET final_material_cn = original_material 
            WHERE final_material_cn IS NULL AND original_material IS NOT NULL
        """)
        
        db = BomTable.query.session
        result = db.execute(sql)
        updated_count = result.rowcount
        db.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"成功更新 {updated_count} 条记录"
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"更新失败: {str(e)}"}), 500


@api_bp.route("/reset-final-material", methods=["POST"])
def reset_final_material():
    """重置终审拟代材料字段：将final_material_cn与original_material相同的记录的final_material_cn设为NULL"""
    try:
        # 使用原生SQL更新数据
        from sqlalchemy import text
        
        sql = text("""
            UPDATE bom_table 
            SET final_material_cn = NULL 
            WHERE final_material_cn = original_material
        """)
        
        db = BomTable.query.session
        result = db.execute(sql)
        updated_count = result.rowcount
        db.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"成功重置 {updated_count} 条记录"
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"重置失败: {str(e)}"}), 500


@api_bp.route("/cleanup-duplicate-parts", methods=["POST"])
def cleanup_duplicate_parts():
    """清理重复零件数据：保留每个零件编号的第一条记录，删除其余重复记录"""
    try:
        project_id = request.get_json(silent=True) or {}
        project_id = project_id.get("project_id")
        
        # 使用原生SQL查询和删除重复数据
        from sqlalchemy import text
        
        # 首先查询有多少重复记录
        if project_id:
            count_sql = text("""
                SELECT COUNT(*) - COUNT(DISTINCT part_number) as duplicate_count
                FROM bom_table 
                WHERE project_id = :project_id
            """)
            # 使用临时表解决MySQL的限制
            delete_sql = text("""
                DELETE FROM bom_table 
                WHERE id NOT IN (
                    SELECT t.min_id FROM (
                        SELECT MIN(id) as min_id
                        FROM bom_table 
                        WHERE project_id = :project_id
                        GROUP BY part_number
                    ) as t
                )
                AND project_id = :project_id
            """)
        else:
            count_sql = text("""
                SELECT COUNT(*) - COUNT(DISTINCT part_number) as duplicate_count
                FROM bom_table
            """)
            # 使用临时表解决MySQL的限制
            delete_sql = text("""
                DELETE FROM bom_table 
                WHERE id NOT IN (
                    SELECT t.min_id FROM (
                        SELECT MIN(id) as min_id
                        FROM bom_table 
                        GROUP BY part_number
                    ) as t
                )
            """)
        
        db = BomTable.query.session
        
        # 获取重复记录数量
        if project_id:
            count_result = db.execute(count_sql, {"project_id": project_id})
        else:
            count_result = db.execute(count_sql)
            
        duplicate_count = count_result.scalar()
        
        if duplicate_count <= 0:
            return jsonify({
                "status": "success", 
                "message": "没有发现重复记录",
                "deleted_count": 0
            })
        
        # 删除重复记录
        if project_id:
            result = db.execute(delete_sql, {"project_id": project_id})
        else:
            result = db.execute(delete_sql)
            
        deleted_count = result.rowcount
        db.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"成功清理 {deleted_count} 条重复记录",
            "deleted_count": deleted_count
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"清理失败: {str(e)}"}), 500
