import requests

# 测试H47 BOM模板导入
with open("WH-DFYF-H47-26-00 H47产品履历模版2026-2-7.xlsx", "rb") as f:
    files = {
        "file": (
            "H47模板.xlsx",
            f,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
    data = {"project_id": "1"}
    response = requests.post("http://localhost:5000/import/bom", files=files, data=data)

print("Status Code:", response.status_code)
print("Response Text:", response.text)
