#!/usr/bin/env python3
"""
调试退出登录问题
"""

import requests
import json
import time

def check_current_state():
    """检查当前状态"""
    print("=== 检查当前状态 ===")
    
    # 检查后端服务
    try:
        response = requests.get('http://localhost:8000/docs')
        print(f"后端服务状态: {response.status_code}")
    except Exception as e:
        print(f"后端服务连接失败: {e}")
        return False
    
    # 检查前端服务
    try:
        response = requests.get('http://localhost:3000')
        print(f"前端服务状态: {response.status_code}")
    except Exception as e:
        print(f"前端服务连接失败: {e}")
        return False
    
    return True

def test_logout_api_detailed():
    """详细测试退出登录API"""
    print("\n=== 详细测试退出登录API ===")
    
    # 测试1: 无Authorization头
    print("1. 测试无Authorization头...")
    try:
        response = requests.post('http://localhost:8000/api/auth/logout',
                               headers={'Content-Type': 'application/json'})
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试2: 空的Authorization头
    print("2. 测试空的Authorization头...")
    try:
        response = requests.post('http://localhost:8000/api/auth/logout',
                               headers={
                                   'Authorization': '',
                                   'Content-Type': 'application/json'
                               })
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试3: 无效的Bearer token
    print("3. 测试无效的Bearer token...")
    try:
        response = requests.post('http://localhost:8000/api/auth/logout',
                               headers={
                                   'Authorization': 'Bearer invalid_token_123',
                                   'Content-Type': 'application/json'
                               })
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试4: 格式错误的Authorization头
    print("4. 测试格式错误的Authorization头...")
    try:
        response = requests.post('http://localhost:8000/api/auth/logout',
                               headers={
                                   'Authorization': 'invalid_format_token',
                                   'Content-Type': 'application/json'
                               })
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   错误: {e}")

def test_login_api():
    """测试登录API"""
    print("\n=== 测试登录API ===")
    
    # 测试登录API是否正常工作
    try:
        # 先获取验证码
        print("1. 获取CAPTCHA...")
        captcha_response = requests.get('http://localhost:8000/api/auth/captcha')
        print(f"   CAPTCHA状态码: {captcha_response.status_code}")
        
        if captcha_response.status_code == 200:
            captcha_data = captcha_response.json()
            print(f"   CAPTCHA问题: {captcha_data.get('question', 'N/A')}")
        
        # 测试发送验证码
        print("2. 测试发送验证码API...")
        send_code_data = {
            "phone": "13800138000",
            "email": "test@example.com",
            "captcha_answer": "10",  # 假设答案
            "captcha_id": captcha_data.get('captcha_id', 'test') if captcha_response.status_code == 200 else 'test',
            "session_id": captcha_data.get('session_id', 'test') if captcha_response.status_code == 200 else 'test'
        }
        
        send_response = requests.post('http://localhost:8000/api/auth/send-verification-code',
                                    json=send_code_data,
                                    headers={'Content-Type': 'application/json'})
        print(f"   发送验证码状态码: {send_response.status_code}")
        print(f"   发送验证码响应: {send_response.text[:200]}...")
        
    except Exception as e:
        print(f"   登录API测试错误: {e}")

def check_frontend_files():
    """检查前端文件是否存在"""
    print("\n=== 检查前端文件 ===")
    
    import os
    
    files_to_check = [
        'frontend/src/App.tsx',
        'frontend/src/components/UserDashboard.tsx',
        'frontend/src/services/authService.ts'
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            print(f"✅ {file_path} 存在")
        else:
            print(f"❌ {file_path} 不存在")

def generate_debug_instructions():
    """生成调试说明"""
    print("\n=== 调试说明 ===")
    print("基于当前问题，请按以下步骤调试：")
    print()
    print("1. 检查浏览器控制台错误:")
    print("   - 打开 http://localhost:3000")
    print("   - 按F12打开开发者工具")
    print("   - 查看Console标签页是否有错误信息")
    print("   - 查看Network标签页，点击退出登录时是否有网络请求")
    print()
    print("2. 检查退出登录按钮:")
    print("   - 确认退出登录按钮是否可见")
    print("   - 右键点击按钮，选择'检查元素'")
    print("   - 查看是否有onClick事件绑定")
    print()
    print("3. 手动测试API:")
    print("   - 在浏览器控制台运行:")
    print("   fetch('/api/auth/logout', {method: 'POST'}).then(r => r.json()).then(console.log)")
    print()
    print("4. 检查localStorage:")
    print("   - 在浏览器控制台运行:")
    print("   console.log('Token:', localStorage.getItem('access_token'))")
    print("   console.log('User:', localStorage.getItem('user_info'))")

def main():
    print("🔍 调试退出登录问题")
    print("=" * 50)
    
    # 检查基本状态
    if not check_current_state():
        print("基本服务检查失败，请先确保服务正常运行")
        return
    
    # 测试API
    test_logout_api_detailed()
    test_login_api()
    
    # 检查文件
    check_frontend_files()
    
    # 生成调试说明
    generate_debug_instructions()
    
    print("\n=== 可能的问题和解决方案 ===")
    print("1. 前端JavaScript错误:")
    print("   - 检查浏览器控制台是否有错误")
    print("   - 可能是异步函数调用问题")
    print()
    print("2. 网络请求问题:")
    print("   - 检查CORS设置")
    print("   - 检查代理配置")
    print()
    print("3. 状态管理问题:")
    print("   - 可能是React状态更新问题")
    print("   - 检查authService是否正确初始化")
    print()
    print("4. 登录500错误:")
    print("   - 检查后端日志中的具体错误信息")
    print("   - 可能是数据库连接或验证码问题")

if __name__ == "__main__":
    main()
