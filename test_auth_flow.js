// 测试认证流程的脚本
// 这个脚本可以在浏览器控制台中运行来测试问题

console.log('开始测试认证流程...');

// 模拟用户背景数据
const testUserBackground = {
  undergraduate_university: "北京大学",
  undergraduate_major: "计算机科学与技术",
  gpa: 3.8,
  target_countries: ["美国", "英国"],
  target_majors: ["计算机科学", "人工智能"],
  language_scores: {
    toefl: 110,
    ielts: null,
    gre: 330,
    gmat: null
  },
  work_experience: "2年软件开发经验",
  research_experience: "参与过机器学习项目",
  extracurricular_activities: "学生会主席",
  awards: "国家奖学金",
  personal_statement: "希望在AI领域深造"
};

// 测试步骤
console.log('1. 模拟填写表单并提交（未登录状态）');
console.log('用户背景数据:', testUserBackground);

console.log('2. 应该跳转到认证页面，并保存用户背景数据');

console.log('3. 用户完成登录/注册');

console.log('4. 应该自动开始分析，而不是返回表单页面');

console.log('测试完成。请在实际界面中验证这个流程。');

// 检查当前页面状态的函数
function checkCurrentState() {
  const currentStep = document.querySelector('[data-testid="current-step"]');
  const progressDisplay = document.querySelector('.ant-progress');
  const authForm = document.querySelector('.auth-form');
  const userForm = document.querySelector('.user-form');
  
  console.log('当前页面状态检查:');
  console.log('- 进度条存在:', !!progressDisplay);
  console.log('- 认证表单存在:', !!authForm);
  console.log('- 用户表单存在:', !!userForm);
  
  return {
    hasProgress: !!progressDisplay,
    hasAuthForm: !!authForm,
    hasUserForm: !!userForm
  };
}

// 导出检查函数供手动调用
window.checkCurrentState = checkCurrentState;

console.log('可以调用 checkCurrentState() 来检查当前页面状态');
