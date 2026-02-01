# 물건 쓰임새 분석기

Google Gemini API를 사용하여 이미지 속 물건의 쓰임새를 분석하는 웹 애플리케이션입니다.

## 🚀 기능

- 이미지 업로드 및 분석
- Google Gemini 3 Flash 모델 사용
- Google Search 연동
- 드래그 앤 드롭 지원
- 반응형 디자인

## 🔧 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

1. `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:
```bash
cp .env.example .env
```

2. Google AI Studio에서 API 키 발급:
   - [Google AI Studio](https://aistudio.google.com/app/apikey) 방문
   - 새 API 키 생성
   - 생성된 키를 복사

3. `.env` 파일에 API 키 설정:
```env
GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PORT=3000
NODE_ENV=development
```

### 3. 서버 시작

```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 🔒 보안 기능

### API 키 보안
- 환경 변수를 통한 API 키 관리
- `.gitignore`를 통한 키 노출 방지
- 서버 측에서만 API 키 사용

### 보안 미들웨어
- **Helmet**: HTTP 헤더 보안 강화
- **Rate Limiting**: 요청 수 제어 (15분당 50개)
- **CORS**: 교차 출처 요청 관리
- **CSP**: 콘텐츠 보안 정책 설정

### 입력 유효성 검사
- Base64 이미지 형식 검증
- 파일 크기 제한 (10MB)
- 지원 형식: JPEG, PNG, GIF, WebP
- API 키 형식 유효성 검사

### 에러 핸들링
- 상세한 에러 로깅 (서버)
- 일반화된 에러 메시지 (클라이언트)
- API 오류 타입별 처리

## 📁 프로젝트 구조

```
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── script.js           # 클라이언트 JavaScript
├── server.js           # Express 서버
├── package.json        # 프로젝트 설정
├── .env.example        # 환경 변수 예시
├── .env               # 환경 변수 (실제)
├── .gitignore         # Git 제외 파일
└── README.md          # 프로젝트 문서
```

## 🔧 개발 환경

- Node.js 18+
- Express.js
- Google Gemini API
- Vanilla JavaScript (프론트엔드)

## 📝 API 사용량

- Rate Limiting: 15분당 IP당 50개 요청
- 파일 크기 제한: 10MB
- 지원 이미지 형식: JPEG, PNG, GIF, WebP

## 🚨 보안 주의사항

1. **API 키 절대 공개 금지**: `.env` 파일을 Git에 커밋하지 마세요
2. **프로덕션 환경**: `NODE_ENV=production` 설정
3. **Rate Limiting**: 필요에 따라 제한값 조정
4. **정기적인 키 교체**: API 키 주기적으로 갱신 권장

## 📄 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 요청은 Issue로 남겨주세요.