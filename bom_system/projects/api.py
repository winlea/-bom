import glob
import os
import time
from typing import Optional

from flask import jsonify, request
from sqlalchemy import func

# 导入器（CSV/XLSX 解析并写入 DB）
from .. import importer
from ..models import BomTable, ImportLog, Project, db
from . import bp

# CRUD for projects


@bp.get("/projects")
def list_projects():
    items = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify(
        {
            "items": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": getattr(p, "status", None),
                    "description": p.description,
                    "created_at": (p.created_at.isoformat() if p.created_at else None),
                }
                for p in items
            ]
        }
    )


@bp.post("/projects")
def create_project():
    try:
        print('收到创建项目请求...')
        
        data = request.get_json(force=True)
        print(f'请求数据: {data}')
        
        if not data:
            print('请求体为空')
            return jsonify({"error": "request body required", "details": "请求体不能为空"}), 400
        
        name = (data.get("name") or "").strip()
        print(f'项目名称: {name}')
        
        if not name:
            print('项目名称为空')
            return jsonify({"error": "name required", "details": "项目名称不能为空"}), 400
        
        desc = (data.get("description") or "").strip() or None
        print(f'项目描述: {desc}')
        
        # 检查数据库连接
        print('检查数据库连接...')
        try:
            # 测试数据库会话
            test_query = db.session.query(Project).limit(1)
            print(f'数据库会话测试: {test_query}')
        except Exception as db_test_error:
            print(f'数据库会话测试失败: {db_test_error}')
        
        p = Project(name=name, description=desc)
        print(f'创建项目对象: {p}')
        
        db.session.add(p)
        print('添加项目到会话')
        
        print('提交数据库事务...')
        db.session.commit()
        print(f'项目创建成功，ID: {p.id}')
        
        return jsonify({"id": p.id, "name": p.name, "description": p.description})
    except Exception as e:
        print(f'创建项目失败: {e}')
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": "create project failed", "details": f"创建项目时发生错误: {str(e)}"}), 500


@bp.delete("/projects/<int:pid>")
def delete_project(pid: int):
    try:
        p = db.session.get(Project, pid)
        if not p:
            return jsonify({"error": "not found", "details": f"项目ID {pid} 不存在"}), 404
        db.session.delete(p)
        db.session.commit()
        return jsonify({"status": "success", "message": "项目删除成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "delete failed", "details": f"删除项目时发生错误: {str(e)}"}), 500


@bp.get("/projects/<int:pid>")
def get_project(pid: int):
    """
    返回单个项目详情，供前端按项目 id 请求使用。
    """
    try:
        p = db.session.get(Project, pid)
        if not p:
            return jsonify({"error": "not found", "details": f"项目ID {pid} 不存在"}), 404
        return jsonify(
            {
                "id": p.id,
                "name": p.name,
                "description": getattr(p, "description", None),
                "status": getattr(p, "status", None),
                "created_at": (
                    p.created_at.isoformat() if getattr(p, "created_at", None) else None
                ),
            }
        )
    except Exception as e:
        return jsonify({"error": "fetch failed", "details": f"获取项目详情时发生错误: {str(e)}"}), 500


# Dashboard summary & recent
@bp.get("/dashboard/summary")
def dashboard_summary():
    project_count = db.session.query(func.count(Project.id)).scalar() or 0
    parts_count = db.session.query(func.count(BomTable.id)).scalar() or 0
    with_image = (
        db.session.query(func.count(BomTable.id))
        .filter(BomTable.image_data.isnot(None))
        .scalar()
        or 0
    )
    without_image = max(0, parts_count - with_image)
    last_import = db.session.query(func.max(ImportLog.created_at)).scalar()
    return jsonify(
        {
            "project_count": project_count,
            "parts_count": parts_count,
            "parts_with_image": with_image,
            "parts_without_image": without_image,
            "last_import_time": last_import.isoformat() if last_import else None,
        }
    )


@bp.get("/dashboard/recent")
def dashboard_recent():
    recent_projects = Project.query.order_by(Project.created_at.desc()).limit(5).all()
    recent_imports = (
        ImportLog.query.order_by(ImportLog.created_at.desc()).limit(5).all()
    )
    return jsonify(
        {
            "recent_projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": getattr(p, "status", None),
                    "created_at": p.created_at.isoformat(),
                }
                for p in recent_projects
            ],
            "recent_imports": [
                {
                    "id": il.id,
                    "project_id": il.project_id,
                    "project_name": (il.project.name if il.project else None),
                    "filename": il.filename,
                    "created_count": il.created_count,
                    "errors_count": il.errors_count,
                    "created_at": il.created_at.isoformat(),
                }
                for il in recent_imports
            ],
        }
    )


@bp.post("/projects/<int:pid>/import")
def import_project_bom(pid: int):
    """
    接收项目级别的 BOM 导入文件（multipart/form-data）
    - file: 上传的 CSV 或 XLSX 文件（可选）
    - mapping: 可选的字段映射 JSON 字符串（前端可传）
    处理策略：
    - 保存接收到的文件到 uploads/imports/ 目录
    - 创建一条 ImportLog 记录（created_count/errors_count 初始为 0）
    - 返回 202 Accepted 并返回 import_log id（实际导入可由后台任务或手动触发）
    """
    p = db.session.get(Project, pid)
    if not p:
        return jsonify({"error": "project not found"}), 404

    # 接收文件与 mapping
    try:
        uploaded = request.files.get("file")
        mapping = request.form.get("mapping")
    except Exception:
        uploaded = None
        mapping = None

    filename = None
    saved_path = None
    if uploaded:
        filename = uploaded.filename or None
        try:
            uploads_dir = os.path.join(os.getcwd(), "uploads", "imports")
            os.makedirs(uploads_dir, exist_ok=True)
            # 在文件名前添加时间戳，避免覆盖
            safe_name = f"{int(time.time())}_{filename}"
            saved_path = os.path.join(uploads_dir, safe_name)
            uploaded.save(saved_path)
        except Exception as e:
            return (
                jsonify({"error": "failed to save uploaded file", "detail": str(e)}),
                500,
            )

    # 创建 ImportLog 记录以便审计与后台处理
    try:
        il = ImportLog(
            project_id=pid, filename=filename, created_count=0, errors_count=0
        )
        db.session.add(il)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "failed to create import log", "detail": str(e)}), 500

    # 返回已接收响应；后台或后续接口可触发实际解析/写库
    return (
        jsonify(
            {
                "status": "accepted",
                "message": "file received and import log created; processing may occur asynchronously",
                "import_log_id": il.id,
                "saved_path": saved_path,
                "mapping_received": mapping is not None,
            }
        ),
        202,
    )


# 新增：查询指定 import log 的详情
@bp.get("/imports/<int:import_id>")
def get_import_log(import_id: int):
    il = db.session.get(ImportLog, import_id)
    if not il:
        return jsonify({"error": "import log not found"}), 404
    return jsonify(
        {
            "id": il.id,
            "project_id": il.project_id,
            "project_name": (il.project.name if il.project else None),
            "filename": il.filename,
            "created_count": il.created_count,
            "errors_count": il.errors_count,
            "created_at": il.created_at.isoformat() if il.created_at else None,
        }
    )


def _find_uploaded_file_for_import(import_log: ImportLog) -> Optional[str]:
    """
    在 uploads/imports 中查找与 import_log.filename 关联的文件（按时间降序）
    返回文件绝对路径或 None
    """
    uploads_dir = os.path.join(os.getcwd(), "uploads", "imports")
    if not os.path.isdir(uploads_dir):
        return None
    # 如果 filename 是 None 或空，则尝试返回最近的上传文件匹配 project_id
    pattern = "*"
    if import_log.filename:
        # 匹配包含原始文件名的文件（safe_name 包含 timestamp_原名）
        pattern = f"*{import_log.filename}*"
    candidates = glob.glob(os.path.join(uploads_dir, pattern))
    if not candidates:
        # fallback: return most recent file
        all_files = glob.glob(os.path.join(uploads_dir, "*"))
        if not all_files:
            return None
        candidates = all_files
    # 选择最新的文件（按修改时间）
    candidates.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return candidates[0]


# 新增：触发对指定 import_log 的同步处理（仅用于开发或手动联调）
@bp.post("/imports/<int:import_id>/process")
def process_import_log(import_id: int):
    il = db.session.get(ImportLog, import_id)
    if not il:
        return jsonify({"error": "import log not found"}), 404

    print(f"DEBUG: ImportLog record: id={il.id}, project_id={il.project_id}, filename={il.filename}")

    # 找到上传文件
    file_path = _find_uploaded_file_for_import(il)
    if not file_path or not os.path.isfile(file_path):
        return (
            jsonify(
                {
                    "error": "uploaded file not found for this import log",
                    "search_filename": il.filename,
                }
            ),
            404,
        )

    # 读取文件并根据扩展名选择解析器
    try:
        with open(file_path, "rb") as fh:
            data = fh.read()
        lower = file_path.lower()
        if lower.endswith(".csv"):
            print(f"DEBUG: Calling import_csv with project_id={il.project_id}")
            result = importer.import_csv(data, project_id=il.project_id)
        else:
            # 其他按 xlsx 处理（openpyxl 支持 xlsx）
            try:
                print(f"DEBUG: Calling import_xlsx with project_id={il.project_id}")
                result = importer.import_xlsx(data, project_id=il.project_id)
            except Exception as e:
                # 如果 xlsx 解析失败，尝试 csv 解析（兼容性）
                try:
                    print(f"DEBUG: Calling import_csv (fallback) with project_id={il.project_id}")
                    result = importer.import_csv(data, project_id=il.project_id)
                except Exception as e2:
                    raise Exception(f"failed to import file as xlsx or csv: {e} / {e2}")
        # result expected: {"created": int, "errors": [ ... ]}
        created = (
            int(result.get("created", 0))
            if isinstance(result.get("created", 0), int)
            else 0
        )
        errors = result.get("errors", []) or []
        errors_count = (
            len(errors) if isinstance(errors, (list, tuple)) else (1 if errors else 0)
        )

        # 更新 ImportLog
        try:
            il.created_count = created
            il.errors_count = errors_count
            db.session.add(il)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return (
                jsonify(
                    {
                        "error": "failed to update import log",
                        "detail": str(e),
                        "process_result": result,
                    }
                ),
                500,
            )

        return jsonify(
            {
                "status": "processed",
                "import_log_id": il.id,
                "created": created,
                "errors_count": errors_count,
                "errors_preview": (
                    errors[:10] if isinstance(errors, list) else str(errors)
                ),
            }
        )
    except Exception as e:
        return jsonify({"error": "processing failed", "detail": str(e)}), 500
