#!/usr/bin/env python3
"""
测试脚本：模拟完整的用户流程，重现500错误
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """测试健康检查"""
    print("1. 测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"   错误: {e}")
        return False

def get_captcha():
    """获取验证码"""
    print("2. 获取CAPTCHA...")
    try:
        response = requests.get(f"{BASE_URL}/api/auth/captcha")
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   CAPTCHA问题: {data['question']}")
            return data
        else:
            print(f"   错误响应: {response.text}")
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def send_verification_code(email, phone, captcha_data, answer):
    """发送验证码"""
    print("3. 发送验证码...")
    try:
        payload = {
            "email": email,
            "phone": phone,
            "captcha_id": captcha_data["captcha_id"],
            "captcha_answer": answer,
            "session_id": captcha_data["session_id"]
        }
        response = requests.post(f"{BASE_URL}/api/auth/send-verification-code", json=payload)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"   响应: {response.json()}")
            return True
        else:
            print(f"   错误响应: {response.text}")
            return False
    except Exception as e:
        print(f"   错误: {e}")
        return False

def get_debug_verification_code(email, phone):
    """获取调试验证码"""
    print("4. 获取调试验证码...")
    try:
        response = requests.get(f"{BASE_URL}/api/auth/debug/verification-code/{email}/{phone}")
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   验证码: {data.get('verification_code', 'N/A')}")
            return data.get('verification_code')
        else:
            print(f"   错误响应: {response.text}")
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def register_user(email, phone, verification_code):
    """注册用户"""
    print("5. 注册用户...")
    try:
        payload = {
            "email": email,
            "phone": phone,
            "verification_code": verification_code
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   注册成功，用户ID: {data['user_info']['id']}")
            return data['access_token']
        else:
            print(f"   错误响应: {response.text}")
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def start_analysis(token):
    """开始分析 - 这里可能出现500错误"""
    print("6. 开始分析...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 构造用户背景数据
        user_background = {
            "undergraduate_university": "清华大学",
            "undergraduate_major": "计算机科学与技术",
            "gpa": 3.8,
            "gpa_scale": "4.0",
            "graduation_year": 2024,
            "target_countries": ["美国", "英国"],
            "target_majors": ["计算机科学", "人工智能"],
            "target_degree_type": "Master"
        }
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_background, headers=headers)
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   分析任务已启动: {data['task_id']}")
            return data['task_id']
        else:
            print(f"   错误响应: {response.text}")
            try:
                error_data = response.json()
                print(f"   错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                pass
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def check_analysis_status(task_id):
    """检查分析状态"""
    print("7. 检查分析状态...")
    try:
        response = requests.get(f"{BASE_URL}/api/analyze/{task_id}")
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   任务状态: {data['status']}")
            return data
        else:
            print(f"   错误响应: {response.text}")
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def main():
    print("开始测试完整的用户流程...")
    print("=" * 50)
    
    # 测试参数 - 使用新的邮箱和手机号
    import time
    timestamp = int(time.time())
    test_email = f"test{timestamp}@example.com"
    test_phone = f"138{timestamp % 100000000:08d}"
    
    # 1. 健康检查
    if not test_health():
        print("健康检查失败，退出测试")
        return
    
    # 2. 获取CAPTCHA
    captcha_data = get_captcha()
    if not captcha_data:
        print("获取CAPTCHA失败，退出测试")
        return
    
    # 3. 计算CAPTCHA答案（简单数学题）
    question = captcha_data["question"]
    try:
        # 解析数学题，例如 "5 + 3 = ?"
        parts = question.replace("=", "").replace("?", "").strip().split()
        if len(parts) == 3:
            num1, op, num2 = int(parts[0]), parts[1], int(parts[2])
            if op == "+":
                answer = num1 + num2
            elif op == "-":
                answer = num1 - num2
            else:
                answer = 0
        else:
            answer = 0
        print(f"   CAPTCHA答案: {answer}")
    except:
        answer = 0
    
    # 4. 发送验证码
    if not send_verification_code(test_email, test_phone, captcha_data, str(answer)):
        print("发送验证码失败，退出测试")
        return
    
    # 5. 获取调试验证码
    verification_code = get_debug_verification_code(test_email, test_phone)
    if not verification_code:
        print("调试接口获取验证码失败，请手动输入验证码（从后端日志中查看）")
        print("请查看后端日志中的验证码，然后输入：")
        verification_code = input("验证码: ").strip()
        if not verification_code:
            print("未输入验证码，退出测试")
            return
    
    # 6. 注册用户
    token = register_user(test_email, test_phone, verification_code)
    if not token:
        print("用户注册失败，退出测试")
        return
    
    # 7. 开始分析 - 这里可能出现500错误
    task_id = start_analysis(token)
    if not task_id:
        print("开始分析失败")
        return
    
    # 8. 检查分析状态
    for i in range(5):
        print(f"   第{i+1}次检查...")
        status_data = check_analysis_status(task_id)
        if status_data:
            if status_data['status'] == 'completed':
                print("   分析完成！")
                break
            elif status_data['status'] == 'failed':
                print(f"   分析失败: {status_data.get('error', 'Unknown error')}")
                break
        time.sleep(2)
    
    print("=" * 50)
    print("测试完成")

if __name__ == "__main__":
    main()
