---
title: Streaming SSR이 해결하는 문제
date: "2023-05-24"
template: "post"
draft: true
slug: "/posts/The-problem-that-Streaming-SSR-solves."
category: "Tech"
description: ""
---

## CSR과 비교했을 때 SSR이 가진 장점

SSR은 서버에서 매번 페이지를 HTML 형태로 완전히 렌더링한 후에 클라이언트로 전송하기 때문에, 자바스크립트의 파싱과 실행 절차 없이 첫 화면을 빠르게 그릴 수 있게 된다. 즉 초기 로딩 시 LCP(Largest Contentful Paint)가 빨라져 사용자들이 페이지의 주요 내용에 더 빨리 접근할 수 있게 해주고, 사용자 경험을 향상시킨다.

## 현재 SSR이 가진 문제점
### Everything or Nothing, 무언가 하기 전에 무엇이든 다 해야 한다.

[https://camo.githubusercontent.com/7fac45f105cd741a94db77234465c4c85843b1e6f902b21bbdb1fe5b52d25a05/68747470733a2f2f717569702e636f6d2f626c6f622f5963474141416b314234322f39656b30786570614f5a653842764679503244652d773f613d6131796c464577695264317a79476353464a4451676856726161375839334c6c726134303732794c49724d61](https://camo.githubusercontent.com/7fac45f105cd741a94db77234465c4c85843b1e6f902b21bbdb1fe5b52d25a05/68747470733a2f2f717569702e636f6d2f626c6f622f5963474141416b314234322f39656b30786570614f5a653842764679503244652d773f613d6131796c464577695264317a79476353464a4451676856726161375839334c6c726134303732794c49724d61)

[https://camo.githubusercontent.com/98a383f6de8ee2bde7516dc540aae6d9bb02a074c43c201ef6746bf3b8450420/68747470733a2f2f717569702e636f6d2f626c6f622f5963474141416b314234322f715377594e765a58514856423970704e7045344659673f613d6c3150774c4844306b664a61495971474930646a53567173574a345544324c516134764f6a6f4b7249785161](https://camo.githubusercontent.com/98a383f6de8ee2bde7516dc540aae6d9bb02a074c43c201ef6746bf3b8450420/68747470733a2f2f717569702e636f6d2f626c6f622f5963474141416b314234322f715377594e765a58514856423970704e7045344659673f613d6c3150774c4844306b664a61495971474930646a53567173574a345544324c516134764f6a6f4b7249785161)

- 유저에게 UI 보여주기 전에 필요한 데이터를 **전부** 다 패치해서 HTML을 그려줘야 한다.
- Hydrate 하기 전에 **모든** 번들을 다 로드해야한다.
- 유저 인터랙션이 되기전에 **모든 걸** 다 하이드레이션 해야한다.

현재 우리가 Next.js나 `renderToString`을 이용해서 하는 SSR의 태생적인 한계점은 렌더링하는 페이지를 기준으로 UI 렌더링, Hydrate, User-Interaction 에 필요한 모든 자원(JS Bundle과 Server Data 등)들과 작업을 한번에 전부 다 준비해야 한다는 점이다.

### Waterfall, 폭포수 현상

이러한 방식은 Waterfall 현상을 발생 시킨다. 데이터 가져오기(서버) -> HTML로 렌더링(서버) -> 코드 불러오기(클라이언트) -> 하이드레이션(클라이언트). 이 중 그 어떤 단계도 이전 단계가 전체 애플리케이션에 대하여 끝나기 전까진 시작되지 못한다. 이것이 바로 비효율적인 이유다.

따라서 SSR은 페이지 단위 전체에서 **이뤄지거나, 혹은 이뤄지지 않는 것** 결국 이 2개의 상태만을 가지게 된다. 이 점 때문에 First Contentful Paint를 많이 지연시켜, 오히려 유저 경험에 악영향을 주는 경우가 생긴다.

## Streaming SSR **(Streaming HTML and Selective Hydration)**

이 문제를 해결하기 위해 등장한게 Streaming SSR으로 기존에 페이지 단위로 준비하던 것을 작게 나눔으로써 해결한다. 전체 페이지를 한 번에 렌더링하지 않고, 가능한 한 빨리 응답을 시작하고, 페이지의 일부를 스트리밍하는 방식을 택함으로써 사용자는 빠르게 페이지를 보게 되며, 서버 부하를 분산시킬 수 있게 된다.

- 서버에서 HTML을 스트리밍 형식으로 전달한다. 이렇게 하기 위해서 전통적인 방식의 SSR을 구현하던 `renderToString` 메소드를 대신해 `renderToPipeableStream` 메소드로 바꿔줘야 한다.

[renderToPipeableStream – React](https://react.dev/reference/react-dom/server/renderToPipeableStream)

- 클라이언트에서도 선택적으로 하이드레이션 한다. 사용하기 위해 클라이언트 단에서 [createRoot로 바꿔주고](https://github.com/reactwg/react-18/discussions/5) 애플리케이션의 부분 부분을 `<Suspense>`로 감싸줘야 한다.

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

`<Comments>` 항목을 `<Suspense>`로 감싸줌으로써, React에게 댓글 부분을 기다리지 않고 나머지 페이지에 대해 HTML을 스트리밍 하도록 할 수 있다. 댓글 부분 대신에 React는 placeholder에 해당하는 `<Spinner>` 컴포넌트를 보내준다.

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/10828a89-b73f-4ffa-aa04-019a01ca0acd/Untitled.png)

이 방식을 이용하면 **전통적인 HTML 스트리밍 방식과 다르게 탑다운 순서로 진행될 필요도 없다.**

- Suspense를 경계로하여 서버에서 콘텐츠 렌더링이 완료되는 순서대로 클라이언트로 내려보낸다.
- 내려보내지는 컨텐츠는 클라이언트가 수신하는대로 즉시 화면에 그려지고 hydrate된다.

## 그래서 결과적으로 어떤게 개선되나요?

기존 SSR의 단점으로 여겨지던 늦은 TTFB**(Time To First Byte, 페이지를 요청했을 때 서버에서 데이터의 첫번째 바이트가 도착하는 시점)**를 당길 수 있게 된다. FCP**(First Contentful Paint, 페이지가 로드되기 시작하고 컨텐츠의 일부가 화면에 렌더링 될 때 까지의 시간)**도 개선된다. 작은 단위로 쪼개어 진행되기 때문에 hydration 성능도 좋아진다. 결과적으로 사용자는 빠르게 페이지를 보게 되며, 서버 부하도 분산시킬 수 있게 된다. 

## Stream with Suspense

Streaming SSR은 여러 단위로 쪼개진 UI를 비동기적으로 렌더링하는 방식을 택함으로써 비동기적 렌더링을 표현하기 위해 사용하는 컴포넌트인 Suspense를 이용한다. 지금까지 수차례 ‘작게 나누어 진행한다’고 언급했는데 결국 Suspense가 감싼 단위 조각으로 Streaming이 이루어 지게 되는 것이다. 굉장히 핵심적인 역할을 담당한다고 볼 수 있다. 

사실 기존의 Suspense는 대수적 효과를 지원하는 컴포넌트로 선언적으로 코드를 작성할 수 있다는 장점이 있었지만 이런식으로 활용되리라고는 예상하지 못했다. React 팀의 큰 그림이 어디까지인지 약간 섬뜩해지는 느낌이랄까…?

Streaming SSR에서 Suspense는 굉장히 핵심적인 역할을 담당한다. 

- 여러 단위로 쪼개진 UI를 비동기적으로 렌더링한다 → 비동기적 렌더링을 표현하기 위해 사용하는 컴포넌트 Suspense 를 이용

`<Suspense>` 컴포넌트는 이 모든 기능들을 참여시키는 역할을 한다. 개선점들 자체는 React 내부에서 자동으로 이뤄지고 이미 기존에 있는 대부분의 React 코드와 동작할 것이 기대된다. 이것은 로딩 상태를 선언적으로 표현하는 것의 힘을 보여준다. `if (isLoading)`을 `<Suspense>`로 바꾸는 것은 큰 변화가 아닌 것 같지만, 이 과정은 위 모든 개선점들을 가능하게 해준다.

## 사용해보려면?

React의 use라는 hook을 사용하거나 React Server Component에 async await를 붙여 비동기적으로 렌더링하는 방식을 통해 Streaming SSR을 맛볼 수 있다. 그러나 use hook은 아직 RFC에서 논의 중인 단계이고 Server Component 역시 stable한 상태가 아니기 때문에 실험적인 수준의 찍먹이 가능할 것으로 보인다. 😋

https://github.com/reactjs/rfcs/pull/229

[https://github.com/reactjs/rfcs/pull/229](https://github.com/reactjs/rfcs/pull/229)

#### 주절주절
사실 Streaming SSR에 대한 글을 쓰게 된건 Next.js의 App router를 뜯어보다가 흘러흘러 오게 된 것이다. 최근 Next.js와 React가 서로 앞서거니 뒷서거니 하며 발맞춰 기능을 업그레이드 하는 모습을 보면 약간 경이로운데  무엇보다 궁금한 것은 이들이 그리는 큰 그림은 과연 어디까지 일까 하는 점이다.

마치 나는 퍼즐 조각 몇 개를 받아들곤 100피스짜리 퍼즐인 줄 알고 우와 우와 하며 열심히 맞추고 있었는데, 알고보니 1000피스를 맞춰야 완성되는 퍼즐인 느낌이랄까? 과연 그들이 그리는 그림은 어떤 모습이고 언제부터 이런 그림을 그려왔던걸까 생각해보면 약간 아득해 지는 것이^^.. 부지런히 설명서를 읽고 퍼즐을 맞춰야 큰 그림의 윤곽을 볼 수 있을 것 같다. 
