"""Process Capability Controller - Handles process capability report generation"""
import logging
import os
import urllib.parse

from flask import Blueprint, request, make_response

from ..response import APIResponse
from ...database.session import get_db_session
from ...models import BomTable
from ...process_capability import ProcessCapabilityService
from ...config import PROCESS_CAPABILITY_TEMPLATE_PATH

logger = logging.getLogger(__name__)
capability_bp = Blueprint("capability", __name__)


@capability_bp.route("/process-capability/generate", methods=["POST"])
def generate_process_capability():
    """Generate initial process capability analysis report"""
    logger.debug("=== 开始处理初始过程能力分析报告请求 ===")
    try:
        data = request.get_json()
        logger.debug(f"收到的请求数据: {data}")
        
        if not data:
            logger.debug("错误: 缺少请求体")
            return APIResponse.bad_request(message="request body required")

        part_id = data.get("part_id")
        project_id = data.get("project_id")
        logger.debug(f"part_id: {part_id}, project_id: {project_id}")

        if not part_id and not project_id:
            logger.debug("错误: 缺少part_id或project_id")
            return APIResponse.bad_request(message="either part_id or project_id is required")

        template_path = PROCESS_CAPABILITY_TEMPLATE_PATH
        logger.debug(f"模板文件路径: {template_path}")
        logger.debug(f"模板文件存在: {os.path.exists(template_path)}")
        
        if not os.path.exists(template_path):
            logger.debug("错误: 模板文件不存在")
            return APIResponse.internal_server_error(message="template file not found")

        service = ProcessCapabilityService(template_path)
        logger.debug("创建ProcessCapabilityService实例成功")

        output_dir = os.path.join(os.path.dirname(template_path), "process_capability")
        logger.debug(f"创建输出目录: {output_dir}")
        os.makedirs(output_dir, exist_ok=True)

        if part_id:
            try:
                part_id = int(part_id)
                logger.debug(f"转换part_id为整数: {part_id}")
            except ValueError:
                logger.debug("错误: part_id不是有效的整数")
                return APIResponse.bad_request(message="part_id must be an integer")

            session = get_db_session()
            part = session.query(BomTable).get(part_id)
            if not part:
                logger.debug(f"错误: 找不到零件，part_id: {part_id}")
                return APIResponse.not_found(message="part not found")

            logger.debug(f"找到零件: id={part.id}, part_number={part.part_number}, part_name={part.part_name}")

            logger.debug(f"开始生成报告，零件号: {str(part.part_number)}")
            try:
                output_paths = service.generate_report(part, output_dir)
                logger.debug(f"报告生成成功: {len(output_paths)} 个文件")
            except Exception as e:
                logger.debug(f"生成报告时出错: {str(e)}")
                import traceback
                traceback.print_exc()
                return APIResponse.internal_server_error(
                    message=f"Generate report failed: {str(e)}",
                    errors={"error": "generate report failed"}
                )

            if not output_paths:
                return APIResponse.internal_server_error(
                    message="无法为该零件生成过程能力分析报告，可能是因为缺少尺寸数据",
                    errors={"error": "no files generated"}
                )

            for output_path in output_paths:
                if not os.path.exists(output_path):
                    return APIResponse.internal_server_error(
                        message=f"Generated file not found: {str(output_path)}",
                        errors={"error": "generated file not found"}
                    )

            output_path = output_paths[0]
            logger.debug(f"读取文件: {output_path}")
            try:
                with open(output_path, 'rb') as f:
                    file_content = f.read()
                logger.debug(f"文件大小: {len(file_content)} bytes")
            except Exception as e:
                logger.debug(f"读取文件时出错: {str(e)}")
                return APIResponse.internal_server_error(
                    message=f"Read file failed: {str(e)}",
                    errors={"error": "read file failed"}
                )

            response = make_response(file_content)
            filename = os.path.basename(output_path)
            encoded_filename = urllib.parse.quote(filename)

            response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            response.headers['Content-Disposition'] = f'attachment; filename="{encoded_filename}"; filename*=UTF-8\'{encoded_filename}'
            response.headers['Content-Length'] = str(len(file_content))

            logger.debug("=== 请求处理完成 ===")
            return response

        elif project_id:
            try:
                project_id = int(project_id)
            except ValueError:
                logger.debug("错误: project_id不是有效的整数")
                return APIResponse.bad_request(message="project_id must be an integer")

            try:
                generated_files = service.generate_reports_for_project(project_id, output_dir)
                logger.debug(f"为项目生成报告成功: {len(generated_files)} 个文件")
            except Exception as e:
                logger.debug(f"生成报告时出错: {str(e)}")
                import traceback
                traceback.print_exc()
                return APIResponse.internal_server_error(
                    message=f"Generate reports failed: {str(e)}",
                    errors={"error": "generate reports failed"}
                )

            if not generated_files:
                logger.debug("错误: 项目中没有零件")
                return APIResponse.not_found(message="no parts found for this project")

            return APIResponse.success(
                message=f"Generated {len(generated_files)} process capability reports",
                data={
                    "status": "success",
                    "files": [os.path.basename(f) for f in generated_files],
                    "output_dir": output_dir
                }
            )

    except Exception as e:
        logger.debug(f"Process capability generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return APIResponse.internal_server_error(
            message=f"Generate process capability report failed: {str(e)}",
            errors={"error": "generate process capability report failed"}
        )
