---
title: createRoot와 createPortal의 차이점
date: "2024-05-20"
template: "post"
draft: false
slug: "/posts/difference-between-createRoot-and-createPortal"
category: "Tech"
description: "Alert 컴포넌트를 직접 구현한다면 어떻게 할래?"
tags:
  - "createRoot"
  - "createPortal"
---

## 궁금증의 시작

코드리뷰를 하다가 팀원분이 Alert 컴포넌트를 직접 구현하셨는데 `createRoot`를 사용하신 걸 보게 되었다. 만약 나였다면 `createPortal`을 사용했을 것 같은데 `createRoot`를 사용한 것이 신기하게 느껴져 이유를 물어보았다.

![code-review](/media/createRoot-review.png)
![code-review2](/media/createRoot-review-2.png)

> toast 팝업처럼 간단하게 제어가 가능한 인터페이스를 구현하고 싶었는데, `createPortal`로 구현하려고 하면 결국 제어에 필요한 상태를 추가해야 하는 단점이 있어서…
> 

라는 답변을 받았다. 추가로 구현을 위해 참고했던 소스링크들도 공유해주셨다.

**참고한 소스 링크**

- https://github.com/GA-MO/react-confirm-alert/blob/master/src/index.js#L186
- https://github.com/haradakunihiko/react-confirm/blob/master/src/mounter/domTree.js#L15

참고한 소스코드 링크들을 살펴보면 `react-confirm-alert` 이나 `react-confirm` 과 같은 라이브러리에서도 Alert 컴포넌트를 `root.render`에서 바로 렌더링 하는 방식으로 구현했다는 것을 알 수 있었다.

과거의 기억을 더듬어 보면 2년 전 쯤 사이드 프로젝트에서 Toast 컴포넌트를 직접 구현한 적이 있었는데, 당시 [ant-design-mobile](https://github.com/ant-design/ant-design-mobile/tree/master)의 Toast 컴포넌트 구현을 참고 했었고 그 때도 `portal`이 아닌 `createRoot`와`root.render`함수를 사용해서 구현한 것을 보고 ‘오 신기하네..?’ 라고 생각했었다. 

잠시 그 때 참고한 코드를 훑어보자면 ant-design-mobile의 Toast 컴포넌트 [method 파일](https://github.com/ant-design/ant-design-mobile/blob/master/src/components/toast/methods.tsx#L47)의 코드를 보면`renderImperatively`라는 함수를 사용해서 컴포넌트를 렌더링하고 있다. [renderImperatively](https://github.com/ant-design/ant-design-mobile/blob/master/src/utils/render-imperatively.tsx) 를 살펴보면 결국 `renderToBody` 라는 함수를 사용하고 있고 `renderToBody`에서 사용하는 [render](https://github.com/ant-design/ant-design-mobile/blob/master/src/utils/render.ts#L63-L69)를 따라가면 `root.render`를 사용하고 있음을 확인할 수 있다. 

다시 돌아와서,
Alert의 동작은 사실상 모달과 비슷하다고 생각되어 `createPortal`을 이용할 법도 한데, 왜 `createRoot`를 이용해 구현한 것일까? 단순히 제어에 필요한 상태값을 추가하지 않아도 되어서 사용한 것일까? 이런 방법에 문제는 없을까? 그렇다면 `createPortal`과 `createRender`는 뭐가 다른 것일까? 하는 궁금증이 생겼고, 관련해서 조금 더 찾아보았다.

## createRoot와 createPortal은 뭐가 다른 것일까?

그렇게 `createPortal`과 `createRoot`의 차이점을 찾던 중 해당 글을 발견했다. 

[[React] Portal, Render의 차이점, 활용방안 알아보기!](https://jaeseokim.dev/React/React-Portal_Render의_차이점_활용방안_알아보기/)

요약하자면 다음과 같다. 

ReactDOM의 Portal 기능은 루트 노드의 DOM 계층 구조 바깥에 있는 DOM 노드를, 루트 노드의 자식으로 렌더링 하는 기능을 제공한다. 외부에 존재하는 DOM 노드가 React App DOM 계층 안에 존재하는 것처럼 연결을 해주는 포탈 기능을 제공하는 것이다. 따라서 `createPortal` 로 연결된 경우에는 부모 컴포넌트의 생명주기(Component LifeCycle)가 적용된다. 

그러나 `creatRoot`의 경우 단순하게 보기에는 `createPortal`과 동일하게 보일 수 있지만, 차이점은 새로운 React LifeCycle 생성 한다는 점이다. 일반적으로는 React 어플리케이션의 최초 생성을 하기 위해서 사용하는 함수 이지만, **함수를 통해 React Component를 생성 할 수 있다 라는 점**을 이용하여 활용이 가능하며 **기존 React의 렌더링 트리와는 별개의 렌더링 트리를 새롭게 생성이 가능이 가능하다. 즉, 호출한 부모의 React LifeCycle과 별개로 동작을 한다.**

즉 Alert과 같은 컴포넌트를 구현 할 때 `createRoot`를 사용하게 되면 **제어를 위한 값을 추가하거나 Context API로 감싸서 관리하는 등의 필요가 사라져 코드가 단순해지고, 기존의 React 렌더링 트리의 변화로 인한 Effect 발생 상태관리의 어려움 등을 쉽게 처리할 수 있게 된다는 이점이 생긴다**는 것을 알 수 있었다. 

`createRoot`와 `root.render`는 보통 리액트 어플리케이션의 최초 생성을 하기 위해서 사용하는 함수이기 때문에 이 메서드를 사용하면 새로운 React 렌더링 트리(라이프 사이클)을 생성한다는 점은 자연스럽게 이해 되었지만 하나의 프로젝트에서 `root.render`를 중첩해서 사용(`createRoot`로 렌더링 되는 컴포넌트 내부에서 또 다시 `createRoot`와 `root.render`를 호출)해 여러 개의 리액트 사이프 사이클을 사용하는 것에 대해서 문제는 없는지, 이러한 활용 사례가 일반적인 것인지(?)에 대해서도 궁금해졌다. 

### createRoot와 createPortal의 차이를 공식문서로 확인해보기

일단 공식문서를 확인해보았다. 

### createPortal

React 공식문서에서는 [createPortal](https://react.dev/reference/react-dom/createPortal#createportal)을 다음과 같이 설명하고 있다. 

> *Portals* let your components render some of their children into a different place in the DOM. This lets a part of your component “escape” from whatever containers it may be in. For example, a component can display a modal dialog or a tooltip that appears above and outside of the rest of the page.
> 

포털을 사용하면 컴포넌트가 자식 중 일부를 DOM의 다른 위치에 렌더링할 수 있습니다. 이를 통해 컴포넌트의 일부가 어떤 컨테이너에 있든 그 컨테이너에서 "탈출"할 수 있습니다. 예를 들어, 컴포넌트는 모달 대화상자나 툴팁을 페이지의 나머지 부분 위와 외부에 표시할 수 있습니다.

> A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the React component that renders it. For example, the child can access the context provided by the parent tree, and events still bubble up from children to parents according to the React tree.
> 

포털은 DOM 노드의 물리적 배치만 변경합니다. 다른 모든 면에서 포털에 렌더링하는 JSX는 이를 렌더링하는 React 컴포넌트의 자식 노드 역할을 합니다. 예를 들어, 자식은 부모 트리에서 제공하는 컨텍스트에 액세스할 수 있으며 이벤트는 여전히 React 트리에 따라 자식에서 부모로 버블업됩니다.

앞선 글에서 언급한 것과 같이 `createPortal`을 사용하면 외부에 존재하는 **DOM 노드**가 **React App DOM 계층 안에 존재하는 것처럼 연결**을 해주는 **포탈 기능**을 제공한다는 것을 확인할 수 있었다. 

### createRoot.render

[createRoot](https://react.dev/reference/react-dom/client/createRoot#createroot)를 설명한 공식문서를 읽던 중에는 다음과 같은 부분을 발견했다. 

> An app fully built with React will usually only have one `createRoot` call for its root component. A page that uses “sprinkles” of React for parts of the page may have as many separate roots as needed.
> 

React로 완전히 빌드된 앱에는 일반적으로 루트 컴포넌트에 대한 `createRoot` 호출이 하나만 있습니다. 페이지의 일부에 React를 부분적으로 사용하는 페이지에는 필요한 만큼의 루트가 따로 있을 수 있습니다.

라고 언급하면서 글 하단의 **Rendering a page partially built with React** 부분에서 코드 예시를 통해 자세히 설명해준다. 즉 온전히 React만으로 만들어진 어플리케이션이 아닐 경우 `createRoot`을 여러번 호출해서 각각에 최상단 UI를 만들어 관리 할 수 있다고 말하고 있다. 각 각의 root에서 서로 다른 컨텐츠들이 보여지도록 할 수 있는 것이다. 

물론 Alert 컴포넌트를 구현할 때 사용한 것 처럼 `creartRoot`를 중첩해서 사용하는 경우에 대한 언급은 찾지 못했다. 다만 리액트를 부분적으로 사용하는 어플리케이션에서는 `createRoot`를 다수 호출해서 사용할 수 있다는 힌트를 얻었다. 

> When you want to render a piece of JSX in a different part of the DOM tree that isn’t a child of your component (for example, a modal or a tooltip), use [createPortal](https://react.dev/reference/react-dom/createPortal) instead of `createRoot`.
> 

컴포넌트의 자식이 아닌 DOM 트리의 다른 부분에서 JSX를 렌더링하고자 할 때(예: 모달 또는 툴팁), `createRoot` 대신 `createPortal`을 사용할 것을 권장한다.

### createRoot와 createPortal의 차이를 직접 구현해서 확인해보기

직접 `creatRoot`, `root.render`로 Alert 컴포넌트를 구현한 뒤 React dev tool로 확인해보았다. 

![react-dev-tool](/media/react-dev-tool.png)

React dev tool에서 최상위 APP의 하위 트리로 렌더링 되는 것이 아닌 별도의 렌더링 트리로 생성된 것을 확인할 수 있었다. 또한 Alert 컴포넌트는 의도한대로 잘 동작하긴 하지만 **Warning: You are calling ReactDOMclient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.** 이라는 경고 메세지가 콘솔에 노출된다. 

## 정리해보면

- `createPortal`은 React 루트 외부에 존재하는 **DOM 노드를** **React Root 렌더링 트리 계층 안에 존재하는 것처럼 연결**을 해주는 **포탈 기능**을 제공하며 Modal, Tooltip과 같은 컴포넌트를 구현할 때 유용하게 쓸 수 있고 React에서 권장하는 방식이다.
- `createRoot` 와 `root.render`는 브라우저 DOM 엘리먼트 안에 콘텐츠를 표시하기 위한 React 루트를 생성하고, JSX 조각(React 노드)을 React 루트의 브라우저 DOM 노드에 표시하는 기능으로 언뜻 보기에 `createPortal`과 비슷해 보이지만 새로운 React 렌더링 트리를 생성한다는 점이 다르다.
- 완벽히 React로만 구현된 어플리케이션에서 Alert과 같은 컴포넌트를 구현하기 위에 `CreateRoot`를 중첩해서 사용하는 방식은 React에서 정식적으로 권장하는 방식은 아니다. 그러나 이러한 방식으로 구현할 경우 (`createPortal`을 사용할 때와 비교하여) **제어를 위한 값을 추가하거나 Context API로 감싸서 관리하는 등의 필욕가 사라져 코드가 단순해지고, 기존의 React 렌더링 트리의 변화로 인한 Effect 발생 상태관리의 어려움 등을 쉽게 처리할 수 있게 된다**는 이점이 있다.
- 다양한 기능을 수행해야 하는 모달의 경우에는 부모 컴포넌트로부터 값을 주고 받거나(context 공유), 같은 리액트 라이프 사이클을 이용해야 할 필요성이 크기 때문에 `CreateRoot`를 중첩 사용해 렌더링 하는 방식은 부적절하며, Toast, Alert, Notification과 같이 독립적으로 수행되는 컴포넌트에 활용이 가능해 보인다. 

<br />

