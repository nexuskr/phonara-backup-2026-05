# Phonara.world — Cyber Luxury Empire 리디자인

## ✅ Phase 0 (완료)
- 디자인 토큰 교체 (Imperial Gold 75% / Cyber Purple 15% / Electric Cyan 5% / Void Black)
- 폰트 교체: Fraunces (display) + Italiana (imperial 워드마크) + Orbitron (HUD 숫자) + Pretendard (한글 본문)
- 모든 "폰미션 / PHONETOK / PhoneMission" → "Phonara / PHONARA"
- 로고 (Layout, SecureAuth) 임페리얼 골드 워드마크로 교체
- index.html 메타 / manifest / 이메일 템플릿 골드 톤 통일

## ⏭ Phase 1 — 로그인 화면 시네마틱 리디자인 (다음)
- imagegen premium: `src/assets/phonara-crown-phone.png` (골드 크라운 + 검정 글래스 폰)
- `SecureAuth.tsx` 풀스크린 cinematic 레이아웃
  - 좌상단 키 라이트 통일
  - 거대 PHONARA 워드마크 + "지구 반대편에서도 Empire를 세우다"
  - 폼은 시트로 슬라이드업 (모바일 60% 이미지 / CTA sticky)
  - 0.6초 오프닝 시퀀스 (sessionStorage gate)
  - 노이즈 텍스처 overlay 0.04 opacity (메탈릭)

## ⏭ Phase 2 — 대시보드
- Layout 데스크톱 사이드바 + 모바일 하단탭 분기
- Top HUD: 거대 골드 숫자 + Active Boost
- Hero "Boost Your Empire" — 3개 3D 미션 카드 (Content Farmer / Trading Bot / Image Maker)
- 미션 아이콘 3장 (standard imagegen, 동일 라이팅 방향)

## ⏭ Phase 3 — 마무리
- Empire Founding Counter royal gold 리스타일 + 30 SEATS
- Empire Tier 시각 시스템 (Bronze→Sovereign 5단계 배지)
- 성능: prefers-reduced-motion, 모바일 파티클 50% 감소, blur 레이어 ≤2

## 컬러/폰트 비율
- Gold 75% (CTA·숫자·테두리·타이포만 — 면적 아님), Purple 15%, Cyan 5%, Void Black 5%
- 헤드라인 영문: Italiana (워드마크) / Fraunces (그 외)
- HUD 숫자: Orbitron tabular
- 한글 본문: Pretendard
