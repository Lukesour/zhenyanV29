#!/usr/bin/env python3
"""
测试多种邮箱服务商的验证码发送功能
"""

import os
import sys
import requests
import time
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

def test_email_provider(email, provider_name):
    """测试特定邮箱服务商"""
    print(f"\n📧 测试 {provider_name} 邮箱: {email}")
    print("-" * 50)
    
    try:
        # 发送验证码
        response = requests.post(
            'http://localhost:8000/api/auth/send-verification-code',
            headers={'Content-Type': 'application/json'},
            json={
                'email': email,
                'phone': '13800138000'
            },
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {provider_name} 邮箱发送成功!")
            print(f"📬 响应: {result['message']}")
            
            # 等待一下，然后获取验证码
            time.sleep(2)
            
            # 获取验证码（用于确认）
            encoded_email = requests.utils.quote(email, safe='')
            debug_response = requests.get(
                f'http://localhost:8000/api/auth/debug/verification-code/{encoded_email}/13800138000',
                timeout=10
            )
            
            if debug_response.status_code == 200:
                debug_data = debug_response.json()
                if debug_data.get('success'):
                    print(f"🔢 验证码: {debug_data['verification_code']}")
                else:
                    print(f"⚠️  无法获取验证码: {debug_data.get('message')}")
            
            return True
        else:
            error_data = response.json()
            print(f"❌ {provider_name} 邮箱发送失败: {response.status_code}")
            print(f"错误信息: {error_data}")
            return False
            
    except Exception as e:
        print(f"❌ {provider_name} 邮箱测试异常: {e}")
        return False

def main():
    """主函数"""
    print("🧪 多邮箱服务商验证码发送测试")
    print("=" * 60)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Resend域名: {settings.RESEND_FROM_DOMAIN}")
    print(f"发送方式: {settings.EMAIL_SEND_METHOD}")
    
    # 测试不同邮箱服务商
    test_cases = [
        ("h133239238@gmail.com", "Gmail"),
        ("1619513754@qq.com", "QQ邮箱"),
        ("test@163.com", "网易163"),
        ("test@126.com", "网易126"),
        ("test@sina.com", "新浪邮箱"),
        ("test@hotmail.com", "Hotmail"),
        ("test@outlook.com", "Outlook"),
        ("test@yahoo.com", "Yahoo"),
    ]
    
    print("\n📋 测试计划:")
    for i, (email, provider) in enumerate(test_cases, 1):
        print(f"{i}. {provider}: {email}")
    
    print("\n🚀 开始测试...")
    
    success_count = 0
    total_count = len(test_cases)
    
    for email, provider in test_cases:
        try:
            if test_email_provider(email, provider):
                success_count += 1
            
            # 测试间隔，避免频率限制
            time.sleep(3)
            
        except KeyboardInterrupt:
            print("\n⏹️  测试被用户中断")
            break
        except Exception as e:
            print(f"❌ 测试 {provider} 时发生异常: {e}")
    
    # 测试总结
    print("\n" + "=" * 60)
    print("📊 测试总结")
    print("=" * 60)
    print(f"总测试数: {total_count}")
    print(f"成功数: {success_count}")
    print(f"失败数: {total_count - success_count}")
    print(f"成功率: {success_count/total_count*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 所有邮箱服务商测试通过！")
    elif success_count > 0:
        print("⚠️  部分邮箱服务商测试通过")
    else:
        print("❌ 所有测试都失败了")
    
    print("\n💡 注意事项:")
    print("1. 请检查各邮箱的收件箱和垃圾邮件文件夹")
    print("2. 某些邮箱可能需要更长时间才能收到邮件")
    print("3. 如果测试邮箱不存在，邮件发送可能成功但无法收到")

if __name__ == "__main__":
    main()
