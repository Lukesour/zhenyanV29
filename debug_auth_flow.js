// 调试认证流程的脚本
// 在浏览器控制台中运行此脚本来监控状态变化

console.log('🔍 开始监控认证流程...');

// 保存原始的 console.log 函数
const originalLog = console.log;

// 创建一个增强的日志函数
function enhancedLog(...args) {
  const timestamp = new Date().toLocaleTimeString();
  originalLog(`[${timestamp}]`, ...args);
}

// 替换 console.log
console.log = enhancedLog;

// 监控状态变化的函数
function monitorStateChanges() {
  let lastStep = null;
  let lastUserBackground = null;
  
  const checkState = () => {
    // 尝试从页面元素中获取当前状态
    const progressElement = document.querySelector('.ant-progress');
    const authForm = document.querySelector('.auth-form');
    const userForm = document.querySelector('[class*="user-form"], form');
    
    let currentStep = 'unknown';
    if (progressElement) currentStep = 'progress';
    else if (authForm) currentStep = 'auth';
    else if (userForm) currentStep = 'form';
    
    // 检查状态变化
    if (currentStep !== lastStep) {
      console.log(`🔄 页面状态变化: ${lastStep} → ${currentStep}`);
      lastStep = currentStep;
    }
    
    // 检查 localStorage 中的用户信息
    const userInfo = localStorage.getItem('user_info');
    const accessToken = localStorage.getItem('access_token');
    
    if (userInfo && accessToken && currentStep === 'form') {
      console.log('⚠️  警告: 用户已登录但显示表单页面');
      console.log('用户信息:', JSON.parse(userInfo));
    }
  };
  
  // 每500ms检查一次状态
  setInterval(checkState, 500);
  
  console.log('✅ 状态监控已启动');
}

// 测试函数
function testAuthFlow() {
  console.log('🧪 开始测试认证流程');
  
  // 检查当前页面状态
  const currentState = {
    hasProgress: !!document.querySelector('.ant-progress'),
    hasAuthForm: !!document.querySelector('.auth-form'),
    hasUserForm: !!document.querySelector('form'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    userInfo: localStorage.getItem('user_info')
  };
  
  console.log('当前页面状态:', currentState);
  
  if (currentState.isAuthenticated) {
    console.log('✅ 用户已认证');
    console.log('用户信息:', JSON.parse(currentState.userInfo || '{}'));
  } else {
    console.log('❌ 用户未认证');
  }
  
  return currentState;
}

// 清除认证状态的函数（用于测试）
function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  console.log('🧹 认证状态已清除');
  location.reload();
}

// 模拟用户背景数据
const mockUserBackground = {
  undergraduate_university: "测试大学",
  undergraduate_major: "计算机科学",
  gpa: 3.8,
  target_countries: ["美国"],
  target_majors: ["人工智能"],
  language_scores: {
    toefl: 100,
    ielts: null,
    gre: 320,
    gmat: null
  }
};

// 导出函数到全局作用域
window.monitorStateChanges = monitorStateChanges;
window.testAuthFlow = testAuthFlow;
window.clearAuth = clearAuth;
window.mockUserBackground = mockUserBackground;

console.log('🛠️  调试工具已加载');
console.log('可用命令:');
console.log('- monitorStateChanges(): 开始监控状态变化');
console.log('- testAuthFlow(): 测试当前认证状态');
console.log('- clearAuth(): 清除认证状态');
console.log('- mockUserBackground: 模拟用户背景数据');

// 自动开始监控
monitorStateChanges();
