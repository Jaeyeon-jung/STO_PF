## STO Project Forecaster (Initial Version)

Next.js + Tailwind 기반의 부동산 개발 프로젝트 분석/시각화 플랫폼 초기 버전입니다.
Cursor AI로 작성되었습니다.

### 실행 방법

```bash
cd web
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 핵심 기능
- 홈: 검색창 + 6개 드롭다운, 실시간 프롬프트 미리보기, 검색 결과 목록
- 프로젝트 상세: 가치 라인차트, 리스크 레이더차트, 4개 액션 버튼
- 메뉴: Investment / Assets / Revenue 빈 페이지

### API (Mock)
- `POST /api/search` – 필터/프롬프트 입력 → 프로젝트 목록 반환
- `GET /api/projects/:id` – 프로젝트 상세 조회

### 기술 스택
- Next.js(App Router), TypeScript, TailwindCSS, Recharts
