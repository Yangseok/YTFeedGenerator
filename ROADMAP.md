# YTFeedGenerator Roadmap (2026-02-07 기준)

이 문서는 현재 코드 기준의 실제 구현 상태를 반영한 로드맵이다.
이전 `PROJECT_PLAN.md`의 이상 상태와의 갭을 명확히 하고, 다음 구현 순서를 제안한다.

## 현재 구현 상태 요약

완료/구현됨
1. Wails v3 + React + TS + Vite 스캐폴딩
2. SQLite + GORM 연결 및 AutoMigrate
3. YouTube RSS 수집 및 채널/영상 Upsert
4. 자막 추출 연동 (youtube-transcript-api-go)
5. LLM 요약 (OpenAI/Ollama) API
6. 템플릿 기본 시드 + 저장/삭제/리스트
7. 태그 CRUD + 영상 태그 추가/삭제 API
8. 컬렉션 CRUD + 영상 추가/삭제 + Markdown 내보내기
9. 프론트 UI (Feed/Collector/Templates/Tags/Settings)
10. 태그/채널/검색 필터링 (프론트 + 백엔드)
11. 컬렉션 UX 개선 (검색 추가 + 피드백)
12. 요약 완료 강조 UI
13. 주기적 RSS 동기화 + Sync Now
14. 알림/트레이 (Wails notifications + System Tray)
15. PDF 내보내기 (간단 PDF 생성)
16. 템플릿 가져오기/내보내기 (JSON)
17. 자동 태깅 (LLM 기반)
18. OpenAI 키 암호화 저장 (DB + AES-GCM)
19. 에러 로깅 (logs/app.log)
20. 백업/복원 (settings/templates/DB zip)
21. 자동 요약 스케줄러 (주기/배치 설정)
22. Transcript 실패 상태 저장 및 Feed 뱃지 표시, 다음 주기 재시도

주의/제약
1. PDF는 외부 라이브러리 없이 최소 기능으로 생성 (한글/줄바꿈 품질 제한 가능)
2. OpenAI 키 암호화는 머신 ID 기반이라 다른 PC로 이전 시 복호화 불가
3. 백업 복원 시 DB는 `.restore` 파일로만 생성됨 (실 DB 교체는 수동)
4. Transcript 실패는 다음 자동 요약 주기에서 재시도됨 (별도 backoff 없음)

## 우선순위 로드맵

### Phase 1: 사용성 완성 (MVP 완성) — 완료
목표: 지금 화면에서 실제로 “수집-요약-정리” 흐름이 막힘 없이 동작.

1. 태그/채널 기반 필터링
   - 백엔드: `ListVideos`에 필터 파라미터 추가 (tagID, channelID, query)
   - 프론트: Tags/Settings 선택 기반 필터 UI 추가
2. 컬렉션 UX 개선
   - Feed 카드에서 컬렉션 추가 성공/실패 피드백
   - Collector에서 영상 검색/추가 (현재는 VideoID 직접 입력)
3. 요약 결과 캐시 UX
   - 요약 완료 후 Feed 리스트 즉시 반영/강조

### Phase 2: 자동화/알림 — 완료
목표: 앱이 “지속적으로” 새 영상을 감지하고 알려줌.

1. 주기적 RSS 동기화
   - 설정에 “동기화 주기” 추가
   - 백엔드 타이머 또는 Wails 이벤트 루프에서 실행
2. 알림/트레이
   - 새 영상 감지, 요약 완료 알림
   - 트레이 메뉴에서 수동 Sync/설정 열기

### Phase 3: 확장 기능 — 완료
목표: 내보내기/공유와 정교한 요약 포맷.

1. PDF 내보내기
   - `gofpdf` 기반으로 컬렉션 PDF 생성
2. 템플릿 프리셋/공유
   - 템플릿 가져오기/내보내기 (JSON)
3. 자동 태깅
   - LLM 기반 키워드 추출 + 사용자 피드백 반영

### Phase 4: 안정성/보안 — 완료
목표: 실제 배포 품질로 정리.

1. OpenAI Key 안전 저장
   - OS 키체인 or 파일 암호화 적용
2. 에러 리포팅/로깅 개선
   - API 실패 원인 UI에 노출
3. 백업/복원
   - 설정 및 DB export/import

## 테스트/검증 계획 (우선순위 순)

1. 기본 플로우 E2E
   - Settings에서 채널 추가 → Sync → Feed에 영상 표시
   - Feed에서 영상 상세 열기 → 요약 생성 → 리스트 요약 반영/강조 확인
2. 필터링
   - Feed 검색/채널/태그 필터 조합으로 결과가 일치하는지 확인
3. 컬렉션
   - Feed에서 컬렉션 추가 시 성공/실패 피드백
   - Collector 검색으로 영상 추가 → 목록 반영
   - Markdown/PDF 내보내기 파일 생성 확인
4. 템플릿 공유
   - Export 후 JSON 복사 → Import로 복원 → 목록 반영
5. 자동 태깅
   - Auto Tag 실행 → 태그 생성 + 영상 연결 확인
6. 자동 동기화/알림/트레이
   - Auto sync 활성화 후 주기적으로 새 영상 동기화
   - 트레이 Sync Now / Show / Quit 동작 확인
   - 알림 권한 요청 및 알림 표시 확인
7. 보안 저장
   - OpenAI 키 저장 → 앱 재시작 후 복원 확인
   - 다른 머신에서 복호화 실패 확인 (기대한 동작)
8. 백업/복원
   - Export Backup 생성 확인
   - Import Backup로 settings/templates 복원 확인
   - DB restore 파일 생성 여부 확인

## 검증 실패 시 체크리스트
1. `logs/app.log`에서 오류 메시지 확인
2. `ytfeed.db` 정상 생성 여부 확인
3. `backups/`와 `exports/` 파일 생성 여부 확인
4. OpenAI 키는 DB에 암호화 저장되므로 `localStorage`에 남지 않는지 확인
