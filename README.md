# PatentPilot AI

> 아이디어를 입력하면 특허 가능성, 경쟁사 현황, 사업성까지 분석해주는 AI 플랫폼

## 환경변수 (Vercel / .env.local)

**절대 GitHub에 커밋하지 마세요.** `.env.local`은 `.gitignore`에 포함되어 있습니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENROUTER_API_KEY` | ✅ | AI 분석 (무료 모델만 자동 사용) |
| `KIPRIS_API_KEY` | ✅ | 국내 특허 검색 |
| `KOSIS_API_KEY` | ✅ | 시장 통계 |
| `NEXT_PUBLIC_APP_URL` | ✅ | OpenRouter Referer (예: Vercel URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | 권장 | 로그인·DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 권장 | 로그인·DB |
| `NTIS_API_KEY` | 선택 | R&D 과제 (없으면 Mock) |
| `POLICY_API_KEY` | 선택 | 정부 정책 (없으면 Mock) |

### Vercel 등록 방법

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 위 변수들을 **Production / Preview / Development** 모두에 추가
3. Redeploy

## AI (OpenRouter 무료 모델)

OpenAI 대신 **OpenRouter 무료 모델만** 사용합니다.

- API에서 `max_price=0` 조건에 해당하는 모델 자동 조회
- 사용 불가/오류 모델은 30분간 자동 제외 후 다음 모델로 폴백
- `openrouter/free` 라우터 포함

## 시작하기

```bash
npm install
cp .env.example .env.local
# .env.local에 키 입력
npm run dev -- -p 60004
```

## 기술 스택

Next.js 15 · Supabase · OpenRouter · KIPRIS · KOSIS · jsPDF · Vercel

## License

Private
