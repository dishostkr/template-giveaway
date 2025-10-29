# Discord.js TypeScript Boilerplate

이 리포지토리는 Discord.js(v14)와 TypeScript로 만든 간단한 봇 템플릿입니다. 빠르게 봇을 시작하고 커맨드/이벤트 구조를 따르기 쉽게 구성되어 있습니다.

## 주요 기능
- TypeScript 기반 구조
- 명령어(commands)와 이벤트(events) 분리
- 슬래시 커맨드 배포 스크립트(`src/deploy-commands.ts`)
- 간단한 스케줄러 예시(`src/scheduler.ts`)
- 환경 변수(.env) 사용 (`dotenv`)

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
  config.ts           # dotenv 로 환경변수 로드 및 검증
  deploy-commands.ts  # 슬래시 커맨드(등록) 스크립트 예시
  index.ts            # 엔트리 포인트
  scheduler.ts        # 스케줄 예시
  commands/           # 커맨드 정의 폴더
    ping.ts
    index.ts          # 커맨드 로더
  events/             # 이벤트 핸들러
    messageCreate.ts
```

새 커맨드나 이벤트를 추가할 때는 기존 구조를 참고해 `commands`/`events`에 파일을 추가하면 됩니다.

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
