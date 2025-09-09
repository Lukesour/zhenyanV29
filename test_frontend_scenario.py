#!/usr/bin/env python3
"""
测试前端实际使用场景 - 模拟用户在前端界面的操作流程
"""

import requests
import json
import time
import random

BASE_URL = "http://localhost:8000"

def simulate_frontend_workflow():
    """模拟前端工作流程"""
    print("=== 模拟前端用户操作流程 ===")
    
    # 生成随机测试数据
    test_id = random.randint(1000, 9999)
    test_email = f"frontend{test_id}@example.com"
    test_phone = f"1{random.randint(3000000000, 9999999999)}"
    
    print(f"测试邮箱: {test_email}")
    print(f"测试手机: {test_phone}")
    
    # 步骤1: 用户填写表单数据（前端暂存）
    user_form_data = {
        "undergraduate_university": "清华大学",
        "undergraduate_major": "电子工程",
        "gpa": 3.7,
        "gpa_scale": "4.0",
        "graduation_year": 2024,
        "language_test_type": "IELTS",
        "language_total_score": 7.5,
        "language_reading": 8.0,
        "language_listening": 7.5,
        "language_speaking": 7.0,
        "language_writing": 7.5,
        "target_countries": ["英国", "澳大利亚"],
        "target_majors": ["电子工程", "通信工程"],
        "target_degree_type": "硕士",
        "research_experiences": [],
        "internship_experiences": [
            {
                "company": "华为",
                "position": "硬件工程师实习生",
                "duration": "4个月"
            }
        ],
        "other_experiences": []
    }
    
    print("1. 用户填写表单数据完成")
    print("2. 用户点击'开始分析'按钮")
    print("3. 系统检测到用户未登录，跳转到认证页面")
    
    # 步骤2: 发送验证码
    print("4. 发送验证码...")
    try:
        payload = {
            "email": test_email,
            "phone": test_phone
        }

        response = requests.post(f"{BASE_URL}/api/auth/send-verification-code", json=payload)
        if response.status_code != 200:
            print(f"   ❌ 验证码发送失败: {response.status_code} - {response.text}")
            return False

        print("   ✅ 验证码发送成功")

    except Exception as e:
        print(f"   ❌ 验证码发送异常: {e}")
        return False
    
    # 步骤4: 获取验证码
    print("6. 获取验证码...")
    try:
        response = requests.get(f"{BASE_URL}/api/auth/debug/verification-code/{test_email}/{test_phone}")
        if response.status_code != 200:
            print(f"   ❌ 获取验证码失败: {response.status_code}")
            return False
        
        data = response.json()
        if not data.get("success"):
            print(f"   ❌ 验证码不可用: {data}")
            return False
        
        verification_code = data["verification_code"]
        print(f"   ✅ 验证码: {verification_code}")
        
    except Exception as e:
        print(f"   ❌ 获取验证码异常: {e}")
        return False
    
    # 步骤5: 用户注册（包含表单数据）
    print("7. 用户注册（包含表单数据）...")
    try:
        payload = {
            "phone": test_phone,
            "email": test_email,
            "verification_code": verification_code,
            "invitation_code": None,
            "profile_data": user_form_data  # 包含用户填写的表单数据
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code != 200:
            print(f"   ❌ 注册失败: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        token = data["access_token"]
        user_id = data["user_info"]["id"]
        print(f"   ✅ 注册成功，用户ID: {user_id}")
        
    except Exception as e:
        print(f"   ❌ 注册异常: {e}")
        return False
    
    # 步骤6: 立即开始分析（模拟前端认证成功后的自动跳转）
    print("8. 认证成功后立即开始分析...")
    print("   模拟前端 handleAuthSuccess -> startAnalysis 流程")
    
    # 模拟前端的延时处理
    print("   等待100ms（模拟前端延时）...")
    time.sleep(0.1)
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"   发送分析请求...")
        print(f"   Token: {token[:50]}...")
        
        response = requests.post(f"{BASE_URL}/api/analyze", json=user_form_data, headers=headers)
        
        print(f"   响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ 分析任务启动成功: {data['task_id']}")
            return True
        else:
            print(f"   ❌ 分析启动失败: {response.status_code}")
            print(f"   响应内容: {response.text}")
            
            # 检查是否是500错误
            if response.status_code == 500:
                print("   🚨 发现500错误！")
                try:
                    error_data = response.json()
                    print(f"   错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print("   无法解析错误响应")
            
            return False
            
    except Exception as e:
        print(f"   ❌ 分析请求异常: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_multiple_scenarios():
    """测试多个场景"""
    print("开始测试多个场景...")
    
    success_count = 0
    total_tests = 3
    
    for i in range(total_tests):
        print(f"\n{'='*60}")
        print(f"测试场景 {i+1}/{total_tests}")
        print('='*60)
        
        if simulate_frontend_workflow():
            success_count += 1
            print(f"✅ 场景 {i+1} 测试成功")
        else:
            print(f"❌ 场景 {i+1} 测试失败")
        
        # 等待一下再进行下一个测试
        if i < total_tests - 1:
            print("等待2秒后进行下一个测试...")
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"测试总结: {success_count}/{total_tests} 个场景成功")
    print('='*60)
    
    if success_count == total_tests:
        print("🎉 所有测试场景都成功，没有发现500错误")
    else:
        print("⚠️  部分测试场景失败，可能存在500错误")

if __name__ == "__main__":
    test_multiple_scenarios()
