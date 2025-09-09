// 前端退出登录功能测试脚本
// 在浏览器控制台中运行此脚本

console.log('=== 前端退出登录功能测试 ===');

// 1. 检查当前localStorage状态
function checkLocalStorage() {
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');
    
    console.log('当前localStorage状态:');
    console.log('- Token:', token ? `存在 (${token.substring(0, 30)}...)` : '不存在');
    console.log('- 用户信息:', userInfo ? '存在' : '不存在');
    
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            console.log('- 用户详情:', user);
        } catch (e) {
            console.log('- 用户信息解析失败');
        }
    }
    
    return { token, userInfo };
}

// 2. 模拟登录状态
function simulateLogin() {
    console.log('\n--- 模拟登录状态 ---');
    
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MzE0MjM2MDAsImlhdCI6MTczMTQyMDAwMH0.mock_signature_for_testing';
    const mockUserInfo = {
        id: 1,
        phone: '13800138000',
        email: 'test@example.com',
        status: 'active',
        remaining_analyses: 3,
        total_analyses_used: 0,
        invitation_code: 'TEST123',
        invited_count: 0
    };

    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('user_info', JSON.stringify(mockUserInfo));
    
    console.log('✅ 模拟登录完成');
    checkLocalStorage();
}

// 3. 测试退出登录API
async function testLogoutAPI() {
    console.log('\n--- 测试退出登录API ---');
    
    try {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('使用token调用API');
        } else {
            console.log('无token调用API');
        }

        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: headers,
        });

        const data = await response.json();
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', data);

        if (response.ok && data.success) {
            console.log('✅ 退出登录API调用成功');
            return true;
        } else {
            console.log('❌ 退出登录API调用失败');
            return false;
        }
        
    } catch (error) {
        console.log('❌ 退出登录API测试失败:', error.message);
        return false;
    }
}

// 4. 测试完整的退出登录流程
async function testCompleteLogout() {
    console.log('\n--- 测试完整退出登录流程 ---');
    
    try {
        // 确保有登录状态
        let { token } = checkLocalStorage();
        if (!token) {
            console.log('没有登录状态，先模拟登录');
            simulateLogin();
        }
        
        // 调用退出登录API
        console.log('步骤1: 调用后端退出登录API...');
        const apiSuccess = await testLogoutAPI();
        
        if (apiSuccess) {
            // 清除本地存储
            console.log('步骤2: 清除本地存储...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
            
            // 验证清除结果
            console.log('步骤3: 验证清除结果...');
            const { token: tokenAfter, userInfo: userAfter } = checkLocalStorage();
            
            if (!tokenAfter && !userAfter) {
                console.log('✅ 完整退出登录测试成功！');
                console.log('- 后端API调用成功');
                console.log('- 本地存储已清除');
                console.log('- 用户状态已重置');
                return true;
            } else {
                console.log('❌ 本地存储清除失败');
                return false;
            }
        } else {
            console.log('❌ 后端API调用失败');
            return false;
        }
        
    } catch (error) {
        console.log('❌ 完整退出登录测试失败:', error.message);
        return false;
    }
}

// 5. 测试前端authService（如果可用）
function testAuthService() {
    console.log('\n--- 测试前端authService ---');
    
    // 检查是否有全局的authService
    if (typeof window !== 'undefined' && window.authService) {
        console.log('找到全局authService');
        
        // 测试logout方法
        if (typeof window.authService.logout === 'function') {
            console.log('authService.logout方法存在');
            
            // 调用logout
            window.authService.logout().then(() => {
                console.log('✅ authService.logout调用成功');
                checkLocalStorage();
            }).catch((error) => {
                console.log('❌ authService.logout调用失败:', error);
            });
        } else {
            console.log('authService.logout方法不存在');
        }
    } else {
        console.log('未找到全局authService，这是正常的（React应用中authService通常不是全局的）');
    }
}

// 6. 运行所有测试
async function runAllTests() {
    console.log('🚀 开始运行所有退出登录测试...\n');
    
    // 初始状态检查
    console.log('=== 初始状态检查 ===');
    checkLocalStorage();
    
    // 测试1: 模拟登录
    simulateLogin();
    
    // 测试2: API测试
    await testLogoutAPI();
    
    // 测试3: 完整流程测试
    await testCompleteLogout();
    
    // 测试4: authService测试
    testAuthService();
    
    console.log('\n🎉 所有测试完成！');
    console.log('\n使用说明:');
    console.log('1. 在浏览器中打开 http://localhost:3000');
    console.log('2. 打开开发者工具控制台');
    console.log('3. 粘贴并运行此脚本');
    console.log('4. 或者单独运行各个测试函数');
}

// 导出测试函数供单独调用
if (typeof window !== 'undefined') {
    window.logoutTests = {
        checkLocalStorage,
        simulateLogin,
        testLogoutAPI,
        testCompleteLogout,
        testAuthService,
        runAllTests
    };
    
    console.log('测试函数已添加到 window.logoutTests');
    console.log('可以调用 window.logoutTests.runAllTests() 运行所有测试');
}

// 如果直接运行，执行所有测试
if (typeof window !== 'undefined') {
    runAllTests();
}
