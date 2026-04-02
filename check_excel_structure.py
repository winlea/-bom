import os

import pandas as pd


def check_excel_structure():
    """检查Excel文件的结构，确认列名"""
    print("开始检查Excel文件结构...")
    print("=" * 60)

    # 使用pandas读取Excel文件，查看实际的列名
    excel_file = "E:\\NEW\\-bom\\WH-DFYF-H47-26-00 H47产品履历模版2026-2-7.xlsx"

    print(f"检查Excel文件结构: {excel_file}")

    try:
        # 读取Excel文件的第一个工作表
        df = pd.read_excel(excel_file, sheet_name=0)
        print("Excel文件列名:")
        for col in df.columns:
            print(f"- {col}")
        print("=" * 60)
        print("检查完成!")
    except Exception as e:
        print(f"错误: {e}")


if __name__ == "__main__":
    check_excel_structure()
