#!/usr/bin/env python3
"""
诊断500错误的详细工具
"""

import requests
import json
import time
import random
from datetime import datetime

BASE_URL = "http://localhost:8000"

def log_with_timestamp(message):
    """带时间戳的日志"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

def test_existing_user_login():
    """测试已存在用户的登录流程"""
    log_with_timestamp("=== 测试已存在用户登录 ===")
    
    # 使用之前测试中创建的用户
    test_email = "frontend5200@example.com"
    test_phone = "19809189604"
    
    log_with_timestamp(f"使用已存在用户: {test_email}")
    
    # 1. 获取CAPTCHA
    try:
        response = requests.get(f"{BASE_URL}/api/auth/captcha")
        if response.status_code != 200:
            log_with_timestamp(f"❌ CAPTCHA获取失败: {response.status_code}")
            return False
        
        captcha_data = response.json()
        question = captcha_data["question"]
        question_clean = question.replace("×", "*").replace("÷", "/").replace("=", "").replace("?", "").strip()
        answer = eval(question_clean)
        log_with_timestamp(f"✅ CAPTCHA: {question} = {answer}")
        
    except Exception as e:
        log_with_timestamp(f"❌ CAPTCHA异常: {e}")
        return False
    
    # 2. 发送验证码
    try:
        payload = {
            "email": test_email,
            "phone": test_phone,
            "captcha_id": captcha_data["captcha_id"],
            "captcha_answer": str(answer),
            "session_id": captcha_data["session_id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/send-verification-code", json=payload)
        if response.status_code != 200:
            log_with_timestamp(f"❌ 验证码发送失败: {response.status_code}")
            return False
        
        log_with_timestamp("✅ 验证码发送成功")
        
    except Exception as e:
        log_with_timestamp(f"❌ 验证码发送异常: {e}")
        return False
    
    # 3. 获取验证码
    try:
        response = requests.get(f"{BASE_URL}/api/auth/debug/verification-code/{test_email}/{test_phone}")
        if response.status_code != 200:
            log_with_timestamp(f"❌ 获取验证码失败: {response.status_code}")
            return False
        
        data = response.json()
        verification_code = data["verification_code"]
        log_with_timestamp(f"✅ 验证码: {verification_code}")
        
    except Exception as e:
        log_with_timestamp(f"❌ 获取验证码异常: {e}")
        return False
    
    # 4. 用户登录
    try:
        payload = {
            "phone": test_phone,
            "email": test_email,
            "verification_code": verification_code
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        if response.status_code != 200:
            log_with_timestamp(f"❌ 登录失败: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        token = data["access_token"]
        user_id = data["user_info"]["id"]
        log_with_timestamp(f"✅ 登录成功，用户ID: {user_id}")
        
    except Exception as e:
        log_with_timestamp(f"❌ 登录异常: {e}")
        return False
    
    # 5. 立即开始分析
    return test_immediate_analysis(token, "已存在用户登录后")

def test_immediate_analysis(token, scenario):
    """测试立即开始分析"""
    log_with_timestamp(f"=== 测试{scenario}立即分析 ===")
    
    user_background = {
        "undergraduate_university": "复旦大学",
        "undergraduate_major": "金融学",
        "gpa": 3.6,
        "gpa_scale": "4.0",
        "graduation_year": 2024,
        "language_test_type": "TOEFL",
        "language_total_score": 102,
        "target_countries": ["美国"],
        "target_majors": ["金融工程"],
        "target_degree_type": "硕士",
        "research_experiences": [],
        "internship_experiences": [],
        "other_experiences": []
    }
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        log_with_timestamp("发送分析请求...")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_background, headers=headers)
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # 转换为毫秒
        
        log_with_timestamp(f"响应时间: {response_time:.2f}ms")
        log_with_timestamp(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            log_with_timestamp(f"✅ 分析任务启动成功: {data['task_id']}")
            return True
        else:
            log_with_timestamp(f"❌ 分析启动失败: {response.status_code}")
            log_with_timestamp(f"响应内容: {response.text}")
            
            if response.status_code == 500:
                log_with_timestamp("🚨 发现500错误！")
                try:
                    error_data = response.json()
                    log_with_timestamp(f"错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    log_with_timestamp("无法解析错误响应")
            
            return False
            
    except Exception as e:
        log_with_timestamp(f"❌ 分析请求异常: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_edge_cases():
    """测试边缘情况"""
    log_with_timestamp("=== 测试边缘情况 ===")
    
    # 测试1: 无效token
    log_with_timestamp("测试1: 使用无效token")
    invalid_token = "invalid.token.here"
    test_immediate_analysis(invalid_token, "无效token")
    
    # 测试2: 空token
    log_with_timestamp("测试2: 使用空token")
    try:
        headers = {"Content-Type": "application/json"}
        user_background = {"undergraduate_university": "测试大学"}
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_background, headers=headers)
        log_with_timestamp(f"无token请求状态码: {response.status_code}")
        
    except Exception as e:
        log_with_timestamp(f"无token请求异常: {e}")
    
    # 测试3: 格式错误的数据
    log_with_timestamp("测试3: 发送格式错误的数据")
    try:
        # 先创建一个有效用户
        test_id = random.randint(1000, 9999)
        test_email = f"edge{test_id}@example.com"
        test_phone = f"1{random.randint(3000000000, 9999999999)}"
        
        # 快速注册
        token = quick_register(test_email, test_phone)
        if token:
            # 发送错误格式的数据
            invalid_data = {
                "undergraduate_university": "",  # 空字符串
                "undergraduate_major": None,     # None值
                "gpa": "invalid",                # 字符串而不是数字
                "target_countries": [],          # 空数组
                "target_majors": []              # 空数组
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(f"{BASE_URL}/api/analyze", json=invalid_data, headers=headers)
            log_with_timestamp(f"错误数据请求状态码: {response.status_code}")
            if response.status_code != 200:
                log_with_timestamp(f"错误响应: {response.text}")
        
    except Exception as e:
        log_with_timestamp(f"错误数据测试异常: {e}")

def quick_register(email, phone):
    """快速注册用户"""
    try:
        # 获取CAPTCHA
        response = requests.get(f"{BASE_URL}/api/auth/captcha")
        captcha_data = response.json()
        question = captcha_data["question"]
        question_clean = question.replace("×", "*").replace("÷", "/").replace("=", "").replace("?", "").strip()
        answer = eval(question_clean)
        
        # 发送验证码
        payload = {
            "email": email,
            "phone": phone,
            "captcha_id": captcha_data["captcha_id"],
            "captcha_answer": str(answer),
            "session_id": captcha_data["session_id"]
        }
        requests.post(f"{BASE_URL}/api/auth/send-verification-code", json=payload)
        
        # 获取验证码
        response = requests.get(f"{BASE_URL}/api/auth/debug/verification-code/{email}/{phone}")
        verification_code = response.json()["verification_code"]
        
        # 注册
        payload = {
            "phone": phone,
            "email": email,
            "verification_code": verification_code,
            "invitation_code": None,
            "profile_data": None
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code == 200:
            return response.json()["access_token"]
        
    except Exception as e:
        log_with_timestamp(f"快速注册失败: {e}")
    
    return None

def main():
    """主函数"""
    log_with_timestamp("开始500错误诊断...")
    
    # 测试1: 已存在用户登录
    test_existing_user_login()
    
    time.sleep(1)
    
    # 测试2: 边缘情况
    test_edge_cases()
    
    log_with_timestamp("诊断完成")

if __name__ == "__main__":
    main()
