#!/bin/bash

# 批量修复API导入和调用的脚本

echo "开始修复API导入和调用..."

# 需要修复的文件列表
files=(
    "frontend/src/components/AuthForm.tsx"
    "frontend/src/components/SystemTest.tsx"
    "frontend/src/components/DebugPanel.tsx"
    "frontend/src/components/UserDashboard.tsx"
    "frontend/src/services/authService.ts"
    "frontend/src/services/api.ts"
)

# 修复每个文件
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "修复文件: $file"
        
        # 替换导入语句
        sed -i '' 's/import { API_BASE_URL } from/import { getApiBaseUrl } from/g' "$file"
        
        # 替换使用语句
        sed -i '' 's/${API_BASE_URL}/${getApiBaseUrl()}/g' "$file"
        
        echo "  ✅ 完成"
    else
        echo "  ❌ 文件不存在: $file"
    fi
done

echo "所有文件修复完成！"
