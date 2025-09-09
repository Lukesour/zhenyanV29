# 用户个人信息功能配置指南

## 概述

本功能实现了用户注册时保存个人信息表单数据，登录时自动填入的完整流程。

## 功能特性

1. **注册时保存个人信息**：用户在填写个人信息表单后进行注册时，个人信息会自动保存到数据库
2. **登录时自动填入**：用户登录后，系统会自动获取并填入之前保存的个人信息
3. **数据完整性**：支持完整的个人信息数据，包括学术背景、语言成绩、标准化考试成绩、目标信息和经历信息

## 数据库配置

### 1. 在Supabase中执行SQL

请在您的Supabase控制台的SQL编辑器中执行以下SQL语句来创建用户个人信息表：

```sql
-- 创建用户个人信息表
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- 学术背景
    undergraduate_university VARCHAR(255),
    undergraduate_major VARCHAR(255),
    gpa DECIMAL(4,2),
    gpa_scale VARCHAR(10),
    graduation_year INTEGER,
    
    -- 语言成绩
    language_test_type VARCHAR(20), -- TOEFL, IELTS
    language_total_score DECIMAL(5,1),
    language_reading DECIMAL(5,1),
    language_listening DECIMAL(5,1),
    language_speaking DECIMAL(5,1),
    language_writing DECIMAL(5,1),
    
    -- 标准化考试成绩
    gre_total INTEGER,
    gre_verbal INTEGER,
    gre_quantitative INTEGER,
    gre_writing DECIMAL(3,1),
    gmat_total INTEGER,
    
    -- 目标信息
    target_countries JSONB, -- 数组格式
    target_majors JSONB, -- 数组格式
    target_degree_type VARCHAR(20), -- Master, PhD
    
    -- 经历信息
    research_experiences JSONB, -- 数组格式，包含详细信息
    internship_experiences JSONB, -- 数组格式，包含详细信息
    other_experiences JSONB, -- 数组格式，包含详细信息
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_undergraduate_university ON user_profiles(undergraduate_university);
CREATE INDEX IF NOT EXISTS idx_user_profiles_target_degree_type ON user_profiles(target_degree_type);

-- 创建触发器以自动更新updated_at字段
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. 验证表创建

执行以下查询来验证表是否创建成功：

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

## 使用流程

### 1. 用户注册流程

1. 用户填写个人信息表单
2. 用户点击"开始分析"按钮
3. 如果用户未登录，跳转到认证页面
4. 用户在认证页面注册新账号
5. 注册成功后，个人信息自动保存到数据库
6. 用户被重定向回表单页面，开始分析

### 2. 用户登录流程

1. 用户在认证页面登录
2. 登录成功后，系统获取用户的个人信息
3. 用户被重定向到表单页面
4. 表单自动填入之前保存的个人信息
5. 用户可以修改信息或直接开始分析

## 技术实现

### 后端变更

1. **数据模型**：
   - 添加了 `UserProfileData` 模型用于API传输
   - 添加了 `UserProfile` 数据库模型
   - 更新了 `UserRegisterRequest` 包含个人信息字段
   - 更新了 `UserInfo` 响应模型包含个人信息字段

2. **服务层**：
   - 在 `UserService` 中添加了 `save_user_profile()` 和 `get_user_profile()` 方法
   - 修改了 `register_user()` 方法支持保存个人信息
   - 修改了 `login_user()` 和 `get_user_info()` 方法返回个人信息

3. **API层**：
   - 修改了注册接口传递个人信息数据
   - 登录接口自动返回个人信息

### 前端变更

1. **组件更新**：
   - 修改了 `AuthForm` 组件接收并发送个人信息数据
   - 修改了 `UserForm` 组件监听认证状态变化并自动填入数据
   - 更新了 `App.tsx` 传递用户背景数据到认证组件

2. **类型定义**：
   - 更新了 `UserInfo` 接口包含 `profile_data` 字段
   - 添加了 `UserProfileData` 接口定义

## 测试

运行测试脚本来验证功能：

```bash
python test_profile_feature.py
```

## 注意事项

1. **数据隐私**：个人信息数据敏感，确保数据库访问权限配置正确
2. **数据完整性**：所有个人信息字段都是可选的，系统会优雅处理空值
3. **性能考虑**：个人信息数据使用JSONB格式存储复杂结构，查询时注意性能
4. **向后兼容**：现有用户登录时如果没有个人信息，系统会正常工作，不会报错

## 故障排除

如果遇到问题，请检查：

1. Supabase数据库表是否正确创建
2. 后端服务是否能正常连接数据库
3. 前端是否正确传递个人信息数据
4. 查看浏览器控制台和后端日志获取详细错误信息
