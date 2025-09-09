#!/usr/bin/env python3
"""
Gmail邮件服务修复脚本
用于诊断和修复Gmail SMTP连接问题
"""

import os
import sys
import smtplib
import ssl
import socket
import requests
from datetime import datetime

# 添加backend目录到Python路径
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# 切换到backend目录以正确加载.env文件
os.chdir(backend_path)

try:
    from config.settings import settings
    from services.email_service import EmailService
except ImportError as e:
    print(f"❌ 导入模块失败: {e}")
    print("请确保在项目根目录运行此脚本")
    sys.exit(1)

def print_header(title):
    """打印标题"""
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print('='*60)

def print_step(step, description):
    """打印步骤"""
    print(f"\n📋 步骤{step}: {description}")
    print('-'*40)

def check_config():
    """检查配置"""
    print_step(1, "检查Gmail配置")
    
    email = settings.GMAIL_SENDER_EMAIL
    password = settings.GMAIL_APP_PASSWORD
    
    if not email:
        print("❌ GMAIL_SENDER_EMAIL 未配置")
        return False
    
    if not password:
        print("❌ GMAIL_APP_PASSWORD 未配置")
        return False
    
    print(f"✅ 发送邮箱: {email}")
    print(f"✅ 应用密码: {'*' * len(password)}")
    
    # 检查密码格式
    if len(password) != 16:
        print("⚠️  警告: Gmail应用专用密码通常是16位字符")
    
    if ' ' in password:
        print("⚠️  警告: 密码中包含空格，建议去除")
    
    return True

def check_network():
    """检查网络连接"""
    print_step(2, "检查网络连接")
    
    # 检查DNS解析
    try:
        ip = socket.gethostbyname('smtp.gmail.com')
        print(f"✅ DNS解析成功: smtp.gmail.com -> {ip}")
    except Exception as e:
        print(f"❌ DNS解析失败: {e}")
        return False
    
    # 检查端口连接
    ports = [587, 465, 25]
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(('smtp.gmail.com', port))
            sock.close()
            
            if result == 0:
                print(f"✅ 端口{port}连接成功")
            else:
                print(f"❌ 端口{port}连接失败")
        except Exception as e:
            print(f"❌ 端口{port}测试异常: {e}")
    
    return True

def test_smtp_auth():
    """测试SMTP认证"""
    print_step(3, "测试SMTP认证")
    
    email = settings.GMAIL_SENDER_EMAIL
    password = settings.GMAIL_APP_PASSWORD
    
    try:
        # 尝试最常用的配置
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.set_debuglevel(1)  # 启用调试输出
        context = ssl.create_default_context()
        server.starttls(context=context)
        server.login(email, password)
        server.quit()
        
        print("✅ SMTP认证成功")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP认证失败: {e}")
        print("💡 可能的原因:")
        print("   1. 应用专用密码错误")
        print("   2. 两步验证未启用")
        print("   3. 应用专用密码已过期")
        return False
    except Exception as e:
        print(f"❌ SMTP连接异常: {e}")
        return False

def test_email_service():
    """测试邮件服务"""
    print_step(4, "测试邮件服务")
    
    try:
        email_service = EmailService()
        
        # 测试验证码生成
        code = email_service.generate_verification_code()
        print(f"✅ 验证码生成成功: {code}")
        
        # 测试邮件发送（控制台模式）
        test_email = input("请输入测试邮箱地址（回车跳过）: ").strip()
        if test_email:
            success = email_service.send_verification_email(test_email, code, "测试用户")
            if success:
                print("✅ 邮件发送测试成功")
                return True
            else:
                print("❌ 邮件发送测试失败")
                return False
        else:
            print("⏭️  跳过邮件发送测试")
            return True
            
    except Exception as e:
        print(f"❌ 邮件服务测试失败: {e}")
        return False

def suggest_solutions():
    """建议解决方案"""
    print_step(5, "解决方案建议")
    
    print("🔧 如果SMTP连接失败，请尝试以下解决方案:")
    print()
    print("1. 重新生成Gmail应用专用密码:")
    print("   - 访问 https://myaccount.google.com/")
    print("   - 安全性 -> 两步验证 -> 应用专用密码")
    print("   - 生成新密码并更新config.env")
    print()
    print("2. 检查网络环境:")
    print("   - 确认防火墙没有阻止SMTP端口")
    print("   - 尝试使用其他网络环境")
    print("   - 检查是否使用了代理")
    print()
    print("3. 使用第三方邮件API:")
    print("   - 在config.env中设置EMAIL_SEND_METHOD=api")
    print("   - 配置Resend、SendGrid或Mailgun API")
    print()
    print("4. 临时使用控制台模式:")
    print("   - 当前系统已自动回退到控制台模式")
    print("   - 验证码会显示在后端控制台中")
    print("   - 这是一个可行的临时解决方案")

def main():
    """主函数"""
    print_header("Gmail邮件服务修复工具")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 检查配置
    if not check_config():
        print("\n❌ 配置检查失败，请先配置Gmail设置")
        suggest_solutions()
        return
    
    # 检查网络
    check_network()
    
    # 测试SMTP认证
    smtp_success = test_smtp_auth()
    
    # 测试邮件服务
    service_success = test_email_service()
    
    # 总结
    print_header("诊断总结")
    if smtp_success and service_success:
        print("🎉 Gmail邮件服务工作正常！")
    elif service_success:
        print("⚠️  SMTP连接失败，但邮件服务已回退到控制台模式")
        print("💡 验证码功能正常工作，验证码会显示在后端控制台中")
    else:
        print("❌ 邮件服务存在问题")
        suggest_solutions()

if __name__ == "__main__":
    main()
