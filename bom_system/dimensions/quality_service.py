"""
质量控制服务
"""

from typing import Dict, List, Optional, Any

from sqlalchemy import and_
from sqlalchemy.orm import Session

from bom_system.dimensions.models import Dimension
from bom_system.dimensions.quality_models import DimensionInspection, QualityReport


class QualityControlService:
    """质量控制服务"""

    def __init__(self, session: Session):
        self.session = session

    def validate_dimension(
        self, dimension_id: int, actual_value: str
    ) -> Dict[str, Any]:
        """
        验证尺寸是否合格

        Args:
            dimension_id: 尺寸ID
            actual_value: 实际测量值

        Returns:
            验证结果，包含是否合格、上下限等信息
        """
        try:
            # 获取尺寸信息
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension:
                return {"success": False, "message": "尺寸不存在", "is_passed": False}

            # 转换实际值为浮点数
            try:
                actual = float(actual_value)
            except ValueError:
                return {
                    "success": False,
                    "message": "实际值必须是有效数字",
                    "is_passed": False,
                }

            # 转换名义值和公差为浮点数
            try:
                nominal = float(dimension.nominal_value)
            except ValueError:
                return {
                    "success": False,
                    "message": "尺寸名义值无效",
                    "is_passed": False,
                }

            # 计算上下限
            if dimension.upper_tolerance and dimension.lower_tolerance:
                try:
                    upper = float(dimension.upper_tolerance)
                    lower = float(dimension.lower_tolerance)
                except ValueError:
                    return {
                        "success": False,
                        "message": "公差值无效",
                        "is_passed": False,
                    }
            elif dimension.tolerance_value:
                try:
                    tolerance = float(dimension.tolerance_value)
                    upper = tolerance
                    lower = -tolerance
                except ValueError:
                    return {
                        "success": False,
                        "message": "公差值无效",
                        "is_passed": False,
                    }
            else:
                # 没有公差，默认为±0.01
                upper = 0.01
                lower = -0.01

            # 计算合格范围
            min_value = nominal + lower
            max_value = nominal + upper

            # 判断是否合格
            is_passed = min_value <= actual <= max_value

            return {
                "success": True,
                "is_passed": is_passed,
                "nominal_value": nominal,
                "actual_value": actual,
                "min_value": min_value,
                "max_value": max_value,
                "dimension": dimension.to_dict(),
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"验证失败: {str(e)}",
                "is_passed": False,
            }

    def save_inspection_result(
        self,
        dimension_id: int,
        actual_value: str,
        inspector: str = None,
        notes: str = None,
    ) -> Optional[DimensionInspection]:
        """
        保存尺寸检验结果

        Args:
            dimension_id: 尺寸ID
            actual_value: 实际测量值
            inspector: 检验员
            notes: 备注

        Returns:
            检验结果对象
        """
        try:
            # 验证尺寸
            validation_result = self.validate_dimension(dimension_id, actual_value)
            if not validation_result.get("success"):
                raise Exception(validation_result.get("message"))

            # 获取尺寸信息
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension:
                raise Exception("尺寸不存在")

            # 创建检验结果
            inspection = DimensionInspection(
                dimension_id=dimension_id,
                project_id=dimension.project_id,
                part_id=dimension.part_id,
                actual_value=actual_value,
                is_passed=validation_result.get("is_passed"),
                inspector=inspector,
                notes=notes,
            )

            self.session.add(inspection)
            self.session.commit()
            self.session.refresh(inspection)

            return inspection

        except Exception as e:
            self.session.rollback()
            raise e

    def get_project_pass_rate(self, project_id: str) -> Dict[str, Any]:
        """
        获取项目的合格率

        Args:
            project_id: 项目ID

        Returns:
            合格率统计信息
        """
        try:
            # 查询项目的检验结果
            inspections = (
                self.session.query(DimensionInspection)
                .filter_by(project_id=project_id)
                .all()
            )

            if not inspections:
                return {"total": 0, "passed": 0, "failed": 0, "pass_rate": 0.0}

            total = len(inspections)
            passed = sum(1 for insp in inspections if insp.is_passed)
            failed = total - passed
            pass_rate = (passed / total) * 100 if total > 0 else 0.0

            return {
                "total": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": round(pass_rate, 2),
            }

        except Exception as e:
            return {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "pass_rate": 0.0,
                "error": str(e),
            }

    def get_part_pass_rate(self, project_id: str, part_id: str) -> Dict[str, Any]:
        """
        获取零件的合格率

        Args:
            project_id: 项目ID
            part_id: 零件ID

        Returns:
            合格率统计信息
        """
        try:
            # 查询零件的检验结果
            inspections = (
                self.session.query(DimensionInspection)
                .filter(
                    and_(
                        DimensionInspection.project_id == project_id,
                        DimensionInspection.part_id == part_id,
                    )
                )
                .all()
            )

            if not inspections:
                return {"total": 0, "passed": 0, "failed": 0, "pass_rate": 0.0}

            total = len(inspections)
            passed = sum(1 for insp in inspections if insp.is_passed)
            failed = total - passed
            pass_rate = (passed / total) * 100 if total > 0 else 0.0

            return {
                "total": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": round(pass_rate, 2),
            }

        except Exception as e:
            return {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "pass_rate": 0.0,
                "error": str(e),
            }

    def generate_quality_report(
        self,
        project_id: str,
        report_name: str,
        generated_by: str = None,
        notes: str = None,
    ) -> Optional[QualityReport]:
        """
        生成质量报告

        Args:
            project_id: 项目ID
            report_name: 报告名称
            generated_by: 生成人
            notes: 备注

        Returns:
            质量报告对象
        """
        try:
            # 获取项目合格率
            pass_rate_info = self.get_project_pass_rate(project_id)

            # 创建质量报告
            report = QualityReport(
                project_id=project_id,
                report_name=report_name,
                total_inspections=pass_rate_info.get("total"),
                passed_inspections=pass_rate_info.get("passed"),
                pass_rate=pass_rate_info.get("pass_rate"),
                generated_by=generated_by,
                notes=notes,
            )

            self.session.add(report)
            self.session.commit()
            self.session.refresh(report)

            return report

        except Exception as e:
            self.session.rollback()
            raise e

    def get_inspection_history(
        self, dimension_id: int, limit: int = 10
    ) -> List[DimensionInspection]:
        """
        获取尺寸的检验历史

        Args:
            dimension_id: 尺寸ID
            limit: 限制数量

        Returns:
            检验历史列表
        """
        try:
            inspections = (
                self.session.query(DimensionInspection)
                .filter_by(dimension_id=dimension_id)
                .order_by(DimensionInspection.inspection_date.desc())
                .limit(limit)
                .all()
            )

            return inspections

        except Exception:
            return []

    def get_project_inspections(
        self, project_id: str, start_date: str = None, end_date: str = None
    ) -> List[DimensionInspection]:
        """
        获取项目的检验结果

        Args:
            project_id: 项目ID
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            检验结果列表
        """
        try:
            query = self.session.query(DimensionInspection).filter_by(
                project_id=project_id
            )

            # 添加日期过滤
            if start_date:
                query = query.filter(DimensionInspection.inspection_date >= start_date)
            if end_date:
                query = query.filter(DimensionInspection.inspection_date <= end_date)

            inspections = query.order_by(
                DimensionInspection.inspection_date.desc()
            ).all()
            return inspections

        except Exception:
            return []
