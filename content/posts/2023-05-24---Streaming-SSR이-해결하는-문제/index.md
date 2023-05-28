---
title: Streaming SSR이 해결하는 문제
date: "2023-05-24"
template: "post"
draft: false
slug: "/posts/The-problem-that-Streaming-SSR-solves"
category: "Tech"
description: "작게 쪼개볼게요"
---
Next.js의 버전이 13.4에 접어들면서 App Router가 stable 상태로 변경되었다. 그렇다고 바로 프로덕션에 적용하기엔 조심스럽지만 이제 더 이상 외면하고 있을 수는 없을 것 같다. App Router를 받아들일 몸(?)과 마음의 준비를 해야 한다. Streaming SSR이 해결하는 문제에 대해서 말한다더니 왜 갑자기 Next.js의 App Router 이야기냐고? 바로 App Router를 통해 우리는 Streaming SSR에 편하고 빠르게 가까워질 것이기 때문이다. 그럼 각설하고 본론으로 들어가보자! 
## CSR과 비교했을 때 SSR이 가진 장점

SSR은 서버에서 매번 페이지를 HTML 형태로 완전히 렌더링한 후에 클라이언트로 전송한다. 따라서 자바스크립트의 파싱과 실행 절차 없이 첫 화면을 빠르게 그릴 수 있게 된다. 즉 초기 로딩 시 LCP(Largest Contentful Paint)가 빨라져 사용자들이 페이지의 주요 내용에 더 빨리 접근할 수 있게 해주고, 사용자 경험을 향상시킨다.
<br /><br />

## 그럼에도 현재 SSR이 가진 문제점
### All or Nothing, 무언가 하기 전에 무엇이든 다 해야 한다.
![everything-or-nothing](/media/everything-or-nothing.png)

- 유저에게 UI 보여주기 전에 필요한 데이터를 **전부** 다 패치해서 HTML을 그려줘야 한다.
- Hydrate 하기 전에 **모든** 번들을 다 로드해야한다.
- 유저 인터랙션이 되기전에 **모든 걸** 다 하이드레이션 해야한다.

현재 우리가 Next.js나 `renderToString`을 이용해서 하는 SSR의 태생적인 한계점은 렌더링하는 페이지를 기준으로 UI 렌더링, Hydrate, User-Interaction 에 필요한 모든 자원(JS Bundle과 Server Data 등)들과 작업을 한번에 전부 다 준비해야 한다는 점이다.

### Waterfall, 폭포수 현상

이러한 방식은 Waterfall 현상을 발생 시킨다. 데이터 가져오기(서버) -> HTML로 렌더링(서버) -> 코드 불러오기(클라이언트) -> 하이드레이션(클라이언트). 이 중 그 어떤 단계도 이전 단계가 전체 애플리케이션에 대하여 끝나기 전까진 시작되지 못한다. 이것이 바로 비효율적인 이유다.

결국 기존 방식의 SSR은 페이지 단위 전체에서 **이뤄지거나, 혹은 이뤄지지 않는 것** 결국 이 2개의 상태만을 가지게 된다. 이 점 때문에 FCP(First Contentful Paint)를 많이 지연시켜, 오히려 유저 경험에 악영향을 주는 경우가 생긴다.
<br /><br />

## Streaming SSR **(Streaming HTML and Selective Hydration)**

짜잔- 이 문제를 해결하기 위해 등장한게 바로 Streaming SSR으로 기존에 페이지 단위로 준비하던 것을 작게 나눔으로써 해결한다. 즉 기존의 SSR은 **전체의 페이지를 최대한 빨리 준비해서 보여준다**의 방식이였다면, Streaming SSR은 **페이지를 부분으로 작게 쪼개어 준비되는 부분부터 보여준다**의 방식을 택한다. 

- 서버에서 HTML을 스트리밍 형식으로 전달해야 한다. 기존에 우리는 Next.js와 같은 프레임 워크 없이 React SSR을 직접 구현할 떄 `renderToString` 메소드를 사용했다. 그러나 Html을 스트리밍 형식으로 전달하기 위해서는 `renderToString` 메소드를 대신해 [`renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) 메소드를 사용해야 한다.

- 클라이언트에서도 선택적으로 하이드레이션 한다. 이를 위해 클라이언트 단에서 [hydrateRoot로 바꿔주고](https://github.com/reactwg/react-18/discussions/5) 애플리케이션의 부분 부분을 `<Suspense>`로 감싸줘야 한다.

```tsx
import { hydrateRoot } from 'react-dom/client';
import App from './App.js';

hydrateRoot(
  document.getElementById('root'),
  <App />
);

```


```tsx
<Layout>
  <NavBar />
  <Sidebar />
  <RightPane>
    <Post />
    <Suspense fallback={<Spinner />}>
      <Comments />
    </Suspense>
  </RightPane>
</Layout>
```

페이지는 Suspense를 경계로 쪼개져 스트리밍 된다. 위의 코드에서는 `<Comments>` 항목을 `<Suspense>`로 감싸줌으로써, React에게 댓글 부분을 기다리지 않고 나머지 페이지에 대해 HTML을 스트리밍 하도록 할 수 있다. 댓글 부분 대신에 React는 placeholder에 해당하는 `<Spinner>` 컴포넌트를 보내준다.

![streaming-ssr](/media/streaming-ssr.png)

이 방식을 이용하면 **전통적인 HTML 스트리밍 방식과 다르게 탑다운 순서로 진행될 필요도 없다.**

- Suspense를 경계로하여 서버에서 콘텐츠 렌더링이 완료되는 순서대로 클라이언트로 내려보낸다.
- 내려보내지는 컨텐츠는 클라이언트가 수신하는대로 즉시 화면에 그려지고 hydrate된다.
<br />

## 그래서 결과적으로 어떤게 개선되나요?

기존 SSR의 단점으로 여겨지던 늦은 **TTFB(Time To First Byte, 페이지를 요청했을 때 서버에서 데이터의 첫번째 바이트가 도착하는 시점)** 를 당길 수 있게 된다. **FCP(First Contentful Paint, 페이지가 로드되기 시작하고 컨텐츠의 일부가 화면에 렌더링 될 때 까지의 시간)** 도 개선된다. 작은 단위로 쪼개어 진행되기 때문에 hydration 성능도 좋아진다. 결과적으로 사용자는 빠르게 페이지를 보게 되며, 서버 부하도 분산시킬 수 있게 된다. 
<br /><br />


## Stream with Suspense

위에서도 언급했듯이 Streaming SSR은 Suspense 컴포넌트를 사용해 이루어진다. 지금까지 수차례 ‘작게 나눈다’고 언급했는데 바로 Suspense를 경계로 UI가 나뉘게 되는 것이다. 굉장히 핵심적인 역할을 담당한다고 볼 수 있다. 
Suspense는 비동기 동작을 선언적으로 작성할 수 있게 하는 문법적 설탕 쯤으로 생각했었는데, 이런식으로 활용될 수 있을것이라고는 상상하지 못했다. `if (isLoading)`을 `<Suspense>`로 바꾸는 것은 큰 변화가 아닌 것 같지만, 이 과정이 여러 개선점들을 가능하게 해준다.
<br /><br />

## Streaming SSR 찍먹 가능할까요 😋?
가능 한지 여부에 대해서 우선 답한다면 '**YES**' 다. 그러나 기존에는 Next.js나 Remix와 같이 SSR를 지원하는 프레임워크를 통해 Streaming SSR을 구현하기에는 어려움이 있었다. 따라서 직접 SSR을 위한 서버를 세팅해야 했고 클라이언트에서도 Suspense를 활용하기 위해 Suspense로 감싸진 컴포넌트 내부에서 의도적으로 promise를 throw 하는 동작을 추가해야 하는 번거로움이 있었다. 

하지만 앞으로는 Next.js의 App Router를 이용해 Streaming SSR을 좀 더 간편하게 구현할 수 있을 것으로 보인다. Next.js의 Doc에서 이와 관련한 부분의 [글](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#streaming-with-suspense)을 참고하면 좋겠다. 또한 컴포넌트 내부에서 의도적으로 Promise를 throw 하는 방식도 React의 use라는 hook을 사용하거나 React Server Component에 async await를 붙여 비동기적으로 렌더링하는 방식 등으로 보다 간편하고 선언적인 형태로 바뀔 것이 예상된다. 단, [use hook](https://github.com/reactjs/rfcs/pull/229)은 아직 RFC에서 논의 중인 단계이고 Server Component 역시 stable한 상태가 아니기 때문에 현재는 실험적인 수준의 찍먹만이 가능할 것으로 보인다. (yummy~😋)
<br /><br />

#### 글을 마치며 주절주절
사실 Streaming SSR에 대한 글을 쓰게 된건 Next.js의 App router를 뜯어보다가 흘러흘러 오게 된 것이다. 최근 Next.js와 React가 서로 앞서거니 뒷서거니 하며 발맞춰 기능을 업그레이드 하는 모습을 보면 약간 경이로운데(...) 그럼과 동시에 궁금한 것은 이들이 그리는 큰 그림은 과연 어디까지 일까 하는 점이다.

마치 나는 퍼즐 조각 몇 개를 받아들곤 100피스짜리 퍼즐인 줄 알고 우와- 우와- 하며 열심히 맞추고 있었는데, 알고보니 1000피스를 맞춰야 완성되는 퍼즐인 느낌이랄까? 과연 그들이 그리는 그림은 어떤 모습이고 언제부터 이런 그림을 그려왔던걸까 생각해보면 약간 아득해 지는 느낌이다^^.. 부지런히 설명서를 읽고 퍼즐을 맞춰야 그림의 윤곽을 볼 수 있을 것 같다. 

#### 참고자료
* [New Suspense SSR Architecture in React 18](https://github.com/reactwg/react-18/discussions/37) 
* [A guide to streaming SSR with React 18](https://blog.logrocket.com/streaming-ssr-with-react-18/)
* [(번역)리액트 렌더링의 미래](https://junghan92.medium.com/%EB%B2%88%EC%97%AD-%EB%A6%AC%EC%95%A1%ED%8A%B8-%EB%A0%8C%EB%8D%94%EB%A7%81%EC%9D%98-%EB%AF%B8%EB%9E%98-5b7251bda66d)
* [스트리밍 SSR 딥 다이브](https://www.youtube.com/watch?v=9xl9X2pfHeI)