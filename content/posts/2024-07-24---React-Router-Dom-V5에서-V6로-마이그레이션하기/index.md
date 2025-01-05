---
title: React Router Dom V5에서 V6로 마이그레이션 하기
date: "2024-07-24"
template: "post"
draft: false
slug: "/posts/migrate-react-router-dom-v5-to-v6"
category: "Tech"
description: "기술부채 해치우기"
tags:
  - "React Router Dom"
  - "마이그레이션"
---

> 지난 2024년 7월 회사 프로젝트의 React Router Dom V5에서 V6로 마이그레이션 하고 동료들에게 공유했던 글을 조금 다듬어 공유해봅니다.

## 마이그레이션 배경

회사 프로젝트는 기존에 React-router-dom 5.3.4 버전을 사용하고 있었다. 그러나 React-router-dom의 경우 이미 2021년 11월에 V6가 출시 되었고(3년이나 묵혀둔 버전 업데이트) 현재(작업을 시작할 당시 2024.06) RRD는 V7로의 업데이트를 앞두고 있는 상황이라 회사 프로젝트의 RRD 버전을 최신으로 올리기로 결심했다. 

RRD의 V5에서 V6로의 마이그레이션이 이렇게 오랜시간 동안 미뤄진 이유가 무엇일까, 추측해보자면

- RRD V5에서 V6의 Breaking change가 너무 커서 마이그레이션 비용이 너무 크다.
- 라우터의 경우 프로젝트 전역에 영향을 미치는 경우가 많아 프로젝트 전체를 마이그레이션하기 어렵다.
- RRD V5를 사용하더라도 성능적인 이슈가 발생하지 않는다.

위와 같은 이유들로 RRD V6로의 버전 업데이트의 우선순위는 계속 밀려 미뤄지고 있었다.

그러나 그럼에도 불구하고 RRD 마이그레이션을 결심한 것은 다음과 같은 이유들이 있다.

- 새로운 프로젝트의 시작을 앞두고 급한 개발작업이 없어서 기술부채를 청산할 수 있는 여유가 조금 생긴 점
- RRD가 V6에서 나아가 V7로의 업데이트를 앞두고 있던 점. (더 이상 미룰 수 없다 너의 업데이트 나의 기술부채)
- RRD V5에서 V6로 **점진적 업그레이드**를 할 수 있는 점

사실 세번째의 사유가 가장 주효했다. react router dom v5 compat이란 패키지를 사용하면 점진적 마이그레이션이 가능하다는 것을 알게 되었고, 혹시나 프로젝트 전체 마이그레이션이 어려운 상황이 오더라도 일부 마이그레이션 후 추가적으로 진행할 수 있겠다는 생각이 들었기 때문이다.


## React Router Dom V5 에서 V6로 점진적 마이그레이션
[react router dom v5 compat](https://www.npmjs.com/package/react-router-dom-v5-compat)이란 패키지를 사용하면, 하나의 프로젝트에서 react router dom V5와 V6를 동시에 사용할 수 있게된다. V5 -> V6가 breaking change가 많기 때문에 점진적인 마이그레이션을 돕는 툴로, 자세한 적용 방법은 [해당 글](https://github.com/remix-run/react-router/discussions/8753)에서 확인할 수 있다.

하지만 **결론적으로 React Router Dom V5 compat을 활용하진 못했다.** 회사 프로젝트에서는 nested route 구조를 사용하고 있었고 이 구조에서는 compat router가 제공하는 pathname이나 params가 예상대로 제공되지 않아서 사용이 한계가 있겠다는 판단을 내렸다. 아마 nested route를 사용하지 않고 RRD V5를 사용하는 프로젝트에서는 compat router를 통해 점진적 마이그레이션이 가능할 것으로 보인다.


## React Router Dom V5 에서 V6로 한번에 마이그레이션 하기

꿈꿔왔던 점진적 마이그레이션에는 실패했지만 이에 굴하지 않고 마이그레이션을 진행하기로 했다. 기왕에 뜬 첫 삽을 무용하게 만들고 싶진 않았다. 그렇게 마이그레이션을 진행하며 소소하게 얻은 팁을 공유해보려 한다.

우선 기본적으로는 공식문서에서 제공하는 [업그레이드 가이드 문서 (Upgrading from v5 v6.28.0)](https://reactrouter.com/6.28.0/upgrading/v5)의 도움을 받았다.


### 1. JScodeShift 사용하기
[jscodeshift](https://github.com/facebook/jscodeshift)는 JavaScript 코드베이스를 변환하는 데 사용되는 도구이다. 주로 코드 리팩토링, 대규모 코드 변경, 자동화된 코드 수정 등에 사용된다. codemod 같은 것을 만들 수 있는 툴이라고 보면 된다. jscodeshift는 Facebook에서 개발한 [recast](https://github.com/benjamn/recast) 라이브러리를 기반으로 하며, 이를 통해 코드의 추상 구문 트리(AST)를 조작하여 코드를 변환할 수 있다.

참고자료로 [JSCodeShift로 기술 부채 청산하기](https://toss.tech/article/jscodeshift)의 도움도 받았다.


* `this.props.history.push`를 `this.props.navigate`로
* `props.history`를 `props.navigate`로
* `const history = useHistory()`를 `const navigate = useNavigate()`로
* `import { withRouter } from 'react-router-dom';`를 `import { withRouter } from 'components/HOC/withRouter';` 로

  V6 에서는 React-Router-Dom에서 제공하던 `withRouter`가 사라져, 커스텀 `withRouter`를 만들어 사용해야 합니다. 커스텀한 `withRouter`는 다음과 같습니다. 

  ```tsx
  import React, { ComponentType } from 'react';
  import { Location, NavigateFunction, Params, useLocation, useNavigate, useParams } from 'react-router-dom';
  interface WithRouterProps {
    navigate: NavigateFunction;
    location: Location;
    params: Params;
  }
  export const withRouter = <P extends object>(Component: ComponentType<P & WithRouterProps>) => {
    const Wrapper: React.FC<P> = (props) => {
      const navigate = useNavigate();
      const location = useLocation();
      const params = useParams();
      return <Component navigate={navigate} location={location} params={params} {...props} />;
    };
    return Wrapper;
  };
  ```

위와 같은 변경사항을 자동화 할 수 있도록 jscodeshift를 사용해 적용했다. 완벽하고 깔끔한 결과물은 얻지 못했고, 60% 정도의 도움을 받았다. 프로젝트가 꽤나 오래되어 TS가 아닌 JS 코드의 비중이 높은 편인데 확실히 TS 코드 부분의 변환이 더 정확하고 깔끔하게 되었던 것으로 보아, TS 코드의 비중이 더 큰 프로젝트에서는 더 좋은 결과물을 얻을 수 있을 것으로 보인다.


### 2. Outet 컴포넌트 사용하여 Private Route 만들기

```tsx
import { useLoggedIn } from 'app/_hooks';
import { ChangePayPlan } from 'components/common';
import { Outlet } from 'react-router-dom';

const CheckLoggedInRoute = () => {
  const isLoggedIn = useCheckLoggedIn();

  if (!isLoggedIn) {
    return <div>접근 금지</div>
  }

  return <Outlet />
};

export default CheckLoggedInRoute;
```


### 3. `<Redirect>` 컴포넌트 대체하기

기존에 사용하던 Redirect 컴포넌트가 사라지고, 다음과 같이 대체할 수 있다.

AS-IS
```tsx
<Redirect to='my-work' />
```

TO-BE
```tsx
<Route path='*' element={<Navigate to='my-work' />} />
```

 

## React Router Dom V6 을 사용하면 얻을 수 있는 이점

```tsx
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<Team />}
      path="teams/:teamId"
      loader={async ({ params }) => {
        return fetch(
          `/fake/api/teams/${params.teamId}.json`
        );
      }}
      action={async ({ request }) => {
        return updateFakeTeam(await request.formData());
      }}
      errorElement={<ErrorBoundary />}
    />
  )
);
```

RRD V6에서는 loader, action, errorElement 같은 값들을 설정할 수 있다. loader를 사용해 페이지가 렌더링 되기 전에 데이터를 페칭하거나, action을 사용해서 Form, fetcher 등을 submit 할 때 취해야 하는 행동을 정의할 수도 있고 route별 errorElement를 세팅할 수 있습니다. lazy를 이용한 코드 스플리팅도 더욱 간편해진다. 

특히 loader를 통해 특정 페이지를 초기 구성하는데 필요한 데이터를 각 경로에 진입하는 시점에 병렬로 호출하는 것은 가장 빠르게 데이터를 호출하는 시점이 될 수 있으며 이를 통해 레이아웃 시프팅이나 불필요한 스피너 같은 것들을 안보여줄 수 있게 해주어 가장 사용해보고 싶은 요소 중 하나이다.


## 그리고 다가올 React Router Dom V7은…?
[React Router Dom V7이자 Remix!](https://remix.run/blog/merging-remix-and-react-router)

지난 React Conf에서 Remix V3는 React Router Dom V7가 될 것이라고 발표했다. 다음과 같이

> 리믹스는 항상 리액트 라우터 위에 있는 레이어에 불과했고, 그 레이어는 시간이 지남에 따라 점점 줄어들고 있습니다. 이제 너무 작아져서 제거하려고 합니다. Remix v3로 출시할 예정이었던 것을 이제 React Router v7로 출시할 예정입니다.

이 말인 즉슨 React Router Dom을 사용한다는 것은 더 큰 확장성을 가진다는 것을 의미한다. 왜냐하면 Remix는 이미 다음과 같은 기능을 갖추고 있기 때문이다. 

* Automatic code splitting
* Simplified data loading
* Form Actions, Server actions
* Simplified pending states
* Optimistic UI
* Server rendering
* Static pre-rendering
* RSC (soon)

따라서 앞으로는 RRD를 사용하는 것 만으로도 다양한 옵션을 통해 성능 최적화나 개선된 DX를 제공할 수 있을 것으로 보인다. 또한 RRD를 사용하는 CSR only 프로젝트에서 SSR의 도입을 꿈꾼다면 보다 간결한 방법으로 전환이 가능할 것 같다. 현재 회사 프로젝트는 CSR Only 프로젝트로 SSR 도입 계획은 없지만, 만약 필요해진다면 Next.js가 아닌 Remix로의 SSR 도입을 고려하게 되지 않을까 생각해본다. 

