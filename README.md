# 물건 쓰임새 분석기

Google Gemini API를 사용하여 이미지 속 물건의 쓰임새를 분석하는 웹 애플리케이션입니다.

## 기술 스택

- **React** + **Vite** (프론트엔드)
- **Cloudflare Pages** (호스팅)
- **Cloudflare Pages Functions** (API)
- **Google Gemini API**

## 기능

- 이미지 업로드 및 분석
- 드래그 앤 드롭 지원
- 반응형 디자인

## 로컬 개발

```bash
npm install
npm run build
npx wrangler pages dev dist
```

- `.dev.vars` 파일에 `GEMINI_API_KEY=키` 추가
- http://localhost:8788 접속

## Cloudflare Pages 배포

자세한 내용은 [DEPLOY.md](./DEPLOY.md) 참고.

1. Cloudflare Pages에 GitHub 연결
2. Build: `npm run build`, Output: `dist`
3. **Environment variables**에 `GEMINI_API_KEY` 추가 (암호화 체크)

## 프로젝트 구조

```
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── functions/
│   └── api/
│       └── analyze.js    # Cloudflare Pages Function
├── index.html
├── vite.config.js
└── package.json
```

## API 키

[Google AI Studio](https://aistudio.google.com/apikey)에서 발급
