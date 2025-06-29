# Happy Diary 🌟

행복한 순간들을 기록하고 AI와 함께 나누는 다이어리 앱입니다.

## 주요 기능

- 📝 **행복한 모먼트 기록**: 하루에 3가지 행복한 순간을 기록
- 🤖 **AI 피드백**: Gemini AI가 각 모먼트에 대해 따뜻한 공감과 반응
- 📊 **행복 분석**: 기록된 모든 모먼트를 종합적으로 분석
- ☁️ **Firebase 연동**: 안전한 클라우드 데이터 저장
- 📱 **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능

## 기술 스택

- **Frontend**: React 19.1.0
- **Database**: Firebase Firestore
- **AI**: Google Gemini API
- **Deployment**: GitHub Pages

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/happy-diary.git
cd happy-diary
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Gemini API 설정
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. 웹 앱 추가 후 설정 정보 복사
4. Firestore 보안 규칙 설정 (테스트 모드로 시작)

### 5. 앱 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 사용법

1. **날짜 선택**: 원하는 날짜를 선택하세요
2. **행복한 모먼트 입력**: 3가지 행복했던 순간을 30자 이내로 입력
3. **저장하기**: AI 피드백과 함께 저장
4. **기록 확인**: 저장된 모든 모먼트를 날짜순으로 확인
5. **행복 분석**: 모든 기록을 종합적으로 분석

## 배포

```bash
npm run build
npm run deploy
```

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
