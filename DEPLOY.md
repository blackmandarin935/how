# Cloudflare Pages 배포 가이드 (React + Vite + Functions)

## 구조

- **프론트엔드**: React + Vite → 빌드 후 `dist/` 배포
- **API**: Cloudflare Pages Functions (`/functions/api/analyze.js`) → Gemini API 호출
- **환경 변수**: Cloudflare 대시보드에서 설정

## 1. Cloudflare Pages 연결

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. `blackmandarin935/how` 저장소 선택
3. **Build settings**:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (비워두기)

## 2. 환경 변수 설정

1. 프로젝트 선택 → **Settings** → **Environment variables**
2. **Production** 환경에 변수 추가:

| 변수 이름 | 값 | 비밀(Encrypt) |
|----------|-----|--------------|
| `GEMINI_API_KEY` | Google AI Studio API 키 | ✅ 체크 |

- **Add variable** → 이름: `GEMINI_API_KEY`, 값: (API 키), **Encrypt** 체크 → **Save**
- [API 키 발급](https://aistudio.google.com/apikey)

## 3. Functions 자동 인식

`/functions` 폴더가 있으면 Cloudflare Pages가 자동으로 Functions로 인식합니다.  
배포 시 `dist`와 함께 Functions가 배포됩니다.

## 4. 배포

- GitHub에 푸시하면 자동 배포됩니다.
- 또는 **Deployments** → **Retry deployment**

## 로컬 개발

```bash
npm install
npm run build
npx wrangler pages dev dist
```

- `.dev.vars` 파일에 `GEMINI_API_KEY=키` 추가 (로컬용)
- `http://localhost:8788` 접속

## VITE_API_URL (선택)

다른 API 서버를 사용할 경우:

1. Cloudflare Pages **Build** 환경 변수에 추가:
   - `VITE_API_URL` = `https://your-api.example.com`
2. 빌드 시 클라이언트에 주입됨

기본값(비워두기)이면 **같은 도메인** `/api/analyze`를 사용합니다.
