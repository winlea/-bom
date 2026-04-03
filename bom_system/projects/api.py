import glob
import os
import time
from typing import Optional

from flask import request, jsonify
from sqlalchemy import func

# 导入器（CSV/XLSX 解析并写入 DB）
from .. import importer
from ..models import BomTable, ImportLog, Project, db
from ..api.response import APIResponse
from . import bp
from bom_system.database.session import get_db_session


# CRUD for projects


@bp.get("/projects")
def list_projects():
    session = get_db_session()
    items = Project.query.order_by(Project.created_at.desc()).all()
    return APIResponse.success(
        data={
            "items": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": getattr(p, "status", None),
                    "description": p.description,
                    "created_at": (p.created_at.isoformat() if p.created_at else None),
                    # 新增项目信息字段
                    "supplier_name": getattr(p, "supplier_name", None),
                    "address": getattr(p, "address", None),
                    "supplier_code": getattr(p, "supplier_code", None),
                    "customer_name": getattr(p, "customer_name", None),
                    "customer_purchase": getattr(p, "customer_purchase", None),
                    "quality_engineer": getattr(p, "quality_engineer", None),
                    "phone": getattr(p, "phone", None),
                    "email": getattr(p, "email", None),
                }
                for p in items
            ]
        }
    )


@bp.post("/projects")
def create_project():
    session = get_db_session()
    try:
        logger.debug("收到创建项目请求...")

        # 检查是否是FormData格式
        if request.files:
            logger.debug("收到FormData请求")
            data = request.form
            # 获取签名图片
            signature_file = request.files.get("quality_engineer_signature")
            quality_engineer_signature = signature_file.read() if signature_file else None
        else:
            logger.debug("收到JSON请求")
            data = request.get_json(force=True)
            quality_engineer_signature = data.get("quality_engineer_signature")

        logger.debug("请求数据: {data}")

        if not data:
            logger.debug("请求体为空")
            return APIResponse.bad_request(
                message="请求体不能为空",
                errors={"error": "request body required"}
            )

        name = (data.get("name") or "").strip()
        logger.debug("项目名称: {name}")

        if not name:
            logger.debug("项目名称为空")
            return APIResponse.bad_request(
                message="项目名称不能为空",
                errors={"error": "name required"}
            )

        desc = (data.get("description") or "").strip() or None
        logger.debug("项目描述: {desc}")

        # 新增项目信息字段
        supplier_name = data.get("supplier_name")
        address = data.get("address")
        supplier_code = data.get("supplier_code")
        customer_name = data.get("customer_name")
        customer_purchase = data.get("customer_purchase")
        quality_engineer = data.get("quality_engineer")
        phone = data.get("phone")
        email = data.get("email")

        logger.debug("供方名称: {supplier_name}")
        logger.debug("街道地址: {address}")
        logger.debug("供方代码: {supplier_code}")
        logger.debug("客户名称: {customer_name}")
        logger.debug("客户采购: {customer_purchase}")
        logger.debug("质量工程师: {quality_engineer}")
        logger.debug("电话: {phone}")
        logger.debug("邮箱: {email}")
        logger.debug("是否有签名图片: {quality_engineer_signature is not None}")

        # 检查数据库连接
        logger.debug("检查数据库连接...")
        try:
            # 测试数据库会话
            test_query = session.query(Project).limit(1)
            logger.debug("数据库会话测试: {test_query}")
        except Exception as db_test_error:
            logger.debug("数据库会话测试失败: {db_test_error}")

        p = Project(
            name=name, 
            description=desc,
            supplier_name=supplier_name,
            address=address,
            supplier_code=supplier_code,
            customer_name=customer_name,
            customer_purchase=customer_purchase,
            quality_engineer=quality_engineer,
            quality_engineer_signature=quality_engineer_signature,
            phone=phone,
            email=email
        )
        logger.debug("创建项目对象: {p}")

        session.add(p)
        logger.debug("添加项目到会话")

        logger.debug("提交数据库事务...")
        session.commit()
        logger.debug("项目创建成功，ID: {p.id}")

        return jsonify({
            "id": p.id, 
            "name": p.name, 
            "description": p.description,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    except Exception as e:
        logger.debug("创建项目失败: {e}")
        import traceback

        traceback.print_exc()
        session.rollback()
        return APIResponse.internal_server_error(
            message=f"创建项目时发生错误: {str(e)}",
            errors={"error": "create project failed"}
        )


@bp.delete("/projects/<int:pid>")
def delete_project(pid: int):
    session = get_db_session()
    try:
        p = session.get(Project, pid)
        if not p:
            return APIResponse.not_found(
                message=f"项目ID {pid} 不存在"
            )
        session.delete(p)
        session.commit()
        return APIResponse.success(
            message="项目删除成功",
            data={"status": "success"}
        )
    except Exception as e:
        session.rollback()
        return APIResponse.internal_server_error(
            message=f"删除项目时发生错误: {str(e)}",
            errors={"error": "delete failed"}
        )


@bp.put("/projects/<int:pid>")
def update_project(pid: int):
    session = get_db_session()
    try:
        logger.debug("收到更新项目请求，ID: {pid}")

        p = session.get(Project, pid)
        if not p:
            return APIResponse.not_found(
                message=f"项目ID {pid} 不存在"
            )

        # 检查是否是FormData格式
        if request.files:
            logger.debug("收到FormData请求")
            data = request.form
            # 获取签名图片
            signature_file = request.files.get("quality_engineer_signature")
            quality_engineer_signature = signature_file.read() if signature_file else None
        else:
            logger.debug("收到JSON请求")
            data = request.get_json(force=True)
            quality_engineer_signature = data.get("quality_engineer_signature")

        logger.debug("请求数据: {data}")

        if not data:
            logger.debug("请求体为空")
            return APIResponse.bad_request(
                message="请求体不能为空",
                errors={"error": "request body required"}
            )

        name = (data.get("name") or "").strip()
        logger.debug("项目名称: {name}")

        if not name:
            logger.debug("项目名称为空")
            return APIResponse.bad_request(
                message="项目名称不能为空",
                errors={"error": "name required"}
            )

        # 更新基本字段
        p.name = name
        p.description = (data.get("description") or "").strip() or None

        # 更新新增项目信息字段
        p.supplier_name = data.get("supplier_name")
        p.address = data.get("address")
        p.supplier_code = data.get("supplier_code")
        p.customer_name = data.get("customer_name")
        p.customer_purchase = data.get("customer_purchase")
        p.quality_engineer = data.get("quality_engineer")
        p.phone = data.get("phone")
        p.email = data.get("email")
        # 更新签名图片
        if quality_engineer_signature is not None:
            p.quality_engineer_signature = quality_engineer_signature

        logger.debug("更新项目对象")
        session.add(p)
        logger.debug("提交数据库事务...")
        session.commit()
        logger.debug("项目更新成功，ID: {p.id}")

        return jsonify({
            "id": p.id, 
            "name": p.name, 
            "description": p.description,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "supplier_name": p.supplier_name,
            "address": p.address,
            "supplier_code": p.supplier_code,
            "customer_name": p.customer_name,
            "customer_purchase": p.customer_purchase,
            "quality_engineer": p.quality_engineer,
            "phone": p.phone,
            "email": p.email
        })
    except Exception as e:
        logger.debug("更新项目失败: {e}")
        import traceback

        traceback.print_exc()
        session.rollback()
        return APIResponse.internal_server_error(
            message=f"更新项目时发生错误: {str(e)}",
            errors={"error": "update project failed"}
        )


@bp.get("/projects/<int:pid>")
def get_project(pid: int):
    """
    session = get_db_session()
    返回单个项目详情，供前端按项目 id 请求使用。
    """
    try:
        p = session.get(Project, pid)
        if not p:
            return APIResponse.not_found(
                message=f"项目ID {pid} 不存在"
            )
        return APIResponse.success(
            data={
                "id": p.id,
                "name": p.name,
                "description": getattr(p, "description", None),
                "status": getattr(p, "status", None),
                "created_at": (
                    p.created_at.isoformat() if getattr(p, "created_at", None) else None
                ),
                # 新增项目信息字段
                "supplier_name": getattr(p, "supplier_name", None),
                "address": getattr(p, "address", None),
                "supplier_code": getattr(p, "supplier_code", None),
                "customer_name": getattr(p, "customer_name", None),
                "customer_purchase": getattr(p, "customer_purchase", None),
                "quality_engineer": getattr(p, "quality_engineer", None),
                "phone": getattr(p, "phone", None),
                "email": getattr(p, "email", None),
            }
        )
    except Exception as e:
        return APIResponse.internal_server_error(
            message=f"获取项目详情时发生错误: {str(e)}",
            errors={"error": "fetch failed"}
        )


# Dashboard summary & recent
@bp.get("/dashboard/summary")
def dashboard_summary():
    session = get_db_session()
    project_count = session.query(func.count(Project.id)).scalar() or 0
    parts_count = session.query(func.count(BomTable.id)).scalar() or 0
    with_image = (
        session.query(func.count(BomTable.id))
        .filter(BomTable.image_data.isnot(None))
        .scalar()
        or 0
    )
    without_image = max(0, parts_count - with_image)
    last_import = session.query(func.max(ImportLog.created_at)).scalar()
    return APIResponse.success(
        data={
            "project_count": project_count,
            "parts_count": parts_count,
            "parts_with_image": with_image,
            "parts_without_image": without_image,
            "last_import_time": last_import.isoformat() if last_import else None,
        }
    )


@bp.get("/dashboard/recent")
def dashboard_recent():
    session = get_db_session()
    recent_projects = Project.query.order_by(Project.created_at.desc()).limit(5).all()
    recent_imports = (
        ImportLog.query.order_by(ImportLog.created_at.desc()).limit(5).all()
    )
    return APIResponse.success(
        data={
            "recent_projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": getattr(p, "status", None),
                    "created_at": p.created_at.isoformat(),
                    # 新增项目信息字段
                    "supplier_name": getattr(p, "supplier_name", None),
                    "address": getattr(p, "address", None),
                    "supplier_code": getattr(p, "supplier_code", None),
                    "customer_name": getattr(p, "customer_name", None),
                    "customer_purchase": getattr(p, "customer_purchase", None),
                    "quality_engineer": getattr(p, "quality_engineer", None),
                    "phone": getattr(p, "phone", None),
                    "email": getattr(p, "email", None),
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
    session = get_db_session()
    接收项目级别的 BOM 导入文件（multipart/form-data）
    - file: 上传的 CSV 或 XLSX 文件（可选）
    - mapping: 可选的字段映射 JSON 字符串（前端可传）
    处理策略：
    - 保存接收到的文件到 uploads/imports/ 目录
    - 创建一条 ImportLog 记录（created_count/errors_count 初始为 0）
    - 返回 202 Accepted 并返回 import_log id（实际导入可由后台任务或手动触发）
    """
    p = session.get(Project, pid)
    if not p:
        return APIResponse.not_found(
            message="项目不存在"
        )

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
            return APIResponse.internal_server_error(
                message=f"保存上传文件失败: {str(e)}",
                errors={"error": "failed to save uploaded file"}
            )

    # 创建 ImportLog 记录以便审计与后台处理
    try:
        il = ImportLog(
            project_id=pid, filename=filename, created_count=0, errors_count=0
        )
        session.add(il)
        session.commit()
    except Exception as e:
        session.rollback()
        return APIResponse.internal_server_error(
            message=f"创建导入日志失败: {str(e)}",
            errors={"error": "failed to create import log"}
        )

    # 返回已接收响应；后台或后续接口可触发实际解析/写库
    return APIResponse.success(
        message="file received and import log created; processing may occur asynchronously",
        data={
            "status": "accepted",
            "import_log_id": il.id,
            "saved_path": saved_path,
            "mapping_received": mapping is not None,
        },
        status_code=202
    )


# 新增：查询指定 import log 的详情
@bp.get("/imports/<int:import_id>")
def get_import_log(import_id: int):
    session = get_db_session()
    il = session.get(ImportLog, import_id)
    if not il:
        return APIResponse.not_found(
            message="导入日志不存在"
        )
    return APIResponse.success(
        data={
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
    session = get_db_session()
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
    session = get_db_session()
    il = session.get(ImportLog, import_id)
    if not il:
        return APIResponse.not_found(
            message="导入日志不存在"
        )

    logger.debug(
        "DEBUG: ImportLog record: id=%s, project_id=%s, filename=%s",
        il.id, il.project_id, il.filename
    )

    # 找到上传文件
    file_path = _find_uploaded_file_for_import(il)
    if not file_path or not os.path.isfile(file_path):
        return APIResponse.not_found(
            message="找不到上传文件",
            errors={"search_filename": il.filename}
        )

    # 读取文件并根据扩展名选择解析器
    try:
        with open(file_path, "rb") as fh:
            data = fh.read()
        lower = file_path.lower()
        if lower.endswith(".csv"):
            logger.debug("DEBUG: Calling import_csv with project_id={il.project_id}")
            result = importer.import_csv(data, project_id=il.project_id)
        else:
            # 其他按 xlsx 处理（openpyxl 支持 xlsx）
            try:
                logger.debug("DEBUG: Calling import_xlsx with project_id={il.project_id}")
                result = importer.import_xlsx(data, project_id=il.project_id)
            except Exception as e:
                # 如果 xlsx 解析失败，尝试 csv 解析（兼容性）
                try:
                    logger.debug(
                        "DEBUG: Calling import_csv (fallback) with project_id=%s",
                        il.project_id
                    )
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
            session.add(il)
            session.commit()
        except Exception as e:
            session.rollback()
            return APIResponse.internal_server_error(
                message=f"更新导入日志失败: {str(e)}",
                errors={"error": "failed to update import log", "process_result": result}
            )

        return APIResponse.success(
            data={
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
        return APIResponse.internal_server_error(
            message=f"处理失败: {str(e)}",
            errors={"error": "processing failed"}
        )
