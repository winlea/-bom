"""Report Controller - Handles report generation (ODS, PSW, Process Capability)"""
import logging
import os
import shutil
import tempfile
from datetime import datetime
from io import BytesIO

from flask import Blueprint, request, send_file, make_response
import urllib.parse

from ..response import APIResponse
from ...database.session import get_db_session
from ...models import BomTable, Project, DrawingChange
from ...templates.dynamic_ods_generator import create_simple_ods_from_data
from ...config import PSW_TEMPLATE_PATH, PROCESS_CAPABILITY_TEMPLATE_PATH
from .base import _get_platform_excel_handler

logger = logging.getLogger(__name__)
report_bp = Blueprint("report", __name__)


@report_bp.route("/reports/generate", methods=["POST"])
def generate_report():
    """Generate ODS report for a project"""
    try:
        data = request.get_json()
        if not data:
            return APIResponse.bad_request(message="request body required")

        project_id = data.get("project_id")
        if not project_id:
            return APIResponse.bad_request(message="project_id is required")

        session = get_db_session()
        project = session.query(Project).get(project_id)
        if not project:
            return APIResponse.not_found(message="project not found")

        parts = (
            session.query(BomTable).filter_by(project_id=project_id)
            .order_by(BomTable.bom_sort.asc(), BomTable.created_at.desc())
            .all()
        )

        if not parts:
            return APIResponse.not_found(message="no parts found for this project")

        report_data = [
            {
                "sequence": part.sequence,
                "part_number": part.part_number,
                "part_name": part.part_name,
                "drawing_2d": part.drawing_2d,
                "drawing_3d": part.drawing_3d,
                "original_material": part.original_material,
                "final_material_cn": part.final_material_cn,
                "part_category": part.part_category,
                "net_weight_kg": part.net_weight_kg,
            }
            for part in parts
        ]

        project_info = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "generated_time": project.created_at.isoformat() if project.created_at else None,
        }

        output_file = create_simple_ods_from_data(data=report_data, project_info=project_info)

        return send_file(
            output_file,
            as_attachment=True,
            download_name=f"{project.name}_ODS_Report.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    except Exception as e:
        logger.debug(f"Report generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return APIResponse.internal_server_error(
            message=f"Generate report failed: {str(e)}",
            errors={"error": "generate report failed"}
        )


@report_bp.route("/psw/generate", methods=["POST"])
def generate_psw():
    """Generate PSW document for a part"""
    try:
        data = request.get_json()
        if not data:
            return APIResponse.bad_request(message="request body required")

        part_id = data.get("part_id")
        if not part_id:
            return APIResponse.bad_request(message="part_id is required")

        session = get_db_session()
        part = session.query(BomTable).get(part_id)
        if not part:
            return APIResponse.not_found(message="part not found")

        project = None
        if part.project_id:
            project = session.query(Project).get(part.project_id)

        template_file = PSW_TEMPLATE_PATH
        if not os.path.exists(template_file):
            return APIResponse.internal_server_error(message="PSW template file not found")

        current_date = datetime.now().strftime("%m-%d-%y")
        platform, win32com, pythoncom = _get_platform_excel_handler()

        if platform == 'win32com':
            pythoncom.CoInitialize()
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
                temp_file_path = temp_file.name
            shutil.copyfile(template_file, temp_file_path)
            excel = win32com.client.Dispatch('Excel.Application')
            excel.Visible = False
            excel.DisplayAlerts = False
        else:
            temp_file_path = tempfile.mktemp(suffix='.xlsx')
            shutil.copyfile(template_file, temp_file_path)

        try:
            wb = excel.Workbooks.Open(temp_file_path)
            ws = wb.Worksheets('PSW')

            drawing_change = DrawingChange.query.filter_by(part_id=part_id).order_by(
                DrawingChange.created_at.desc()
            ).first()

            fields_to_fill = {
                (5, 3): part.part_name or "N/A",
                (5, 8): part.part_number or "N/A",
                (5, 13): part.drawing_2d or "N/A",
                (7, 8): current_date,
                (7, 13): current_date,
                (9, 13): part.net_weight_kg if part.net_weight_kg is not None else 0,
                (46, 4): "冲压/弧焊/电泳",
                (52, 13): current_date
            }

            if drawing_change:
                fields_to_fill[(47, 4)] = f"图纸变更版本: {drawing_change.drawing_change_version}"
                fields_to_fill[(48, 4)] = f"CR号: {drawing_change.cr_number}"
                fields_to_fill[(49, 4)] = f"变更次数: {drawing_change.change_count}"
                fields_to_fill[(50, 4)] = f"变更日期: {drawing_change.change_date.strftime('%Y-%m-%d')}"

            if project:
                project_fields = {
                    (14, 3): project.supplier_name or "N/A",
                    (14, 8): project.supplier_code or "N/A",
                    (14, 13): project.customer_name or "N/A",
                    (15, 3): project.address or "N/A",
                    (15, 14): project.customer_purchase or "N/A",
                    (53, 3): project.quality_engineer or "N/A",
                    (54, 2): "质量工程师",
                    (53, 8): project.phone or "N/A",
                    (54, 8): project.email or "N/A",
                }
                fields_to_fill.update(project_fields)

                if project.quality_engineer_signature:
                    try:
                        import io
                        from PIL import Image

                        img_data = project.quality_engineer_signature
                        img = Image.open(io.BytesIO(img_data))
                        width_px = int(1.46 * 96 / 2.54)
                        height_px = int(0.82 * 96 / 2.54)
                        resized_img = img.resize((width_px, height_px), Image.LANCZOS)

                        temp_img_path = os.path.join(tempfile.gettempdir(), f"signature_{part_id}.png")
                        resized_img.save(temp_img_path, format='PNG')

                        ws.Shapes.AddPicture(
                            temp_img_path, False, True,
                            ws.Cells(53, 6).Left + 5,
                            ws.Cells(53, 6).Top + 2,
                            width_px, height_px
                        )
                        os.unlink(temp_img_path)
                        logger.debug("签名图片添加成功")
                    except Exception as e:
                        logger.debug(f"添加签名图片失败: {str(e)}")

            for (row, col), value in fields_to_fill.items():
                try:
                    ws.Cells(row, col).Value = value
                except Exception as e:
                    logger.debug(f"填充单元格({row},{col})失败: {str(e)}")

            wb.Save()
            wb.Close()
        finally:
            excel.Quit()

        with open(temp_file_path, 'rb') as f:
            output_data = f.read()
        os.unlink(temp_file_path)

        output_file = BytesIO(output_data)
        output_file.seek(0)

        return send_file(
            output_file,
            as_attachment=True,
            download_name=f"PSW_{part.part_name}_{part.part_number}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    except Exception as e:
        logger.debug(f"PSW generation error: {e}")
        import traceback
        traceback.print_exc()
        return APIResponse.internal_server_error(
            message=f"Generate PSW failed: {str(e)}",
            errors={"error": "generate PSW failed"}
        )
