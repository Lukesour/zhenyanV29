import { getApiBaseUrl } from '../config';

interface UserProfileData {
  undergraduate_university?: string;
  undergraduate_major?: string;
  gpa?: number;
  gpa_scale?: string;
  graduation_year?: number;
  language_test_type?: string;
  language_total_score?: number;
  language_reading?: number;
  language_listening?: number;
  language_speaking?: number;
  language_writing?: number;
  gre_total?: number;
  gre_verbal?: number;
  gre_quantitative?: number;
  gre_writing?: number;
  gmat_total?: number;
  target_countries?: string[];
  target_majors?: string[];
  target_degree_type?: string;
  research_experiences?: any[];
  internship_experiences?: any[];
  other_experiences?: any[];
}

interface UserInfo {
  id: number;
  phone: string;
  email: string;
  status: string;
  remaining_analyses: number;
  total_analyses_used: number;
  invitation_code: string;
  invited_count: number;
  created_at: string;
  last_login_at?: string;
  profile_data?: UserProfileData;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: UserInfo;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // 从本地存储初始化认证状态
  private initializeFromStorage(): void {
    try {
      const token = localStorage.getItem('access_token');
      const userInfo = localStorage.getItem('user_info');

      if (token && userInfo) {
        const user = JSON.parse(userInfo);
        this.authState = {
          isAuthenticated: true,
          user,
          token
        };
      }
    } catch (error) {
      console.error('Failed to initialize auth state from storage:', error);
      this.clearAuthState();
    }
  }

  // 添加状态监听器
  public addListener(listener: (state: AuthState) => void): void {
    this.listeners.push(listener);
  }

  // 移除状态监听器
  public removeListener(listener: (state: AuthState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // 获取当前认证状态
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  // 获取当前用户信息
  public getCurrentUser(): UserInfo | null {
    return this.authState.user;
  }

  // 获取访问令牌
  public getAccessToken(): string | null {
    return this.authState.token;
  }

  // 检查是否已认证
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  // 设置认证状态
  public setAuthState(loginResponse: LoginResponse): void {
    this.authState = {
      isAuthenticated: true,
      user: loginResponse.user_info,
      token: loginResponse.access_token
    };

    // 保存到本地存储
    localStorage.setItem('access_token', loginResponse.access_token);
    localStorage.setItem('user_info', JSON.stringify(loginResponse.user_info));

    this.notifyListeners();
  }

  // 清除认证状态
  public clearAuthState(): void {
    console.log('authService: clearAuthState() 被调用'); // 调试日志

    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };

    // 清除本地存储
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    console.log('authService: localStorage 已清除'); // 调试日志

    this.notifyListeners();
    console.log('authService: 监听器已通知'); // 调试日志
  }

  // 更新用户信息
  public updateUserInfo(userInfo: Partial<UserInfo>): void {
    if (this.authState.user) {
      this.authState.user = { ...this.authState.user, ...userInfo };
      localStorage.setItem('user_info', JSON.stringify(this.authState.user));
      this.notifyListeners();
    }
  }

  // 发送验证码
  public async sendVerificationCode(email: string, phone: string): Promise<boolean> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return false;
    }
  }

  // 用户注册
  public async register(
    phone: string,
    email: string,
    verificationCode: string,
    invitationCode?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          email,
          verification_code: verificationCode,
          invitation_code: invitationCode || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthState(data);
        return { success: true };
      } else {
        return { success: false, message: data.detail || '注册失败' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: '网络错误，请稍后重试' };
    }
  }

  // 用户登录
  public async login(
    phone: string,
    verificationCode: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthState(data);
        return { success: true };
      } else {
        return { success: false, message: data.detail || '登录失败' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: '网络错误，请稍后重试' };
    }
  }

  // 用户登出
  public async logout(): Promise<void> {
    console.log('authService: logout() 被调用'); // 调试日志

    try {
      // 如果有token，先调用后端退出登录API
      if (this.authState.token) {
        console.log('authService: 发现token，调用后端API'); // 调试日志
        const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authState.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('authService: 后端退出登录成功');
        } else {
          console.warn('authService: 后端退出登录失败，但仍会清除本地状态');
        }
      } else {
        console.log('authService: 没有token，直接清除本地状态'); // 调试日志
      }
    } catch (error) {
      console.error('authService: 调用后端退出登录API失败:', error);
      // 即使后端调用失败，也要清除本地状态
    } finally {
      console.log('authService: 开始清除本地认证状态'); // 调试日志
      // 无论后端调用是否成功，都要清除本地认证状态
      this.clearAuthState();
      console.log('authService: 本地认证状态已清除'); // 调试日志
    }
  }

  // 刷新用户信息
  public async refreshUserInfo(): Promise<boolean> {
    try {
      if (!this.authState.token) {
        return false;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/auth/user-info`, {
        headers: {
          'Authorization': `Bearer ${this.authState.token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        this.updateUserInfo(userInfo);
        return true;
      } else if (response.status === 401) {
        // 令牌无效，清除认证状态
        this.clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }

    return false;
  }

  // 刷新访问令牌
  public async refreshToken(): Promise<boolean> {
    try {
      if (!this.authState.token) {
        return false;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authState.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.authState.token = data.access_token;
        localStorage.setItem('access_token', data.access_token);
        this.notifyListeners();
        return true;
      } else if (response.status === 401) {
        // 令牌无效，清除认证状态
        this.clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }

    return false;
  }

  // 获取分析统计信息
  public async getAnalysisStats(): Promise<any> {
    try {
      if (!this.authState.token) {
        throw new Error('未登录');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/auth/analysis-stats`, {
        headers: {
          'Authorization': `Bearer ${this.authState.token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        this.clearAuthState();
        throw new Error('登录已过期，请重新登录');
      } else {
        throw new Error('获取统计信息失败');
      }
    } catch (error) {
      console.error('Failed to get analysis stats:', error);
      throw error;
    }
  }

  // 获取邀请信息
  public async getInvitationInfo(): Promise<any> {
    try {
      if (!this.authState.token) {
        throw new Error('未登录');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/auth/invitation-info`, {
        headers: {
          'Authorization': `Bearer ${this.authState.token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        this.clearAuthState();
        throw new Error('登录已过期，请重新登录');
      } else {
        throw new Error('获取邀请信息失败');
      }
    } catch (error) {
      console.error('Failed to get invitation info:', error);
      throw error;
    }
  }
}

export default AuthService.getInstance();
export type { UserInfo, LoginResponse, AuthState };
