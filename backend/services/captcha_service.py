import random
import string
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import hashlib

logger = logging.getLogger(__name__)

class CaptchaService:
    """简单的CAPTCHA验证服务"""
    
    def __init__(self):
        # 内存存储CAPTCHA，生产环境建议使用Redis
        self.captcha_cache: Dict[str, Dict] = {}
        self.cleanup_interval = timedelta(minutes=10)  # 10分钟过期
    
    def generate_captcha(self, session_id: str) -> Dict[str, str]:
        """
        生成CAPTCHA
        
        Args:
            session_id: 会话ID，用于标识用户
            
        Returns:
            包含CAPTCHA问题和答案ID的字典
        """
        try:
            # 生成简单的数学题
            num1 = random.randint(1, 20)
            num2 = random.randint(1, 20)
            operation = random.choice(['+', '-'])
            
            if operation == '+':
                question = f"{num1} + {num2} = ?"
                answer = num1 + num2
            else:
                # 确保减法结果为正数
                if num1 < num2:
                    num1, num2 = num2, num1
                question = f"{num1} - {num2} = ?"
                answer = num1 - num2
            
            # 生成CAPTCHA ID
            captcha_id = self._generate_captcha_id()
            
            # 存储CAPTCHA信息
            self.captcha_cache[captcha_id] = {
                'session_id': session_id,
                'question': question,
                'answer': str(answer),
                'created_at': datetime.utcnow(),
                'expires_at': datetime.utcnow() + self.cleanup_interval,
                'attempts': 0,
                'max_attempts': 3
            }
            
            # 清理过期的CAPTCHA
            self._cleanup_expired_captchas()
            
            logger.info(f"生成CAPTCHA: {captcha_id} for session: {session_id}")
            
            return {
                'captcha_id': captcha_id,
                'question': question
            }
            
        except Exception as e:
            logger.error(f"生成CAPTCHA失败: {str(e)}")
            raise Exception("CAPTCHA生成失败")
    
    def verify_captcha(self, captcha_id: str, answer: str, session_id: str) -> bool:
        """
        验证CAPTCHA
        
        Args:
            captcha_id: CAPTCHA ID
            answer: 用户输入的答案
            session_id: 会话ID
            
        Returns:
            验证是否成功
        """
        try:
            if captcha_id not in self.captcha_cache:
                logger.warning(f"CAPTCHA不存在: {captcha_id}")
                return False
            
            captcha_data = self.captcha_cache[captcha_id]
            
            # 检查会话ID
            if captcha_data['session_id'] != session_id:
                logger.warning(f"CAPTCHA会话ID不匹配: {captcha_id}")
                return False
            
            # 检查是否过期
            if datetime.utcnow() > captcha_data['expires_at']:
                logger.warning(f"CAPTCHA已过期: {captcha_id}")
                del self.captcha_cache[captcha_id]
                return False
            
            # 检查尝试次数
            if captcha_data['attempts'] >= captcha_data['max_attempts']:
                logger.warning(f"CAPTCHA尝试次数超限: {captcha_id}")
                del self.captcha_cache[captcha_id]
                return False
            
            # 增加尝试次数
            captcha_data['attempts'] += 1
            
            # 验证答案
            if str(answer).strip() == captcha_data['answer']:
                logger.info(f"CAPTCHA验证成功: {captcha_id}")
                # 验证成功后删除CAPTCHA
                del self.captcha_cache[captcha_id]
                return True
            else:
                logger.warning(f"CAPTCHA答案错误: {captcha_id}, 期望: {captcha_data['answer']}, 实际: {answer}")
                return False
                
        except Exception as e:
            logger.error(f"验证CAPTCHA失败: {str(e)}")
            return False
    
    def _generate_captcha_id(self) -> str:
        """生成CAPTCHA ID"""
        timestamp = str(int(datetime.utcnow().timestamp() * 1000))
        random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        raw_id = f"{timestamp}_{random_str}"
        return hashlib.md5(raw_id.encode()).hexdigest()[:16]
    
    def _cleanup_expired_captchas(self):
        """清理过期的CAPTCHA"""
        try:
            current_time = datetime.utcnow()
            expired_ids = [
                captcha_id for captcha_id, data in self.captcha_cache.items()
                if current_time > data['expires_at']
            ]
            
            for captcha_id in expired_ids:
                del self.captcha_cache[captcha_id]
            
            if expired_ids:
                logger.info(f"清理了 {len(expired_ids)} 个过期CAPTCHA")
                
        except Exception as e:
            logger.error(f"清理过期CAPTCHA失败: {str(e)}")
    
    def get_captcha_stats(self) -> Dict:
        """获取CAPTCHA统计信息"""
        return {
            'total_captchas': len(self.captcha_cache),
            'active_sessions': len(set(data['session_id'] for data in self.captcha_cache.values()))
        }

# 创建全局实例
captcha_service = CaptchaService()
