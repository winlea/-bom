from io import BytesIO

from flask import Blueprint, jsonify, request, send_file

from .importer import import_csv, import_xlsx
from .models import BomTable, ImportLog, Project, db
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
    try:
        if "file" not in request.files:
            return jsonify({"error": "file is required", "details": "请上传CSV或Excel文件"}), 400
        
        try:
            project_id = int(request.form.get("project_id")) if request.form.get("project_id") else None
        except ValueError:
            return jsonify({"error": "invalid project_id", "details": "项目ID必须是数字"}), 400
        
        f = request.files["file"]
        data = f.read()
        if not data:
            return jsonify({"error": "empty file", "details": "上传的文件为空"}), 400
        
        filename = (f.filename or "").lower()
        try:
            if filename.endswith(".csv"):
                result = import_csv(data, project_id=project_id)
            elif filename.endswith(".xlsx") or filename.endswith(".xlsm"):
                result = import_xlsx(data, project_id=project_id)
            else:
                return jsonify({"error": "Unsupported file type", "details": "仅支持CSV、XLSX和XLSM文件格式"}), 400
        except ValueError as e:
            return jsonify({"error": str(e), "details": "文件格式错误或缺少必要字段"}), 400
        except Exception as e:
            return jsonify({"error": "import failed", "details": f"导入过程中发生错误: {str(e)}"}), 500

        # log import result and update project status
        try:
            log = ImportLog(
                project_id=project_id,
                filename=(f.filename or ""),
                created_count=result.get("created", 0),
                errors_count=len(result.get("errors", []) or []),
                message="; ".join(result.get("errors", []) or []),
            )
            db.add(log)
            if project_id:
                proj = db.get(Project, project_id)
                if proj and proj.status == "created" and result.get("created", 0) > 0:
                    proj.status = "imported"
            db.commit()
        except Exception as e:
            # 记录日志失败不影响导入结果
            print(f"记录导入日志失败: {str(e)}")

        return jsonify({"status": "success", **result})
    except Exception as e:
        return jsonify({"error": "internal server error", "details": f"服务器内部错误: {str(e)}"}), 500


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
    """List parts with project filter: supports ?project_id=1&q=part"""
    try:
        project_id = int(request.args.get("project_id")) if request.args.get("project_id") else None
    except ValueError:
        project_id = None
    
    q = (request.args.get("q") or "").strip()

    query = BomTable.query
    
    # Filter by project_id if provided
    if project_id:
        query = query.filter(BomTable.project_id == project_id)
    
    # Filter by search term if provided
    if q:
        like = f"%{q}%"
        query = query.filter(BomTable.part_number.like(like))
    
    # Get all matching parts
    rows = query.order_by(BomTable.bom_sort.asc(), BomTable.created_at.desc()).all()

    def ser_part(r: BomTable):
        return {
            "id": r.id,
            "project_id": r.project_id,
            "part_number": r.part_number,
            "part_name": r.part_name,
            "sequence": r.sequence,
            "assembly_level": r.assembly_level,
            "original_material": r.original_material,
            "final_material_cn": r.final_material_cn,
            "net_weight_kg": r.net_weight_kg,
            "drawing_2d": r.drawing_2d,
            "drawing_3d": r.drawing_3d,
            "image_url": r.image_url,
            "part_category": r.part_category,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    return jsonify([ser_part(r) for r in rows])
