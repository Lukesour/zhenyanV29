#!/usr/bin/env python3
"""
箴言留学用户系统测试脚本
用于验证用户认证、邮件服务、数据库连接等功能
"""

import asyncio
import sys
import os
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.user_service import UserService
from services.email_service import EmailService
from services.email_verification_service import email_verification_service
from config.settings import settings

class UserSystemTester:
    def __init__(self):
        self.user_service = None
        self.email_service = None
        self.email_verification_service = None
        self.test_results = []
    
    def log_test(self, test_name: str, success: bool, message: str = ""):
        """记录测试结果"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now()
        })
    
    def test_configuration(self):
        """测试配置"""
        print("\n🔧 测试系统配置...")
        
        # 测试Supabase配置
        supabase_ok = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        self.log_test("Supabase配置", supabase_ok, 
                     f"URL: {settings.SUPABASE_URL[:20]}..." if supabase_ok else "缺少配置")
        
        # 测试Brevo配置
        brevo_ok = bool(settings.BREVO_API_KEY)
        self.log_test("Brevo邮件配置", brevo_ok,
                     "API密钥已配置" if brevo_ok else "缺少API密钥")

        # 测试Hunter.io配置
        hunter_ok = bool(settings.HUNTER_API_KEY)
        self.log_test("Hunter.io邮箱验证配置", hunter_ok,
                     "API密钥已配置" if hunter_ok else "缺少API密钥")
        
        # 测试JWT配置
        jwt_ok = bool(settings.JWT_SECRET_KEY and settings.JWT_SECRET_KEY != "your-secret-key-change-in-production")
        self.log_test("JWT配置", jwt_ok,
                     "密钥已配置" if jwt_ok else "使用默认密钥，请更改")
        
        return supabase_ok and brevo_ok
    
    def test_services_initialization(self):
        """测试服务初始化"""
        print("\n🚀 测试服务初始化...")
        
        # 测试用户服务初始化
        try:
            self.user_service = UserService()
            self.log_test("用户服务初始化", True)
        except Exception as e:
            self.log_test("用户服务初始化", False, str(e))
            return False
        
        # 测试邮件服务初始化
        try:
            self.email_service = EmailService()
            self.log_test("邮件服务初始化", True)
        except Exception as e:
            self.log_test("邮件服务初始化", False, str(e))
            return False

        # 测试邮箱验证服务初始化
        try:
            self.email_verification_service = email_verification_service
            self.log_test("邮箱验证服务初始化", True)
        except Exception as e:
            self.log_test("邮箱验证服务初始化", False, str(e))
            return False

        return True
    
    def test_database_connection(self):
        """测试数据库连接"""
        print("\n🗄️ 测试数据库连接...")
        
        if not self.user_service:
            self.log_test("数据库连接", False, "用户服务未初始化")
            return False
        
        try:
            connection_ok = self.user_service.test_connection()
            self.log_test("数据库连接", connection_ok,
                         "连接成功" if connection_ok else "连接失败")
            return connection_ok
        except Exception as e:
            self.log_test("数据库连接", False, str(e))
            return False
    
    def test_email_service(self):
        """测试邮件服务"""
        print("\n📧 测试邮件服务...")
        
        if not self.email_service:
            self.log_test("邮件服务连接", False, "邮件服务未初始化")
            return False
        
        try:
            connection_ok = self.email_service.test_connection()
            self.log_test("邮件服务连接", connection_ok,
                         "连接成功" if connection_ok else "连接失败")
            
            # 测试验证码生成
            code = self.email_service.generate_verification_code()
            code_ok = len(code) == 6 and code.isdigit()
            self.log_test("验证码生成", code_ok, f"生成的验证码: {code}")
            
            return connection_ok and code_ok
        except Exception as e:
            self.log_test("邮件服务测试", False, str(e))
            return False

    async def test_email_verification_service(self):
        """测试Hunter.io邮箱验证服务"""
        print("\n🔍 测试Hunter.io邮箱验证服务...")

        if not self.email_verification_service:
            self.log_test("邮箱验证服务连接", False, "邮箱验证服务未初始化")
            return False

        try:
            # 测试连接
            connection_ok = await self.email_verification_service.test_connection()
            self.log_test("邮箱验证服务连接", connection_ok,
                         "连接成功" if connection_ok else "连接失败")

            if connection_ok:
                # 测试邮箱验证功能
                test_email = "test@example.com"
                verification_result = await self.email_verification_service.verify_email(test_email)

                verify_ok = "result" in verification_result and "valid" in verification_result
                self.log_test("邮箱验证功能", verify_ok,
                             f"验证结果: {verification_result.get('result', 'unknown')}")

                # 测试风险检测
                is_risky = self.email_verification_service.is_email_risky(verification_result)
                quality_score = self.email_verification_service.get_email_quality_score(verification_result)
                self.log_test("邮箱风险检测", True,
                             f"风险: {'是' if is_risky else '否'}, 质量分数: {quality_score}")

                return verify_ok
            else:
                return False

        except Exception as e:
            self.log_test("邮箱验证服务测试", False, str(e))
            return False
    
    async def test_user_operations(self):
        """测试用户操作"""
        print("\n👤 测试用户操作...")
        
        if not self.user_service:
            self.log_test("用户操作", False, "用户服务未初始化")
            return False
        
        test_phone = "13800138000"
        test_email = "test@example.com"
        
        try:
            # 测试邀请码生成
            invitation_code = self.user_service.generate_invitation_code()
            code_ok = len(invitation_code) == 8 and invitation_code.isalnum()
            self.log_test("邀请码生成", code_ok, f"生成的邀请码: {invitation_code}")
            
            # 测试JWT令牌生成
            token_data = self.user_service.generate_jwt_token(1)
            token_ok = 'access_token' in token_data and 'expires_in' in token_data
            self.log_test("JWT令牌生成", token_ok, "令牌生成成功" if token_ok else "令牌生成失败")
            
            # 测试JWT令牌验证
            if token_ok:
                user_id = self.user_service.verify_jwt_token(token_data['access_token'])
                verify_ok = user_id == 1
                self.log_test("JWT令牌验证", verify_ok, f"验证用户ID: {user_id}")
            
            return True
            
        except Exception as e:
            self.log_test("用户操作测试", False, str(e))
            return False
    
    def test_api_endpoints(self):
        """测试API端点（需要服务器运行）"""
        print("\n🌐 测试API端点...")
        
        try:
            import requests
            base_url = "http://localhost:8000"
            
            # 测试健康检查端点
            try:
                response = requests.get(f"{base_url}/api/auth/health", timeout=5)
                health_ok = response.status_code == 200
                self.log_test("健康检查API", health_ok, 
                             f"状态码: {response.status_code}" if not health_ok else "API正常")
            except requests.exceptions.RequestException as e:
                self.log_test("健康检查API", False, f"连接失败: {str(e)}")
                return False
            
            return health_ok
            
        except ImportError:
            self.log_test("API测试", False, "requests库未安装，跳过API测试")
            return True
    
    def print_summary(self):
        """打印测试总结"""
        print("\n" + "="*60)
        print("📊 测试总结")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests} ✅")
        print(f"失败: {failed_tests} ❌")
        print(f"成功率: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "="*60)
        
        if failed_tests == 0:
            print("🎉 所有测试通过！系统配置正确。")
        else:
            print("⚠️  部分测试失败，请检查配置。")
        
        return failed_tests == 0

async def main():
    """主测试函数"""
    print("🧪 箴言留学用户系统测试")
    print("="*60)
    
    tester = UserSystemTester()
    
    # 运行所有测试
    config_ok = tester.test_configuration()
    services_ok = tester.test_services_initialization() if config_ok else False
    db_ok = tester.test_database_connection() if services_ok else False
    email_ok = tester.test_email_service() if services_ok else False
    email_verification_ok = await tester.test_email_verification_service() if services_ok else False
    user_ops_ok = await tester.test_user_operations() if services_ok else False
    api_ok = tester.test_api_endpoints()
    
    # 打印总结
    all_passed = tester.print_summary()
    
    # 返回适当的退出码
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    asyncio.run(main())
