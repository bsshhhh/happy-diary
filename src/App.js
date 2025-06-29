import React, { useState, useEffect } from 'react';
import './App.css';
import { getGeminiFeedback, getHappinessAnalysis } from './gemini';
import { 
  getAllDiaryEntries, 
  addDiaryEntry, 
  updateDiaryEntry, 
  deleteDiaryEntryByDate,
  getDiaryEntryByDate
} from './firebaseService';
import { onAuthStateChange, logOut, getCurrentUser } from './authService';
import Auth from './Auth';

// 행복 모먼트 예시 플레이스홀더 문장들
const examplePlaceholders = [
  "햇살 좋은 날 산책하며 콧노래를 흥얼거렸을 때",
  "오랜만에 친구와 맛있는 음식을 먹으며 수다 떨었을 때",
  "좋아하는 드라마의 마지막 회를 드디어 봤을 때",
  "새로운 취미를 시작해서 성취감을 느꼈을 때",
  "뜻밖의 칭찬을 들어 기분 좋았을 때",
  "따뜻한 이불 속에서 푹 잘 수 있었을 때",
  "작은 목표를 달성하고 스스로 뿌듯했을 때",
  "좋아하는 음악을 들으며 나만의 시간을 가졌을 때"
];

// 글자 수 제한
const MAX_CHAR_LIMIT = 30;

// 🚫 부적절한 내용 필터링을 위한 키워드 목록 (예시)
// 이 목록은 더욱 확장하거나 정교하게 만들 수 있습니다.
// const inappropriateKeywords = [
//   "개새끼", "씨발", "좆같은", "병신", "지랄", "닥쳐",
//   "죽어", "살인", "폭력", "자살",
//   "성적인", "음란", "포르노", "섹스",
//   "혐오", "차별", "인종", "종교", "정치적",
//   "쓰레기", "짜증나", "최악", "싫어"
// ];

// 입력된 텍스트에 부적절한 키워드가 포함되어 있는지 확인하는 헬퍼 함수
// const containsInappropriateContent = (text) => {
//   if (!text) return false;
//   const lowerText = text.toLowerCase();
//   return inappropriateKeywords.some(keyword => lowerText.includes(keyword));
// };

function App() {
  const [entries, setEntries] = useState([
    '', '', ''
  ]);
  const [diaryList, setDiaryList] = useState([]);
  const [aiFeedback, setAIFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [happinessAnalysisResult, setHappinessAnalysisResult] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [happinessSummary, setHappinessSummary] = useState(''); // 키워드 기능 제거: 단순 문자열로 변경
  const [summaryLoading, setSummaryLoading] = useState(false);
  // 새로운 상태 추가: 더보기 버튼을 위한 상태
  const [showAllMoments, setShowAllMoments] = useState(false);
  // 랜덤 placeholder를 위한 상태 추가
  const [randomPlaceholders, setRandomPlaceholders] = useState([]);
  // 인증 상태 추가
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignupInProgress, setIsSignupInProgress] = useState(false);

  // 날짜 포맷 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user);
      
      // 회원가입 중일 때는 인증 상태 변경을 무시
      if (isSignupInProgress) {
        console.log('Ignoring auth state change during signup');
        return;
      }
      
      if (user) {
        // 사용자 정보 새로고침 시도
        try {
          await user.reload();
          const updatedUser = getCurrentUser();
          console.log('Updated user info:', updatedUser);
          setUser(updatedUser);
        } catch (error) {
          console.error('User reload failed:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isSignupInProgress]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logOut();
      setDiaryList([]);
      setEntries(['', '', '']);
      setAIFeedback('');
      setHappinessAnalysisResult('');
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  };

  // 랜덤 placeholder 생성 함수
  const generateRandomPlaceholders = () => {
    const shuffled = [...examplePlaceholders].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  // 컴포넌트 마운트 시 랜덤 placeholder 생성
  useEffect(() => {
    setRandomPlaceholders(generateRandomPlaceholders());
  }, []);

  // Firebase에서 기록 불러오기 및 선택된 날짜에 맞춰 UI 업데이트
  useEffect(() => {
    const loadDiaryEntries = async () => {
      try {
        const entries = await getAllDiaryEntries();
        
        // Firebase에 데이터가 없고 localStorage에 데이터가 있으면 마이그레이션
        if (entries.length === 0) {
          const saved = localStorage.getItem('happyDiary');
          if (saved) {
            const localData = JSON.parse(saved);
            if (localData.length > 0) {
              console.log('localStorage 데이터를 Firebase로 마이그레이션 중...');
              
              // localStorage 데이터를 Firebase로 마이그레이션
              for (const entry of localData) {
                if (entry && entry.date && entry.items) {
                  try {
                    await addDiaryEntry({
                      date: entry.date,
                      items: entry.items,
                      aiFeedback: entry.aiFeedback || ''
                    });
                    console.log(`${entry.date} 데이터 마이그레이션 완료`);
                  } catch (error) {
                    console.error(`${entry.date} 마이그레이션 실패:`, error);
                  }
                }
              }
              
              // 마이그레이션 후 데이터 다시 로드
              const migratedEntries = await getAllDiaryEntries();
              setDiaryList(migratedEntries);
              
              alert('기존 데이터가 Firebase로 성공적으로 마이그레이션되었습니다! 🎉');
            }
          }
        } else {
          setDiaryList(entries);
        }

        // 선택된 날짜의 기록을 찾아 입력 폼과 AI 피드백에 반영
        const currentEntry = entries.find(d => d.date === selectedDate);
        if (currentEntry) {
          setEntries(currentEntry.items);
          setAIFeedback(currentEntry.aiFeedback || '');
        } else {
          setEntries(['', '', '']);
          setAIFeedback('');
        }

        // ✅ 행복 분석 결과 불러오기 (localStorage에서)
        const savedAnalysis = localStorage.getItem('happinessAnalysisResult');
        if (savedAnalysis) {
          setHappinessAnalysisResult(savedAnalysis);
        }
      } catch (error) {
        console.error('Firebase에서 데이터 불러오기 중 오류:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };

    loadDiaryEntries();
  }, [selectedDate]);

  // 기록 저장
  const handleSave = async () => {
    if (entries.every(e => !e.trim())) {
      alert('최소 한 가지 행복한 모먼트를 입력해 주세요!');
      return;
    }

    const selectedDateExists = diaryList.some(d => d.date === selectedDate);
    if (selectedDateExists) {
      const confirmReplace = window.confirm(`선택된 날짜(${selectedDate})에 이미 행복한 모먼트를 작성하셨어요! 지금 작성하신 모먼트로 변경하시겠어요?`);
      if (!confirmReplace) return;
    }

    setLoading(true);
    setAIFeedback('');
    setHappinessAnalysisResult(''); // 이전 분석 결과 초기화

    try {
      const feedback = await getGeminiFeedback(entries);
      setAIFeedback(feedback);
      
      const newEntry = {
        date: selectedDate,
        items: [...entries],
        aiFeedback: feedback
      };

      if (selectedDateExists) {
        // 기존 항목 업데이트
        const existingEntry = diaryList.find(d => d.date === selectedDate);
        await updateDiaryEntry(existingEntry.id, newEntry);
      } else {
        // 새 항목 추가
        await addDiaryEntry(newEntry);
      }

      // 목록 새로고침
      const updatedEntries = await getAllDiaryEntries();
      setDiaryList(updatedEntries);
      
    } catch (e) {
      console.error('AI 피드백 또는 Firebase 저장 중 오류 발생:', e);
      alert(`AI 피드백을 받아오거나 기록 저장 중 오류가 발생했습니다: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 행복 분석 핸들러
  const handleAnalyzeHappiness = async () => {
    // 🚫 부적절한 내용 검수
    // const allMomentsText = diaryList
    //   .flatMap(entry => entry.items)
    //   .filter(Boolean)
    //   .join(' ');
    // if (containsInappropriateContent(allMomentsText)) {
    //   alert('기록된 모먼트에 부적절하거나 불쾌한 표현이 포함되어 있어 분석을 진행할 수 없습니다. 😥');
    //   return;
    // }

    if (diaryList.length === 0) {
      alert('분석할 행복 모먼트 기록이 없습니다. 먼저 기록을 작성해 주세요!');
      return;
    }
    setAnalysisLoading(true);
    setHappinessAnalysisResult(''); // 이전 분석 결과 초기화
    try {
      const analysis = await getHappinessAnalysis(diaryList);
      setHappinessAnalysisResult(analysis);
      localStorage.setItem('happinessAnalysisResult', analysis); // 분석 결과를 localStorage에 저장
    } catch (e) {
      console.error('행복 분석 중 오류 발생:', e);
      alert(`행복 분석 중 오류가 발생했습니다: ${e.message || e}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // 입력값 변경
  const handleChange = (idx, value) => {
    // 글자 수 제한 적용
    if (value.length <= MAX_CHAR_LIMIT) {
      const newEntries = [...entries];
      newEntries[idx] = value;
      setEntries(newEntries);
    }
  };

  // 오늘 기록 및 AI 피드백 표시 (선택된 날짜의 기록을 표시)
  const currentDisplayedEntry = diaryList.find(d => d.date === selectedDate);

  // 실제로 표시할 일기 목록 (최신순 3개 또는 전체)
  const displayedDiaryList = showAllMoments ? diaryList : diaryList.slice(0, 3);

  // 기록 삭제 핸들러
  const handleDelete = async (dateToDelete) => {
    const confirmDelete = window.confirm(`정말 ${dateToDelete} 날짜의 행복 모먼트를 삭제하시겠어요?`);
    if (confirmDelete) {
      try {
        await deleteDiaryEntryByDate(dateToDelete);
        
        // 목록 새로고침
        const updatedEntries = await getAllDiaryEntries();
        setDiaryList(updatedEntries);
        
        // 만약 삭제된 날짜가 현재 선택된 날짜라면 입력 필드 초기화
        if (selectedDate === dateToDelete) {
          setEntries(['', '', '']);
          setAIFeedback('');
        }
        
        alert('기록이 성공적으로 삭제되었습니다. ✅');
      } catch (error) {
        console.error('삭제 중 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="App" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        로딩 중... ⏳
      </div>
    );
  }

  // 로그인되지 않았으면 Auth 컴포넌트 표시
  if (!user) {
    return <Auth 
      onAuthSuccess={() => {}} 
      onSignupStart={() => setIsSignupInProgress(true)}
      onSignupComplete={() => {
        setIsSignupInProgress(false);
        // 회원가입 완료 후 인증 상태를 강제로 null로 설정
        setUser(null);
      }}
    />;
  }

  return (
    <div className="App">
      {/* 헤더에 사용자 정보와 로그아웃 버튼 추가 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '0 0 16px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            안녕하세요, {user.displayName || user.email.split('@')[0]}님! 🌟
          </h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            오늘도 행복한 순간을 기록해보세요
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          로그아웃
        </button>
      </div>

      <div className="card">
        <h2>오늘의 행복한 모먼트 3가지</h2>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange} 
          max={today}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={randomPlaceholders[i] || examplePlaceholders[i % examplePlaceholders.length]}
                value={entries[i]}
                onChange={e => handleChange(i, e.target.value)}
                maxLength={MAX_CHAR_LIMIT}
                style={{ 
                  width: '100%',
                  paddingRight: '60px' // 글자 수 표시 공간 확보
                }}
              />
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.8rem',
                color: entries[i].length >= MAX_CHAR_LIMIT ? '#ff6b6b' : '#999',
                pointerEvents: 'none'
              }}>
                {entries[i].length}/{MAX_CHAR_LIMIT}
              </div>
            </div>
          ))}
          <button onClick={handleSave} disabled={loading}>
            {loading ? 'AI가 피드백을 작성 중...' : '저장하기'}
          </button>
        </div>
        {currentDisplayedEntry && currentDisplayedEntry.aiFeedback && (
          <div style={{
            background: '#f6f7fb',
            borderRadius: '8px',
            marginTop: '24px',
            padding: '18px 14px',
            color: '#444',
            fontSize: '1.05rem',
            boxShadow: '0 1px 6px 0 rgba(60,60,60,0.04)'
          }}>
            <b>AI 한마디 🗨️</b>
            <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{currentDisplayedEntry.aiFeedback}</div>
          </div>
        )}
      </div>
      <div className="card">
        <h3>기록된 행복 모먼트</h3>
        {diaryList.length === 0 && <p>아직 기록이 없습니다.</p>}
        <div className="diary-list">
          {displayedDiaryList.map((entry) => {
            if (!entry || typeof entry !== 'object') {
              console.warn('Skipping invalid entry in diaryList rendering:', entry);
              return null;
            }
            return (
              <div key={entry.date} className="diary-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{entry.date}</strong>
                  <button
                    onClick={() => handleDelete(entry.date)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background 0.2s, color 0.2s',
                      fontWeight: 'normal',
                      width: 'auto'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#999'; }}
                  >
                    삭제
                  </button>
                </div>
                <ol>
                  {(entry.items ?? []).filter(item => item && item.trim() !== '').map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ol>
                {entry.aiFeedback && (
                  <div style={{
                    background: '#f6f7fb',
                    borderRadius: '8px',
                    marginTop: '12px',
                    padding: '12px 10px',
                    color: '#444',
                    fontSize: '0.98rem',
                    boxShadow: '0 1px 6px 0 rgba(60,60,60,0.03)'
                  }}>
                    <b>AI 한마디 🗨️</b>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{entry.aiFeedback}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* 더보기 버튼 추가 */}
        {diaryList.length > 3 && (
          <button
            onClick={() => setShowAllMoments(!showAllMoments)}
            style={{
              marginTop: '20px',
              background: '#eee',
              color: '#666',
              border: '1px solid #ddd',
              padding: '12px 0',
              fontWeight: 'normal',
              width: '100%'
            }}
          >
            {showAllMoments ? '간략히 보기 ⬆️' : '더보기 ⬇️'}
          </button>
        )}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h3>나는 어떨 때 행복할까?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', margin: '0 auto' }}>
            <button
              onClick={handleAnalyzeHappiness}
              disabled={analysisLoading || diaryList.length === 0}
            >
              {analysisLoading ? 'AI가 행복 모먼트 분석 중...' : '행복 모먼트 분석하기'}
            </button>
            {happinessAnalysisResult && (
              <div style={{
                background: '#e6ffe6',
                borderRadius: '8px',
                marginTop: '10px',
                padding: '18px 14px',
                color: '#333',
                fontSize: '1.05rem',
                boxShadow: '0 1px 6px 0 rgba(60,60,60,0.06)'
              }}>
                <b>분석 결과</b>
                <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{happinessAnalysisResult}</div>
              </div>
            )}
            {!analysisLoading && diaryList.length === 0 && (
              <p style={{ marginTop: '0px', color: '#666' }}>분석할 기록이 없습니다. 먼저 행복 모먼트를 작성해주세요!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;