# 로그인 + AI 초안 생성 셋업 가이드

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 에 가입 후 **New Project** 클릭
2. 이름: `boheme-bloglab` (원하는 대로)
3. Database Password 설정 (나중에 다시 볼 수 없으니 저장)
4. Region: **Northeast Asia (Seoul)** 권장
5. 프로젝트 생성 (~2분 소요)

## 2. Supabase 환경변수 복사

- 좌측 메뉴 **Project Settings** → **API**
- 다음 두 값을 복사:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Google OAuth 활성화

### Google Cloud Console 에서 OAuth Client 생성
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 선택
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Authorized redirect URIs 에 Supabase 콜백 URL 추가:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (Supabase 프로젝트의 URL 확인: Settings > API > Project URL)
6. Client ID와 Client Secret 복사

### Supabase 에 Google Provider 연결
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 토글 활성화
3. 위에서 복사한 **Client ID**, **Client Secret** 붙여넣기
4. **Save** 클릭

### Site URL / Redirect URL 설정
1. **Authentication** → **URL Configuration**
2. **Site URL**: 배포된 도메인 (예: `https://bohemebloglab.com`)
3. **Redirect URLs** 에 다음 추가:
   - `https://bohemebloglab.com/auth/callback`
   - `http://localhost:3000/auth/callback` (로컬 개발용)

## 4. 사용량 추적 테이블 생성

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. `supabase/migrations/0001_ai_draft_usage.sql` 파일 내용 전체 복사 붙여넣기
3. **Run** 클릭

## 5. Anthropic API 키 발급

1. https://console.anthropic.com 가입 후 로그인
2. **API Keys** 메뉴 → **Create Key**
3. 발급된 키 복사 → `ANTHROPIC_API_KEY`
4. **Billing** 에 결제수단 등록 필요 (사용자당 월 몇백원 수준)

## 6. Vercel 환경변수 등록

Vercel 프로젝트 대시보드 → **Settings** → **Environment Variables** 에서 다음 4개 추가:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | (2단계 URL) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (2단계 anon key) | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | (5단계 키) | Production, Preview |
| (기존 네이버/이미지 키들은 이미 등록되어 있을 것) | | |

환경변수 추가 후 **Redeploy** 필요: Deployments 탭 → 최신 배포 > `...` > Redeploy.

## 7. 로컬 개발 (선택)

`.env.local` 파일에 위 4개 값 입력 후 `npm run dev`.

## 문제 해결

### "로그인이 필요합니다" 에러
- Supabase Project URL / Anon Key 가 올바른지 확인
- 브라우저에서 `/login` 페이지가 정상 로드되는지 확인

### Google 로그인 시 "redirect_uri_mismatch"
- Google Cloud Console의 Authorized redirect URIs 에
  `https://<ref>.supabase.co/auth/v1/callback` 이 정확히 등록되어 있는지 확인

### AI 초안 생성 시 "AI 기능이 아직 설정되지 않았습니다"
- `ANTHROPIC_API_KEY` 가 Vercel 환경변수에 있는지 확인 후 Redeploy

### 사용량이 계속 0으로 초기화됨
- Supabase SQL Editor 에서 `select * from ai_draft_usage;` 실행해 확인
- RLS 정책이 제대로 생성되었는지 Table Editor에서 확인

## 비용 가이드

- **Supabase Free Tier**: 월 50,000 MAU, 500MB DB → 초기엔 무료
- **Anthropic Claude Sonnet**: 하루 사용자당 2회 × max 4096 토큰 ≈ 약 $0.03 / 사용자 / 일
  - 100명이 매일 사용하면 월 $90 정도
  - 프롬프트 캐싱 적용되어 있어 실제로는 50~70% 할인 예상
- 사용량 증가 시: `/api/ai-draft/route.ts`의 `DAILY_LIMIT` 을 낮추거나 유료 멤버십 도입 검토
