#!/usr/bin/env python3
"""
直接测试发送验证码功能（绕过数据库）
"""

import sys
import os
import asyncio

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import EmailService

async def test_send_verification_code():
    """直接测试发送验证码"""
    print("📧 直接测试验证码发送功能")
    print("=" * 50)
    
    # 初始化邮件服务
    try:
        email_service = EmailService()
        print("✅ 邮件服务初始化成功")
    except Exception as e:
        print(f"❌ 邮件服务初始化失败: {e}")
        return False
    
    # 生成验证码
    verification_code = email_service.generate_verification_code()
    print(f"🔢 生成验证码: {verification_code}")
    
    # 获取测试邮箱
    test_email = input("请输入测试邮箱地址: ").strip()
    if not test_email:
        print("❌ 未输入邮箱地址")
        return False
    
    # 发送验证码邮件
    print(f"📤 发送验证码到: {test_email}")
    
    try:
        success = email_service.send_verification_email(
            to_email=test_email,
            verification_code=verification_code,
            user_name="测试用户"
        )
        
        if success:
            print("✅ 验证码邮件发送成功！")
            print(f"🔢 验证码: {verification_code}")
            print("📬 请检查您的邮箱（包括垃圾邮件文件夹）")
            return True
        else:
            print("❌ 验证码邮件发送失败")
            return False
            
    except Exception as e:
        print(f"❌ 发送验证码异常: {e}")
        return False

def main():
    """主函数"""
    print("🧪 验证码发送功能测试")
    print("这个测试直接调用邮件服务，不依赖数据库")
    print()
    
    success = asyncio.run(test_send_verification_code())
    
    if success:
        print("\n🎉 验证码发送功能测试成功！")
        print("\n💡 现在您可以在前端测试:")
        print("1. 访问前端页面")
        print("2. 填写注册或登录表单")
        print("3. 点击'发送验证码'")
        print("4. 查看后端控制台输出的验证码")
    else:
        print("\n❌ 验证码发送功能测试失败")
        print("\n📋 请检查:")
        print("1. Gmail SMTP配置是否正确")
        print("2. 网络连接是否正常")
        print("3. 邮箱地址是否有效")

if __name__ == "__main__":
    main()
