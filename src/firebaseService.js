import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';

// 사용자별 컬렉션 이름 생성
const getUserCollection = (userId) => `users/${userId}/diary_entries`;

// 현재 사용자의 컬렉션 가져오기
const getCurrentUserCollection = () => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }
  return getUserCollection(user.uid);
};

// 새로운 일기 항목 추가
export const addDiaryEntry = async (entry) => {
  try {
    const userCollection = getCurrentUserCollection();
    const docRef = await addDoc(collection(db, userCollection), {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...entry };
  } catch (error) {
    console.error('일기 항목 추가 중 오류:', error);
    throw error;
  }
};

// 모든 일기 항목 가져오기 (날짜순 정렬)
export const getAllDiaryEntries = async () => {
  try {
    const userCollection = getCurrentUserCollection();
    const q = query(
      collection(db, userCollection), 
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    return entries;
  } catch (error) {
    console.error('일기 항목 가져오기 중 오류:', error);
    throw error;
  }
};

// 특정 날짜의 일기 항목 가져오기
export const getDiaryEntryByDate = async (date) => {
  try {
    const userCollection = getCurrentUserCollection();
    const q = query(
      collection(db, userCollection), 
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('특정 날짜 일기 항목 가져오기 중 오류:', error);
    throw error;
  }
};

// 일기 항목 업데이트
export const updateDiaryEntry = async (id, updatedEntry) => {
  try {
    const userCollection = getCurrentUserCollection();
    const docRef = doc(db, userCollection, id);
    await updateDoc(docRef, {
      ...updatedEntry,
      updatedAt: serverTimestamp()
    });
    return { id, ...updatedEntry };
  } catch (error) {
    console.error('일기 항목 업데이트 중 오류:', error);
    throw error;
  }
};

// 일기 항목 삭제
export const deleteDiaryEntry = async (id) => {
  try {
    const userCollection = getCurrentUserCollection();
    const docRef = doc(db, userCollection, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error('일기 항목 삭제 중 오류:', error);
    throw error;
  }
};

// 특정 날짜의 일기 항목 삭제
export const deleteDiaryEntryByDate = async (date) => {
  try {
    const entry = await getDiaryEntryByDate(date);
    if (entry) {
      await deleteDiaryEntry(entry.id);
      return entry.id;
    }
    return null;
  } catch (error) {
    console.error('날짜별 일기 항목 삭제 중 오류:', error);
    throw error;
  }
};

// 실시간 데이터 동기화 (새로 추가)
export const subscribeToDiaryEntries = (callback) => {
  try {
    const userCollection = getCurrentUserCollection();
    const q = query(
      collection(db, userCollection), 
      orderBy('date', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      callback(entries);
    }, (error) => {
      console.error('실시간 데이터 동기화 중 오류:', error);
    });
  } catch (error) {
    console.error('실시간 동기화 설정 중 오류:', error);
  }
};

// 행복 분석 결과 저장
export const saveHappinessAnalysis = async (analysis) => {
  try {
    const userCollection = getCurrentUserCollection();
    const analysisRef = collection(db, `${userCollection}_analysis`);
    
    // 기존 분석 결과가 있으면 업데이트, 없으면 새로 생성
    const existingQuery = query(analysisRef);
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // 기존 문서 업데이트
      const docRef = doc(db, `${userCollection}_analysis`, existingSnapshot.docs[0].id);
      await updateDoc(docRef, {
        analysis: analysis,
        updatedAt: serverTimestamp()
      });
    } else {
      // 새 문서 생성
      await addDoc(analysisRef, {
        analysis: analysis,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('행복 분석 결과 저장 중 오류:', error);
    throw error;
  }
};

// 행복 분석 결과 불러오기
export const getHappinessAnalysis = async () => {
  try {
    const userCollection = getCurrentUserCollection();
    const analysisRef = collection(db, `${userCollection}_analysis`);
    const q = query(analysisRef);
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data().analysis;
    }
    return null;
  } catch (error) {
    console.error('행복 분석 결과 불러오기 중 오류:', error);
    throw error;
  }
}; 