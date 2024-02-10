---
title: Yarn Classic에서 Pnpm으로 with TurboRepo
date: "2024-02-10"
template: "post"
draft: false
slug: "/posts/from-yarn-classic-to-pnpm-with-turborepo"
category: "Tech"
description: "패키지 매니저 전환기"
---

> 해당 글은 동일한 내용으로 [회사 블로그](https://medium.com/wantedjobs/yarn-classic%EC%97%90%EC%84%9C-pnpm%EC%9C%BC%EB%A1%9C-%EC%A0%84%ED%99%98%ED%95%98%EA%B8%B0-with-turborepo-7c0c37cb3f9e)에 기고 되었습니다.

## Yarn Classic이 가진 문제

원티드스페이스 프로젝트는 Turbo Repo를 사용한 모노레포 구조에 패키지 매니저로는 Yarn Classic을 사용하고 있었습니다. Yarn Classic이란 Yarn 1.x 버전을 지칭 하는데요. 성능면에서 다소 느릴 뿐만 아니라 의존성 중복 저장 문제를 호이스팅을 통해 해결하기 때문에 유령 의존성 현상을 야기 할 수 있다는 단점이 존재합니다.

특히 모노레포 구조에서는 하나의 레포지토리에서 여러 프로젝트의 의존성을 관리해야 하기 때문에 프로젝트가 서로 다른 프로젝트의 의존성에 의존하는 등 더 빈번하고 크리티컬한 유령 의존성 현상이 발생할 수 있습니다. 실제로 원스 프로젝트에서도 [depcheck](https://www.npmjs.com/package/depcheck)를 통해 확인한 결과 다양한 유령 의존성이 존재함을 알 수 있었습니다.

### 유령 의존성 현상이란

과연 이 유령 의존성 현상이란 무엇이며 왜 문제가 되는 것 일까요? 한 번 짚고 넘어가겠습니다.

![https://classic.yarnpkg.com/blog/2018/02/15/nohoist/](/media/hoisting.png)

왼쪽과 같은 의존성 트리를 가진 프로젝트가 있다고 가정해 보겠습니다. 왼쪽 트리에서 **[A (1.0)]** 과 **[B (1.0)]** 을 두 번 설치 하는 것은 디스크 공간 측면에서 비효율적입니다. 따라서 Npm(ver 3~), Yarn Classic은 호이스팅 & 병합을 통해 오른쪽 트리와 같이 평탄화(flat) 된 종속성 트리로 모양을 바꿉니다. (놀랍게도 Npm ver 2 까지는 모든 의존성을 중복 설치했다고 합니다.) 이를 통해 디스크 공간을 절약하고 트리 경로 깊이 내려가지 않아도 최상위에서 원하는 의존성을 탐색할 수 있게 되므로 보다 효율적입니다.

그러나 이로 인해 프로젝트에서 직접 의존하고 있지 않은 패키지(위의 이미지 상에서는 [B (1.0)]에 해당)를 암묵적으로 참조하게 되는 경우가 발생합니다. 이것이 바로 유령 의존성 현상입니다. 이처럼 유령 의존성 현상이 발생하면 어떠한 의존성 파일을 지웠을 때 암묵적으로 참조 했던 패키지도 삭제될 수 있는 등 의존성 트리의 유효성을 보증 받기 어렵습니다.

## Why Pnpm?

앞서 언급한 문제점을 해결할 수 있는 방법으로는 크게 두 가지가 있습니다. 바로 Yarn Berry와 Pnpm 입니다. Yarn Berry 에서는 Plug’n’Play 전략을 통해 종속성 중복 저장 문제를 해결하며 호이스팅을 사용하지 않는 `nohoist`가 기본 값입니다.

![https://github.com/vercel/turbo/issues/693#issuecomment-1278886166](/media/turborepo-pnp.png)

그러나 원티드스페이스 프로젝트는 Turbo Repo로 구성 되어 있고 Turbo Repo에서는 Yarn Berry의 PnP를 지원하지 않기 때문에 실질적인 선택지는 Pnpm 하나 뿐 이였습니다. 하지만 Pnpm은 Npm 또는 Yarn Classic과 비교 했을 때 더 좋은 성능과 보안을 제공 하므로 객관적으로도 매력적인 옵션이라고 생각합니다.

![https://pnpm.io/benchmarks](/media/benchmark.png)

또한 Pnpm은 Npm과 사용법이 비슷하며 마이그레이션 과정이 단순하다는 점도 장점이라 생각되었습니다.

**결론적으로 Pnpm을 선택한 이유를 정리해보자면 다음과 같습니다.**

- 유령 의존성 문제를 해결하면서 현재 사용하고 있는 Turbo Repo와의 궁합이 가장 좋은 조합
- 기존에 사용하던 Yarn Classic과 비교해 설치와 실행이 빠르고 더 나은 보안성을 제공함
- Npm과 사용법이 비슷하며 (Yarn Berry와 비교하여) 마이그레이션 과정이 단순함

### Pnpm이 종속성 중복 저장 문제를 해결하는 방법

그렇다면 Pnpm은 어떤 방법으로 종속성 중복 저장 문제를 해결하고 유령 의존성을 없애는 것 일까요? Pnpm은 호이스팅 대신 [Content-addressable Store](https://pnpm.io/next/symlinked-node-modules-structure) 방식을 통해 중복 의존성 저장 문제를 해결합니다. 전역 스토어에 종속성을 설치한 다음 심볼릭 링크와 하드링크를 사용하여 디렉터리 구조를 구성하는 방식인데요 좀 더 자세히 살펴보자면 다음과 같습니다.

처음 Pnpm은 `<home dir>/.pnpm-store`에 종속성을 설치합니다. 이곳이 전역 스토어 이며 모든 종속성 버전은 해당 폴더에 물리적으로 한번만 저장 됩니다.

그런 다음 프로젝트에서 필요한 패키지를 프로젝트의 최상위 `node_modules/.pnpm` 경로에 [하드링크](https://pnpm.io/faq#why-does-my-node_modules-folder-use-disk-space-if-packages-are-stored-in-a-global-store)합니다. 여기서 말하는 필요한 패키지란 `package.json`에 나열되어 프로젝트에서 직접적으로 의존하는 의존성 뿐만 아니라 의존성의 의존성까지 포함합니다. 이렇게 필요한 모든 종속성은 `node_modules/.pnpm`디렉터리 아래에 평탄화 되어 위치합니다. 이후 `node_modules`의 최상위 종속성(프로젝트에서 직접적으로 의존하는 패키지를 의미합니다.)과 의존성의 의존성들을 평탄화 되지 않은 형태로 중첩되어(nested) 존재하며`node_modules/.pnpm`에 위치한 것들과 Symbolic Link로 연결됩니다.

예시로 `demo-foo@ 1.0.1` 과 `demo-baz@ 1.0.0`에 의존성을 가지는 `node_modules`의 구조를 그려본다면 다음과 같습니다.

![pnpm-dependency-tree](/media/pnpm-dependency-tree.png)

아직도 감이 안오신다면 다음은 프로젝트 구조에서 심볼릭 링크와 하드 링크가 어떻게 구성되는지 더 잘 이해할 수 있도록 도와주는 이미지입니다.

![pnpm-work](/media/pnpm-work.png)

결과적으로 모든 종속성은 전역 스토어에 물리적으로 한번만 저장되어 단일한 진실 공급원(**Single Source Of Truth)**를 구성하고 이를 통해 디스크 공간을 크게 절약합니다. 또한 `node_modules/.pnpm`디렉터리 아래에 하드링크된 의존성들을 평탄화 하여 위치 시킴으로써 유령 의존성 문제와 [Npm 도플갱어 문제](https://rushjs.io/pages/advanced/npm_doppelgangers/)를 해결합니다.

## Pnpm 도입 과정

자 그럼 실질적인 Pnpm 도입 과정에 대해서 설명하겠습니다. 원스 프로젝트는 Turbo Repo로 구성한 모노레포에 Pnpm을 도입하였으므로 이를 참고해주세요!

1. `npm install -g pnpm` 을 통해 Pnpm을 전역으로 설치 합니다.
2. Pnpm의 workspace 기능을 사용하면 모노레포를 지원할 수 있습니다. 모노레포 프로젝트의 루트에 [pnpm-workspace.yaml](https://pnpm.io/pnpm-workspace_yaml) 파일을 생성하고 workspace를 선언합니다.

   ```jsx
   packages: -"docs" - "apps/*" - "packages/*";
   ```

3. App에서 workspace package들을 별칭으로 참조할 수 있도록 apps 내부 프로젝트의 package.json 파일을 수정합니다.

   ```jsx
   // root/apps/dashboard/package.json

   {
   	"dependencies": {
         "@wantedspace-inc/api": "workspace:*",
         "@wantedspace-inc/constants": "workspace:*",
         "@wantedspace-inc/css": "workspace:*",
         "@wantedspace-inc/hooks": "workspace:*",
         "@wantedspace-inc/icons": "workspace:*",
         ...
     }
   }
   ```

4. 프로젝트의 루트에 `.npmrc` 파일을 생성하여 추가적인 설정을 해줄 수 있습니다.

   `.npmrc`에서 `node-linker=hoisted` 옵션을 사용하면 Yarn Classic과 같은 방식으로, `node-linker=pnp`로 사용하면 Plug’n’Play 방식으로 사용할 수 있습니다. 다만 저는 추가적인 세팅이 필요하지 않아 `.npmrc` 파일을 생성하지 않았습니다.

5. 모든 `node_modules`와 캐시를 삭제하고 `pnpm install` 명령어를 통해 의존성들을 재설치 한 뒤 로컬에서 App이 잘 실행되는지 확인합니다. 기존에 유령 의존성 문제가 존재하지 않았다면 프로젝트가 로컬에서 잘 실행이 되었겠지만 저의 상황은 그렇지 못했습니다. 유령 의존성으로 인한 각종 에러메세지와 만나게 되었습니다.

6. 프로젝트 내에 존재하는 유령 의존성을 좀 더 쉽고 빠르게 찾기 위해 [depcheck](https://www.npmjs.com/package/depcheck)를 이용했습니다. `depcheck`는 프로젝트의 종속성들을 분석하여 불필요한 종속성, 유령 의존성 등을 찾아주는 툴 입니다.

   ![depcheck](/media/depcheck.png)

   의존성 분석 결과를 참고하여 유령 의존성은 설치하거나 적절한 의존성을 사용할 수 있도록 수정해주고 불필요한 의존성은 삭제합니다.

7. Resolution 등 의존성과 관련해 설정한 것들이 있다면 이 역시 Pnpm 환경에서 적용될 수 있도록 잘 이관해줍니다.

8. 원스 프로젝트는 Amplify Preview를 스테이징 환경으로 사용 하는데요. 여기서 약간의 문제가 있었습니다. Pnpm은 심볼릭 링크를 지원하지 않는 환경에서는 동작하지 않습니다. 따라서 lambda와 같은 서버리스 호스팅 환경이나 Electron App에서는 사용할 수 없습니다. 관련한 이슈를 [여기](https://github.com/orgs/nodejs/discussions/37509)에서 확인할 수 있으며 Pnpm 공식문서에서는 다음과 같은 경우 [node-linker=hoisted 옵션을 사용해 해결](https://pnpm.io/npmrc#node-linker)할 것을 권장합니다. AWS에서도 [Turborepo 및 pnpm 모노레포 앱 구성](https://docs.aws.amazon.com/ko_kr/amplify/latest/userguide/monorepo-configuration.html#turborepo-pnpm-monorepo-configuration)과 관하여 같은 해결책을 제안합니다.

   그러나 `node-linker=hoisted` 옵션을 사용한다는 것은 호이스팅을 이용해 중복 종속성을 해결한다는 뜻이고 이는 Pnpm으로 전환한 의미가 퇴색된다고 생각했습니다. 뿐만 아니라 실제 프로덕션 빌드 시에는 Github Action를 사용하고 있었기 때문에 `node-linker=hoisted`를 사용하지 않고도 정상적으로 배포가 가능한 상황이였습니다.

   따라서 프로젝트 루트에 `.npmrc`를 생성해 호이스팅 설정을 하는 대신 Amplify 빌드 설정에 `echo "node-linker=hoisted" > .npmrc` 명령어를 추가했습니다. Amplify 빌드 설정을 담고 있는`amplify.yml`의 전체 내용은 다음과 같습니다.

   ```jsx
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm install -g pnpm
               - cd ../../
               - echo "$PWD"
               - echo "node-linker=hoisted" > .npmrc
               - pnpm install --no-frozen-lockfile
           build:
             commands:
               - echo "$PWD"
               - if [ $NODE_ENV_VARIABLES = ".env.development" ]; then cat "./$AMPLIFY_MONOREPO_APP_ROOT/$NODE_ENV_VARIABLES" > "./$AMPLIFY_MONOREPO_APP_ROOT/.env.production"; fi
               - pnpm run "build:$AMPLIFY_MONOREPO_APP"
         artifacts:
           baseDirectory: build
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
       appRoot: apps/dashboard
   ```

   Amplify Preview 에서 정상적으로 잘 빌드 되는 것을 확인할 수 있었습니다.

9. 이후 프로덕션 빌드를 수행하는 Github Action에서 Pnpm install cache를 사용할 수 있도록 workflow를 변경하였습니다. [pnpm/action-setup](https://github.com/pnpm/action-setup) 플러그인 레포지토리에 사용방법이 친절하게 나와 있으며 코드는 다음과 같습니다.

   ```jsx
   - name: Install pnpm
     uses: pnpm/action-setup@v2
     with:
       version: 8
       run_install: false

   - name: Get pnpm store directory
     id: pnpm-store-dir-path
     shell: bash
     run: |
       echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

   - name: Setup pnpm cache
     uses: actions/cache@v3
     id: pnpm-cache
     with:
       path: ${{ env.STORE_PATH }}
       key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
       restore-keys: |
         ${{ runner.os }}-pnpm-store-

   - name: Install dependencies
     run: pnpm install --no-frozen-lockfile
   ```

## 도입 후 결과

이 후 얼마간의 테스트 기간을 거쳐 프로덕션 배포를 성공적으로 진행하였습니다.

Pnpm 마이그레이션 이전과 이후의 `node_modules` 크기를 비교해 보았을 때 다소 늘어난 것을 확인할 수 있었는데요. 유령 의존성을 직접 의존할 수 있도록 설치한 점, 모노레포 내 프로젝트에서 같은 라이브러리의 서로 다른 버전 사용하는 점 등이 영향을 미쳤을 것으로 예상되어 관련한 최적화 작업을 진행할 계획입니다.

모노레포 내의 A 프로젝트에서는 React 17을 B 프로젝트에서는 React 18을 사용한다고 가정할 경우, `node_modules/.pnpm`에는 React 17과 18이 모두 나열되고 공간을 차지하게 되어 디스크 공간 측면에서 비효율적입니다. 따라서 가능하다면 프로젝트에서 공통으로 사용하는 의존성들은 같은 버전으로 맞춰주는 것이 이상적인데요. 이 경우 [syncpack](https://jamiemason.github.io/syncpack/)을 사용하면 각 프로젝트에서 일치 하지 않는 의존성 버전을 분석해주고 autofix 기능도 제공해주니 사용을 고려해볼 수 있겠습니다.

또한 속도 면에서는 Amplify Preview에서는 의존성 설치 시간이 Done in 74.52s → Done in 25.1s 정도로 약 3배 정도 단축 되었으며, Github action에서는 평균적으로 45~50초 정도 걸리던 설치 시간이 25-30초 정도로 줄어드는 등 개선이 이뤄진 것을 확인할 수 있었습니다.

추가적으로 Pnpm과 직접적 연관이 있는 것은 아니나 Turbo Repo를 사용하면서 빌드 툴로 Github Action을 사용하고 있다면 Vercel의 Remote Cache를 사용하지 않아도 [github actions/cache를 사용하여 CI 단계별 캐싱](https://turbo.build/repo/docs/ci/github-actions#caching-with-github-actionscache)을 적용해 빌드 속도를 개선할 수 있는 여지도 있습니다. 참고 사항으로 언급해두겠습니다.

마지막으로 저는 과거 다른 프로젝트에서 Yarn Classic → Yarn Berry(PnP)으로 전환한 경험이 있는데요. 당시 `node_module`을 사용하지 않고 의존성을 `.zip` 포맷으로 저장하는 Yarn Berry PnP의 특성상 IDE에서 zip 파일로 된 종속성을 읽어올 수 있도록 추가적인 세팅이나 extension을 설치하는 과정이 다소 번거롭게 느껴졌었습니다. 이에 반해 Pnpm으로 변환하는 과정은 보다 단순하여 편리하다는 생각이 들었습니다.

또한 Pnpm을 통해 모노레포 환경에서 엄격한 의존성 관리가 가능하게 되어, 특히 Turbo Repo를 사용하고 있다면 적극 추천하는 선택지이며 Turbo Repo를 사용하지 않더라도 한 번 쯤 도입을 고려해볼만한 매력적인 기술인 것 같습니다.

<br />
<br />

### 별책부록

위에 내용까지가 회사 블로그에 기고한 내용이고 이 곳에는 나만의 별책부록을 작성해본다. 이 글을 작성하기 위해서 각종 자료와 공식문서를 꼼꼼히 찾아 읽고 Pnpm뿐만 아니라 YarnBerry와 Yarn, Npm까지 패키지 매니저의 동작방식에 대해서 더 잘 이해할 수 있게 되었다. 역시 글로 정리하면서 더 많이 배운다.

패키지 매니저를 비교한 글들을 읽다보면 Npm(Ver 3-), Yarn Classic에서 평탄화된 `node_modules`라는 말이 자주 등장하는데, Pnpm 관련 글을 읽으면서도 자꾸 평탄화 언급이 나와서 처음에는 무슨 차이인지 다소 햇갈렸다. 하지만 핵심만 살펴보자면 다음과 같다.

Npm과 Yarn Classic은 `node_modules`를 직접적인(물리적인) 저장소로 사용하며 이를 효율적으로 사용하기 위해 `node_modules`’**를**’ 평탄화 한다. 그러나 Yarn Berry나 Pnpm은 `node_modules`를 직접적인 저장소로 사용하지 않고 따로 저장소를 둔다. Yarn Berry나 Pnpm은 저장소를 따로 둔 대신 중첩된 `node_modules`를 가진다 대신 저장소를 평탄화 하는데 이것이 핵심이다. 좀 더 정확히 말하자면 Yarn Berry P’n’P에서는 `node_modules` 자체를 없애고 `.pnp.cjs`로 대체하는데 `.pnp.cjs` 파일에 중첩된 형태의 의존성 트리를 기술해놓는다. 그리고 Yarn Berry는 인터페이스 링커를 Pnpm은 하드링크와 심볼링 링크를 이용해 저장소와 `node_modules`를 연결해서 사용하는 것이다.

따라서 마지막으로 링커에 대해 설명하고 이 글을 마무리 하려고 한다.

#### 링커란?

링커는 서로 다른 소프트웨어 컴포넌트나 시스템 간의 인터페이스를 연결하는 역할을 하는 소프트웨어나 도구를 가리킵니다.

하드링크와 심볼릭 링크(심볼릭 링크를 흔히 "심볼릭 링크" 또는 "소프트링크"라고 부릅니다)는 파일 시스템에서 파일이나 디렉토리를 참조하는 두 가지 주요 방법입니다. 이러한 링크는 운영 체제의 파일 관리에서 중요한 역할을 하며, 사용자가 파일이나 디렉토리에 대한 다양한 경로나 이름으로 접근할 수 있게 해줍니다. 하드링크와 심볼릭 링크는 기능적으로 다르며, 각각의 특성을 아래에서 설명합니다.

**하드링크**

- 하드링크는 파일의 실제 위치를 가리키는 포인터입니다. 하드링크를 생성하면, 원본 파일과 같은 파일 시스템 내의 데이터 블록을 참조하는 새로운 디렉토리 엔트리가 만들어집니다.
- 하드링크는 원본 파일과 동일한 파일 시스템 내에 있어야 합니다.
- 하드링크를 통해 파일에 접근하면, 원본 파일이 삭제되어도 링크를 통해 여전히 데이터에 접근할 수 있습니다. 파일 시스템은 모든 하드링크가 삭제될 때까지 파일의 데이터를 유지합니다.
- 하드링크는 파일의 내용에 대한 다른 "이름" 또는 "경로"를 제공하지만, 원본 파일과 완전히 동일한 권한과 속성을 가집니다.
- 디렉토리에 대한 하드링크를 만드는 것은 대부분의 운영 체제에서 허용되지 않습니다.

**심볼릭 링크 (소프트링크)**

- 심볼릭 링크는 다른 파일이나 디렉토리를 가리키는 파일입니다. 이는 원본 파일의 경로를 저장하는 별도의 파일로, 원본 파일이나 디렉토리의 "단축 경로" 또는 "참조" 역할을 합니다.
- 심볼릭 링크는 다른 파일 시스템에 있는 파일이나 디렉토리를 가리킬 수 있습니다.
- 원본 파일이 삭제되면 심볼릭 링크는 더 이상 유효하지 않은 참조(종종 "끊어진 링크"라고 함)가 됩니다.
- 심볼릭 링크는 원본 파일과는 독립적인 권한과 속성을 가질 수 있으며, 파일의 실제 내용 대신 경로 정보만을 포함합니다.
- 심볼릭 링크는 파일뿐만 아니라 디렉토리에도 사용될 수 있습니다.

하드링크와 심볼릭 링크는 용도에 따라 선택하여 사용할 수 있습니다. 예를 들어, 데이터의 중복을 방지하면서 여러 위치에서 동일한 파일에 접근해야 할 때 하드링크를 사용할 수 있습니다. 반면, 다른 파일 시스템에 있는 파일이나 디렉토리에 대한 참조가 필요할 때는 심볼릭 링크가 더 적합할 수 있습니다.

<br />

### 참고자료

- [nohoist in Workspaces](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/)
- [JavaScript package managers compared: npm, Yarn, or pnpm? - LogRocket Blog](https://blog.logrocket.com/javascript-package-managers-compared/)
- [Inside the pain of monorepos and hoisting](https://www.jonathancreamer.com/inside-the-pain-of-monorepos-and-hoisting/)
- [How to Easily Manage Dependencies in a JS Monorepo](https://blog.bitsrc.io/how-to-easily-manage-dependencies-in-a-js-monorepo-6216bd6621ea)
- [How does pnpm work](https://dev.to/chlorine/how-does-pnpm-work-5mh)
- [Configure pnpm for the best possible developer experience | Adam Coster](https://adamcoster.com/blog/pnpm-config)
- [A story of how we migrated to pnpm - ‹div›RIOTS](https://divriots.com/blog/switching-to-pnpm/)
