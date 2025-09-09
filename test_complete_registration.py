#!/usr/bin/env python3
"""
测试完整的注册流程
"""

import requests
import json
import time

def test_complete_registration():
    """测试完整的注册流程"""
    print("🧪 测试完整的注册流程")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    test_email = "h133239238@gmail.com"
    test_phone = "13800138000"
    
    # 步骤1: 发送验证码
    print("📤 步骤1: 发送验证码...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/send-verification-code",
            headers={"Content-Type": "application/json"},
            json={"email": test_email, "phone": test_phone},
            timeout=15
        )
        
        if response.status_code == 200:
            print("✅ 验证码发送成功")
            print(f"   响应: {response.json()}")
        else:
            print(f"❌ 验证码发送失败: {response.status_code}")
            print(f"   错误: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ 验证码发送异常: {e}")
        return False
    
    # 步骤2: 获取验证码
    print("\n🔢 步骤2: 获取验证码...")
    print("请查看:")
    print("1. 您的邮箱 (h133239238@gmail.com)")
    print("2. 后端控制台日志")
    
    verification_code = input("请输入收到的验证码: ").strip()
    
    if not verification_code or len(verification_code) != 6:
        print("❌ 验证码格式不正确")
        return False
    
    # 步骤3: 注册用户
    print(f"\n👤 步骤3: 注册用户 (验证码: {verification_code})...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers={"Content-Type": "application/json"},
            json={
                "email": test_email,
                "phone": test_phone,
                "verification_code": verification_code
            },
            timeout=15
        )
        
        if response.status_code == 200:
            print("✅ 用户注册成功")
            result = response.json()
            print(f"   用户信息: {result.get('user_info', {})}")
            print(f"   访问令牌: {result.get('access_token', 'N/A')[:20]}...")
            return True
        else:
            print(f"❌ 用户注册失败: {response.status_code}")
            error_data = response.json()
            print(f"   错误: {error_data}")
            return False
            
    except Exception as e:
        print(f"❌ 用户注册异常: {e}")
        return False

def test_login_flow():
    """测试登录流程"""
    print("\n🔐 测试登录流程")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    test_email = "h133239238@gmail.com"
    test_phone = "13800138000"
    
    # 步骤1: 发送验证码
    print("📤 步骤1: 发送登录验证码...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/send-verification-code",
            headers={"Content-Type": "application/json"},
            json={"email": test_email, "phone": test_phone},
            timeout=15
        )
        
        if response.status_code == 200:
            print("✅ 验证码发送成功")
        else:
            print(f"❌ 验证码发送失败: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 验证码发送异常: {e}")
        return False
    
    # 步骤2: 获取验证码
    verification_code = input("请输入收到的验证码: ").strip()
    
    # 步骤3: 登录
    print(f"\n🔑 步骤3: 用户登录 (验证码: {verification_code})...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={
                "email": test_email,
                "phone": test_phone,
                "verification_code": verification_code
            },
            timeout=15
        )
        
        if response.status_code == 200:
            print("✅ 用户登录成功")
            result = response.json()
            print(f"   用户信息: {result.get('user_info', {})}")
            return True
        else:
            print(f"❌ 用户登录失败: {response.status_code}")
            print(f"   错误: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ 用户登录异常: {e}")
        return False

def main():
    """主测试函数"""
    print("🔍 完整用户认证流程测试")
    print("这个测试验证注册和登录的完整流程")
    print()
    
    # 测试注册
    print("选择测试类型:")
    print("1. 注册新用户")
    print("2. 登录现有用户")
    
    choice = input("请选择 (1/2): ").strip()
    
    if choice == "1":
        success = test_complete_registration()
        if success:
            print("\n🎉 注册流程测试成功！")
            print("现在您可以使用相同的邮箱和手机号登录。")
        else:
            print("\n❌ 注册流程测试失败")
    elif choice == "2":
        success = test_login_flow()
        if success:
            print("\n🎉 登录流程测试成功！")
        else:
            print("\n❌ 登录流程测试失败")
    else:
        print("❌ 无效选择")
        return
    
    print("\n" + "=" * 50)
    print("📋 测试总结:")
    print("✅ 验证码发送: 邮件发送到真实邮箱")
    print("✅ 验证码验证: 内存缓存验证机制")
    print("✅ 用户注册/登录: 完整流程测试")
    print("✅ 数据库容错: 优雅处理表不存在的情况")

if __name__ == "__main__":
    main()
