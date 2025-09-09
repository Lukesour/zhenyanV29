#!/usr/bin/env python3
"""
调试500错误 - 重现用户遇到的问题
"""

import requests
import json
import time
import random

BASE_URL = "http://localhost:8000"

def send_verification_code(email, phone):
    """发送验证码"""
    print("1. 发送验证码...")
    try:
        payload = {
            "email": email,
            "phone": phone
        }

        response = requests.post(f"{BASE_URL}/api/auth/send-verification-code", json=payload)
        print(f"   状态码: {response.status_code}")

        if response.status_code == 200:
            print("   验证码发送成功")
            return True
        else:
            print(f"   验证码发送失败: {response.text}")
            return False
    except Exception as e:
        print(f"   错误: {e}")
        return False

def get_debug_verification_code(email, phone):
    """获取调试验证码"""
    print("3. 获取调试验证码...")
    try:
        response = requests.get(f"{BASE_URL}/api/auth/debug/verification-code/{email}/{phone}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"   验证码: {data['verification_code']}")
                return data["verification_code"]
        print("   调试接口获取验证码失败")
        return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def register_user(email, phone, verification_code):
    """注册用户"""
    print("4. 注册用户...")
    try:
        payload = {
            "phone": phone,
            "email": email,
            "verification_code": verification_code,
            "invitation_code": None,
            "profile_data": None  # 不提供profile_data，模拟前端实际情况
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   注册成功，用户ID: {data['user_info']['id']}")
            return data["access_token"]
        else:
            print(f"   注册失败: {response.text}")
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def start_analysis_with_detailed_error(token):
    """开始分析并显示详细错误信息"""
    print("5. 开始分析（查看详细错误）...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 使用更真实的用户数据
        user_background = {
            "undergraduate_university": "北京大学",
            "undergraduate_major": "计算机科学与技术",
            "gpa": 3.8,
            "gpa_scale": "4.0",
            "graduation_year": 2024,
            "language_test_type": "TOEFL",
            "language_total_score": 105,
            "language_reading": 28,
            "language_listening": 26,
            "language_speaking": 25,
            "language_writing": 26,
            "gre_total": 325,
            "gre_verbal": 155,
            "gre_quantitative": 170,
            "gre_writing": 4.0,
            "target_countries": ["美国", "加拿大"],
            "target_majors": ["计算机科学", "软件工程"],
            "target_degree_type": "硕士",
            "research_experiences": [
                {
                    "title": "机器学习研究项目",
                    "description": "参与深度学习算法研究",
                    "duration": "6个月"
                }
            ],
            "internship_experiences": [
                {
                    "company": "腾讯",
                    "position": "软件开发实习生",
                    "duration": "3个月"
                }
            ],
            "other_experiences": []
        }
        
        print(f"   发送请求到: {BASE_URL}/api/analyze")
        print(f"   请求头: {headers}")
        print(f"   请求体: {json.dumps(user_background, indent=2, ensure_ascii=False)}")
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_background, headers=headers)
        print(f"   响应状态码: {response.status_code}")
        print(f"   响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   分析任务启动成功: {data['task_id']}")
            return data['task_id']
        else:
            print(f"   ❌ 分析失败，状态码: {response.status_code}")
            print(f"   响应内容: {response.text}")
            try:
                error_data = response.json()
                print(f"   错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print("   无法解析错误响应为JSON")
            return None
    except Exception as e:
        print(f"   异常: {e}")
        import traceback
        traceback.print_exc()
        return None

def debug_500_error():
    """调试500错误"""
    print("=== 调试500错误 ===")
    
    # 生成随机测试数据
    test_id = random.randint(1000, 9999)
    test_email = f"debug{test_id}@example.com"
    test_phone = f"1{random.randint(3000000000, 9999999999)}"
    
    print(f"测试邮箱: {test_email}")
    print(f"测试手机: {test_phone}")
    


    # 2. 发送验证码
    if not send_verification_code(test_email, test_phone):
        print("发送验证码失败，退出测试")
        return

    # 3. 获取调试验证码
    verification_code = get_debug_verification_code(test_email, test_phone)
    if not verification_code:
        print("获取验证码失败，退出测试")
        return
    
    # 5. 注册用户
    token = register_user(test_email, test_phone, verification_code)
    if not token:
        print("用户注册失败，退出测试")
        return
    
    # 6. 开始分析（这里可能出现500错误）
    print("\n" + "="*50)
    print("开始分析阶段 - 查看是否出现500错误")
    print("="*50)
    
    task_id = start_analysis_with_detailed_error(token)
    if task_id:
        print("✅ 分析启动成功，没有500错误")
    else:
        print("❌ 分析启动失败，可能出现500错误")

if __name__ == "__main__":
    debug_500_error()
