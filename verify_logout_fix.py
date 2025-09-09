#!/usr/bin/env python3
"""
验证退出登录功能修复
"""

import requests
import json
import time
import sys

def test_backend_api():
    """测试后端API"""
    print("=== 测试后端退出登录API ===")
    
    try:
        # 测试无token情况
        print("1. 测试无token调用...")
        response = requests.post('http://localhost:8000/api/auth/logout', 
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 无token调用成功")
            else:
                print("❌ 无token调用返回失败状态")
                return False
        else:
            print(f"❌ 无token调用失败，状态码: {response.status_code}")
            return False
        
        # 测试无效token情况
        print("2. 测试无效token调用...")
        response = requests.post('http://localhost:8000/api/auth/logout',
                               headers={
                                   'Authorization': 'Bearer invalid_token',
                                   'Content-Type': 'application/json'
                               })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 无效token调用成功")
            else:
                print("❌ 无效token调用返回失败状态")
                return False
        else:
            print(f"❌ 无效token调用失败，状态码: {response.status_code}")
            return False
        
        print("✅ 后端API测试通过")
        return True
        
    except Exception as e:
        print(f"❌ 后端API测试失败: {str(e)}")
        return False

def check_services():
    """检查服务状态"""
    print("=== 检查服务状态 ===")
    
    # 检查后端
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ 后端服务正常运行")
        else:
            print("❌ 后端服务响应异常")
            return False
    except Exception as e:
        print(f"❌ 后端服务连接失败: {str(e)}")
        print("请确保后端服务器正在运行: cd backend && python start_server.py")
        return False
    
    # 检查前端
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✅ 前端服务正常运行")
        else:
            print("❌ 前端服务响应异常")
            return False
    except Exception as e:
        print(f"❌ 前端服务连接失败: {str(e)}")
        print("请确保前端服务器正在运行: cd frontend && npm start")
        return False
    
    return True

def generate_test_instructions():
    """生成测试说明"""
    print("\n=== 手动测试说明 ===")
    print("现在请按照以下步骤手动测试退出登录功能：")
    print()
    print("1. 打开浏览器访问: http://localhost:3000")
    print("2. 如果看到登录页面，请完成登录流程")
    print("3. 登录成功后，应该能看到用户仪表板")
    print("4. 在用户仪表板右上角找到红色的\"退出登录\"按钮")
    print("5. 点击\"退出登录\"按钮")
    print("6. 应该弹出确认对话框，点击\"确定\"")
    print("7. 验证以下结果：")
    print("   - 页面应该跳转回登录界面")
    print("   - 用户仪表板应该消失")
    print("   - 浏览器控制台应该显示退出登录相关日志")
    print()
    print("如果以上步骤都正常工作，说明退出登录功能已经修复成功！")
    print()
    print("=== 调试工具 ===")
    print("如果遇到问题，可以使用以下调试工具：")
    print("1. 测试页面: http://localhost:3000/test_logout.html")
    print("2. 浏览器控制台中运行测试脚本（见 test_frontend_logout.js）")
    print("3. 查看后端日志（运行后端的终端窗口）")

def main():
    print("🔍 验证退出登录功能修复")
    print("=" * 50)
    
    # 检查服务状态
    if not check_services():
        print("\n❌ 服务检查失败，请先启动必要的服务")
        sys.exit(1)
    
    # 测试后端API
    if not test_backend_api():
        print("\n❌ 后端API测试失败")
        sys.exit(1)
    
    print("\n✅ 所有自动化测试通过！")
    
    # 生成手动测试说明
    generate_test_instructions()
    
    print("\n=== 修复总结 ===")
    print("已完成的修复内容：")
    print("1. ✅ 添加了后端退出登录API (/api/auth/logout)")
    print("2. ✅ 更新了前端authService.logout()方法")
    print("3. ✅ 修改了App.tsx和UserDashboard.tsx支持异步退出")
    print("4. ✅ 添加了完善的错误处理机制")
    print("5. ✅ 创建了测试工具和验证脚本")
    print()
    print("退出登录功能现在应该完全正常工作了！")

if __name__ == "__main__":
    main()
