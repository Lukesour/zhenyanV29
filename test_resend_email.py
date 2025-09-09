#!/usr/bin/env python3
"""
Resend邮件服务测试脚本
"""

import os
import sys
import requests
from datetime import datetime

# 添加backend目录到Python路径
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.chdir(backend_path)

try:
    from config.settings import settings
    from services.email_service import EmailService
except ImportError as e:
    print(f"❌ 导入模块失败: {e}")
    sys.exit(1)

def test_resend_config():
    """测试Resend配置"""
    print("🔧 测试Resend配置")
    print("=" * 50)
    
    api_key = settings.RESEND_API_KEY
    send_method = settings.EMAIL_SEND_METHOD
    
    print(f"📧 邮件发送方式: {send_method}")
    print(f"🔑 Resend API密钥: {api_key[:10]}...{api_key[-4:] if api_key else 'N/A'}")
    
    if not api_key:
        print("❌ Resend API密钥未配置")
        return False
    
    if not api_key.startswith('re_'):
        print("❌ Resend API密钥格式错误，应该以're_'开头")
        return False
    
    print("✅ Resend配置检查通过")
    return True

def test_resend_api_direct():
    """直接测试Resend API"""
    print("\n🚀 直接测试Resend API")
    print("=" * 50)
    
    api_key = settings.RESEND_API_KEY
    test_email = input("请输入测试邮箱地址: ").strip()
    
    if not test_email:
        print("❌ 未输入测试邮箱")
        return False
    
    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'from': '箴言留学 <noreply@resend.dev>',
                'to': [test_email],
                'subject': 'Resend API测试邮件',
                'html': '''
                <h2>🎉 Resend API测试成功！</h2>
                <p>这是一封来自箴言留学系统的测试邮件。</p>
                <p>如果您收到这封邮件，说明Resend邮件服务配置成功！</p>
                <p>测试时间: ''' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '''</p>
                ''',
                'text': f'''
                Resend API测试成功！
                
                这是一封来自箴言留学系统的测试邮件。
                如果您收到这封邮件，说明Resend邮件服务配置成功！
                
                测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                '''
            },
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Resend API测试成功！")
            print(f"📧 邮件ID: {result.get('id', 'N/A')}")
            print(f"📬 收件人: {test_email}")
            print("💡 请检查您的邮箱（包括垃圾邮件文件夹）")
            return True
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"❌ Resend API测试失败: {response.status_code}")
            print(f"错误信息: {error_data}")
            return False
            
    except Exception as e:
        print(f"❌ Resend API测试异常: {e}")
        return False

def test_email_service():
    """测试邮件服务"""
    print("\n📧 测试邮件服务")
    print("=" * 50)
    
    try:
        email_service = EmailService()
        
        # 检查发送方式
        print(f"📤 邮件发送方式: {email_service.send_method}")
        
        # 生成测试验证码
        code = email_service.generate_verification_code()
        print(f"🔢 生成验证码: {code}")
        
        # 测试邮件发送
        test_email = input("请输入测试邮箱地址: ").strip()
        if not test_email:
            print("❌ 未输入测试邮箱")
            return False
        
        print(f"📤 发送验证码邮件到: {test_email}")
        success = email_service.send_verification_email(test_email, code, "测试用户")
        
        if success:
            print("✅ 邮件服务测试成功！")
            print(f"🔢 验证码: {code}")
            print("💡 请检查您的邮箱（包括垃圾邮件文件夹）")
            return True
        else:
            print("❌ 邮件服务测试失败")
            return False
            
    except Exception as e:
        print(f"❌ 邮件服务测试异常: {e}")
        return False

def test_api_endpoint():
    """测试API端点"""
    print("\n🌐 测试API端点")
    print("=" * 50)
    
    try:
        # 获取CAPTCHA
        print("1. 获取CAPTCHA...")
        response = requests.get('http://localhost:8000/api/auth/captcha', timeout=10)
        if response.status_code != 200:
            print(f"❌ 获取CAPTCHA失败: {response.status_code}")
            return False
        
        captcha_data = response.json()
        print(f"✅ CAPTCHA获取成功: {captcha_data['question']}")
        
        # 发送验证码
        print("2. 发送验证码...")
        test_email = input("请输入测试邮箱地址: ").strip()
        if not test_email:
            print("❌ 未输入测试邮箱")
            return False
        
        captcha_answer = input(f"请回答CAPTCHA问题 '{captcha_data['question']}': ").strip()
        
        response = requests.post(
            'http://localhost:8000/api/auth/send-verification-code',
            headers={'Content-Type': 'application/json'},
            json={
                'email': test_email,
                'phone': '13800138000',
                'captcha_id': captcha_data['captcha_id'],
                'captcha_answer': captcha_answer,
                'session_id': captcha_data['session_id']
            },
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API端点测试成功！")
            print(f"📧 响应: {result['message']}")
            print("💡 请检查您的邮箱（包括垃圾邮件文件夹）")
            return True
        else:
            error_data = response.json()
            print(f"❌ API端点测试失败: {response.status_code}")
            print(f"错误信息: {error_data}")
            return False
            
    except Exception as e:
        print(f"❌ API端点测试异常: {e}")
        return False

def main():
    """主函数"""
    print("🧪 Resend邮件服务完整测试")
    print("=" * 60)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 测试配置
    if not test_resend_config():
        print("\n❌ 配置测试失败，请检查Resend API密钥配置")
        return
    
    # 选择测试方式
    print("\n请选择测试方式:")
    print("1. 直接测试Resend API")
    print("2. 测试邮件服务类")
    print("3. 测试完整API端点")
    print("4. 全部测试")
    
    choice = input("请输入选择 (1-4): ").strip()
    
    if choice == '1':
        test_resend_api_direct()
    elif choice == '2':
        test_email_service()
    elif choice == '3':
        test_api_endpoint()
    elif choice == '4':
        test_resend_api_direct()
        test_email_service()
        test_api_endpoint()
    else:
        print("❌ 无效选择")

if __name__ == "__main__":
    main()
