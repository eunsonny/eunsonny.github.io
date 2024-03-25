---
title: 모노레포 Packages Tree-Shaking 하기
date: "2024-03-26"
template: "post"
draft: true
slug: "/posts/tree-shaking-monorepo-packages"
category: "Tech"
description: "모노레포의 Packages 트리쉐이킹 하기"
tags:
  - "Tree-Shaking"
  - "트리쉐이킹"
---

지난 글에서 트리쉐이킹의 원리와 동작에 대해서 알아본 이후 나는 이를 이용해서 회사 레포의 Packages를 트리쉐이킹 할 계획을 세웠다. 그리고 그것은 수행 되었으며(?) 이 글에서는 그 과정과 결과에 대해서 적어보려 한다.

우선 프로젝트의 구조에 대해서 간단하게 설명해보자면 Turbo Repo로 구성된 모노레포 구조인데 `apps`, `docs`, `packages` 이렇게 세 개의 워크스페이스를 갖고 있다. `apps` 하위에는 대시보드(웹) / 모바일 두 개의 레포가 존재하고, `packages`의 하위에는 ui, css, hooks, types 등 웹과 모바일에서 공통적으로 사용되는 요소들이 패키지로 묶여있는 형태다.

```
├── apps
│   ├── dashboard
│   └── mobile
├── docs
└── packages
    ├── ui
    ├── css
    ├── hooks
    ├── types  // 실제로는 더 많은 패키지들이 존재
    └── tsconfig
```

**dashboard**와 **mobile** 레포는 Vite로 번들링 되고 있으며 packages 하위의 패키지들은 하나를 제외하고는 모두 번들러를 사용하여 번들링하지 않는 패키지이다.

일단 **dashboard** 와 `packages/ui`를 기준으로 트리쉐이킹이 되고 있는지를 확인했다. 보다 정확하게 확인하기 위해서 `packages/ui` 안에 `TestButton`를 작성하고 export 한 뒤, dashboard에서는 `TestButton`를 사용하지 않았다. (import 하지 않음)

![no-tree-shaking](/media/no-tree-shaking.png)
`vite-bundle-visualizer`를 이용해 번들 결과물을 확인했다. dashboard에서 TestButton을 사용하지 않았음에도 불구하고 빌드 결과물에 `TestButton`이 포함된 것을 확인할 수 있다. 

## 트리쉐이킹 시도하기
### packages/ui의 package.json에 type: 'module' 옵션 추가하기

### packages/ui의 package.json에 sideEffects: false 옵션 추가하기
