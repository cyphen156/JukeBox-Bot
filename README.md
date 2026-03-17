<img width="154" height="155" alt="디스코드 봇 썸네일" src="https://github.com/user-attachments/assets/d9452022-eb47-4efb-a385-0269beda3926" />

---
# JukeBox-Bot

Node.js + Discord.js 기반 Discord 음악 스트리밍 봇입니다.  
슬래시 명령어로 YouTube 음악을 재생·제어하고, 큐 및 개인 플레이리스트를 관리할 수 있습니다.

- **개발자** : 오융택
- **개발 기간** : 2025.08.18 ~ 2025.08.31 (2주 / 약 40시간)
- **GitHub** : [cyphen156/JukeBox-Bot](https://github.com/cyphen156/JukeBox-Bot)

https://github.com/user-attachments/assets/92c83d31-f6e6-42a1-bd0f-f5bb167f47bd

## 서비스 구성도
<img width="968" height="545" alt="서비스 구성도" src="https://github.com/user-attachments/assets/eb578302-9726-4d32-ab8f-506135f599be" />

---

## 수행 역할

혼자 진행한 프로젝트로, 전체 설계와 구현을 담당했습니다.

- YouTube 스트리밍 파이프라인 설계 및 구현
- 재생 상태 관리 FSM 설계
- 플레이리스트 AES-256-GCM 암호화 저장 구조 설계
- 퍼사드 구조의 사용자 명령어 설계
- Azure VM + systemd 배포 및 운영

---

## 핵심 기능

### 🎵 음악 재생
- `/join` : 음성 채널에 봇 초대
- `/play <검색어|URL>` : YouTube 검색 또는 URL로 즉시 재생
- `/pause` `/resume` `/skip` `/stop` : 재생 제어
- `/leave` : 음성 채널에서 봇 퇴장

### 📋 큐 관리
- `/queue` : 현재 대기열 확인
- `/add <검색어|URL>` : 대기열에 곡 추가
- `/queue remove` `/queue clear` `/queue shuffle` : 대기열 조작

### 💾 플레이리스트
- 길드·유저·이름 단위로 저장
- AES-256-GCM 암호화 적용, 서버 파일시스템에 보관
- `/playlist create <이름>` : 플레이리스트 생성
- `/playlist delete <이름>` : 플레이리스트 삭제
- `/playlist add <이름> <검색어|URL>` : 곡 추가
- `/playlist remove <이름> [index]` : 곡 제거
- `/playlist clear <이름>` : 플레이리스트 비우기
- `/playlist show` : 서버 내 전체 플레이리스트 목록 조회
- `/playlist info <이름>` : 플레이리스트 상세 조회
- `/playlist queue <이름>` : 플레이리스트 전체를 대기열에 추가

### ⚙️ 운영
- `/help` : 카테고리별 명령어 안내
- 음성 채널 인원 없을 시 5분 후 자동 퇴장
- Azure VM + systemd 데몬으로 상시 운영 구성

---

## 기술 스택

| 분류 | 내용 |
|---|---|
| 언어 | JavaScript (Node.js) |
| Discord SDK | discord.js v14, @discordjs/voice |
| 프로토콜 | Discord Voice (Opus / RTP / DAVE) |
| 스트리밍 | yt-dlp, ffmpeg |
| 보안 | AES-256-GCM |
| 호스팅 | Azure Cloud VM |
| 버전관리 | GitHub |

---

## 서비스 구조

### 스트리밍 파이프라인

```
yt-dlp → ffmpeg → @discordjs/voice → Discord 음성 채널
```

- WebM/Opus 직접 추출 우선 시도 (fast pipe)
- 300ms 내 데이터 미도착 시 ffmpeg 인코딩으로 폴백
- skip/stop 시 파이프라인 종료 순서 정의로 EPIPE/EOF 크래시 방지

### 재생 상태 관리 (FSM)

길드별 독립 `PlayerFSM` 인스턴스로 재생 상태를 관리합니다.  
전이 테이블 기반으로 유효하지 않은 상태 전이를 차단합니다.

```
IDLE → BUFFERING → PLAYING ↔ PAUSED
                 ↓
              STOPPED / ERROR
```

### 큐

- 길드별 인메모리 Map으로 격리
- `snapshot()`으로 불변 복사본 반환, 외부 직접 수정 불가

### 데이터 저장 구조

```
storage/data/
└── {guildId}/
    ├── catalog.json          ← 길드 플레이리스트 인덱스
    └── {userId}/
        └── {name}.json.enc   ← AES-256-GCM 암호화 플레이리스트
```

- `/playlist show` : 카탈로그만 읽어 응답, 암호화 파일 미접근
- `/playlist info` : 카탈로그에서 소유자 확인 후 해당 암호화 파일 복호화하는 2단계 조회
- Create/Delete 시점에만 카탈로그 갱신
- catalog.json 유실 시 디렉토리 스캔으로 자동 복구

### 암호화

- AES-256-GCM 적용, 파일마다 랜덤 IV 생성
- 마스터 키는 환경변수(`MASTER_KEY`) 또는 `config.json`에서 로드
- 암호화 페이로드에 `keyVersion`, `algo`, `iv`, `tag`, `data` 포함

### 동시성 제어

- Promise 체이닝 기반 뮤텍스
- 키 단위 (`pl:{guildId}:{userId}:{name}`) 직렬화
- 이전 작업 실패 시에도 체인 유지, 다음 작업 블로킹 방지

---

## 프로젝트 구조
 
```
JukeBox-Bot/
├─ bin/yt-dlp.exe                  # 음원 다운로더
├─ commands/                       # 슬래시 커맨드 정의 (입력 파싱 전담)
│  ├─ play/                        # 주크박스 조작 명령어
│  │  └─ [pause, play, resume, skip, stop].js
│  ├─ playlist/
│  │  └─ playlist.js               # show/info/create/delete 등 플레이리스 서브커맨드 허브
│  ├─ queue/                       # 주크박스 대기열 조작 명령어
│  │  └─ [add, clear, queue, remove, show, shuffle].js
│  └─ utility/
│  │  └─ [help, join, leave, ping, server, test, user].js # 보조 명령어
│
├─ components/                     # 런타임 구성요소 (실행·상태·플레이어)
│  ├─ youtube/
│  │  └─ youtube.js                # 검색·URL 해석
│  ├─ player.js                    # 길드별 AudioPlayer 런타임
│  ├─ queue.js                     # 길드별 대기열
│  └─ state.js                     # 길드별 FSM
│
├─ services/                       # 비즈니스 로직 (권한/검증/정책/트랜잭션)
│  └─ playlistService.js           # 플레이리스트 CRUD, 트랙 add/remove 등
│
├─ storage/                        # 데이터 저장소
│  ├─ schema/
│  │  ├─ document.js               # 문서(JSON) 스키마 검증·정규화·마이그레이션
│  │  └─ filesystem.js             # 파일 스키마 검증 + JSON 스펙 → 실제 파일 생성기
│  ├─ crypto.js                    # 암호화 엔진 (AES-GCM 기본, 3DES 옵션)
│  ├─ storage.js                   # 읽기/쓰기 + 암/복호화 + 락
│  └─ data/                        # .gitignore 처리 (실제 유저 데이터)
│     └─ {guildId}/
│        ├─ catalog.json           # 플레이리스트 조회용 서버별 카탈로그
│        ├─ logs/{YYYY-MM-DD}.log
│        └─ {userId}/
│           └─ playlist.json.enc
│
├─ utility/                        # 공통 유틸
│  ├─ logger.js                    # 로깅 어댑터
│  ├─ mutex.js                     # 파일 단위 직렬화 (동시 접근 방지)
│  └─ time.js                      # KST 래핑 모듈
│
├─ bot.js                          # 클라이언트·이벤트 바인딩
├─ config.json                     # 로컬 개발용 설정 (gitignore)
├─ deploy-commands.js              # 명령어 로컬 배포
├─ deploy-global.js                # 명령어 전역 배포
├─ .env                            # 운영 환경 변수 (gitignore)
├─ index.js                        # 엔트리
├─ jukebox.js                      # 퍼사드 (components 통합 단일 API)
└─ package.json
```

---

## 트러블슈팅

### 1. YouTube 오디오 스트림 추출 실패 → 봇 크래시

| | |
|---|---|
| **문제** | 음악 재생 요청 시 `ERR_INVALID_URL` · `403 Forbidden` 오류 발생하며 봇 다운 |
| **원인** | play-dl 라이브러리가 YouTube 인증/토큰 처리 방식 변경에 대응하지 못해 스트림 추출 실패 |
| **해결** | yt-dlp로 오디오 추출 후 ffmpeg로 Discord 재생 형식으로 변환하는 구조로 교체 |
| **결과** | 특정 라이브러리 의존도 제거, 안정적인 스트리밍 파이프라인 구성 |

### 2. Discord 음성 채널 재생 실패

| | |
|---|---|
| **문제** | 큐에는 정상 추가되지만 재생이 시작되지 않거나 봇 종료 |
| **원인** | DAVE 프로토콜 변경으로 기존 암호화 모드 deprecated, VoiceConnection이 Ready 진입 실패 |
| **해결** | libsodium-wrappers 도입으로 RTP 암호화 요구사항 충족 및 DAVE 프로토콜 대응 |
| **결과** | 음성 채널 정상 오디오 송출 확인 |

### 3. skip · stop 시 EPIPE/EOF 크래시

| | |
|---|---|
| **문제** | `/skip` 또는 `/stop` 호출 시 EPIPE/EOF 오류 발생 |
| **원인** | FFmpeg 프로세스와 AudioPlayer 간 스트림 종료 순서 불일치 |
| **해결** | 파이프라인 종료 → 송출 종료 순서 정의 + WebM/Opus 우선 · ffmpeg 폴백 구성 |
| **결과** | 크래시 방지 및 초기 재생 지연 감소 |

---

## 미해결 과제

Azure VM 데이터센터 IP가 YouTube 봇 탐지에 의해 차단되어 상시 운영이 어려운 상태입니다.  
IP 로테이션 · VPN 우회 등 현실적인 해결책이 없어 현재는 필요 시 로컬 환경에서 실행 중입니다.

---

## 봇 사용 방법

1. 아래 초대 링크로 서버에 봇 추가
2. 음성 채널 입장 후 `/join` 으로 봇 연결
3. `/help` 로 카테고리별 명령어 확인
4. `/play <검색어|URL>` 로 재생

> **봇 초대 링크** : [초대하기](https://discord.com/oauth2/authorize?client_id=1406904684823711785&permissions=3234304&integration_type=0&scope=bot)  
> 로컬 실행 환경 구성은 개발 과정 상세 글 참고

---

## 상세 개발 과정

- [#1 봇 생성하기](https://cyphen156.tistory.com/405)
- [#2 봇 활성화 및 코드 적용](https://cyphen156.tistory.com/406)
- [#3 명령어 배포](https://cyphen156.tistory.com/408)
- [#4 유튜브 연동](https://cyphen156.tistory.com/410)
- [#5 스트림 안정화](https://cyphen156.tistory.com/413)
- [#6 플레이리스트 저장 & 암호화](https://cyphen156.tistory.com/431)
- [#7 Azure VM 배포](https://cyphen156.tistory.com/432)

> 포트폴리오 소개 : [[Node.js] 디스코드 주크박스 봇](https://cyphen156.tistory.com/464)
