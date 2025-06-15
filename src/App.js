import React, { useState, useEffect } from 'react';
import './App.css';
import { getGeminiFeedback, getHappinessAnalysis } from './gemini';

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

  // 날짜 포맷 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // localStorage에서 기록 불러오기 및 선택된 날짜에 맞춰 UI 업데이트
  useEffect(() => {
    const saved = localStorage.getItem('happyDiary');
    let list = saved ? JSON.parse(saved) : [];
    
    // 데이터 로드 시 강력한 유효성 검사 및 마이그레이션
    list = list.map(entry => {
      // 1단계: entry 자체가 유효한 객체인지 확인
      if (typeof entry !== 'object' || entry === null) {
        console.warn('Skipping invalid diary entry (not an object): ', entry);
        return null; // 유효하지 않은 entry는 null로 표시
      }

      // 2단계: items 배열 유효성 검사 및 마이그레이션
      let items = [];
      if (Array.isArray(entry.items)) {
        items = entry.items;
      } else if (entry.entry1 || entry.entry2 || entry.entry3) { // 이전 형식 (entry1, entry2, entry3) 마이그레이션
        items = [entry.entry1 || '', entry.entry2 || '', entry.entry3 || ''];
      }
      
      // 3단계: items 배열 내 각 항목이 문자열인지 확인 및 항상 3개의 요소 유지
      items = items.slice(0, 3).map(item => typeof item === 'string' ? item.trim() : ''); // 3개 초과하면 잘라내고, 문자열이 아니면 빈 문자열로
      while (items.length < 3) {
        items.push(''); // 3개 미만이면 빈 문자열로 채우기
      }

      // 4단계: 다른 중요한 필드들도 유효성 검사
      const date = typeof entry.date === 'string' ? entry.date : null;
      const aiFeedback = typeof entry.aiFeedback === 'string' ? entry.aiFeedback : '';

      // 모든 필수 데이터가 유효한지 확인
      if (!date) {
        console.warn('Skipping invalid diary entry (missing date): ', entry);
        return null; // 날짜 없는 entry는 null로 표시
      }

      return {
        date: date,
        items: items,
        aiFeedback: aiFeedback
      };
    }).filter(entry => entry !== null); // 유효하지 않은 entry (null) 제거
    
    // 정렬 로직은 handleSave로 이동되었으므로 여기서는 제거
    // list.sort((a, b) => new Date(b.date) - new Date(a.date));

    setDiaryList(list);

    // 선택된 날짜의 기록을 찾아 입력 폼과 AI 피드백에 반영
    const currentEntry = list.find(d => d.date === selectedDate);
    if (currentEntry) {
      setEntries(currentEntry.items);
      console.log('useEffect: entries set to currentEntry.items', currentEntry.items);
      setAIFeedback(currentEntry.aiFeedback || '');
    } else {
      setEntries(['', '', '']);
      console.log('useEffect: entries set to empty array');
      setAIFeedback('');
    }

    // 변환된 데이터가 있으면 localStorage에 다시 저장 (옵션: 마이그레이션 후 저장)
    localStorage.setItem('happyDiary', JSON.stringify(list));

    // ✅ 행복 분석 결과 불러오기 추가
    const savedAnalysis = localStorage.getItem('happinessAnalysisResult');
    if (savedAnalysis) {
      setHappinessAnalysisResult(savedAnalysis);
    }

  }, [selectedDate]);

  // 기록 저장
  const handleSave = async () => {
    // 🚫 부적절한 내용 검수
    // const hasInappropriate = entries.some(entry => containsInappropriateContent(entry));
    // if (hasInappropriate) {
    //   alert('부적절하거나 불쾌한 표현이 포함되어 있습니다. 바르고 고운 말을 사용해주세요! 🙏');
    //   return;
    // }

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
      const updatedList = [newEntry, ...diaryList.filter(d => d.date !== selectedDate)];
      updatedList.sort((a, b) => new Date(b.date) - new Date(a.date)); // 저장 시 정렬
      setDiaryList(updatedList);
      localStorage.setItem('happyDiary', JSON.stringify(updatedList));
    } catch (e) {
      console.error('AI 피드백 또는 localStorage 저장 중 오류 발생:', e);
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
    const newEntries = [...entries];
    newEntries[idx] = value;
    setEntries(newEntries);
  };

  // 오늘 기록 및 AI 피드백 표시 (선택된 날짜의 기록을 표시)
  const currentDisplayedEntry = diaryList.find(d => d.date === selectedDate);

  // 실제로 표시할 일기 목록 (최신순 3개 또는 전체)
  const displayedDiaryList = showAllMoments ? diaryList : diaryList.slice(0, 3);

  return (
    <div className="App">
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
            <input
              key={i}
              type="text"
              placeholder={examplePlaceholders[i % examplePlaceholders.length]}
              value={entries[i]}
              onChange={e => handleChange(i, e.target.value)}
            />
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
            // entry가 유효한 객체인지 다시 한번 확인 (방어적 코드)
            if (!entry || typeof entry !== 'object') {
              console.warn('Skipping invalid entry in diaryList rendering:', entry);
              return null; // 유효하지 않은 entry는 렌더링하지 않음
            }
            return (
              <div key={entry.date} className="diary-item">
                <strong>{entry.date}</strong>
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
            {showAllMoments ? '간략히 보기' : '더보기'}
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