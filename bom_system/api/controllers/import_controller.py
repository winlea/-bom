"""Import Controller - Handles BOM data import"""
import logging

from flask import Blueprint, request

from ..response import APIResponse
from ...database.session import get_db_session
from ...importer import import_csv, import_xlsx
from ...models import ImportLog, Project

logger = logging.getLogger(__name__)
import_bp = Blueprint("import", __name__)


@import_bp.route("/import/bom", methods=["POST"])
def import_bom():
    """Import BOM into a project. multipart/form-data with fields: file, project_id."""
    try:
        if "file" not in request.files:
            return APIResponse.bad_request(
                message="请上传CSV或Excel文件",
                errors={"error": "file is required"}
            )

        try:
            project_id = (
                int(request.form.get("project_id"))
                if request.form.get("project_id")
                else None
            )
        except ValueError:
            return APIResponse.bad_request(
                message="项目ID必须是数字",
                errors={"error": "invalid project_id"}
            )

        f = request.files["file"]
        data = f.read()
        if not data:
            return APIResponse.bad_request(
                message="上传的文件为空",
                errors={"error": "empty file"}
            )

        filename = (f.filename or "").lower()
        try:
            if filename.endswith(".csv"):
                result = import_csv(data, project_id=project_id)
            elif filename.endswith(".xlsx") or filename.endswith(".xlsm"):
                result = import_xlsx(data, project_id=project_id)
            else:
                return APIResponse.bad_request(
                    message="仅支持CSV、XLSX和XLSM文件格式",
                    errors={"error": "Unsupported file type"}
                )
        except ValueError as e:
            return APIResponse.bad_request(
                message="文件格式错误或缺少必要字段",
                errors={"error": str(e)}
            )
        except Exception as e:
            return APIResponse.internal_server_error(
                message=f"导入过程中发生错误: {str(e)}",
                errors={"error": "import failed"}
            )

        # log import result and update project status
        try:
            log = ImportLog(
                project_id=project_id,
                filename=(f.filename or ""),
                created_count=result.get("created", 0),
                errors_count=len(result.get("errors", []) or []),
                message="; ".join(result.get("errors", []) or []),
            )
            session = get_db_session()
            session.add(log)
            if project_id:
                proj = session.query(Project).get(project_id)
                if proj and proj.status == "created" and result.get("created", 0) > 0:
                    proj.status = "imported"
        except Exception as e:
            logger.debug(f"记录导入日志失败: {str(e)}")

        return APIResponse.success(
            data={"status": "success", **result}
        )
    except Exception as e:
        return APIResponse.internal_server_error(
            message=f"服务器内部错误: {str(e)}",
            errors={"error": "internal server error"}
        )
