#!/usr/bin/env python3
"""
测试认证修复 - 验证登录/注册后立即调用分析API是否正常工作
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
            "profile_data": {
                "undergraduate_university": "测试大学",
                "undergraduate_major": "计算机科学",
                "gpa": 3.5,
                "target_countries": ["美国"],
                "target_majors": ["计算机科学"]
            }
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

def start_analysis_immediately(token):
    """立即开始分析（模拟前端行为）"""
    print("5. 立即开始分析...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        user_background = {
            "undergraduate_university": "测试大学",
            "undergraduate_major": "计算机科学",
            "gpa": 3.5,
            "gpa_scale": "4.0",
            "graduation_year": 2024,
            "language_test_type": "TOEFL",
            "language_total_score": 100,
            "target_countries": ["美国"],
            "target_majors": ["计算机科学"],
            "target_degree_type": "硕士",
            "research_experiences": [],
            "internship_experiences": [],
            "other_experiences": []
        }
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_background, headers=headers)
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   分析任务启动成功: {data['task_id']}")
            return data['task_id']
        else:
            print(f"   分析任务启动失败: {response.text}")
            try:
                error_data = response.json()
                print(f"   错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                pass
            return None
    except Exception as e:
        print(f"   错误: {e}")
        return None

def test_auth_fix():
    """测试认证修复"""
    print("=== 测试认证修复 ===")
    
    # 生成随机测试数据
    test_id = random.randint(1000, 9999)
    test_email = f"test{test_id}@example.com"
    test_phone = f"1{random.randint(3000000000, 9999999999)}"
    
    print(f"测试邮箱: {test_email}")
    print(f"测试手机: {test_phone}")
    
    # 1. 发送验证码
    if not send_verification_code(test_email, test_phone):
        print("发送验证码失败，退出测试")
        return

    # 2. 获取调试验证码
    verification_code = get_debug_verification_code(test_email, test_phone)
    if not verification_code:
        print("获取验证码失败，退出测试")
        return

    # 3. 注册用户
    token = register_user(test_email, test_phone, verification_code)
    if not token:
        print("用户注册失败，退出测试")
        return

    # 4. 立即开始分析（这里应该不会出现500错误）
    task_id = start_analysis_immediately(token)
    if task_id:
        print("✅ 测试成功！认证后立即调用分析API正常工作")
    else:
        print("❌ 测试失败！认证后立即调用分析API仍然出现错误")

if __name__ == "__main__":
    test_auth_fix()
