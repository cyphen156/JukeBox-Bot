# JukeBox-Bot

Node.js + Discord.js 기반 Discord 음악 스트리밍 봇입니다.  
슬래시 명령어로 YouTube 음악을 재생·제어하고, 큐 및 개인 플레이리스트를 관리할 수 있습니다.

- **개발자** : 오융택
- **개발 기간** : 2025.08.18 ~ 2025.08.31 (7일 / 약 40시간)
- **레퍼런스** : discord.js 공식 문서

---

## 핵심 기능

### 🎵 음악 재생
- `/play <검색어|URL>` : YouTube 검색 또는 URL로 즉시 재생
- `/pause` `/resume` `/skip` `/stop` : 재생 제어

### 📋 큐 관리
- `/queue` : 현재 대기열 확인
- `/queue add/remove/clear/shuffle` : 대기열 조작

### 💾 플레이리스트
- 길드·유저·이름 단위로 저장
- AES-256-GCM 암호화 적용, 서버 파일시스템에 보관
- `/playlist show/info/create/delete/add/remove/queue` : CRUD 및 큐 적재

### ⚙️ 운영
- 음성 채널 인원 없을 시 5분 후 자동 퇴장
- Azure VM + systemd 데몬으로 상시 운영 구성

---

## 기술 스택

| 분류 | 내용 |
|---|---|
| 언어 | JavaScript (Node.js) |
| Discord SDK | discord.js v14, @discordjs/voice |
| 스트리밍 | yt-dlp, ffmpeg |
| 보안 | AES-256-GCM |
| 호스팅 | Azure Cloud VM |
| 버전관리 | GitHub |

---

## 봇 사용 방법

1. 아래 초대 링크로 서버에 봇 추가
2. `/join` 으로 음성 채널 연결
3. `/help` 로 명령어 확인
4. `/play <검색어|URL>` 로 재생

> **봇 초대 링크** : [초대하기](https://discord.com/oauth2/authorize?client_id=1406904684823711785&permissions=3234304&integration_type=0&scope=bot)

> 로컬 실행 환경 구성은 개발 과정 상세 글 참고

---

## 저장소 및 상세 글

- **GitHub** : [cyphen156/JukeBox-Bot](https://github.com/cyphen156/JukeBox-Bot)
- **개발 과정 상세** : [Cyphen - 토이프로젝트/디스코드 주크박스봇 만들기](https://cyphen156.tistory.com/category/%ED%86%A0%EC%9D%B4%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EB%94%94%EC%8A%A4%EC%BD%94%EB%93%9C%20%EC%A3%BC%ED%81%AC%EB%B0%95%EC%8A%A4%20%EB%B4%87)
- **포트폴리오 소개** : [[Node.js] 디스코드 주크박스 봇](https://cyphen156.tistory.com/464)
