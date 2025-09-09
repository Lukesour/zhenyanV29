#!/bin/bash

echo "🔍 验证码修复验证脚本"
echo "=================================="

# 检查构建文件
echo "1. 检查构建文件中的API URL..."
if [ -f "frontend/build/static/js/main.92acefe2.js" ]; then
    echo "   ✅ 构建文件存在"
    
    # 检查是否包含正确的API URL
    if grep -q "https://api.zhenyan.asia" frontend/build/static/js/main.92acefe2.js; then
        echo "   ✅ 包含正确的生产API URL"
    else
        echo "   ❌ 未找到生产API URL"
    fi
    
    # 检查验证码端点
    if grep -q "https://api.zhenyan.asia/api/auth/captcha" frontend/build/static/js/main.92acefe2.js; then
        echo "   ✅ 验证码端点配置正确"
    else
        echo "   ❌ 验证码端点配置错误"
    fi
else
    echo "   ❌ 构建文件不存在，请先运行 npm run build"
fi

echo ""

# 检查环境配置文件
echo "2. 检查环境配置..."
if [ -f "frontend/.env.production" ]; then
    echo "   ✅ 生产环境配置文件存在"
    echo "   内容: $(cat frontend/.env.production)"
else
    echo "   ❌ 生产环境配置文件不存在"
fi

echo ""

# 检查源代码
echo "3. 检查源代码修复..."
relative_paths=$(find frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "fetch.*['\"]/" 2>/dev/null | wc -l)
if [ "$relative_paths" -eq 0 ]; then
    echo "   ✅ 所有相对路径API调用已修复"
else
    echo "   ❌ 仍有 $relative_paths 个文件包含相对路径API调用"
    find frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -H "fetch.*['\"]/" 2>/dev/null
fi

echo ""

# 测试API连通性
echo "4. 测试API连通性..."
if curl -s --max-time 10 https://api.zhenyan.asia/api/auth/captcha > /dev/null; then
    echo "   ✅ 后端API可访问"
    
    # 获取验证码测试
    response=$(curl -s https://api.zhenyan.asia/api/auth/captcha)
    if echo "$response" | grep -q "captcha_id"; then
        echo "   ✅ 验证码API返回正确数据"
        echo "   示例: $(echo "$response" | head -c 100)..."
    else
        echo "   ❌ 验证码API返回异常数据"
    fi
else
    echo "   ❌ 后端API不可访问"
fi

echo ""

# 检查前端网站
echo "5. 检查前端网站..."
if curl -s --max-time 10 https://zhenyan.asia > /dev/null; then
    echo "   ✅ 前端网站可访问"
    
    # 检查是否使用了新的JS文件
    main_js=$(curl -s https://zhenyan.asia | grep -o 'static/js/main\.[^"]*\.js' | head -1)
    if [ -n "$main_js" ]; then
        echo "   当前JS文件: $main_js"
        
        # 检查JS文件中的API配置
        if curl -s "https://zhenyan.asia/$main_js" | grep -q "https://api.zhenyan.asia"; then
            echo "   ✅ 前端使用正确的API配置"
        else
            echo "   ❌ 前端仍使用旧的API配置"
        fi
    fi
else
    echo "   ❌ 前端网站不可访问"
fi

echo ""
echo "=================================="
echo "验证完成！"

# 提供部署建议
echo ""
echo "📋 部署建议："
echo "1. 确保后端服务运行在 localhost:8000"
echo "2. 确保 Cloudflare Tunnel 正常运行"
echo "3. 将 frontend/build 目录内容部署到 Cloudflare Pages"
echo "4. 清除浏览器缓存后测试验证码功能"
