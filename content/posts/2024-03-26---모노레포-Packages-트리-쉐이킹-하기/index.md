---
title: 모노레포 Packages Tree-Shaking 하기
date: "2024-03-26"
template: "post"
draft: false
slug: "/posts/tree-shaking-monorepo-packages"
category: "Tech"
description: "습득한 지식 활용해보기"
tags:
  - "Tree-Shaking"
  - "트리쉐이킹"
---

지난 글에서 트리쉐이킹의 원리와 동작에 대해서 알아본 이후 나는 이를 이용해서 회사 레포의 Packages를 트리쉐이킹 할 계획을 세웠다. 그리고 이 글에서는 그 과정과 결과에 대해 공유해보고자 한다.

## 프로젝트의 구조와 조건 사항

우선 어떤 상황에서 트리쉐이킹을 시도했는지 그 상황과 조건에 대해 설명해야 할 것 같다. 프로젝트의 구조는 Turbo Repo로 설정된 모노레포 구조로 `apps`/`docs`/`packages` 이렇게 세 개의 워크스페이스를 갖고 있다. `apps` 하위에는 **Dashboard**(웹) 와 **mobile**(웹 앱) 두 개의 레포가 존재하고, `packages`의 하위에는 ui, css, hooks, types 등 대시보드와 모바일에서 공통적으로 사용되는 요소들이 패키지로 묶여있는 형태다.

```
├── apps
│   ├── dashboard
│   └── mobile
├── docs
└── packages
    ├── ui
    ├── css
    ├── hooks
    ├── types
    ├── tsconfig  // 실제로는 더 많은 패키지들이 존재
    └── sortable-tree
```

**dashboard**와 **mobile** 레포는 Vite로 번들링 되고 있으며 `vite.config` 파일에 트리쉐이킹을 위한 추가적인 옵션을 지정하지는 않았다. 또한 **packages** 워크 스페이스 하위의 패키지들은 `sortable-tree`를 제외하고는 모두 패키지 자체적으로 번들러를 사용하여 빌드하지 않는 패키지이며, 대시보드와 모바일에서는 다음과 같은 형태로 패키지들에 의존하고 있다.

```
// apps/dashboard/package.json

 "dependencies": {
    "@companyname-inc/api": "workspace:*",
    "@companyname-inc/constants": "workspace:*",
    "@companyname-inc/css": "workspace:*",
    "@companyname-inc/hooks": "workspace:*",
    "@companyname-inc/icons": "workspace:*",
    "@companyname-inc/lib": "workspace:*",
    "@companyname-inc/sortable-tree": "workspace:*",
	   ....
```

## AS-IS

일단 **dashboard** 와 `packages/ui`를 기준으로 트리 쉐이킹이 되고 있는지, 즉 **dashboard**를 빌드했을 때 `packages/ui`의 모든 코드가 함께 번들링 되는 것이 아니라 **dashboard**에서 사용하는 `packages/ui`의 코드만 번들링 되는지를 확인하기로 했다. 결과를 보다 명확하게 확인하기 위해서 `packages/ui` 안에 `TestButton`를 작성하고 export 한 뒤, dashboard에서는 `TestButton`를 사용하지 않은 상태로 (import 하지 않음) 확인을 진행했다.

![no-tree-shaking](/media/no-tree-shaking.png)

[vite-bundle-visualizer](https://github.com/KusStar/vite-bundle-visualizer#readme)를 이용해 번들링 한 결과물을 확인했다. **dashboard**에서 `TestButton` 컴포넌트를 사용하지 않았음에도 불구하고 결과물에 `TestButton`이 포함된 것을 확인할 수 있다. 즉 `packages/ui`**가 트리쉐이킹 되지 않고 있음**을 확인할 수 있었다.

## Packages 트리쉐이킹 시도하기 (TO-BE Tree Shaking)

### 가설 1) packages/ui의 package.json에 type: 'module' 옵션 추가하기

앞선 글을 통해 ESM으로 작성된 코드를 번들러로 번들링 할 경우 기본적으로 트리쉐이킹이 수행된다는 것을 알게 되었기 때문에 생각한 가설이다. `package.json`에 `type: 'module`' 을 추가 한다는 것은 해당 레포지토리의 `.js` 확장자 파일은 ESM으로 작성된 파일이라는 것을 의미한다.

따라서 `packages/ui`의 `package.json`에 `type: 'module'`을 추가하고 빌드를 진행했다. 여기서 빌드한 것은 `packages/ui`를 의존성으로 가지고 있는 **dashboard**를 빌드한 것이며, 앞서 언급 하였듯 `packages/ui`는 자체적인 번들러로 빌드 하지 않는 패키지이다.

![no-tree-shaking](/media/no-tree-shaking.png)

`type: 'module'`을 추가하지 않은 것과 차이가 없이 여전히 트리쉐이킹이 수행되지 않았다. 아마도 `packages/ui` 자체적으로 번들러를 두고 번들링 하는 것이 아니기 때문에 `type: 'module'` 옵션의 영향도가 없었을 것으로 추측했다. (사실 보통 레포지토리에서 cjm 형태로 코드를 작성하고 package.json에 `type:module`을 추가한 뒤 번들링하면 작성한 코드가 ESM의 문법에 맞지 않기 때문에 에러가 발생하는데 그 에러가 발생하지 않는 것 부터 뭔가 이상하다는 생각은 들었다 🤫)

`packages.json`에 `type:module` 을 추가하는 방법이 아니라 `packages/ui` 의 js 파일의 확장자를 `mjs`로 바꾸고 내부 코드를 ESM 형식으로 변경 했다면 트리쉐이킹이 잘 되었을 수도 있으나 이 방법을 적용하기엔 공수가 너무 커서 일단 여기서 1번 가설은 확인을 마쳤다.

### 가설 2) packages/ui의 package.json에 sideEffects: false 옵션 추가하기

Vite나 Rollup의 공식문서에는 `package.json`에 `sideEffects: false` 옵션을 추가했을 때, 특히 의존성 패키지의 `package.json`에 `sideEffect:false` 옵션을 추가했을 때 정확히 어떠한 동작이 수행 되는지에 대해서 언급은 찾지 못했지만, 범용적인 방법이기 때문에 해당 가설을 세우고 실행시켜 확인해보았다. (당연히 Vite나 Rollup의 config 파일에서는 최적화(tree-shaking)에 적용할 수 있는 sideEffect 옵션들이 있다.)

![package-tree-shaking](/media/package-tree-shaking.png)

`sideEffects: false` 옵션 추가 후 빌드 했을 때 **트리쉐이킹이 잘 수행되는 것을 확인**했다! 빌드 결과물에서 `TestButton`은 물론 사용하지 않는 컴포넌트들이 사라졌다! 기존 24.29kb 였던 `packages/ui/components` 청크의 사이즈도 6.91kb로 **약 17kb 정도가 줄어든 것을 확인**할 수 있었다. 빌드의 주체가 되는 번들러는 **dashboard**의 번들러이지만 의존성(패키지)의 `package.json`에 `sideEffect`옵션도 번들링에 영향을 준다는 것을 확인할 수 있었다.

(그러나 패키지의`package.json`에 `sideEffect` 옵션이 구체적으로 어떤 과정을 통해 Vite의 트리쉐이킹을 트리거 시키는지는 찾지 못했다 🥹 정말 제대로 파악하려면 소스코드를 파보거나 해야겠지만…)

## 님아 그 호기심의 강을 건너지마오

### 추가적인 의문 해결, 적절한 트리쉐이킹이 이뤄지고 있는가 🤔?

![package-tree-shaking](/media/package-tree-shaking.png)

그런데 나는 이 결과를 확인하고 한가지 이상한 점을 발견했다. `packages/ui/components`에 `inputWithUnit` 컴포넌트가 존재하지 않았다. `inputWithUnit`은 내가 비교적 최근에 만들고 사용한 컴포넌트여서 **dashboard**에서 사용하고 있는 컴포넌트 라는 것을 정확하게 인지하고 있었다.

> 💡 혹시 부적절한 트리쉐이킹으로 필요한 코드가 누락된 것은 아닐까?

확인해 보기로 했다.

1. 빌드한 파일을 띄우고 `inputWithUnit`이 사용되는 페이지가 정상적으로 노출 & 동작 하는지 확인

   → 정상적으로 노출/동작하는 것을 확인했다.

2. `vite-bundle-visualizer`를 통해 `inputWithUnit`이 사용된 페이지가 어떤 파일명으로 빌드되었는지 확인 (`index-c2e221fb.js`) 그리고 그 빌드 파일에 inputWithUnit이 존재하는지 확인

   → 해당 파일에서 `inputWithUnit`의 **displayName**을 확인할 수 있었다.

   참고로 [DisplayName](https://ko.legacy.reactjs.org/docs/react-component.html#displayname) 문자열은 디버깅 메시지 표시에 사용되기 때문에 명시적으로 이 값을 지정해 놓으면 디버깅시에 도움을 받을 수 있다.

   ![search-inputwithunit](/media/search-build.png)

그럼 여기서 생길 수 있는 합리적인 의문이 있다.


> 💡 사실 `TestButton`이나 다른 사용하지 않는 컴포넌트들도 트리쉐이킹 된 것이 아니라 그냥 다른 청크에서 빌드된 것 아닌가?


→ `TestButton`을 비롯해 `packages/ui`에 있는 모든 컴포넌트는 **DisplayName**을 지정해 놓았고, 빌드 결과물에서 `TestButton`을 확인할 수 없는 것으로 미뤄보아 사용하지 않는 컴포넌트들은 트리쉐이킹 된 것을 알 수 있었다. 참고로 `sideEffects: false`를 추가하기 전 빌드 결과물에서는 `TestButton`이 검색 되었다.

### 최종 결과

`packages/ui` 뿐만 아니라 모노레포 내의 다른 패키지들에도 `sideEffects: false` 옵션을 적용하여 트리쉐이킹이 수행되도록 했다.

**AS-IS**
![tree-shaking-as-is](/media/tree-shaking-as-is.png)

**TO-BE**

![tree-shaking-to-be](/media/tree-shaking-to-be.png)

그 상태로 **dashboard**를 빌드한 결과 **번들 사이즈가 약 17kb 줄어든 것을 확인**할 수 있었다. (빌드 속도도 체크해 보았지만 로컬 빌드 기준으로 0.n초 정도 줄어들거나 거의 차이가 없었다.) 애초에 **packages**의 코드 대부분을 **dashboard**에 사용하고 있어서 미미한 축소 효과밖에 얻지 못했지만 트리쉐이킹에 성공 했다는 점과 앞으로 **packages**에 존재하는 사용하지 않는 코드들이 함께 번들링 되지 않는다는 안정감(^^)을 얻게 된 것에 의의를 두면서 이 글을 마친다.

아 그리고 드디어 블로그에 댓글 기능을 달아서 이 말을 쓸 수 있게 되었다. 글을 읽다가 틀린 점이 발견되면 언제든 댓글 부탁드립니다!
