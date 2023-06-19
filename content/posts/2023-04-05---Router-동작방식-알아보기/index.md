---
title: Router 동작방식 알아보기
date: "2023-04-05"
template: "post"
draft: false
slug: "/posts/how-routers-work"
category: "Tech"
tags:
  - "Router"
description: "라우터는 어떤 원리로 동작하는 것일까?"
---
이 글에서는 SPA에서 사용하는 라우터의 동작 원리를 살펴보며 바닐라 JS로 구현한다면 어떻게 구현할지 고민해볼 것이다. 하지만 구체적인 구현은 하지 않을 것이니 참고해주길 😇

## Router의 동작방식
- URL을 변경한다.
- URL의 변경을 클라이언트에서 감지한다.
- 변경된 URL에 맞춰 렌더링 해야 할 컴포넌트를 찾고 화면에 그린다.

꽤나 단순하지 않은가? URL에 따라 렌더링 해야할 컴포넌트를 맵핑해 놓고 URL의 변경을 감지하여 그에 맞는 화면을 보여주는 것이다. 

따라서 라우팅 시스템은 **두 가지의 핵심 요소**를 가진다.
- 어플리케이션의 경로 목록을 수집하는 레지스트리
- URL의 리스너

레지스트리를 정말 단순한 형태로 만들어 본다면 다음과 같겠다.

```jsx
// 어플리케이션 경로 목록을 수집하는 레지스트리로, URL에 따라 구성요소를 맵핑한 객체
const routes = {
	URL_A: ComponentA,
  URL_B: ComponentB,
	URL_C: ComponentC,
}
```


위의 예시에서 URL에 해당하는 key값을 어떤 형태로 사용할 것인가, (해시가 붙어있는 형태로 사용할 것인가? 아닌가?)에 따라 해시 라우터와 브라우저 라우터로 나뉘며 그에 따라 URL 리스너도 달라진다. 
<br /><br />

## 해시 라우터의 경우

해시로 시작하는 선택적 부분을 `프래그먼트 식별자`라고 부르는데, 이 값을 key 값으로 사용한다고 보면 된다. 프래그먼트 식별자는 location 객체의 hash 속성에 저장되기 때문에 `window.location.hash`를 통해 그 값을 가져올 수 있다.

![window.location.hash](/media/location-hash.png)

 페이지를 이동하고 싶을 때는 앵커 태그를 이용해서 URL 변경한다.

```jsx
<main>
	<a href="#/">Go To Index</a>
	<a href="#/list">Go To List</a>
	<a href="#/detail">Go To Detail</a>
</main>
```

그리고 **hashChange**라는 이벤트를 통해서 프래그먼트가 변경될 때마다 알림을 받을 수 있다. **즉 해시 라우터의 URL 리스너는 hashChange 이벤트다.**

```jsx
window.addEventListener('hashChange', checkRoutes) 
```

프래그먼트가 바뀔 때마다 `checkRoutes` 함수가 동작할 것이고, `checkRoutes` 내부에서는 프래그먼트가 레지스트리에 있는지 확인한 뒤 그에 맞는 구성요소를 렌더링한다. 
<br /><br />

## 브라우저 라우터의 경우에는

`window.location.pathname`을 key 값으로 사용한다.

페이지를 이동하고 싶을 때는 HTML5에서 등장한 [History API](https://developer.mozilla.org/ko/docs/Web/API/History_API)를 사용하여 URL을 변경한다. 주요 메서드는 다음과 같다.

- `back()` :  히스토리에서 이전 페이지로 이동한다.
- `forward()`: 히스토리에서 다음 페이지로 이동한다.
- `go(index)`: 히스토리에서 특정 페이지로 이동한다.
- `pushState(state, title, URL)`: 히스토리 스택의 데이터를 푸시하고 제공된 URL로 이동한다.
- `replaceState(state, title, URL)`: 히스토리 스택에서 가장 최근 데이터를 바꾸고 제공된 URL로 이동한다.


**[popState](https://developer.mozilla.org/ko/docs/Web/API/Window/popstate_event)** 이벤트는 브라우저의 뒤로가기/앞으로가기 버튼을 클릭하거나, **`pushState()`** 또는 **`replaceState()`** 메서드를 호출하여 URL을 업데이트할 때 발생하며 브라우저 라우터의 URL 리스너로 사용된다. 

```jsx
window.addEventListener('popState', checkRoutes) 
```

URL이 업데이트 될 때마다 `checkRoutes` 함수가 동작하고, 해시 라우터에서와 마찬가지로 `checkRoutes` 내부에서는 프래그먼트가 레지스트리에 있는지 확인한 뒤 그에 맞는 구성요소를 렌더링한다. 
<br /><br />


## 또 다른 방법은 없을까?
또 다른 URL 리스너의 형태로는 `setInterval`을 사용하는 방법이 있다. 주기적으로 pathname이 변경되었는지를 확인하고, 변경 되었으면 그에 맞는 구성요소를 렌더링 하는 것이다. 그러나 이 방식은 정확도가 떨어져 권장되지 않는다. 

```jsx
setInterval(function() {
  if (window.location.pathname !== previousPathname) {
    console.log('pathname changed to ' + window.location.pathname);
    previousPathname = window.location.pathname;
  }
}, 1000);
```
<br />

### 참고사항
라우터에 관련한 추가적인 참고사항으로는 History API는 IE 9 이하에서 지원되지 않아 모든 브라우저에서 지원되는 브라우저를 개발하기 위해서는 해시 라우터를 사용해야 한다는 점이 있다. 😇
<br />

### 참고자료
* (도서) 프레임워크 없는 프론트엔드 개발, 프란세스코 스트라츨로 지음
* [라이브러리 없이 라우터(Router) 만들기 | 카카오엔터테인먼트 FE 기술블로그](https://fe-developers.kakaoent.com/2022/221124-router-without-library/)