---
title: useSyncExternalStore로 Hydration 불일치 해결하기
date: "2024-02-11"
template: "post"
draft: true
slug: "/posts/avoiding-hydration-mismatches-with-useSyncExternalStore"
category: "Tech"
description: "번역"
---

> 해당 글은 TkDodo의 [Avoiding Hydration Mismatches with useSyncExternalStore](https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store#suppresshydrationwarning)를 번역한 글입니다.

<br />

Hydration 불일치는 React 개발자가 종종 만나게 되는 가장 두려운 오류 중 하나입니다:

> Uncaught Error: Text content does not match server-rendered HTML.

왜 이런 문제가 생기는 걸까요? 우리는 동형 렌더링을 약속 받았습니다 - 처음에는 서버에서, 그 다음에는 클라이언트에서요. 코드는 한 번만 작성되고 두 번 실행됩니다.

서버가 클라이언트가 아니라는 점을 제외하면요. 서버는 다른 시간대나 다른 locale에서 실행될 수 있으므로 클라이언트와 다른 정보(예: 날짜가 포함된 경우)를 렌더링할 수 있습니다. 또한 `window`와 같이 브라우저에서만 사용할 수 있는 API에 접근할 수 없습니다.

```typescript
function LastUpdated() {
  const date = getLastUpdated();
  return <span>Last updated at: {date.toLocaleDateString()}</span>;
}
```

서버의 locale이 클라이언트와 다른 경우, 한쪽에서는 날짜가 "21/02/2024"로 렌더링되지만 다른 쪽에서는 "2/21/2024"로 렌더링될 수 있습니다. 이와 같은 불일치가 발생하면 React는 이것을 우리에게 알리게 됩니다. 왜냐하면 서버에서 렌더링된 출력과 클라이언트에서 렌더링된 출력을 정확히 일치시켜 가능한 최상의 사용자 경험을 제공하려 하기 때문이죠.

하지만 앞에서 살펴본 바와 같이 불일치를 피할 수 없는 경우도 있습니다. 그렇다면 어떻게 '수정'할 수 있을까요?

## suppressHydrationWarning

이것은 `eslint-ignore` 또는 `@ts-expect-error`를 쓰는것과 비슷하지만, 여러분이 무엇을 하고 있는지 알고 있다면 괜찮을 것입니다. 해당 요소에 `suppressHydrationWarning`을 붙이고 하루를 마무리하세요:

```typescript
function LastUpdated() {
  const date = getLastUpdated();
  return (
    <span suppressHydrationWarning>
      Last updated at: {date.toLocaleDateString()}
    </span>
  );
}
```

[문서](https://react.dev/reference/react-dom/components/common#common-props)에 따르면 이것은 탈출구이므로 남용해서는 안 된다고 합니다. 그럼 다른 방법은 없을까요?

## double render pass

또 다른 해결 방법은 클라이언트에서 두 번 렌더링하는 것입니다. 기본적으로 서버에서 가지고 있는 정보로 렌더링하여 정적 마크업을 생성합니다. 그런 다음 클라이언트에서는 첫 번째 렌더링 주기에 대해 서버에서와 동일한 출력을 생성하려고 시도합니다. 이렇게 하면 Hydration 오류가 발생하지 않습니다. 그런 다음 "진짜" 클라이언트 정보로 또 다른 렌더링 주기를 트리거합니다.

물론 이 방법의 단점은 아래의 애니메이션에서 볼 수 있듯이 짧은 깜빡임이 생긴다는 점입니다(시간에 집중하세요):

<<< 이미지 >>>

표준 시간대는 클라이언트에서만 알 수 있기 때문에 서버 렌더링에서는 각 사용자마다 그 들의 위치에 따라 다르므로 표시 해야 할 정확한 시간을 알 수 없습니다.

이러한 접근 방식의 또 다른 해결방법으로는 서버에서는 null을 렌더링하고 클라이언트에서만 올바른 콘텐츠를 '표시'하는 것입니다.

서버 렌더링에 어떤 값을 선택하든 코드는 일반적으로 다음과 같은 형태로 표시됩니다:

```typescript
function LastUpdated() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const date = getLastUpdated();
  return <span>Last updated at: {date.toLocaleDateString()}</span>;
}
```

`Effect`는 서버에서 실행되지 않으므로 먼저 `null`이 반환됩니다. 그 다음 클라이언트의 첫 번째 렌더링 사이클에서도 `null`이 반환됩니다. `Effect`가 실행된 후에야 날짜가 올바르게 표시됩니다.

이것은 보일러 플레이트에 가깝습니다만 원한다면 추상화할 수 있으며(이를 위한 패키지도 있을 것입니다. 😂), 매우 일반적인 패턴입니다.

그렇다면 무엇이 문제일까요?

## Client Side Transition

이중 렌더링은 컴포넌트가 서버 렌더링되는 경우 필요악이지만, 전통적인 SSR 애플리케이션에서는 모든 페이지가 서버 렌더링되는 것은 아닙니다. 일반적으로 사용자가 처음 방문하는 페이지만 정적 마크업을 생성하면 됩니다. 그 이후에는 모든 탐색이 SPA와 유사한 클라이언트 측 전환으로 이루어집니다. 비동기 요청을 통해 데이터를 가져온 다음(nextJs의 getServerSideProps를 생각하면 됩니다) 클라이언트에서만 다음 페이지를 렌더링합니다.

그러나 이러한 경우 useEffect를 사용한 double render pass 방법을 사용하면 불필요하게 속도가 느려집니다. 우리는 이미 클라이언트에 있지만 코드는 이를 알지 못합니다. 상관없이 null을 렌더링한 다음 효과를 트리거한 다음 콘텐츠를 렌더링합니다. 또한 SSR 이후 첫 번째 클라이언트 렌더링도 null을 렌더링해야 하므로 클라이언트에 있는 경우 추가 검사를 추가할 수도 없습니다. 😂

우리가 찾고 있는 것은 서버 렌더링에 대해 알고 있는 솔루션이며, 더 중요한 것은 첫 번째 클라이언트 렌더링이 언제 발생하는지 알고 있는 솔루션입니다. 놀랍게도 이를 위한 가장 좋은 훅은 `useSyncExternalStore`인 것 같습니다.

## useSyncExternalStore

`useSyncExternalStore`의 주요 사용처는 외부 저장소를 구독하는 것이지만, 흥미로운 두 번째 특성이 있습니다. 서버 스냅샷과 클라이언트 스냅샷을 구분할 수 있다는 점입니다. 문서에서 getServerSnapshot에 대해 어떻게 설명하는지 살펴봅시다:

> **getServerSnapshot** <br/>
> 스토어에 있는 데이터의 초기 스냅샷을 반환하는 함수입니다. 서버 렌더링 중과 클라이언트에서 서버 렌더링 콘텐츠의 하이드레이션 중에만 사용됩니다. 서버 스냅샷은 클라이언트와 서버 간에 동일해야 하며, 일반적으로 직렬화되어 서버에서 클라이언트로 전달됩니다.

이것이 바로 Hydration 오류를 피하기 위해 필요한 것입니다. useSyncExternalStore가 존재하는 페이지에서는 클라이언트 사이드로 전환되는 즉시 클라이언트 스냅샷이 생성됩니다.

한 가지 문제가 있습니다. 어떤 'Store'를 바라보아야(subscribe) 할까요? 이상하게 보일 수도 있지만 방법이 있습니다: 업데이트되지 않는 빈 스토어를 구독하면 됩니다. 클라이언트 스냅샷은 어쨌든 모든 렌더링 중에 평가될 것이고, React 외부에서 이 컴포넌트로 업데이트를 푸시할 필요가 없습니다.

subscribe 매개변수는 필수이므로 코드는 다음과 같이 작성되어야 합니다:

```typescript
const emptySubscribe = () => () => {};

function LastUpdated() {
  const date = React.useSyncExternalStore(
    emptySubscribe,
    () => lastUpdated.toLocaleDateString(),
    () => null,
  );

  return date ? <span>Last updated at: {date}</span> : null;
}
```

`subscribe` 함수는 안정적이여야 하므로 React 컴포넌트 외부에서 선언해야 합니다. 저는 이 방법이 다소 편법(hacky) 같다고 생각했기 때문에 이 글을 게시하기 전에 React 팀으로부터 좋은 생각이라는 확인을 받아야 했습니다.
https://twitter.com/acdlite/status/1741161736936558721

좀 더 인체공학적인 방법이 있으면 좋겠지만 아직 찾지 못했습니다. 이걸로 패키지를 만들어야 할지도 모르겠네요... 🤔

이 패턴을 사용하면 브라우저 전용 API에 안전하게 액세스할 수 있는 클라이언트에서만 렌더링되는 컴포넌트인 `ClientGate`를 매우 쉽게 만들 수 있습니다:

```typescript
function ClientGate({ children }) {
  const isServer = React.useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  );

  return isServer ? null : children();
}

function App() {
  return (
    <main>
      Hello Server
      <ClientGate>{() => `Hello Client ${window.title}`}</ClientGate>
    </main>
  );
}
```

## Layout Shift 최소화하기

Layout Shift 현상은 이상적이지 않으며, 클라이언트 정보에 따라 세부 사항이 달라진다고 해서 컴포넌트를 완전히 렌더링하지 않으면 필요 이상으로 큰 레이아웃 이동이 발생할 수 있습니다. JS가 로드되지 않는다면 화면의 해당 부분에 대한 정보를 전혀 표시할 수 없게 됩니다.

따라서 서버에서 안정적인 날짜 출력을 생성할 수 있다면 이전에 표시된 GIF의 페이지와 유사하게 콘텐츠 이동을 날짜로만 제한할 수 있습니다:

```typescript
const emptySubscribe = () => () => {};

function LastUpdated() {
  const date = React.useSyncExternalStore(
    emptySubscribe,
    () => lastUpdated.toLocaleDateString(),
    () => lastUpdated.toLocaleDateString("en-US"),
  );

  return <span>Last updated at: {date}</span>;
}
```

서버 스냅샷은 서버와 클라이언트에서 평가되므로 정적 로캘을 전달하는 것이 중요합니다. 아무것도 전달하지 않고 런타임이 로캘을 유추하도록 하면 전체 하이드레이션 오류 시나리오도 발생하게 됩니다.

## Client hints

앞으로 HTTP 클라이언트 힌트는 서버가 렌더링하기 전에 클라이언트에서만 사용할 수 있는 정보를 알 수 있는 방법을 제공하기 때문에 이 모든 상황을 개선할 수 있을 것으로 기대합니다. 그러면 해결 방법에 의존할 필요 없이 정보를 SSR로 수정할 수 있습니다. 그때까지는 이 정도면 충분하다고 생각하며, 저는 언제든 이펙트 솔루션보다 useSyncExternalStore를 선호합니다.