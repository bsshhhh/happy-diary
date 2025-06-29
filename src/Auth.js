import React, { useState } from 'react';
import { signUp, signIn, logOut } from './authService';
import Popup from './Popup';
import './Auth.css';

function Auth({ onAuthSuccess, onSignupStart, onSignupComplete }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        // 로그인
        await signIn(email, password);
        onAuthSuccess();
      } else {
        // 회원가입
        setIsSigningUp(true);
        onSignupStart(); // 회원가입 시작 알림
        
        if (!displayName.trim()) {
          throw new Error('닉네임을 입력해주세요.');
        }
        if (password !== confirmPassword) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        
        await signUp(email, password, displayName);
        
        // 회원가입 후 자동 로그아웃 (Firebase가 자동 로그인하는 것을 방지)
        await logOut();
        
        // 잠시 대기하여 인증 상태 변경이 완료되도록 함
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 회원가입 성공 메시지 표시
        setSuccessMessage(`${displayName}님, 회원가입이 완료되었습니다! 로그인해주세요.`);
        setShowSuccessPopup(true);
        
        // 로그인 모드로 전환
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        
        setIsSigningUp(false);
        onSignupComplete(); // 회원가입 완료 알림
      }
    } catch (error) {
      setIsSigningUp(false);
      onSignupComplete(); // 에러 발생 시에도 완료 알림
      console.error('인증 오류:', error);
      let errorMessage = '오류가 발생했습니다.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바른 이메일 형식이 아닙니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호는 6자 이상이어야 합니다.';
          break;
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        case 'auth/user-disabled':
          errorMessage = '비활성화된 계정입니다.';
          break;
        case 'auth/invalid-credential':
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '이 로그인 방법은 현재 허용되지 않습니다.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = '보안을 위해 다시 로그인해주세요.';
          break;
        default:
          // Firebase 에러가 아닌 경우 원본 메시지 사용
          if (error.message && !error.message.includes('Firebase')) {
            errorMessage = error.message;
          } else {
            errorMessage = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
          }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Happy Diary 🌟</h2>
        <p className="auth-subtitle">
          {isLogin ? '로그인하여 행복한 순간을 기록하세요' : '회원가입하여 시작하세요'}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>닉네임</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="닉네임을 입력하세요"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>
          
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required={!isLogin}
              />
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              type="button"
              onClick={handleSwitchMode}
              className="switch-button"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
      
      {/* 성공 팝업 */}
      <Popup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="회원가입 완료! 🎉"
        message={successMessage}
        type="success"
      />
    </div>
  );
}

export default Auth; 