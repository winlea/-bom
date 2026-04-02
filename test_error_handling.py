import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

# Test cases for error handling
test_cases = [
    # Project endpoints
    {
        "name": "Create project without name",
        "endpoint": "/projects",
        "method": "POST",
        "data": {"description": "Test project"},
        "expected_status": 400,
        "expected_error": "项目名称不能为空"
    },
    {
        "name": "Get non-existent project",
        "endpoint": "/projects/999999",
        "method": "GET",
        "expected_status": 404,
        "expected_error": "项目ID 999999 不存在"
    },
    
    # Part endpoints
    {
        "name": "Create part without required fields",
        "endpoint": "/parts",
        "method": "POST",
        "data": {"part_name": "Test Part"},
        "expected_status": 400,
        "expected_error": "part_number, part_name, and project_id are required"
    },
    {
        "name": "Get non-existent part",
        "endpoint": "/parts/999999",
        "method": "GET",
        "expected_status": 404,
        "expected_error": "part not found"
    },
    
    # BOM import endpoints
    {
        "name": "Import BOM without file",
        "endpoint": "/import/bom",
        "method": "POST",
        "data": {"project_id": 1},
        "expected_status": 400,
        "expected_error": "请上传CSV或Excel文件"
    },
    
    # Drawing change endpoints
    {
        "name": "Create drawing change without required fields",
        "endpoint": "/drawing-changes",
        "method": "POST",
        "data": {"project_id": 1, "part_id": 1},
        "expected_status": 400,
        "expected_error": "all fields are required"
    },
    
    # ODS endpoints
    {
        "name": "Generate ODS without part_id",
        "endpoint": "/ods/generate",
        "method": "POST",
        "data": {"header_data": {}}, 
        "expected_status": 400,
        "expected_error": "part_id is required"
    },
    {
        "name": "Generate ODS for non-existent part",
        "endpoint": "/ods/generate",
        "method": "POST",
        "data": {"part_id": 999999},
        "expected_status": 404,
        "expected_error": "part not found"
    },
    
    # PSW endpoints
    {
        "name": "Generate PSW without part_id",
        "endpoint": "/psw/generate",
        "method": "POST",
        "data": {"test": "data"}, 
        "expected_status": 400,
        "expected_error": "part_id is required"
    },
    {
        "name": "Generate PSW for non-existent part",
        "endpoint": "/psw/generate",
        "method": "POST",
        "data": {"part_id": 999999},
        "expected_status": 404,
        "expected_error": "part not found"
    },
    
    # Process capability endpoints
    {
        "name": "Generate process capability without part_id or project_id",
        "endpoint": "/process-capability/generate",
        "method": "POST",
        "data": {"test": "data"}, 
        "expected_status": 400,
        "expected_error": "either part_id or project_id is required"
    },
    
    # Image upload endpoints
    {
        "name": "Upload base64 image without part_number",
        "endpoint": "/upload/base64",
        "method": "POST",
        "data": {"image_data": "test"},
        "expected_status": 400,
        "expected_error": "part_number and image_data are required"
    },
    {
        "name": "Upload URL image without URL",
        "endpoint": "/upload/url",
        "method": "POST",
        "data": {"part_number": "test"},
        "expected_status": 400,
        "expected_error": "part_number and url are required"
    }
]

def test_error_handling():
    print("Testing error handling for API endpoints...\n")
    
    passed = 0
    failed = 0
    
    for test_case in test_cases:
        print(f"Test: {test_case['name']}")
        print(f"Endpoint: {test_case['endpoint']}")
        print(f"Method: {test_case['method']}")
        
        url = f"{BASE_URL}{test_case['endpoint']}"
        
        try:
            if test_case['method'] == "POST":
                response = requests.post(url, json=test_case.get('data', {}))
            elif test_case['method'] == "GET":
                response = requests.get(url)
            elif test_case['method'] == "PUT":
                response = requests.put(url, json=test_case.get('data', {}))
            elif test_case['method'] == "DELETE":
                response = requests.delete(url)
            else:
                print(f"Unsupported method: {test_case['method']}")
                failed += 1
                continue
            
            status_code = response.status_code
            print(f"Status code: {status_code}")
            
            if status_code == test_case['expected_status']:
                try:
                    response_json = response.json()
                    print(f"Response: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
                    
                    # Check if error message contains expected error
                    if 'message' in response_json:
                        if test_case['expected_error'] in response_json['message']:
                            print("✓ Test passed: Error message matches expected")
                            passed += 1
                        else:
                            print(f"✗ Test failed: Error message does not match expected")
                            print(f"Expected: {test_case['expected_error']}")
                            print(f"Got: {response_json['message']}")
                            failed += 1
                    else:
                        print("✗ Test failed: No 'message' in response")
                        failed += 1
                except json.JSONDecodeError:
                    print("✗ Test failed: Response is not JSON")
                    print(f"Response content: {response.text}")
                    failed += 1
            else:
                print(f"✗ Test failed: Status code {status_code} != expected {test_case['expected_status']}")
                try:
                    response_json = response.json()
                    print(f"Response: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
                except json.JSONDecodeError:
                    print(f"Response content: {response.text}")
                failed += 1
                
        except requests.exceptions.ConnectionError:
            print("✗ Test failed: Connection error - API server may not be running")
            failed += 1
        except Exception as e:
            print(f"✗ Test failed: {str(e)}")
            failed += 1
        
        print("-" * 80)
    
    print(f"\nTest Results:")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Total: {passed + failed}")

if __name__ == "__main__":
    test_error_handling()