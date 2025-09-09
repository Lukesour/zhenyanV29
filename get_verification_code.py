#!/usr/bin/env python3
"""
获取内存缓存中的验证码
"""

import requests
import urllib.parse

def get_verification_code():
    """获取验证码"""
    email = "h133239238@gmail.com"
    phone = "13800138000"
    
    # URL编码邮箱地址
    encoded_email = urllib.parse.quote(email, safe='')
    
    url = f"http://localhost:8000/api/auth/debug/verification-code/{encoded_email}/{phone}"
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"🔢 验证码: {data['verification_code']}")
                print(f"📧 邮箱: {email}")
                print(f"📱 手机: {phone}")
                return data['verification_code']
            else:
                print(f"❌ {data.get('message', '未找到验证码')}")
                return None
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            print(f"   响应: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return None

if __name__ == "__main__":
    print("🔍 获取内存缓存中的验证码")
    print("=" * 40)
    
    code = get_verification_code()
    
    if code:
        print(f"\n✅ 验证码获取成功: {code}")
        print("您可以使用这个验证码完成注册或登录")
    else:
        print("\n❌ 验证码获取失败")
        print("请先发送验证码，然后再运行此脚本")
