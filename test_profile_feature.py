#!/usr/bin/env python3
"""
测试用户个人信息功能的脚本
"""
import asyncio
import json
from datetime import datetime
from backend.services.user_service import UserService
from backend.models.user_models import UserProfileData

async def test_profile_feature():
    """测试用户个人信息功能"""
    print("开始测试用户个人信息功能...")
    
    try:
        # 初始化用户服务
        user_service = UserService()
        
        # 测试数据
        test_phone = "13800138001"
        test_email = "test@example.com"
        test_verification_code = "123456"
        
        # 创建测试个人信息数据
        profile_data = UserProfileData(
            undergraduate_university="清华大学",
            undergraduate_major="计算机科学与技术",
            gpa=3.8,
            gpa_scale="4.0",
            graduation_year=2024,
            language_test_type="TOEFL",
            language_total_score=105.0,
            language_reading=28.0,
            language_listening=27.0,
            language_speaking=25.0,
            language_writing=25.0,
            gre_total=325,
            gre_verbal=160,
            gre_quantitative=165,
            gre_writing=4.0,
            target_countries=["美国", "加拿大"],
            target_majors=["计算机科学", "人工智能"],
            target_degree_type="Master",
            research_experiences=[
                {
                    "name": "机器学习研究项目",
                    "role": "研究助理",
                    "description": "参与深度学习算法研究"
                }
            ],
            internship_experiences=[
                {
                    "company": "腾讯",
                    "position": "软件工程师实习生",
                    "description": "负责后端开发工作"
                }
            ],
            other_experiences=[
                {
                    "name": "ACM竞赛",
                    "description": "获得省级一等奖"
                }
            ]
        )
        
        print("1. 测试用户注册（包含个人信息）...")
        try:
            # 注册用户（包含个人信息）
            user_info = await user_service.register_user(
                phone=test_phone,
                email=test_email,
                verification_code=test_verification_code,
                invitation_code=None,
                profile_data=profile_data
            )
            print(f"✓ 用户注册成功，ID: {user_info.id}")
            print(f"✓ 个人信息已保存: {user_info.profile_data is not None}")
            
            # 测试获取用户个人信息
            print("2. 测试获取用户个人信息...")
            retrieved_profile = await user_service.get_user_profile(user_info.id)
            if retrieved_profile:
                print("✓ 成功获取用户个人信息")
                print(f"  - 本科院校: {retrieved_profile.undergraduate_university}")
                print(f"  - 本科专业: {retrieved_profile.undergraduate_major}")
                print(f"  - GPA: {retrieved_profile.gpa}")
                print(f"  - 语言考试: {retrieved_profile.language_test_type}")
                print(f"  - 语言总分: {retrieved_profile.language_total_score}")
                print(f"  - 目标国家: {retrieved_profile.target_countries}")
                print(f"  - 目标专业: {retrieved_profile.target_majors}")
            else:
                print("✗ 获取用户个人信息失败")
            
            # 测试用户登录（应该返回个人信息）
            print("3. 测试用户登录（应该返回个人信息）...")
            login_data = await user_service.login_user(
                phone=test_phone,
                email=test_email,
                verification_code=test_verification_code
            )
            
            if login_data['user_info'].profile_data:
                print("✓ 登录成功，个人信息已返回")
                profile = login_data['user_info'].profile_data
                print(f"  - 本科院校: {profile.undergraduate_university}")
                print(f"  - 目标专业: {profile.target_majors}")
            else:
                print("✗ 登录成功，但个人信息未返回")
                
        except Exception as e:
            print(f"✗ 测试过程中出现错误: {str(e)}")
            # 如果是因为用户已存在，尝试直接测试获取功能
            if "已注册" in str(e):
                print("用户已存在，尝试测试获取功能...")
                # 这里可以添加获取现有用户信息的测试
        
        print("\n测试完成！")
        
    except Exception as e:
        print(f"测试失败: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_profile_feature())
