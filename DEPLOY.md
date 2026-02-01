# Railway 백엔드 배포 가이드

## 1단계: Railway 배포

1. [Railway](https://railway.app) 접속 후 **GitHub 로그인**
2. **New Project** → **Deploy from GitHub repo**
3. `blackmandarin935/how` 저장소 선택
4. **Settings** → **Variables** → **New Variable** 추가:
   - `GEMINI_API_KEY` = (Google AI Studio에서 발급한 API 키)
5. **Settings** → **Networking** → **Generate Domain** 클릭
6. 생성된 URL 복사 (예: `https://how-production-xxxx.up.railway.app`)

## 2단계: 프론트엔드 API 주소 설정

1. 프로젝트의 `api-config.js` 파일 열기
2. `window.API_BASE_URL` 값을 Railway URL로 변경:

```javascript
window.API_BASE_URL = 'https://how-production-xxxx.up.railway.app';
```

3. 변경사항 커밋 후 푸시:

```bash
git add api-config.js
git commit -m "Update API URL for production"
git push
```

## 3단계: Cloudflare Pages 재배포

- GitHub에 푸시하면 Cloudflare Pages가 자동으로 재배포됩니다.
- 또는 Cloudflare 대시보드에서 **Retry deployment** 클릭

## 완료

이제 https://how-als.pages.dev 에서 이미지 분석이 동작합니다.
