---
title: useSyncExternalStore로 Hydration 불일치 해결하기
date: "2024-03-10"
template: "post"
draft: true
slug: "/posts/avoiding-hydration-mismatches-with-useSyncExternalStore"
category: "Tech"
description: "번역"
---

> 해당 글은 동일한 내용으로 [회사 블로그](https://medium.com/wantedjobs/yarn-classic%EC%97%90%EC%84%9C-pnpm%EC%9C%BC%EB%A1%9C-%EC%A0%84%ED%99%98%ED%95%98%EA%B8%B0-with-turborepo-7c0c37cb3f9e)에 기고 되었습니다.

Hydration 불일치는 React 개발자가 종종 만나게 되는 가장 두려운 오류 중 하나입니다:

> Uncaught Error: Text content does not match server-rendered HTML.

어떻게 이럴 수 있을까요? 우리는 동형 렌더링을 약속 받았습니다 - 처음에는 서버에서, 그 다음에는 클라이언트에서요. 코드는 한 번만 작성되고 두 번 실행됩니다.

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
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const date = getLastUpdated()
  return <span>Last updated at: {date.toLocaleDateString()}</span>
}
```