# Discord.js TypeScript 추첨(Giveaway) 봇 템플릿

이 리포지토리는 Discord.js(v14)와 TypeScript로 만든 추첨(Giveaway) 봇 템플릿입니다. 슬래시 커맨드로 추첨을 생성하고 관리하며, 봇 재시작 시에도 모든 추첨이 자동으로 복구됩니다.

## 주요 기능
- **추첨 생성 및 관리**: 슬래시 커맨드로 추첨 이벤트를 쉽게 생성하고 관리
- **자동 복구**: 봇이 재시작되어도 진행 중인 추첨이 자동으로 복구
- **다국어 지원**: 한국어 로컬라이제이션 내장 (Discord.js 내장 함수 사용)
- **시간 변환**: 사용자 친화적인 시간 형식 (예: 1d 12h 30m)
- **파일 기반 저장소**: 별도 데이터베이스 없이 JSON 파일로 관리

## 추첨 명령어

### `/giveaway start` (추첨 시작)
새로운 추첨을 시작합니다.
- **기간**: 추첨 기간 (예: 1d, 12h, 30m, 1d 12h 30m)
- **당첨자수**: 당첨자 수
- **경품**: 추첨 경품
- **채널**: 추첨을 게시할 채널 (선택 사항, 기본값: 현재 채널)

### `/giveaway reroll` (재추첨)
종료된 추첨의 당첨자를 다시 뽑습니다.
- **메시지-id**: 추첨 메시지 ID

### `/giveaway end` (조기 종료)
진행 중인 추첨을 조기 종료합니다.
- **메시지-id**: 추첨 메시지 ID

## 기술 스택
- **언어**: Node.js + TypeScript
- **라이브러리**: Discord.js v14 (Partials 활성화)
- **데이터 저장**: giveaways.json (루트 디렉터리)
- **시간 변환**: ms 라이브러리

## 요구사항
- Node.js 18 이상 권장
- npm

## 빠른 시작

1. 리포지토리 복제

```bash
git clone <your-repo-url>
cd template-djs-boilerplate
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 다음 값을 채우세요:

```
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

4. 개발 모드로 실행

```bash
npm run dev
```

5. 빌드 및 시작 (프로덕션)

```bash
npm run build
npm start
```

> package.json에 정의된 스크립트:

- `dev` : `tsx watch src/index.ts` (개발 중 빠른 재시작)
- `build`: `tsc -p tsconfig.json` (TypeScript 컴파일)
- `start`: `npm run build && node dist/index.js` (빌드 후 실행)

## 환경 변수
`src/config.ts`에서 사용되는 환경 변수는 다음과 같습니다:

- `DISCORD_TOKEN` - 봇 토큰
- `DISCORD_CLIENT_ID` - 애플리케이션(클라이언트) ID

필수 변수들이 설정되어 있지 않으면 실행 시 에러가 발생합니다.

## 프로젝트 구조

```
src/
  config.ts                # dotenv로 환경변수 로드 및 검증
  deploy-commands.ts       # 슬래시 커맨드(등록) 스크립트
  index.ts                 # 엔트리 포인트
  scheduler.ts             # 스케줄 예시
  giveaway-utils.ts        # 추첨 유틸리티 함수 (복구, 종료 등)
  commands/                # 커맨드 정의 폴더
    giveaway.ts            # 추첨 명령어
    ping.ts
    index.ts               # 커맨드 로더
  events/                  # 이벤트 핸들러
    messageCreate.ts
giveaways.json             # 추첨 데이터 저장 파일
```

새 커맨드나 이벤트를 추가할 때는 기존 구조를 참고해 `commands`/`events`에 파일을 추가하면 됩니다.

## 핵심 기능 설명

### 1. 추첨 복구 (Persistence)
봇이 시작되면 `giveaways.json` 파일에서 활성 추첨을 읽어와 자동으로 복구합니다:
- 종료 시간이 지난 추첨: 즉시 `endGiveaway()` 실행
- 종료 시간이 남은 추첨: 남은 시간만큼 타이머 재설정

### 2. 추첨 종료 처리
`endGiveaway()` 함수는 다음을 수행합니다:
1. 메시지의 🎉 반응을 가져와 참가자 목록 생성
2. 당첨자를 랜덤으로 선정
3. 결과를 한국어로 공지
4. 원본 임베드를 "추첨 종료" 상태로 수정
5. `giveaways.json`에서 상태 업데이트 (isActive: false)

### 3. 시간 형식
`ms` 라이브러리를 사용하여 사용자 친화적인 시간 형식을 지원합니다:
- `1d` = 1일
- `12h` = 12시간
- `30m` = 30분
- `1d 12h 30m` = 1일 12시간 30분 (조합 가능)

## 슬래시 커맨드 배포

개발 시 TypeScript 파일을 직접 실행하려면 `tsx`를 사용합니다:

```bash
npx tsx src/deploy-commands.ts
```

프로덕션 환경에서는 먼저 빌드한 뒤 dist 파일을 실행하세요:

```bash
npm run build
node dist/deploy-commands.js
```

> 배포 스크립트는 Discord 애플리케이션에 커맨드를 등록합니다. GUILD 단위 배포/전역 배포 등 스크립트 내용을 확인해 필요에 맞게 조정하세요.

## 명령어·이벤트 추가 가이드

1. `src/commands` 폴더에 새 커맨드 파일을 추가합니다. 기존 `ping.ts`를 참고하세요.
2. `src/commands/index.ts`에서 새 커맨드를 내보내도록 추가합니다.

## 출처(Attribution)

이 템플릿을 기반으로 한 프로젝트는 원저작자 표기(출처)를 남기면 됩니다. 예시 문구:

```
This project is based on dishostkr/template-djs-boilerplate (https://github.com/dishostkr/template-djs-boilerplate)
```

또는 한글 문구로:

```
이 프로젝트는 dishostkr/template-djs-boilerplate를 기반으로 합니다 (https://github.com/dishostkr/template-djs-boilerplate)
```

출처 표기를 하려면 README, 프로젝트 홈페이지, 혹은 배포 패키지의 적절한 위치에 위 문구를 포함시키면 됩니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 리포지토리 루트의 `LICENSE` 파일을 확인하세요.

요약: 이 템플릿을 사용한 프로젝트는 원저작자 표기(출처)를 남기면 됩니다(MIT의 저작권 고지 유지).
