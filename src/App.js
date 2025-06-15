import React, { useState, useEffect } from 'react';
import './App.css';
import { getGeminiFeedback } from './gemini';

function App() {
  const [entries, setEntries] = useState([
    '', '', ''
  ]);
  const [diaryList, setDiaryList] = useState([]);
  const [aiFeedback, setAIFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [happinessSummary, setHappinessSummary] = useState(''); // 키워드 기능 제거: 단순 문자열로 변경
  const [summaryLoading, setSummaryLoading] = useState(false);

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
      
      // 3단계: items 배열 내 각 항목이 문자열인지 확인 및 불필요한 공백 제거
      items = items.filter(item => typeof item === 'string' && item.trim() !== '');

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
      setAIFeedback(currentEntry.aiFeedback || '');
    } else {
      setEntries(['', '', '']);
      setAIFeedback('');
    }

    // 변환된 데이터가 있으면 localStorage에 다시 저장 (옵션: 마이그레이션 후 저장)
    localStorage.setItem('happyDiary', JSON.stringify(list));
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
      setEntries(['', '', '']);
    } catch (e) {
      console.error('AI 피드백 또는 localStorage 저장 중 오류 발생:', e);
      alert(`AI 피드백을 받아오거나 기록 저장 중 오류가 발생했습니다: ${e.message || e}`);
    } finally {
      setLoading(false);
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

  return (
    <div className="App">
      <div className="card">
        <h2>오늘의 행복한 모먼트 3가지</h2>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange} 
          max={today} 
          style={{ marginBottom: '20px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <input
              key={i}
              type="text"
              placeholder={`행복했던 일 ${i + 1}`}
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
            <b>AI 피드백</b>
            <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{currentDisplayedEntry.aiFeedback}</div>
          </div>
        )}
      </div>
      <div className="card">
        <h3>기록된 행복 모먼트</h3>
        {diaryList.length === 0 && <p>아직 기록이 없습니다.</p>}
        <div className="diary-list">
          {diaryList.map((entry) => {
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
                    <b>AI 피드백</b>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{entry.aiFeedback}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;