import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  signInAnonymously
} from 'firebase/auth';
import { auth } from './firebase';

// 회원가입
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 사용자 프로필 업데이트 (닉네임 설정)
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    return userCredential.user;
  } catch (error) {
    console.error('회원가입 중 오류:', error);
    throw error;
  }
};

// 로그인
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('로그인 중 오류:', error);
    throw error;
  }
};

// 비회원(익명) 로그인
export const signInAsGuest = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('비회원(익명) 로그인 중 오류:', error);
    throw error;
  }
};

// 로그아웃
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    throw error;
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
}; 