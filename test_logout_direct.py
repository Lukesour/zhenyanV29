#!/usr/bin/env python3
"""
直接测试退出登录API
"""

import requests
import json
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent / "backend"
sys.path.insert(0, str(project_root))

from services.user_service import UserService

def test_logout_api():
    """测试退出登录API"""
    try:
        print("=== 直接测试退出登录API ===")

        # 1. 生成一个简单的测试token（不依赖用户服务）
        print("\n1. 生成测试token...")
        import jwt
        from datetime import datetime, timedelta

        # 使用简单的测试payload
        payload = {
            'user_id': 1,
            'exp': datetime.utcnow() + timedelta(hours=1),
            'iat': datetime.utcnow()
        }
        # 使用默认密钥（与settings中一致）
        test_token = jwt.encode(payload, "your-secret-key-here", algorithm="HS256")
        print(f"测试token: {test_token[:50]}...")

        # 2. 测试退出登录API
        print("\n2. 调用退出登录API...")
        url = "http://localhost:8000/api/auth/logout"
        headers = {
            "Authorization": f"Bearer {test_token}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers)

        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 退出登录API测试成功！")
                return True
            else:
                print("❌ API返回失败状态")
                return False
        else:
            print(f"❌ API调用失败，状态码: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_without_token():
    """测试没有token时的情况"""
    try:
        print("\n=== 测试无token情况 ===")
        url = "http://localhost:8000/api/auth/logout"
        headers = {"Content-Type": "application/json"}

        response = requests.post(url, headers=headers)
        print(f"无token响应状态码: {response.status_code}")
        print(f"无token响应内容: {response.text}")

        # 我们的设计是即使没有token也返回成功，让前端能够清除本地状态
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 无token时正确返回成功（允许前端清除状态）")
                return True
            else:
                print("❌ 无token时应该返回成功")
                return False
        else:
            print("❌ 无token时应该返回200")
            return False

    except Exception as e:
        print(f"❌ 无token测试失败: {str(e)}")
        return False

def test_invalid_token():
    """测试无效token的情况"""
    try:
        print("\n=== 测试无效token情况 ===")
        url = "http://localhost:8000/api/auth/logout"
        headers = {
            "Authorization": "Bearer invalid_token_here",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers)
        print(f"无效token响应状态码: {response.status_code}")
        print(f"无效token响应内容: {response.text}")

        # 我们的设计是即使token无效也返回成功，让前端能够清除本地状态
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 无效token时正确返回成功（允许前端清除状态）")
                return True
            else:
                print("❌ 无效token时应该返回成功")
                return False
        else:
            print("❌ 无效token时应该返回200")
            return False

    except Exception as e:
        print(f"❌ 无效token测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("开始测试退出登录功能...")
    
    # 检查服务器是否运行
    try:
        response = requests.get("http://localhost:8000/docs")
        if response.status_code != 200:
            print("❌ 后端服务器未运行，请先启动服务器")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务器，请确保服务器在运行")
        sys.exit(1)
    
    # 运行测试
    results = []
    results.append(test_logout_api())
    results.append(test_without_token())
    results.append(test_invalid_token())
    
    # 总结
    print(f"\n=== 测试总结 ===")
    passed = sum(results)
    total = len(results)
    print(f"通过: {passed}/{total}")
    
    if passed == total:
        print("🎉 所有测试通过！退出登录API工作正常")
    else:
        print("⚠️  部分测试失败，请检查实现")
